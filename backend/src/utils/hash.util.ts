import { compareSync, genSaltSync, hashSync } from 'bcrypt';

export function hashPassword(password: string): string {
  const salt = genSaltSync(10);
  return hashSync(password, salt);
}

export function comparePassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}
