import { db } from "@/lib/db";

// M1-də Auth.js (SMS OTP / Google) ilə əvəz olunacaq.
// İndilik yalnız development rejimində DEV_PROFILE_USERNAME profili qaytarılır.
export async function getCurrentProfile() {
  if (process.env.NODE_ENV === "production") return null;
  const username = process.env.DEV_PROFILE_USERNAME;
  if (!username) return null;
  return db.profile.findUnique({
    where: { username },
    include: { user: { include: { subscription: true } } },
  });
}
