export const repeatLastElementOfArrayIfNotEven = (leavesArray: string[]) => {
  if (leavesArray.length % 2 !== 0)
    leavesArray = [...leavesArray, leavesArray[leavesArray.length - 1]];

  return leavesArray;
};
