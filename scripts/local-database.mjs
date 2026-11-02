// Lokal baza (prisma dev). Mövcud baza varsa onu olduğu kimi işlədir (adı dəyişdirilmir: köçürmə Windows-da
// məlumat itkisi riski yaradırdı), yeni quraşdırmada "karvan" adı ilə yaradır. Əvvəlki versiyanın yarımçıq
// qoyduğu vəziyyət (köhnə baza ehtiyat qovluğuna aparılıb, yenisi açılmayıb) avtomatik bərpa olunur.
import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const NAME = "karvan";
const LEGACY = "biofaktura"; // köhnə layihə adı ilə yaranmış baza (məlumatlar saxlanılır)

function dataRoot() {
  if (process.platform === "win32") return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "prisma-dev-nodejs", "Data");
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", "prisma-dev-nodejs");
  return join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share"), "prisma-dev-nodejs");
}

const hasData = (root, name) => existsSync(join(root, name, ".pglite")) && existsSync(join(root, name, "server.json"));

// Əvvəlki versiyanın ehtiyat nüsxəsi: <data>/../prisma-dev-nodejs-biofaktura-backup
function restoreLegacyBackup(root) {
  const backup = join(root, "..", "prisma-dev-nodejs-biofaktura-backup");
  if (hasData(root, LEGACY) || hasData(root, NAME) || !existsSync(join(backup, "server", ".pglite"))) return;
  console.log("Köhnə baza ehtiyat nüsxədən bərpa olunur...");
  rmSync(join(root, NAME), { recursive: true, force: true });
  rmSync(join(root, "durable-streams", NAME), { recursive: true, force: true });
  cpSync(join(backup, "server"), join(root, LEGACY), { recursive: true });
  if (existsSync(join(backup, "streams"))) cpSync(join(backup, "streams"), join(root, "durable-streams", LEGACY), { recursive: true });
  console.log("Bərpa olundu: məlumatlarınız yerindədir.");
}

export function startLocalDatabase() {
  const root = dataRoot();
  restoreLegacyBackup(root);
  // Yarımçıq qalmış (məlumatsız) yeni qovluq başlatmanı pozmasın
  if (existsSync(join(root, NAME)) && !hasData(root, NAME)) rmSync(join(root, NAME), { recursive: true, force: true });

  const name = hasData(root, LEGACY) && !hasData(root, NAME) ? LEGACY : NAME;
  try {
    execSync(`npx prisma dev -d -n ${name}`, { stdio: ["ignore", "ignore", "pipe"] });
  } catch (error) {
    console.error(`Lokal baza ("${name}") açılmadı:\n${String(error.stderr ?? error.message).trim()}`);
    throw error;
  }
}
