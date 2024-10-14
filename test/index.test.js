import { test, describe, expect, it } from 'vitest';
import { generateMerkleTree, generateMerkleProof } from '../build/index.js';

describe.each([
  {
    leavesArray: ['test1'],
    expectedMerkleTree: {
      tree: ['1b4f0e9851971998e732078544c96b36c3d01cedf7caa332359d6f1d83567014'],
      root: '1b4f0e9851971998e732078544c96b36c3d01cedf7caa332359d6f1d83567014',
      leavesArray: ['test1']
    }
  },
  {
    leavesArray: ['test1', 'test2'],
    expectedMerkleTree: {
      tree: [
        '1b4f0e9851971998e732078544c96b36c3d01cedf7caa332359d6f1d83567014',
        '60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752',
        '2f297f1520dfd4d6a9b680536568fd3aad16a8c2d7067b654ea06dd931bccd51'
      ],
      root: '2f297f1520dfd4d6a9b680536568fd3aad16a8c2d7067b654ea06dd931bccd51',
      leavesArray: ['test1', 'test2']
    }
  },
  {
    leavesArray: ['test1', 'test2', 'test3'],
    expectedMerkleTree: {
      tree: [
        '1b4f0e9851971998e732078544c96b36c3d01cedf7caa332359d6f1d83567014',
        '60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752',
        'fd61a03af4f77d870fc21e05e7e80678095c92d808cfb3b5c279ee04c74aca13',
        'fd61a03af4f77d870fc21e05e7e80678095c92d808cfb3b5c279ee04c74aca13',
        '2f297f1520dfd4d6a9b680536568fd3aad16a8c2d7067b654ea06dd931bccd51',
        '000b7a5fc83fa7fb1e405b836daf3488d00ac42cb7fc5a917840e91ddc651661',
        'd6aaf9c71e15f57bbd132955709520fe633c6547b2bc0ceb66baaaff71f9ab61'

      ],
      root: 'd6aaf9c71e15f57bbd132955709520fe633c6547b2bc0ceb66baaaff71f9ab61',
      leavesArray: ['test1', 'test2', 'test3']
    }
  },
  {
    leavesArray: ['test1', 'test2', 'test3', 'test4'],
    expectedMerkleTree: {
      tree: [
        '1b4f0e9851971998e732078544c96b36c3d01cedf7caa332359d6f1d83567014',
        '60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752',
        'fd61a03af4f77d870fc21e05e7e80678095c92d808cfb3b5c279ee04c74aca13',
        'a4e624d686e03ed2767c0abd85c14426b0b1157d2ce81d27bb4fe4f6f01d688a',
        '2f297f1520dfd4d6a9b680536568fd3aad16a8c2d7067b654ea06dd931bccd51',
        '400c4387b6200c3cdc99a4a6efa396cceb74640d3ea93c0e96a84c0a396de8c9',
        'b437a3f04a2410505819386b059d09fab957c0ae2046caeab93beaa91e33352f'

      ],
      root: 'b437a3f04a2410505819386b059d09fab957c0ae2046caeab93beaa91e33352f',
      leavesArray: ['test1', 'test2', 'test3', 'test4']
    }
  },
  {
    leavesArray: ['test1', 'test2', 'test3', 'test4', 'test5'],
    expectedMerkleTree: {
      tree: [
        '1b4f0e9851971998e732078544c96b36c3d01cedf7caa332359d6f1d83567014', //
        '60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752', //
        'fd61a03af4f77d870fc21e05e7e80678095c92d808cfb3b5c279ee04c74aca13', //
        'a4e624d686e03ed2767c0abd85c14426b0b1157d2ce81d27bb4fe4f6f01d688a', //
        'a140c0c1eda2def2b830363ba362aa4d7d255c262960544821f556e16661b6ff', //
        'a140c0c1eda2def2b830363ba362aa4d7d255c262960544821f556e16661b6ff', //
        '2f297f1520dfd4d6a9b680536568fd3aad16a8c2d7067b654ea06dd931bccd51',
        '400c4387b6200c3cdc99a4a6efa396cceb74640d3ea93c0e96a84c0a396de8c9',
        '5becda531601ec4b4aeb5cdd05b0c891946fa6fbc75c974a643723c6d7e60b24',
        '5becda531601ec4b4aeb5cdd05b0c891946fa6fbc75c974a643723c6d7e60b24',
        'b437a3f04a2410505819386b059d09fab957c0ae2046caeab93beaa91e33352f',
        '9c9ead8b820cb402c29345f1282a6ab00fa23b6f3f9b23cff537d7c6acb2c8ac',
        '6884a11aa2f9382de974dbb9e7277ee38a6636646bba1317739f3d8e0daf5fab'
      ],
      root: '6884a11aa2f9382de974dbb9e7277ee38a6636646bba1317739f3d8e0daf5fab',
      leavesArray: ['test1', 'test2', 'test3', 'test4', 'test5']
    }
  }
])('create merkle tree for $leavesArray', ({ leavesArray, expectedMerkleTree }) => {
  test('returns the correct merkle tree promise', () => {
    generateMerkleTree(leavesArray)
      .then(merkleTree => {
        expect(merkleTree).toStrictEqual(expectedMerkleTree);
      })
      .catch(err => {
        expect(err).toEqual(null);
      });
  });
  it('returns the correct merkle tree callback', () => new Promise(done => {
    generateMerkleTree(leavesArray, (err, merkleTree) => {
      expect(err).toEqual(null);
      expect(merkleTree).toStrictEqual(expectedMerkleTree);
      done();
    });
  }));
});

