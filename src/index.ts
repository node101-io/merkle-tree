import { isElementsDuplicated } from './utils/isElementsDuplicated.js';
import { repeatLastElementOfArrayIfNotEven } from './utils/repeatLastElementOfArrayIfNotEven.js';
import { sha256 } from './utils/sha256.js';
import {
  MerkleTree,
  Witness,
  MerkleWitnessTraversalState,
  CallbackMerkleTree,
  CallbackMerkleProof
} from './types.js';

const MAX_LEAF_SIZE = 4 * 1024; // TODO: search MAX_LEAF_SIZE should be

function _verifyMerkleProofRecursively(merkleRoot: string, merklePath: Witness[], targetDataHash: string, operationCount: number): boolean {
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

  return _verifyMerkleProofRecursively(merkleRoot, merklePath, hashOfCombinedWitnessHash, operationCount + 1);
};
function _generateMerkleProof(merkleTree: MerkleTree, targetLeaf: string): Promise<Witness[]> {
  return new Promise((resolve, reject) => {
    const targetLeafIndex = merkleTree.leavesArray.findIndex(leafIndex => leafIndex === targetLeaf);

    if (targetLeafIndex === -1)
      return reject('leaf_not_found');

    const firstLevelNodeCount = merkleTree.leavesArray.length % 2 === 0 ? merkleTree.leavesArray.length : merkleTree.leavesArray.length + 1;

    const merkleWitnessTraversalState: MerkleWitnessTraversalState = {
      cummulativeNodeCount: 0,
      currentIndex: targetLeafIndex,
      nextLevelNodeCount: firstLevelNodeCount,
      nextLevelNodePosition: targetLeafIndex + 1,
      witnessArray: [],
      merkleTree: merkleTree
    };

    return _generateUpperTreeWitnessesRecursively(merkleWitnessTraversalState);
  });
}
function _generateMerkleTree(leavesArray: string[]): Promise<MerkleTree> {
  return new Promise((resolve, reject) => {
    if (isElementsDuplicated(leavesArray))
      return reject('duplicated_leaves');

    const hashedLeavesArray: string[] = [];

    for (let i = 0; i < leavesArray.length; i++) {
      if (leavesArray[i].length > MAX_LEAF_SIZE)
        return reject('leaf_too_large');

      hashedLeavesArray[i] = sha256(leavesArray[i]);
    };

    return resolve(_generateMerkleTreeRecursively(leavesArray, hashedLeavesArray));
  });
};
function _generateMerkleTreeRecursively(originalLeavesArray: string[], hashArray: string[]): MerkleTree {
  if (hashArray.length === 1)
    return {
      tree: hashArray,
      root: hashArray[hashArray.length - 1],
      leavesArray: originalLeavesArray
    };

  const evenHashArray = repeatLastElementOfArrayIfNotEven(hashArray);
  const childArray = _generateChildArrayRecursively(evenHashArray, [], 0);
  const upperTree = _generateMerkleTreeRecursively(originalLeavesArray, childArray);

  return {
    tree: [...evenHashArray, ...upperTree.tree],
    root: upperTree.tree[upperTree.tree.length - 1],
    leavesArray: originalLeavesArray
  };
};
function _generateChildArrayRecursively(evenHashArray: string[], childArray: string[], index: number): string[] {
  if (index >= evenHashArray.length)
    return childArray;

  if (index % 2 !== 0)
    return _generateChildArrayRecursively(evenHashArray, childArray, index + 1);

  const combinedHash = evenHashArray[index] + evenHashArray[index + 1];
  const hashOfCombined = sha256(combinedHash);

  return _generateChildArrayRecursively(evenHashArray, [...childArray, hashOfCombined], index + 2);
};
function _addLeaf(merkleTree: MerkleTree, leavesToAdd: string | string[]): Promise<MerkleTree> {
  return new Promise((resolve, reject) => {
    const newLeavesToAdd = Array.isArray(leavesToAdd) ? leavesToAdd : [leavesToAdd];

    const combinedLeavesArray = [...merkleTree.leavesArray, ...newLeavesToAdd];

    if (isElementsDuplicated(combinedLeavesArray))
      return reject('duplicated_leaves');

    return resolve(generateMerkleTree(combinedLeavesArray));
  });
};
function _removeLeaf(merkleTree: MerkleTree, leavesToRemove: string | string[]): Promise<MerkleTree> {
  return new Promise((resolve, reject) => {
    leavesToRemove = Array.isArray(leavesToRemove) ? leavesToRemove : [leavesToRemove];

    const prunedLeaves = merkleTree.leavesArray.filter((item: string) => !leavesToRemove.includes(item));

    if (prunedLeaves.length === 0)
      return reject('no_leaf_to_remove');

    if (isElementsDuplicated(prunedLeaves))
      return reject('duplicated_leaves');

    return generateMerkleTree(prunedLeaves);
  });
};
function _generateUpperTreeWitnessesRecursively (data: MerkleWitnessTraversalState): Witness[] {
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

  return _generateUpperTreeWitnessesRecursively(data);
};

