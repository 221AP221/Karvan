// `prisma dev` ilə işə düşən lokal Postgres (qeydiyyat tələb etmir). DATABASE_URL verilməyibsə istifadə olunur.
//
// Port sabit deyil: `prisma dev` hər quraşdırmada boş port seçir (51214, 50310, ...). Ona görə
// əlaqə sətrini serverin özünün yazdığı server.json faylından oxuyuruq; tapılmasa, ən çox rast
// gələn portla davam edirik. Yalnız server tərəfdə oxunur (src/lib/db.ts və prisma.config.ts).
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const FALLBACK = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const NAMES = ["karvan", "biofaktura"]; // biofaktura: layihənin köhnə adı ilə yaranmış baza

function dataRoot() {
  if (process.platform === "win32") return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "prisma-dev-nodejs", "Data");
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", "prisma-dev-nodejs");
  return join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share"), "prisma-dev-nodejs");
}

function connectionStringOf(name: string) {
  try {
    const file = join(dataRoot(), name, "server.json");
    if (!existsSync(file)) return null;
    const meta = JSON.parse(readFileSync(file, "utf8")) as {
      databasePort?: number;
      exports?: { database?: { connectionString?: string } };
    };
    if (meta.exports?.database?.connectionString) return meta.exports.database.connectionString;
    if (meta.databasePort) return `postgres://postgres:postgres@localhost:${meta.databasePort}/template1?sslmode=disable`;
    return null;
  } catch {
    return null;
  }
}

export const LOCAL_DATABASE_URL = NAMES.map(connectionStringOf).find(Boolean) ?? FALLBACK;
