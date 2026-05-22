import { createHash } from "crypto";

export const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};