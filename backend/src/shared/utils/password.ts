import bcrypt from "bcryptjs";
import { env } from "../../config/env";

export const hashPassword = async (plainTextPassword: string): Promise<string> => {
  return bcrypt.hash(plainTextPassword, env.BCRYPT_ROUNDS);
};

export const verifyPassword = async (
  plainTextPassword: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(plainTextPassword, hash);
};