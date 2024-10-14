import { isElementsDuplicated } from './utils/isElementsDuplicated.js';
import { repeatLastElementOfArrayIfNotEven } from './utils/repeatLastElementOfArrayIfNotEven.js';
import { sha256 } from './utils/sha256.js';
import {
  MerkleTree,
  Witness,
  GenerateUpperTreeWitnessData,
  CallbackMerkleTree,
  CallbackMerkleProof
} from './types.js';

const MAX_LEAF_SIZE = 4 * 1024; // TODO: search MAX_LEAF_SIZE should be

const generateChildArrayRecursively = (evenHashArray: string[], childArray: string[], index: number): string[] => {
  if (index >= evenHashArray.length)
    return childArray;

  if (index % 2 !== 0)
    return generateChildArrayRecursively(evenHashArray, childArray, index + 1);

  const combinedHash = evenHashArray[index] + evenHashArray[index + 1];
  const hashOfCombined = sha256(combinedHash);

  return generateChildArrayRecursively(evenHashArray, [...childArray, hashOfCombined], index + 2);
};
const generateMerkleTreeRecursively = (originalLeavesArray: string[], hashArray: string[]): MerkleTree => {
  if (hashArray.length === 1)
    return {
      tree: hashArray,
      root: hashArray[hashArray.length - 1],
      leavesArray: originalLeavesArray
    };

  const evenHashArray = repeatLastElementOfArrayIfNotEven(hashArray);

  const childArray = generateChildArrayRecursively(evenHashArray, [], 0);

  const upperTree = generateMerkleTreeRecursively(originalLeavesArray, childArray);

  return {
    tree: [...evenHashArray, ...upperTree.tree],
    root: upperTree.tree[upperTree.tree.length - 1],
    leavesArray: originalLeavesArray
  };
};
const generateUpperTreeWitnessesRecursively = (data: GenerateUpperTreeWitnessData): string[] => {
  if (data.cummulativeNodeCount >= data.merkleTree.tree.length - 1) // TODO: fix
    return [];

  let witnessIndex: number;

  if (data.currentIndex % 2 === 0)
    witnessIndex = data.currentIndex + 1;
  else
    witnessIndex = data.currentIndex - 1;

  data.witnessArray = [...data.witnessArray, {
    witnessHash: data.merkleTree.tree[witnessIndex],
    witnessIndex: witnessIndex % 2
  }];

  data.nextLevelNodePosition = Math.ceil(data.nextLevelNodePosition / 2);
  data.cummulativeNodeCount += data.nextLevelNodeCount;
  data.currentIndex = data.cummulativeNodeCount - 1 + data.nextLevelNodePosition;
  data.nextLevelNodeCount = data.nextLevelNodeCount / 2;

  if (data.nextLevelNodeCount % 2 != 0)
    data.nextLevelNodeCount++;

  return generateUpperTreeWitnessesRecursively(data);
};
const verifyMerkleProofRecursively = (merkleRoot: string, merklePath: Witness[], targetDataHash: string, operationCount: number): boolean => {
  if (targetDataHash === merkleRoot)
    return true;

  if (operationCount === merklePath.length)
    return false;

  let combinedWitnessHash: string;

  if (merklePath[operationCount].witnessIndex === 0)
    combinedWitnessHash = merklePath[operationCount].witnessHash + targetDataHash;
  else
    combinedWitnessHash = targetDataHash + merklePath[operationCount].witnessHash;

  const hashOfCombinedWitnessHash = sha256(combinedWitnessHash);

  return verifyMerkleProofRecursively(merkleRoot, merklePath, hashOfCombinedWitnessHash, operationCount + 1);
};

export const generateMerkleTree = (leavesArray: string[], callback: CallbackMerkleTree) => {
  if (isElementsDuplicated(leavesArray))
    return callback('duplicated_leaves');

  const hashedLeavesArray: string[] = [];

  for (let i = 0; i < leavesArray.length; i++) {
    if (leavesArray[i].length > MAX_LEAF_SIZE)
      return callback('leaf_too_large');

    hashedLeavesArray[i] = sha256(leavesArray[i]);
  };

  return generateMerkleTreeRecursively(leavesArray, hashedLeavesArray);
};
export const addLeaf = (merkleTree: MerkleTree, leavesToAdd: string | string[], callback: CallbackMerkleTree) => {
  const newLeavesToAdd = Array.isArray(leavesToAdd) ? leavesToAdd : [leavesToAdd];

  const combinedLeavesArray = [...merkleTree.leavesArray, ...newLeavesToAdd];

  if (isElementsDuplicated(combinedLeavesArray))
    return callback('duplicated_leaves');

  return generateMerkleTree(combinedLeavesArray, callback);
};
export const removeLeaf = (merkleTree: MerkleTree, leavesToRemove: string | string[], callback: CallbackMerkleTree) => {
  leavesToRemove = Array.isArray(leavesToRemove) ? leavesToRemove : [leavesToRemove];

  const prunedLeaves = merkleTree.leavesArray.filter(item => !leavesToRemove.includes(item));

  if (prunedLeaves.length === 0)
    return callback('no_leaf_to_remove');

  if (isElementsDuplicated(prunedLeaves))
    return callback('duplicated_leaves');

  return generateMerkleTree(prunedLeaves, callback);
};
export const generateMerkleProof = (merkleTree: MerkleTree, targetLeaf: string, callback: CallbackMerkleProof) => {
  const targetLeafIndex = merkleTree.leavesArray.findIndex(leafIndex => leafIndex === targetLeaf);

  if (targetLeafIndex === -1)
    return callback('leaf_not_found');

  const firstLevelNodeCount = merkleTree.leavesArray.length % 2 === 0 ? merkleTree.leavesArray.length : merkleTree.leavesArray.length + 1;

  const generateUpperTreeWitnessesData = {
    cummulativeNodeCount: 0,
    currentIndex: targetLeafIndex,
    nextLevelNodeCount: firstLevelNodeCount,
    nextLevelNodePosition: targetLeafIndex + 1,
    witnessArray: [],
    merkleTree: merkleTree
  };

  return generateUpperTreeWitnessesRecursively(generateUpperTreeWitnessesData);
};
export const verifyMerkleProof = (merklePath: Witness[], targetData: string, merkleRoot: string): boolean => {
  const hashOfTargetData = sha256(targetData);

  return verifyMerkleProofRecursively(merkleRoot, merklePath, hashOfTargetData, 0);
};
