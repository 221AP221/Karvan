import { createHash } from "node:crypto";
import { db } from "@/lib/db";

export const hashResetToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function findValidReset(token: string) {
  if (!token) return null;
  const reset = await db.passwordReset.findUnique({ where: { id: hashResetToken(token) } });
  return reset && !reset.usedAt && reset.expiresAt > new Date() ? reset : null;
}
