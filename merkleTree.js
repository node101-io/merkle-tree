const async = require('async');
const crypto = require('crypto');

function repeatLastElementIfNotEven(leavesArray, callback) {
  if (!Array.isArray(leavesArray))
    return callback('array_expected');

  if (leavesArray.length % 2 !== 0)
    leavesArray.push(leavesArray[leavesArray.length - 1]);

  return callback(null, leavesArray);
};

function sha256(string, key, callback) {
  const hash = crypto.createHash('sha256').update(string).digest('hex');

  return callback(null, hash);
};

function recursiveGenerateMerkleTree(hashArray, originalLeavesArray, callback) {
  if (!Array.isArray(hashArray))
    return callback('array_expected');

  if (hashArray.length === 1)
    return callback(null, {
      tree: hashArray,
      root: hashArray[hashArray.length - 1],
      leavesArray: originalLeavesArray
    });

  repeatLastElementIfNotEven(hashArray, (err, evenHashArray) => {
    if (err)
      return callback(err);

    const childArray = [];

    async.eachOfSeries(
      evenHashArray,
      (value, index, eachCallback) => {
        if (index % 2 === 0) {
          const combinedHash = evenHashArray[index] + evenHashArray[index + 1];
          sha256(combinedHash.toString(), index, (err, hashOfCombined) => {
            if (err)
              return eachCallback(err);

            childArray.push(hashOfCombined);
            eachCallback();
          });
        } else {
          eachCallback();
        }
      },
      (err) => {
        if (err)
          return callback(err);

        recursiveGenerateMerkleTree(childArray, originalLeavesArray, (err, upperTree) => {
          if (err)
            return callback(err);

          return callback(null, {
            tree: hashArray.concat(upperTree.tree),
            root: upperTree.tree[upperTree.tree.length - 1],
            leavesArray: originalLeavesArray
          });
        });
      }
    );
  });
};

function createMerkleTree(leavesArray, callback) {
  if (!Array.isArray(leavesArray))
    return callback('array_expected');

  const hashedLeavesArray = [];

  async.eachOf(
    leavesArray,
    (leaf, index, eachCallback) => {
      sha256(leaf.toString(), index, (err, hash) => {
        if (err)
          return eachCallback(err);

        hashedLeavesArray[index] = hash;
        eachCallback();
      });
    },
    err => {
      if (err)
        return callback(err);

      recursiveGenerateMerkleTree(hashedLeavesArray, leavesArray, (err, merkleTree) => {
        if (err)
          return callback(err);

        return callback(null, merkleTree);
      });
    }
  );
};

function getMerkleRoot(merkleTree, callback) {
  if (!Array.isArray(merkleTree))
    return callback('unexpected_merkle_tree_format');

  return callback(null, merkleTree.root);
};

function addLeaf(newLeafArray, leavesArray, callback) {
  if (!Array.isArray(leavesArray))
    return callback('unexpected_merkle_tree_format');

  if (!Array.isArray(newLeafArray))
    return callback('unexpected_leaf_format');

  const combinedLeavesArray = leavesArray.concat(newLeafArray);

  createMerkleTree(combinedLeavesArray, (err, merkleTree) => {
    if (err)
      return callback(err)

    return callback(null, merkleTree);
  });
};

function removeLeaf(leafToRemove, merkleTree, callback){
  if (!leafToRemove)
    return callback('bad_request');

  const prunedLeaves = merkleTree.leavesArray.filter(item => item !== leafToRemove);

  if (!prunedLeaves)
    return callback('bad_request'); // TODO: açık hata mesajı

  createMerkleTree(prunedLeaves, (err, prunedLeavesMerkleTree) => {
    if (err)
      return callback(err);

    return callback(null, prunedLeavesMerkleTree);
  })
};

function recursiveGenerateUpperTreeWitnesses( data, callback) {
  if (data.cummulativeNodeCount >= data.merkleTree.tree.length - 1) //düzelt burayı
    return callback(null, []);

  if (data.currentIndex >= data.merkleTree.tree.length) {
    callback('stack_exceeded', null);
    return;
  }

  data.currentIndex = data.cummulativeNodeCount + Math.floor(((data.currentIndex ) % (data.eachLevelNodeCount - 1) / 2));

  if (data.currentIndex % 2 === 0)
    data.witnessIndex = data.currentIndex + 1;
  else
    data.witnessIndex = data.currentIndex - 1;


  data.witnessArray.push({
    witnessHash: data.merkleTree.tree[data.witnessIndex],
    witnessIndex: data.witnessIndex
  });

  data.eachLevelNodeCount = Math.floor(data.eachLevelNodeCount / 2);

  if (data.eachLevelNodeCount % 2 != 0)
    data.eachLevelNodeCount++;

  data.cummulativeNodeCount += data.eachLevelNodeCount;

  recursiveGenerateUpperTreeWitnesses(data, (err, upperTreeWitnessArray) => {
    if (err)
      return callback(err);

    callback(null, data.witnessArray);
  })
};

