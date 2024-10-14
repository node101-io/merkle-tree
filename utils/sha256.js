import crypto from 'node:crypto';

export const sha256 = (string) => {
  return crypto.createHash('sha256').update(string.toString()).digest('hex');
};
