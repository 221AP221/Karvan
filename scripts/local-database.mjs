// Lokal baza (prisma dev): "karvan" adı ilə işləyir. Köhnə "biofaktura" adlı baza varsa, məlumatları avtomatik
// köçürülür; köhnənin ehtiyat nüsxəsi qalır (yoxlayandan sonra silə bilərsiniz).
import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const NAME = "karvan";
const OLD = "biofaktura";

function dataRoot() {
  if (process.platform === "win32") return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "prisma-dev-nodejs", "Data");
  if (process.platform === "darwin") return join(homedir(), "Library", "Application Support", "prisma-dev-nodejs");
  return join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share"), "prisma-dev-nodejs");
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function stopped(name) {
  try {
    const out = execSync("npx prisma dev ls", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return !out.split("\n").some((l) => l.includes(name) && /\brunning\b/.test(l));
  } catch {
    return true;
  }
}

function stopAndWait(name) {
  quiet(`npx prisma dev stop ${name}`);
  for (let i = 0; i < 20 && !stopped(name); i++) sleep(500);
}

const quiet = (cmd) => {
  try {
    execSync(cmd, { stdio: "ignore" });
  } catch {}
};

export function startLocalDatabase() {
  const root = dataRoot();
  const oldServer = join(root, OLD);
  const oldStreams = join(root, "durable-streams", OLD);
  const newData = join(root, NAME, ".pglite");

  if (existsSync(join(oldServer, ".pglite")) && !existsSync(newData)) {
    console.log("Köhnə lokal baza (biofaktura) karvan bazasına köçürülür...");
    stopAndWait(OLD);
    // Köhnə server qovluqdan çıxarılır (ehtiyat nüsxə qalır): yoxsa Prisma yeni serverə başqa portlar verir
    const backup = join(root, "..", "prisma-dev-nodejs-biofaktura-backup");
    rmSync(backup, { recursive: true, force: true });
    cpSync(oldServer, join(backup, "server"), { recursive: true });
    if (existsSync(oldStreams)) cpSync(oldStreams, join(backup, "streams"), { recursive: true });
    rmSync(oldServer, { recursive: true, force: true });
    rmSync(oldStreams, { recursive: true, force: true });

    quiet(`npx prisma dev -d -n ${NAME}`); // yeni serverin qovluğunu və standart portlarını yaradır
    stopAndWait(NAME);
    rmSync(newData, { recursive: true, force: true });
    cpSync(join(backup, "server", ".pglite"), newData, { recursive: true });
    console.log(`Məlumatlar köçürüldü. Köhnə bazanın ehtiyat nüsxəsi: ${backup}`);
  }
  execSync(`npx prisma dev -d -n ${NAME}`, { stdio: "ignore" });
}