export function generateMerkleTree(leavesArray: string[]): Promise<MerkleTree>;
export function generateMerkleTree(leavesArray: string[], callback: CallbackMerkleTree): void;
export function generateMerkleTree(leavesArray: string[], callback?: CallbackMerkleTree): Promise<MerkleTree> | void {
  if (!callback)
    return _generateMerkleTree(leavesArray);
  else
    _generateMerkleTree(leavesArray)
      .then(merkleTree => callback(null, merkleTree))
      .catch(err => callback(err));
};
export function addLeaf(merkleTree: MerkleTree, leavesToAdd: string | string[]): Promise<MerkleTree>;
export function addLeaf(merkleTree: MerkleTree, leavesToAdd: string | string[], callback: CallbackMerkleTree): void;
export function addLeaf(merkleTree: MerkleTree, leavesToAdd: string | string[], callback?: CallbackMerkleTree): void | Promise<MerkleTree> {
  if (!callback)
    return _addLeaf(merkleTree, leavesToAdd);
  else
    _addLeaf(merkleTree, leavesToAdd)
      .then(merkleTree => callback(null, merkleTree))
      .catch(err => callback(err));
};
export function removeLeaf(merkleTree: MerkleTree, leavesToRemove: string | string[]): Promise<MerkleTree>;
export function removeLeaf(merkleTree: MerkleTree, leavesToRemove: string | string[], callback: CallbackMerkleTree): void;
export function removeLeaf(merkleTree: MerkleTree, leavesToRemove: string | string[], callback?: CallbackMerkleTree): void | Promise<MerkleTree> {
  if (!callback)
    return _removeLeaf(merkleTree, leavesToRemove);
  else
    _removeLeaf(merkleTree, leavesToRemove)
      .then(merkleTree => callback(null, merkleTree))
      .catch(err => callback(err));
};
export function generateMerkleProof(merkleTree: MerkleTree, targetLeaf: string): Promise<Witness[]>;
export function generateMerkleProof(merkleTree: MerkleTree, targetLeaf: string, callback: CallbackMerkleProof): void;
export function generateMerkleProof(merkleTree: MerkleTree, targetLeaf: string, callback?: CallbackMerkleProof): void | Promise<Witness[]> {
  if (!callback)
    return _generateMerkleProof(merkleTree, targetLeaf);
  else
    _generateMerkleProof(merkleTree, targetLeaf)
      .then(witnessArray => callback(null, witnessArray))
      .catch(err => callback(err));
};
export function verifyMerkleProof(merklePath: Witness[], targetData: string, merkleRoot: string): boolean {
  const hashOfTargetData = sha256(targetData);

  return _verifyMerkleProofRecursively(merkleRoot, merklePath, hashOfTargetData, 0);
};
