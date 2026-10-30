import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, localeFromPath } from "@/i18n/config";

// Dil prefiksi olmayan, amma seçilmiş dildə göstərilən səhifələr. Satıcı paneli və satıcı səhifələri hələlik Azərbaycan dilindədir.
const AUTH_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Hər sorğuya dil başlığı (x-locale) əlavə edir: <html lang> və giriş/qeydiyyat səhifələrinin dili bundan asılıdır.
// Dil prefiksli səhifəyə (/, /tr, /ru, kataloq) baxan ziyarətçinin seçimi cookie-də yadda qalır.
export function proxy(request: NextRequest) {
  const fromPath = localeFromPath(request.nextUrl.pathname);
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const followsCookie = AUTH_PATHS.includes(request.nextUrl.pathname);
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
