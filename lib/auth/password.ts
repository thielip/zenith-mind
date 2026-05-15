// lib/auth/password.ts — Node Runtime Only
import bcrypt from "bcryptjs";

const ROUNDS = 12; // OWASP 建議最低 10，12 為平衡點

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
