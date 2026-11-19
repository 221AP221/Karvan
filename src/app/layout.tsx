import type { Metadata } from "next";
import "@fontsource-variable/geologica";
import "@fontsource-variable/onest";
import "./globals.css";
import { NavigationTracker } from "@/components/BackButton";
import { InitialLoader } from "@/components/InitialLoader";
import { InlineScript } from "@/components/InlineScript";
import { ChatWidget } from "@/components/site/ChatWidget";
import { CookieNotice } from "@/components/site/CookieNotice";
import { SITE_URL } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

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
  const dict = getDictionary(locale);
  const notice = dict.footer.cookieNotice;
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <InlineScript html={THEME_SCRIPT} />
      </head>
      <body className="min-h-screen antialiased">
        <InitialLoader />
        <NavigationTracker />
        {children}
        <CookieNotice text={notice.text} accept={notice.accept} more={notice.more} href="/cookie" />
        <ChatWidget t={dict.chat} />
      </body>
    </html>
  );
}
