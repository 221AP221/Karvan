// `npm run dev`-dən əvvəl işləyir: DATABASE_URL yoxdursa lokal bazanı arxa fonda işə salır
// (artıq işləyirsə, heç nə etmir), sonra yeni miqrasiyaları tətbiq edir.
import "dotenv/config";
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  execSync("npx prisma dev -d -n biofaktura", { stdio: "ignore" });
}
execSync("npx prisma migrate deploy", { stdio: ["ignore", "ignore", "inherit"] });
