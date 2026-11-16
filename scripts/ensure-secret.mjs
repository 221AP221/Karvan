// APP_SECRET bazadakı həssas ayarları (AI açarı, ödəniş rekvizitləri) şifrələmək üçün lazımdır.
// Yoxdursa, burada bir dəfə yaradılıb .env faylına yazılır: əks halda produksiya rejimində
// admin paneldə açar nə saxlanılır, nə də oxunur.
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const FILE = ".env";
const NOTE = "# Bazadakı açarları şifrələyən gizli söz. Dəyişsəniz, saxlanılmış açarlar oxunmayacaq.";

export function ensureSecret() {
  if (process.env.APP_SECRET) return { created: false };

  const current = existsSync(FILE) ? readFileSync(FILE, "utf8") : "";
  const line = current.split("\n").find((l) => l.trim().startsWith("APP_SECRET="));
  if (line) {
    // .env-də var, amma bu prosesə yüklənməyib: proses üçün özümüz oxuyuruq
    process.env.APP_SECRET = line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
    return { created: false };
  }

  const secret = randomBytes(48).toString("base64url");
  const text = `${current && !current.endsWith("\n") ? "\n" : ""}${NOTE}\nAPP_SECRET="${secret}"\n`;
  if (current) appendFileSync(FILE, text);
  else writeFileSync(FILE, text);
  process.env.APP_SECRET = secret;
  return { created: true };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { created } = ensureSecret();
  console.log(created ? "APP_SECRET yaradıldı və .env faylına yazıldı." : "APP_SECRET yerindədir.");
}
