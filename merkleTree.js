const async = require('async');
const crypto = require('crypto');

function isElementsDuplicated(leavesArray, callback) {
  if(!Array.isArray(leavesArray))
    return callback('array_expected');
  if(leavesArray.length === 0)
    return callback('empty_leaves_array');
  if(leavesArray.length === 1)
    return callback(null, false);

  const uniqueLeaves = new Set(leavesArray);

  if(uniqueLeaves.size !== leavesArray.length)
    return callback(null, true);

  return callback(null, false);
};

function repeatLastLeafIfNotEven(leavesArray, callback) {
  if (!Array.isArray(leavesArray))
    return callback('array_expected');

  if (leavesArray.length % 2 !== 0)
    leavesArray.push(leavesArray[leavesArray.length - 1]); // O(1)
    // leavesArray.push(crypto.createHash('sha256').update((leavesArray.length).toString()).digest('hex'));

  return callback(null, leavesArray);
};

function sha256(string, callback) { //TODO: max lenght
  if(!typeof string === 'string')
    return callback('string_expected');

  const hash = crypto.createHash('sha256').update(string.toString()).digest('hex');

  return callback(null, hash);
};

function _generateMerkleTreeRecursively(hashArray, originalLeavesArray, callback) {
  if (!Array.isArray(hashArray))
    return callback('array_expected');

  if (hashArray.length === 1)
    return callback(null, {
      tree: hashArray,
      root: hashArray[hashArray.length - 1],
      leavesArray: originalLeavesArray
    });

  repeatLastLeafIfNotEven(hashArray, (err, evenHashArray) => {
    if (err)
      return callback(err);

    const childArray = [];

    async.eachOfSeries(
      evenHashArray,
      (value, index, eachCallback) => {
        if (index % 2 === 0) {
          const combinedHash = evenHashArray[index] + evenHashArray[index + 1];

          sha256(combinedHash.toString(), (err, hashOfCombined) => {
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

        _generateMerkleTreeRecursively(childArray, originalLeavesArray, (err, upperTree) => {
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

function generateMerkleTree(leavesArray, callback) {
  if (!Array.isArray(leavesArray))
    return callback('array_expected');

  isElementsDuplicated(leavesArray, (err, isDuplicated) => {
    if(err)
      return callback(err);
    if(isDuplicated)
      return callback('duplicated_leaves');

    const hashedLeavesArray = [];

    async.eachOf(
      leavesArray,
      (leaf, index, eachCallback) => {
        sha256(leaf.toString(), (err, hash) => {
          if (err)
            return eachCallback(err);

          hashedLeavesArray[index] = hash;
          eachCallback();
        });
      },
      err => {
        if (err)
          return callback(err);

        _generateMerkleTreeRecursively(hashedLeavesArray, leavesArray, (err, merkleTree) => {
          if (err)
            return callback(err);

          return callback(null, merkleTree);
        });
      }
    );
  })
};

function getMerkleRoot(merkleTree, callback) {
  if (!Array.isArray(merkleTree))
    return callback('unexpected_merkle_tree_format');

  return callback(null, merkleTree.root);
};

function addLeaf(newLeafToAdd, merkleTree, callback) {
  if(!newLeafToAdd) //TODO: max length belirle
    return callback('empty_addition');

  if(Array.isArray(newLeafToAdd)) {
    if(newLeafToAdd.length == 1 && newLeafToAdd[0] == merkleTree.leavesArray[merkleTree.leavesArray.length - 1])
      return callback('doubled_last_element');

    if(!newLeafToAdd.length == 1 && newLeafToAdd[newLeafToAdd.length - 1] == newLeafToAdd[newLeafToAdd.length - 2])
      return callback('doubled_last_element');

    if(!newLeafToAdd.length == 1 && newLeafToAdd[newLeafToAdd.length - 1] == merkleTree.leavesArray[merkleTree.leavesArray.length - 1])
      return callback('doubled_last_element');

  }
  if(typeof newLeafToAdd === 'string') {
    //TODO: check max length
    if(newLeafToAdd == merkleTree.leavesArray[merkleTree.leavesArray.length - 1])
      return callback('doubled_last_element');
  }

  const combinedLeavesArray = [...merkleTree.leavesArray, ...newLeafToAdd];
  //add isElementsDuplicated
  isElementsDuplicated(combinedLeavesArray, (err, isDuplicated) => {
    if(err)
      return callback(err);
    if(isDuplicated)
      return callback('duplicated_leaves');

    generateMerkleTree(combinedLeavesArray, (err, merkleTree) => {
      if (err)
        return callback(err)

      return callback(null, merkleTree);
    });
  })
};

function removeLeaf(leafToRemove, merkleTree, callback) {
  if (!leafToRemove)
    return callback('missing_leaf');

  const prunedLeaves = merkleTree.leavesArray.filter(item => item !== leafToRemove);

  if (prunedLeaves.length === 0)
    return callback('empty_pruned_leaves'); // TODO: açık hata mesajı

  isElementsDuplicated(prunedLeaves, (err, isDuplicated) => {
    if(err)
      return callback(err);

    if(isDuplicated) {
      console.log('Cannot delete: operation results');
      return callback('last_two_elements_duplicated');
    };

    generateMerkleTree(prunedLeaves, (err, prunedLeavesMerkleTree) => {
      if (err)
        return callback(err);

      return callback(null, prunedLeavesMerkleTree);
    })
  })

};

function _generateUpperTreeWitnessesRecursively( data, callback) {
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
    witnessIndex: data.witnessIndex % 2
  });

  data.eachLevelNodeCount = Math.floor(data.eachLevelNodeCount / 2);

  if (data.eachLevelNodeCount % 2 != 0)
    data.eachLevelNodeCount++;

  data.cummulativeNodeCount += data.eachLevelNodeCount;

  _generateUpperTreeWitnessesRecursively(data, (err, upperTreeWitnessArray) => {
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
    witnessIndex: witnessIndex % 2
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

  _generateUpperTreeWitnessesRecursively(witnessGenerationParameters, (err, upperTreeWitnessArray) => {
    if (err)
      return callback(err);

    return callback(null, upperTreeWitnessArray);
  });
};

function _verifyMerkleProofRecursively(data, merklePath, operationCount, merkleRoot, callback) {
  if (data == merkleRoot)
    return callback(null, true);

  if (operationCount == merklePath.length)
    return callback(null, false);

  let combinedWitnessHash;

  if (merklePath[operationCount].witnessIndex == 0) {
    combinedWitnessHash = merklePath[operationCount].witnessHash + data;
  }
  else {
    combinedWitnessHash = data + merklePath[operationCount].witnessHash;
  }
  sha256(combinedWitnessHash, (err, hashOfCombinedWitnessHash) => {
    if (err)
      return callback(err);

    operationCount++;

    _verifyMerkleProofRecursively(hashOfCombinedWitnessHash, merklePath, operationCount, merkleRoot, (err, result) => {
      if (err)
        return callback(err);

      return callback(null, result);
    })
  })
};

function verifyMerkleProof(targetData, merklePath, merkleRoot, callback) {
  if (!Array.isArray(merklePath))
    return callback('array_expected');

  // if (merkleRoot.length != 256)
  //   return callback('unexpected_merkle_root');

  sha256(targetData.toString(), (err, hashOfTargetData) => {
    if (err)
      return callback(err);

    _verifyMerkleProofRecursively(hashOfTargetData, merklePath, 0, merkleRoot, (err, result) => {
      if (err)
        return callback(err);

      return callback(null, result);
    })
  });
};

generateMerkleTree(['a', 'b', 'c', 'd', 'e'], (err, merkleTree) => {
  if (err)
    return console.log(err);
  console.log(merkleTree);

  addLeaf(['k'], merkleTree, (err, newMerkleTree) => {
    if (err)
      return console.log(err);
    console.log(newMerkleTree)

    removeLeaf('', newMerkleTree, (err, prunedMerkleTree) => {
      if(err)
        return console.log(err);

      console.log(prunedMerkleTree);
    })
    generateMerkleProof('a', newMerkleTree, (err, merkleProof) => {
      if (err)
        return console.log(err);

      verifyMerkleProof('a', merkleProof, newMerkleTree.root, (err, result) => {
        if (err)
          return console.log(err);

        console.log(result);
      });
    });
  });
});

module.exports = {
  generateMerkleTree,
  getMerkleRoot,
  addLeaf,
  removeLeaf,
  generateMerkleProof,
  verifyMerkleProof
};
