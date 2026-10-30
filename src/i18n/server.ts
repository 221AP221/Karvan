import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale, isLocale } from "./config";
import { az } from "./dictionaries/az";
import { ru } from "./dictionaries/ru";
import { tr } from "./dictionaries/tr";

const DICTIONARIES = { az, tr, ru };
export type Dict = typeof az;

export const getDictionary = (locale: Locale): Dict => DICTIONARIES[locale];

// Dil prefiksi olmayan səhifələr (giriş, qeydiyyat) üçün: proxy-nin təyin etdiyi dil, yoxdursa seçilmiş dil (cookie)
export async function getLocale(): Promise<Locale> {
  const fromProxy = (await headers()).get("x-locale");
  if (isLocale(fromProxy)) return fromProxy;
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(fromCookie) ? fromCookie : DEFAULT_LOCALE;
}
