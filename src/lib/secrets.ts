import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// Bazada saxlanılan həssas ayarlar (API açarları) AES-256-GCM ilə şifrələnir. Açar APP_SECRET-dən yaranır.
// Real serverdə APP_SECRET mütləq təyin olunmalıdır; lokalda defolt dəyər istifadə olunur.
function key() {
  const secret = process.env.APP_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("APP_SECRET təyin edilməyib: açarları şifrələmək üçün lazımdır.");
  return scryptSync(secret ?? "karvan-local-dev-secret", "karvan-settings", 32);
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decrypt(payload: string): string | null {
  try {
    const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null; // APP_SECRET dəyişib və ya məlumat zədəlidir
  }
}
