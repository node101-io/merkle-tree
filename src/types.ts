export interface MerkleTree {
  tree: string[];
  root: string;
  leavesArray: string[];
}

export interface Witness {
  witnessHash: string;
  witnessIndex: number;
}

export interface GenerateUpperTreeWitnessData {
  cummulativeNodeCount: number;
  currentIndex: number;
  nextLevelNodeCount: number;
  nextLevelNodePosition: number;
  witnessArray: Witness[];
  merkleTree: MerkleTree;
}

export interface CallbackMerkleTree {
  (err: string | null, merkleTree?: MerkleTree): void;
}

export interface CallbackMerkleProof {
  (err: string | null, merkleProof?: string[]): void
}
