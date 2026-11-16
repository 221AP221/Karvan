import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// Bazada saxlanılan həssas ayarlar (AI açarı və s.) AES-256-GCM ilə şifrələnir. Açar APP_SECRET-dən yaranır.
// APP_SECRET `npm run dev` / `npm start` zamanı avtomatik yaradılıb .env faylına yazılır (scripts/ensure-secret.mjs).
//
// Köhnə quraşdırmalar APP_SECRET olmadan işləyirdi və defolt sözlə şifrələnirdi. Həmin yazılar itməsin deyə
// oxuyarkən köhnə açar da sınanır; belə yazı ilk dəfə oxunanda yenidən, cari açarla saxlanılır.
const LEGACY_SECRET = "karvan-local-dev-secret";

const derive = (secret: string) => scryptSync(secret, "karvan-settings", 32);

function keys(): { current: Buffer; legacy?: Buffer } {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "APP_SECRET təyin edilməyib: açarları şifrələmək üçün lazımdır. `npm start` onu özü yaradır; serverdə isə mühit dəyişəni kimi verin.",
      );
    }
    return { current: derive(LEGACY_SECRET) };
  }
  return { current: derive(secret), legacy: derive(LEGACY_SECRET) };
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keys().current, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

function open(payload: string, key: Buffer): string | null {
  try {
    const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Mətni qaytarır; `legacy` — yazı köhnə açarla açılıb və yenidən saxlanılmalıdır. */
export function decryptDetailed(payload: string): { text: string; legacy: boolean } | null {
  const { current, legacy } = keys();
  const now = open(payload, current);
  if (now !== null) return { text: now, legacy: false };
  if (legacy) {
    const old = open(payload, legacy);
    if (old !== null) return { text: old, legacy: true };
  }
  return null; // APP_SECRET dəyişib və ya məlumat zədəlidir
}

export function decrypt(payload: string): string | null {
  return decryptDetailed(payload)?.text ?? null;
}
