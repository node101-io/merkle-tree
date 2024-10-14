import async from 'async';

import { isElementsDuplicated } from './utils/isElementsDuplicated.js';
import { repeatLastElementOfArrayIfNotEven } from './utils/repeatLastElementOfArrayIfNotEven.js';
import { sha256 } from './utils/sha256.js';

const MAX_LEAF_SIZE = 4 * 1024; // TODO: search MAX_LEAF_SIZE should be

const _generateMerkleTreeRecursively = (hashArray, originalLeavesArray, callback) => {
  if (!Array.isArray(hashArray))
    return callback('array_expected');

  if (hashArray.length === 1)
    return callback(null, {
      tree: hashArray,
      root: hashArray[hashArray.length - 1],
      leavesArray: originalLeavesArray
    });

  const evenHashArray = repeatLastElementOfArrayIfNotEven(hashArray);

  const childArray = [];

  async.eachOfSeries(
    evenHashArray,
    (value, index, eachCallback) => {
      if (index % 2 !== 0)
        return eachCallback();

      const combinedHash = evenHashArray[index] + evenHashArray[index + 1];

      sha256(combinedHash.toString(), (err, hashOfCombined) => {
        if (err)
          return eachCallback(err);

        childArray.push(hashOfCombined);
        eachCallback();
      });
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
};

const _generateUpperTreeWitnessesRecursively = ( data, callback) => {
  if (data.cummulativeNodeCount >= data.merkleTree.tree.length - 1) //düzelt burayı
    return callback(null, []);

  if (data.currentIndex >= data.merkleTree.tree.length)
    return callback('stack_exceeded', null);

  let witnessIndex;
  console.log('cummulativeNodeCount: ' + data.cummulativeNodeCount);
  console.log('currentIndex: ' + data.currentIndex);
  console.log('nextLevelNodeCount: ' + data.nextLevelNodeCount);
  console.log('nextLevelNodePosition: ' + data.nextLevelNodePosition);

  if (data.currentIndex % 2 == 0)
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

  if (data.nextLevelNodeCount % 2 != 0)
    data.nextLevelNodeCount++;

  _generateUpperTreeWitnessesRecursively(data, (err, upperTreeWitnessArray) => {
    if (err)
      return callback(err);

    return callback(null, data.witnessArray);
  });
};

const _verifyMerkleProofRecursively = (data, merklePath, operationCount, merkleRoot, callback) => {
  if (data === merkleRoot)
    return callback(null, true);

  if (operationCount === merklePath.length)
    return callback(null, false);

  let combinedWitnessHash;

  if (merklePath[operationCount].witnessIndex == 0)
    combinedWitnessHash = merklePath[operationCount].witnessHash + data;
  else
    combinedWitnessHash = data + merklePath[operationCount].witnessHash;

  const hashOfCombinedWitnessHash = sha256(combinedWitnessHash);

  _verifyMerkleProofRecursively(hashOfCombinedWitnessHash, merklePath, operationCount + 1, merkleRoot, (err, result) => {
    if (err)
      return callback(err);

    return callback(null, result);
  });
};

export const generateMerkleTree = (leavesArray, callback) => {
  if (!Array.isArray(leavesArray))
    return callback('array_expected');

  if (isElementsDuplicated(leavesArray))
    return callback('duplicated_leaves');

  const hashedLeavesArray = [];

  async.eachOf(
    leavesArray,
    (leaf, index, eachCallback) => {
      if (!leaf || leaf.length > MAX_LEAF_SIZE)
        return eachCallback(err);

      sha256(leaf.toString(), (err, hash) => {
        if (err)
          return eachCallback(err);

        hashedLeavesArray[index] = hash;

        return eachCallback();
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
};

export const addLeaf = (newLeafToAdd, merkleTree, callback) => {
  if (!newLeafToAdd) // TODO: max length belirle
    return callback('empty_addition');

  if (Array.isArray(newLeafToAdd)) {
    if (newLeafToAdd.length == 1 && newLeafToAdd[0] == merkleTree.leavesArray[merkleTree.leavesArray.length - 1])
      return callback('doubled_last_element');

    if (!newLeafToAdd.length == 1 && newLeafToAdd[newLeafToAdd.length - 1] == newLeafToAdd[newLeafToAdd.length - 2])
      return callback('doubled_last_element');

    if (!newLeafToAdd.length == 1 && newLeafToAdd[newLeafToAdd.length - 1] == merkleTree.leavesArray[merkleTree.leavesArray.length - 1])
      return callback('doubled_last_element');
  }

  if (typeof newLeafToAdd === 'string')
    if (newLeafToAdd == merkleTree.leavesArray[merkleTree.leavesArray.length - 1]) // TODO: check max length
      return callback('doubled_last_element');

  console.log([...merkleTree.leavesArray, ...newLeafToAdd]);
  const combinedLeavesArray = [...merkleTree.leavesArray, ...newLeafToAdd];

  if (isElementsDuplicated(combinedLeavesArray))
    return callback('duplicated_leaves');

  generateMerkleTree(combinedLeavesArray, (err, merkleTree) => {
    if (err)
      return callback(err)

    return callback(null, merkleTree);
  });
};

export const removeLeaf = (leafToRemove, merkleTree, callback) => {
  if (!leafToRemove)
    return callback('missing_leaf');

  const prunedLeaves = merkleTree.leavesArray.filter(item => item !== leafToRemove);

  if (prunedLeaves.length === 0)
    return callback('empty_pruned_leaves'); // TODO: açık hata mesajı

  if (isElementsDuplicated(prunedLeaves)) {
    console.log('Cannot delete: operation results');
    return callback('last_two_elements_duplicated');
  };

  generateMerkleTree(prunedLeaves, (err, prunedLeavesMerkleTree) => {
    if (err)
      return callback(err);

    return callback(null, prunedLeavesMerkleTree);
  });
};

export const generateMerkleProof = (targetLeaf, merkleTree, callback) => {
  if (!targetLeaf)
    return callback(null, '');

  const witnessArray = [];
  const targetLeafIndex = merkleTree.leavesArray.findIndex(leafIndex => leafIndex === targetLeaf);

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
  };

  _generateUpperTreeWitnessesRecursively(witnessGenerationParameters, (err, upperTreeWitnessArray) => {
    if (err)
      return callback(err);

    return callback(null, upperTreeWitnessArray);
  });
};

export const verifyMerkleProof = (targetData, merklePath, merkleRoot, callback) => {
  if (!Array.isArray(merklePath))
    return callback('array_expected');

  // if (merkleRoot.length != 256)
  //   return callback('unexpected_merkle_root');

  const hashOfTargetData = sha256(targetData.toString());

  _verifyMerkleProofRecursively(hashOfTargetData, merklePath, 0, merkleRoot, (err, result) => {
    if (err)
      return callback(err);

    return callback(null, result);
  });
};
