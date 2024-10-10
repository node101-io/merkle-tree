const async = require('async');
const crypto = require('crypto');

const MAX_LEAF_SIZE = 4 * 1024; // TODO: search MAX_LEAF_SIZE should be

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
  if(string.length > MAX_LEAF_SIZE)
    return callback('bad_request'); //TODO: ask the naming
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
        if(!leaf || leaf.length > MAX_LEAF_SIZE)
          return eachCallback(err);

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
  let witnessIndex;
  console.log('cummulativeNodeCount: ' + data.cummulativeNodeCount);
  console.log('currentIndex: ' + data.currentIndex);
  console.log('nextLevelNodeCount: ' + data.nextLevelNodeCount);
  console.log('nextLevelNodePosition: ' + data.nextLevelNodePosition);

  if(data.currentIndex % 2 == 0)
    witnessIndex = data.currentIndex + 1;
  else
    witnessIndex = data.currentIndex - 1;

  data.witnessArray.push({
    witnessHash: data.merkleTree.tree[witnessIndex],
    witnessIndex: witnessIndex % 2
  });
  console.log('Math.ceil(data.nextLevelNodePosition / 2): ')
  data.nextLevelNodePosition = Math.ceil(data.nextLevelNodePosition / 2);
  data.cummulativeNodeCount += data.nextLevelNodeCount;
  data.currentIndex = (data.cummulativeNodeCount - 1) + data.nextLevelNodePosition;
  data.nextLevelNodeCount = data.nextLevelNodeCount / 2;

  if(data.nextLevelNodeCount % 2 != 0)
    data.nextLevelNodeCount++;


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

  // if (targetLeafIndex % 2 == 0)
  //   witnessIndex = targetLeafIndex + 1;
  // else
  //   witnessIndex = targetLeafIndex - 1;

  // witnessArray.push({
  //   witnessHash: merkleTree.tree[witnessIndex],
  //   witnessIndex: witnessIndex % 2
  // });

  let firstLevelNodeCount = merkleTree.leavesArray.length
  if (firstLevelNodeCount % 2 != 0)
    firstLevelNodeCount++;

  const witnessGenerationParameters = {
    cummulativeNodeCount: 0,
    currentIndex: targetLeafIndex,
    nextLevelNodeCount: firstLevelNodeCount,
    nextLevelNodePosition: targetLeafIndex + 1,
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

generateMerkleTree(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', '1', '2', '3', '4', '5'], (err, merkleTree) => {
  if (err)
    return console.log(err);
  console.log(merkleTree);

  // addLeaf([''], merkleTree, (err, newMerkleTree) => {
  //   if (err)
  //     return console.log(err);
  //   console.log(newMerkleTree)

  //   removeLeaf('', newMerkleTree, (err, prunedMerkleTree) => {
  //     if(err)
  //       return console.log(err);

  //     console.log(prunedMerkleTree);
  //   })
  generateMerkleProof('5', merkleTree, (err, merkleProof) => {
    if (err)
      return console.log(err);

    console.log(merkleProof);
    verifyMerkleProof('5', merkleProof, merkleTree.root, (err, result) => {
      if (err)
        return console.log(err);

        console.log(result);
    });
  });
});
// });

module.exports = {
  generateMerkleTree,
  getMerkleRoot,
  addLeaf,
  removeLeaf,
  generateMerkleProof,
  verifyMerkleProof
};
