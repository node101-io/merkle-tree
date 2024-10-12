# merkle-tree

A JavaScript library to generate a Merkle Tree using SHA-256. The library is designed for applications that require data integrity verification through cryptographic hashing. It supports a range of key functionalities, including:

- Building a Merkle tree from an array of leaves
- Generating the Merkle root and cryptographic proofs for leaf inclusion
- Verifying proofs to ensure data integrity
- Adding and removing leaves dynamically

The complexity for operations like proof generation and verification is optimized to $O(\log n)$, making this library well-suited for use in blockchain, distributed systems, or any application where cryptographic data validation is critical.


## Building a Tree

```javascript
const leaves = ['leaf_1', 'leaf_2', 'leaf_3'];

generateMerkleTree(leaves, (err, merkleTree) => {
  if (err)
    return console.log(err);

  console.log(merkleTree);
});
```
Provide an array of unique leaves and generate a merkle tree. Merkle tree object has 3 field.
- tree: a merkle tree which is complete binary tree
- root: root of the merkle tree which also can be reach through the last element of the merkleTree.tree
- leavesArray: an array of the leaves

```javascript
tree: [
    'b21f0bed6bc4671035b48fe4117223eee394129878eb69ccc1bd4bc9cfb1a8c0',
    '6bdcde01c11dde7a0b532df991ffa39b970f6cb184d02905525442cae311734c',
    '05f086386b21d049fd52fddf71840f86f0bf9dcd3b5b0cbce7737f257a252232',
    '05f086386b21d049fd52fddf71840f86f0bf9dcd3b5b0cbce7737f257a252232',
    '9788694eb5052fc7871acbe154843bcca9fb5ec11aaa9558c026f709b2ca179b',
    '9ff73710cb11aebc2ee63953f795f5f7fe8d659e20c3ca0702a98a184c84d414',
    'f0992f51777c5b571c57c12db014dcba83dd3b93ca71a4d437067b3367d385e9'
  ],
  root: 'f0992f51777c5b571c57c12db014dcba83dd3b93ca71a4d437067b3367d385e9',
  leavesArray: [ 'leaf_1', 'leaf_2', 'leaf_3' ]
```

The `generateMerkleTree` function first checks whether the provided leaves array contains unique elements. Although, in theory, a Merkle tree can consist of non-unique elements, we avoid them to ensure data integrity and mitigate denial-of-service attacks, such as [CVE-2012-2459](https://lists.linuxfoundation.org/pipermail/bitcoin-dev/2012-August/001806.html).


After confirming the uniqueness of the leaves, `generateMerkleTree` verifies the length of the array to ensure that it has an even number of elements, which is required for building a balanced binary tree. For this there is two option we will discuss.


## Adding leaves

For adding a leaf or leaves to the merkle tree we need to use `addLeaf` method. `addLeaf` method takes an array of leaves or a leaf string and it creates the new merkle tree with the new `leavesArray`. For ensuring non-duplicated `leavesArray` also we check uniqueness of the updated `leavesArray`

For only one leaf adition:

```javascript
const leaves = ['leaf_1', 'leaf_2', 'leaf_3'];

generateMerkleTree(leaves, (err, merkleTree) => {
  if (err)
    return console.log(err);

  addLeaf('induvidual_leaf', merkleTree, (err, updatedMerkleTree) => {
    if (err)
      return console.log(err)

    console.log(updatedMerkleTree);
  })
})
```

For multiple leaf adition:

```javascript
const leaves = ['leaf_1', 'leaf_2', 'leaf_3'];

generateMerkleTree(leaves, (err, merkleTree) => {
  if (err)
    return console.log(err);

  addLeaf(['leaf_4', 'leaf_5', 'leaf_6'], merkleTree, (err, updatedMerkleTree) => {
    if (err)
      return console.log(err)

    console.log(updatedMerkleTree);
  })
})
```
## Deleting leaves

## Getting Merkle Root

After creating `merkleTree` object we can directly reach root my `merkleTree.root`. Also we have a method to reach the Merkle Root `getMerkleRoot`

```javascript
const leaves = ['leaf_1', 'leaf_2', 'leaf_3'];

generateMerkleTree(leaves, (err, merkleTree) => {
  if (err)
    return console.log(err);

  console.log(merkleTree.root);
  //or
  getMerkleRoot(merkleTree , (err, merkleRoot) => {
    if (err)
      return console.log(err);

    console.log(merkleRoot);
  })
});
```


## Obtaining a Merkle Proof Path

A Merkle proof is a cryptographic proof used to verify that a particular piece of data (a "leaf") is part of a larger dataset (represented by a Merkle tree) without having to reveal the entire dataset. It’s a key feature in ensuring data integrity and efficiency in verification processes. (change here)

```javascript
const leaves = ['leaf_1', 'leaf_2', 'leaf_3'];

generateMerkleTree(leaves, (err, merkleTree) => {
  if (err)
    return console.log(err);

  generateMerkleProof('leaf_1', merkleTree, (err, merkleProof) => {
    if (err)
      return console.log(err);

    console.log(merkleProof);
  })
});
```

## Validating a Merkle Proof

Validating a Merkle proof is essential for ensuring the integrity and authenticity of data in systems where it's important to verify that a particular piece of data is part of a larger dataset (represented by a Merkle tree) without having to download or trust the entire dataset.

For our package a validation process look like:

```javascript
verifyMerkleProof('target_data', merklePath, (err, isPartOfTheTree) => {
  if (err)
    return console.log(err);

  console.log(isPartOfTheTree);
});
```


## Discussion
### Different Aproach for Creating Merkle Tree

Our aproach to generate Merkle tree is checking each layer recursively and ensure the each layer has even node.

![example 1](./img/example%201.png)

The other option is to round the number of nodes to the nearest multiple of 2. By doing this, we ensure that the number of nodes in each layer is even.

![example 2](./img/example%202.png)

The reason why we chose the first aproach is for the worst case we only need $\log n$ extra nodes. But in the second aproach for the worst case we need $2^{n - 1} - 1$ extra nodes.

![aproach 1](./img/aproach%201.png)

![aproach 2](./img/aproach%202.png)

## Why there is no duplication on Merkle Set

## Weaknesses of Hash Functions
### Lenght Extension Attack
### Denial-of-service attack (CVE-2012-2459)



## Related readings
[Why you should probably never sort your Merkle tree's leaves](https://alinush.github.io/2023/02/05/Why-you-should-probably-never-sort-your-Merkle-trees-leaves.html)

## License
[MIT](https://choosealicense.com/licenses/mit/)