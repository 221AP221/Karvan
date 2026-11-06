// `prisma dev` ilə işə düşən lokal Postgres (qeydiyyat tələb etmir). DATABASE_URL verilməyibsə istifadə olunur.
//
// Port sabit deyil: `prisma dev` hər quraşdırmada boş port seçir (51214, 50310, ...) və onu öz
// server.json faylına yazır. Həmin faylın yeri isə əməliyyat sistemindən və prisma versiyasından
// asılı olaraq dəyişir, ona görə bir neçə ehtimal olunan qovluqda axtarırıq.
// Yalnız server tərəfdə oxunur (src/lib/db.ts və prisma.config.ts).
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const FALLBACK = "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const PREFERRED = ["karvan", "biofaktura"]; // biofaktura: layihənin köhnə adı ilə yaranmış baza

function roots() {
  const home = homedir();
  const list = [
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "prisma-dev-nodejs", "Data"),
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "prisma-dev-nodejs"),
    process.env.APPDATA && join(process.env.APPDATA, "prisma-dev-nodejs"),
    join(home, "AppData", "Local", "prisma-dev-nodejs", "Data"),
    join(home, "AppData", "Roaming", "prisma-dev-nodejs"),
    join(home, "Library", "Application Support", "prisma-dev-nodejs"),
    process.env.XDG_DATA_HOME && join(process.env.XDG_DATA_HOME, "prisma-dev-nodejs"),
    join(home, ".local", "share", "prisma-dev-nodejs"),
  ].filter((p): p is string => Boolean(p));
  return [...new Set(list)].filter((p) => existsSync(p));
}

type Found = { name: string; file: string; url: string; mtime: number };

function read(file: string, name: string): Found | null {
  try {
    const meta = JSON.parse(readFileSync(file, "utf8")) as {
      databasePort?: number;
      exports?: { database?: { connectionString?: string } };
    };
    const url =
      meta.exports?.database?.connectionString ??
      (meta.databasePort ? `postgres://postgres:postgres@localhost:${meta.databasePort}/template1?sslmode=disable` : null);
    return url ? { name, file, url, mtime: statSync(file).mtimeMs } : null;
  } catch {
    return null;
  }
}

/** Tapılan bütün lokal bazalar: əvvəl bu layihənin adları, sonra ən son işə düşən. */
export function findLocalDatabases(): Found[] {
  const found: Found[] = [];
  for (const root of roots()) {
    let entries: string[];
    try {
      entries = readdirSync(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      if (name === "durable-streams") continue; // ayrı xidmətin qovluğu, baza deyil
      const file = join(root, name, "server.json");
      if (!existsSync(file)) continue;
      const hit = read(file, name);
      if (hit) found.push(hit);
    }
  }
  return found.sort((a, b) => {
    const rank = (n: string) => {
      const i = PREFERRED.indexOf(n);
      return i === -1 ? PREFERRED.length : i;
    };
    return rank(a.name) - rank(b.name) || b.mtime - a.mtime;
  });
}

export const LOCAL_DATABASE_URL = findLocalDatabases()[0]?.url ?? FALLBACK;