function generateMerkleProof(targetLeaf, merkleTree, callback) {
  if (!targetLeaf)
    return callback(null, '');

  const witnessArray = [];
  let witnessIndex;
  let targetLeafIndex = merkleTree.leavesArray.findIndex(leafIndex => leafIndex === targetLeaf);

  if (targetLeafIndex % 2 == 0)
    witnessIndex = targetLeafIndex + 1;
  else
    witnessIndex = targetLeafIndex - 1;

  witnessArray.push({
    witnessHash: merkleTree.tree[witnessIndex],
    witnessIndex: witnessIndex
  });

  let firstLevelNodeCount = merkleTree.leavesArray.length
  if (firstLevelNodeCount % 2 != 0)
    firstLevelNodeCount++;

  const witnessGenerationParameters = {
    currentIndex: targetLeafIndex,
    witnessIndex: witnessIndex,
    eachLevelNodeCount: firstLevelNodeCount,
    cummulativeNodeCount: firstLevelNodeCount,
    witnessArray: witnessArray,
    merkleTree: merkleTree
  }
  // console.log(witnessGenerationParameters);

  recursiveGenerateUpperTreeWitnesses(witnessGenerationParameters, (err, upperTreeWitnessArray) => {
    if (err)
      return callback(err);

    return callback(null, upperTreeWitnessArray);
  });
};

function recursivelyVerifyMerkleProof(data, merklePath, operationCount, merkleRoot, callback) {
  console.log(merklePath);

  if (data == merkleRoot)
    return callback(null, true);

  if (operationCount == merklePath.length)
    return callback(null, false);

  let combinedWitnessHash;

  if (merklePath[operationCount].witnessIndex % 2 == 0) {
    combinedWitnessHash = merklePath[operationCount].witnessHash + data;
  }
  if (merklePath[operationCount].witnessIndex % 2 != 0) {
    combinedWitnessHash = data + merklePath[operationCount].witnessHash;
  }
  sha256(combinedWitnessHash, 0, (err, hashOfCombinedWitnessHash) => {
    if (err)
      return callback(err);

    console.log(hashOfCombinedWitnessHash);
    operationCount++;

    recursivelyVerifyMerkleProof(hashOfCombinedWitnessHash, merklePath, operationCount, merkleRoot, (err, result) => {
      if (err)
        return callback(err);

      return callback(null, result);
    })
  })
};

function verifyMerkleProof(targetData, merklePath, merkleRoot, callback) {
  if (!Array.isArray(merklePath))
    return callback('array_expected');

  console.log('verifyMerkleProof');
  console.log(merklePath);
  // if (merkleRoot.length != 256)
  //   return callback('unexpected_merkle_root');

  sha256(targetData.toString(), 0, (err, hashOfTargetData) => {
    if (err)
      return callback(err);

    recursivelyVerifyMerkleProof(hashOfTargetData, merklePath, 0, merkleRoot, (err, result) => {
      if (err)
        return callback(err);

      return callback(null, result);
    })
  });
};

createMerkleTree(['a', 'b', 'c', 'd'], (err, merkleTree) => {
  if (err)
    return console.log(err);

  // console.log(merkleTree);

  addLeaf(['e'], merkleTree.leavesArray, (err, newMerkleTree) => {
    if (err)
      return console.log(err);

    // console.log(newMerkleTree);

    generateMerkleProof('c', newMerkleTree, (err, merkleProof) => {
      if (err)
        console.log(err);

      // console.log(merkleProof);

      verifyMerkleProof('c', merkleProof, newMerkleTree.root, (err, result) => {
        if (err)
          return console.log(err);

        console.log(result);
      });
    });
  });
});

module.exports = {
  createMerkleTree,
  getMerkleRoot,
  addLeaf,
  removeLeaf,
  generateMerkleProof,
  verifyMerkleProof
};
