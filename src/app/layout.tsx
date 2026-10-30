import type { Metadata } from "next";
import "@fontsource-variable/geologica";
import "@fontsource-variable/onest";
import "./globals.css";
import { NavigationTracker } from "@/components/BackButton";
import { SITE_URL } from "@/i18n/config";
import { getLocale } from "@/i18n/server";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Karvan — link-in-bio, sifariş və onlayn faktura", template: "%s | Karvan" },
  description: "Instagram və TikTok-da xidmət satanlar üçün link-in-bio səhifə, sifariş formu, avtomatik PDF faktura və ödəniş izləmə.",
  applicationName: "Karvan",
};

// Səhifə çəkilməzdən əvvəl tema tətbiq olunur ki, qaranlıq rejimdə ağ "parıltı" olmasın
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <NavigationTracker />
        {children}
      </body>
    </html>
  );
}
