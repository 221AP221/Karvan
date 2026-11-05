/**
 * Səhifə çəkilməzdən əvvəl işləməli olan sətirdaxili skript.
 *
 * React komponentin içindəki <script> brauzerdə icra olunmur və inkişaf rejimində xəbərdarlıq verir.
 * Next-in tövsiyəsi: serverdə `text/javascript`, klientdə `text/plain` tipi vermək —
 * belədə skript yalnız HTML oxunarkən (ilk yüklənmədə) işləyir, xəbərdarlıq isə olmur.
 * Mənbə: node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
