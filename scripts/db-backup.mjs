#!/usr/bin/env node
// Verilənlər bazasının ehtiyat nüsxəsi (NFR-REL-04).
// İstifadə: npm run db:backup [-- --dir=/yol] [-- --keep=14]
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  }),
);

// DATABASE_URL yoxdursa, lokal inkişaf bazası (prisma dev) götürülür — src/lib/local-db.ts ilə eyni
const LOCAL_DATABASE_URL = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const url = process.env.DATABASE_URL || LOCAL_DATABASE_URL;
if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL yoxdur — lokal inkişaf bazasının nüsxəsi götürülür.");
}

const dir = path.resolve(args.dir ?? "backups");
const keep = Number(args.keep ?? 14);
mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const file = path.join(dir, `karvan-${stamp}.dump`);

try {
  // -Fc: sıxılmış format, pg_restore ilə açılır
  execFileSync("pg_dump", ["--no-owner", "--no-privileges", "-Fc", "-f", file, url], { stdio: ["ignore", "inherit", "inherit"] });
} catch (error) {
  rmSync(file, { force: true }); // yarımçıq fayl qalmasın
  console.error("\npg_dump işə düşmədi.");
  console.error("Yoxlayın: postgresql-client quraşdırılıb və versiyası serverin versiyası ilə uyğundur.");
  console.error(String(error.message ?? error));
  process.exit(1);
}

const size = (statSync(file).size / 1024 / 1024).toFixed(1);
console.log(`Ehtiyat nüsxə hazırdır: ${file} (${size} MB)`);

// Köhnə nüsxələrin təmizlənməsi
const old = readdirSync(dir)
  .filter((f) => f.startsWith("karvan-") && f.endsWith(".dump"))
  .sort()
  .slice(0, -keep);
for (const f of old) {
  rmSync(path.join(dir, f));
  console.log(`Silindi (köhnə): ${f}`);
}

console.log(`\nBərpa: pg_restore --clean --if-exists --no-owner -d "$DATABASE_URL" "${file}"`);
if (!existsSync(path.join(dir, ".gitignore"))) {
  console.log("Qeyd: nüsxələri repozitoriyaya yükləməyin — backups/ .gitignore-dadır.");
}
