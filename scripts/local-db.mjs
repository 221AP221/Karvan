// `npm run dev`-dən əvvəl işləyir: DATABASE_URL yoxdursa lokal bazanı arxa fonda işə salır
// (artıq işləyirsə, heç nə etmir), sonra yeni miqrasiyaları tətbiq edir və demo məlumatları yoxlayır.
import "dotenv/config";
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  // "biofaktura" lokal bazanın daxili adıdır: dəyişsə, mövcud məlumatlar olan baza tapılmaz
  execSync("npx prisma dev -d -n biofaktura", { stdio: "ignore" });
}
execSync("npx prisma migrate deploy", { stdio: ["ignore", "ignore", "inherit"] });
// Demo hesab və onun analitika məlumatları (yalnız çatışmayanlar əlavə olunur)
execSync("npx tsx prisma/seed.ts", { stdio: ["ignore", "ignore", "inherit"] });
