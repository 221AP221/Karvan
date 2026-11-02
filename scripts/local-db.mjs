// `npm run dev`-dən əvvəl işləyir: DATABASE_URL yoxdursa lokal bazanı arxa fonda işə salır
// (artıq işləyirsə, heç nə etmir), sonra yeni miqrasiyaları tətbiq edir və demo məlumatları yoxlayır.
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// Yeni versiya açılanda (zip yenilənəndə) əlavə olunmuş paketlər çatışmırsa, avtomatik quraşdırılır
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const missing = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((name) => !existsSync(`node_modules/${name}/package.json`));
if (missing.length) {
  console.log(`Çatışmayan paketlər quraşdırılır: ${missing.join(", ")}`);
  execSync("npm install", { stdio: "inherit" });
}

await import("dotenv/config");

if (!process.env.DATABASE_URL) {
  const { startLocalDatabase } = await import("./local-database.mjs");
  startLocalDatabase();
}
// Yeni açılan bazanın qoşulmağa hazır olması bir neçə saniyə çəkə bilər
for (let attempt = 1; ; attempt++) {
  try {
    execSync("npx prisma migrate deploy", { stdio: ["ignore", "ignore", attempt >= 8 ? "inherit" : "ignore"] });
    break;
  } catch (error) {
    if (attempt >= 8) throw error;
    await new Promise((r) => setTimeout(r, 1500));
  }
}
// Demo hesab və onun analitika məlumatları (yalnız çatışmayanlar əlavə olunur)
try {
  execSync("npx tsx prisma/seed.ts", { stdio: ["ignore", "ignore", "pipe"] });
} catch (error) {
  // Demo məlumatı yaradılmasa da sayt işə düşməlidir
  console.warn("Demo məlumatlar yenilənmədi:", String(error.stderr ?? error).split("\n").find((l) => l.trim()) ?? error);
}
