const merkleTree = require('./merkleTree');

test('properly creates a merkle tree', (done) => {
  const textArray = ['test1', 'test2', 'test3', 'test4', 'test5'];

  const expectedMerkleTree = {
    tree: [
      'f9c2bf2b8e8275541f35c8d03cbcf57d8b73eb24bbaac832e113a20ba9f3b868',
      '73475cb40a568e8da8a5a25ef9f36a8f638316d8e3ac5f6c1c7fa975e8f1d863',
      '4e07408562bedb8b60ce05c1decfe3ad16b72230960c90b78b7420527d07053f',
      'ef797c8118f02d4c2b1dd2f098c51b56cc7732778f93d5474120e04d6c7b202e',
      '2ef7bde608ce5404e97d5f042f95f89f1c2328711cfdd8a7d51f2fdb8a10d989',
      '5feceb66ffc86f38d952786c6d696c79c7a4b8d9653a6a2a823965a0057d2cb0',
      '6b86b273ff34fce19d6b804eff5a3f574d25711d3d48aa1d2f1a1f2d668c8a9d',
      'd4735e3a265e16eee03f59718b9b5d03b5e2a6ce9697a0e42f5cf7a29977c5d1',
      '2d711642b726b04401627ca9fbac32f5c2855c1b1fd47d60f29c12f69fa7e0db'
    ],
    root: '2d711642b726b04401627ca9fbac32f5c2855c1b1fd47d60f29c12f69fa7e0db',
    leavesArray: ['test1', 'test2', 'test3', 'test4', 'test5']
  };

  merkleTree.createMerkleTree(textArray, (err, merkleTree) => {
    if(err)
      return done(err);

    expect(merkleTree).toEqual(expectedMerkleTree);
  });
});
