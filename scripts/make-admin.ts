// İstifadə: npm run admin -- ad@karvan.az [şifrə] [--super]
// Hesab varsa admin (və ya super admin) edir; yoxdursa şifrə ilə yeni hesab yaradır.
import { hashPassword } from "../src/lib/auth";
import { db } from "../src/lib/db";

const args = process.argv.slice(2);
const role = args.includes("--super") ? "SUPER_ADMIN" : "ADMIN";
const [email, password] = args.filter((a) => !a.startsWith("--"));
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("İstifadə: npm run admin -- e-poçt [şifrə] [--super]");
  process.exit(1);
}
const label = role === "SUPER_ADMIN" ? "super admin" : "admin";
const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
if (existing) {
  await db.user.update({ where: { id: existing.id }, data: { role, blockedAt: null, ...(password ? { passwordHash: await hashPassword(password) } : {}) } });
  console.log(`${email} indi ${label}dir${password ? ", şifrə yeniləndi" : ""}. /login ilə daxil olun.`);
} else {
  if (!password || password.length < 10) {
    console.error("Yeni hesab üçün ən azı 10 simvollu şifrə yazın.");
    process.exit(1);
  }
  await db.user.create({ data: { email: email.toLowerCase(), role, passwordHash: await hashPassword(password) } });
  console.log(`Yeni ${label} yaradıldı: ${email}. /login ilə daxil olun.`);
}
process.exit(0);
