import crypto from "node:crypto";
import { env } from "../../config/env";

const ALGORITHM = "aes-256-cbc";
// Derive a 32-byte key from JWT_ACCESS_SECRET
const KEY = crypto.createHash("sha256").update(env.JWT_ACCESS_SECRET).digest();

export function encryptToken(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  // Use dash separator to be URL-safe without encoding
  return `${iv.toString("hex")}-${encrypted}`;
}

export function decryptToken(token: string): string | null {
  try {
    const parts = token.split("-");
    if (parts.length !== 2) {
      return null;
    }
    const iv = Buffer.from(parts[0], "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(parts[1], "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    return null;
  }
}
