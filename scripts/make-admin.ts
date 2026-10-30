// İstifadə: npm run admin -- ad@karvan.az [şifrə]
// Hesab varsa admin edir; yoxdursa şifrə ilə yeni admin hesabı yaradır.
import { hashPassword } from "../src/lib/auth";
import { db } from "../src/lib/db";

const [email, password] = process.argv.slice(2);
if (!email || !/^[^@\s]+@[^@\s]+$/.test(email)) {
  console.error("İstifadə: npm run admin -- e-poçt [şifrə]");
  process.exit(1);
}
const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
if (existing) {
  await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN", blockedAt: null } });
  console.log(`${email} artıq admindir. /admin ünvanından daxil olun.`);
} else {
  if (!password || password.length < 10) {
    console.error("Yeni admin üçün ən azı 10 simvollu şifrə yazın: npm run admin -- e-poçt şifrə");
    process.exit(1);
  }
  await db.user.create({ data: { email: email.toLowerCase(), role: "ADMIN", passwordHash: await hashPassword(password) } });
  console.log(`Admin hesabı yaradıldı: ${email}. /login ilə daxil olun.`);
}
process.exit(0);
