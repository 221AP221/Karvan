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
    execSync("npx prisma migrate deploy", { stdio: ["ignore", "ignore", attempt >= 8 ? "pipe" : "ignore"] });
    break;
  } catch (error) {
    if (attempt < 8) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    const text = String(error.stderr ?? "") + String(error.stdout ?? "");
    process.stderr.write(text);
    // Yarımçıq qalmış miqrasiya: nə edəcəyini açıq yazırıq, yoxsa sayt köhnə kodla açıq qalır
    if (text.includes("P3009")) {
      const name = text.match(/The `([^`]+)` migration started/)?.[1] ?? "<miqrasiya_adı>";
      console.error(`\nBaza yenilənmədi: əvvəlki cəhd yarımçıq qalıb. Bu iki əmri işlədin, sonra yenidən \`npm run dev\`:\n  npx prisma migrate resolve --rolled-back ${name}\n  npx prisma migrate deploy\n`);
    }
    throw error;
  }
}
// Sxem dəyişəndə (yeni zip) Prisma klienti köhnə qalmasın: "Unknown argument" xətasının qarşısını alır
execSync("npx prisma generate", { stdio: ["ignore", "ignore", "inherit"] });
// Demo hesab və onun analitika məlumatları (yalnız çatışmayanlar əlavə olunur)
try {
  execSync("npx tsx prisma/seed.ts", { stdio: ["ignore", "ignore", "pipe"] });
} catch (error) {
  // Demo məlumatı yaradılmasa da sayt işə düşməlidir
  console.warn("Demo məlumatlar yenilənmədi:", String(error.stderr ?? error).split("\n").find((l) => l.trim()) ?? error);
}
