export const isElementsDuplicated = (leavesArray: string[]) => {
  const uniqueLeaves = new Set(leavesArray);

  return uniqueLeaves.size !== leavesArray.length;
};
