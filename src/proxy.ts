import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeFromPath } from "@/i18n/config";

// Dil prefiksi olmayan, amma ziyarətçinin seçdiyi dildə göstərilən səhifələr.
// Satıcı səhifəsi (/<username>) də buraya aiddir: ünvanı dəyişmir, dili cookie ilə seçilir.
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];
// Admin paneli və ödəniş simulyasiyası hələ Azərbaycan dilindədir; satıcı paneli artıq çoxdillidir
const AZ_ONLY = ["/admin", "/pay"];

// Hər sorğuya dil başlığı (x-locale) əlavə edir: <html lang> və giriş/qeydiyyat səhifələrinin dili bundan asılıdır.
// Dil prefiksli səhifəyə (/, /tr, /ru, kataloq) baxan ziyarətçinin seçimi cookie-də yadda qalır.
export function proxy(request: NextRequest) {
  const fromPath = localeFromPath(request.nextUrl.pathname);
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const path = request.nextUrl.pathname;
  const followsCookie =
    AUTH_PATHS.includes(path) || (!AZ_ONLY.some((p) => path === p || path.startsWith(`${p}/`)) && !path.startsWith("/_"));
  const locale = fromPath ?? (followsCookie && isLocale(saved) ? saved : DEFAULT_LOCALE);

  const headers = new Headers(request.headers);
  headers.set("x-locale", locale);
  const response = NextResponse.next({ request: { headers } });
  if (fromPath && saved !== fromPath) {
    response.cookies.set(LOCALE_COOKIE, fromPath, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|i/|favicon|icon|robots|sitemap|.*\\..*).*)"],
};