// describe.each([
//   {
//     merkleTree: {
//       tree: [
//         '1b4f0e9851971998e732078544c96b36c3d01cedf7caa332359d6f1d83567014', //
//         '60303ae22b998861bce3b28f33eec1be758a213c86c93c076dbe9f558c11c752', //
//         'fd61a03af4f77d870fc21e05e7e80678095c92d808cfb3b5c279ee04c74aca13', //
//         'a4e624d686e03ed2767c0abd85c14426b0b1157d2ce81d27bb4fe4f6f01d688a', //
//         'a140c0c1eda2def2b830363ba362aa4d7d255c262960544821f556e16661b6ff', //
//         'a140c0c1eda2def2b830363ba362aa4d7d255c262960544821f556e16661b6ff', //
//         '2f297f1520dfd4d6a9b680536568fd3aad16a8c2d7067b654ea06dd931bccd51',
//         '400c4387b6200c3cdc99a4a6efa396cceb74640d3ea93c0e96a84c0a396de8c9',
//         '5becda531601ec4b4aeb5cdd05b0c891946fa6fbc75c974a643723c6d7e60b24',
//         '5becda531601ec4b4aeb5cdd05b0c891946fa6fbc75c974a643723c6d7e60b24',
//         'b437a3f04a2410505819386b059d09fab957c0ae2046caeab93beaa91e33352f',
//         '9c9ead8b820cb402c29345f1282a6ab00fa23b6f3f9b23cff537d7c6acb2c8ac',
//         '6884a11aa2f9382de974dbb9e7277ee38a6636646bba1317739f3d8e0daf5fab'
//       ],
//       root: '6884a11aa2f9382de974dbb9e7277ee38a6636646bba1317739f3d8e0daf5fab',
//       leavesArray: ['test1', 'test2', 'test3', 'test4', 'test5']
//     },
//     expectedMerkleTree: null // TODO: add expected merkle tree
//   }
// ])('add leaves to merkle tree', ({ merkleTree, expectedMerkleTree }) => {
//   test('returns the correct merkle tree promise', () => {
//     addLeavesToMerkleTree(merkleTree, ['test6', 'test7'])
//       .then(merkleTree => {
//         expect(merkleTree).toStrictEqual(expectedMerkleTree);
//       })
//       .catch(err => {
//         expect(err).toEqual(null);
//       });
//   });
//   it('returns the correct merkle tree callback', () => new Promise(done => {
//     addLeavesToMerkleTree(merkleTree, ['test6', 'test7'], (err, merkleTree) => {
//       expect(err).toEqual(null);
//       expect(merkleTree).toStrictEqual(expectedMerkleTree);
//       done();
//     });
//   }));
// });
