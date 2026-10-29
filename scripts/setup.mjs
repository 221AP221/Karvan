// Bir komanda ilə quraşdırma: lokal baza + cədvəllər + demo məlumat. Windows, macOS və Linux-da işləyir.
import "dotenv/config";
import { execSync } from "node:child_process";

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

if (!process.env.DATABASE_URL) run("npx prisma dev -d -n biofaktura");
run("npx prisma migrate deploy");
run("npx prisma db seed");

console.log(`
Hazırdır! İndi işə salın:  npm run dev
Sonra açın:                http://localhost:3000/login
Demo giriş:                demo@biofaktura.az / demo12345
`);
