export const isElementsDuplicated = leavesArray => {
  const uniqueLeaves = new Set(leavesArray);

  return uniqueLeaves.size !== leavesArray.length;
};
