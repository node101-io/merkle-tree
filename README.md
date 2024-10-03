# merkle-tree

A JavaScript library to generate a Merkle Tree using SHA-256. The library is designed for applications that require data integrity verification through cryptographic hashing with the complexity of O(log n). It supports building a Merkle tree from an array of leaves, generating a Merkle root and Proof, verifying a proof, adding and deleting leaves.


## Building a Tree
```javascript
const leaves = ['leaf_1', 'leaf_2', 'leaf_3'];

const merkleTree = generateMerkleTree(leaves, (err, merkleTree) => {
  if (err)
    return console.log(err);

  console.log(merkleTree);
});
```
Provide an array of leaves and generate a merkle tree. Merkle tree object has 3 field.
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

## Adding and Deleting leaves
For adding a leaf or leaves to the merkle tree we need to use addLeaf method. addLeaf method takes an array of leaves or an individual leaf and it creates the new merkle tree with the new leavesArray. For the protection

## Getting Merkle Root
## Obtaining a Merkle Proof
## Validating a Merkle Proof
## Weaknesses of Hash Functions
 ### Lenght Extension Attack
## Possible Attack Resistance

## Why there is no duplication on Merkle Set

## Related readings
### Why you should probably never sort your Merkle tree's leaves
https://alinush.github.io/2023/02/05/Why-you-should-probably-never-sort-your-Merkle-trees-leaves.html


# (CVE-2012-2459) denial-of-service attack

https://lists.linuxfoundation.org/pipermail/bitcoin-dev/2012-August/001806.html

# Length extension attack

## License
[MIT](https://choosealicense.com/licenses/mit/)