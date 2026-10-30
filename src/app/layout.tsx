import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { NavigationTracker } from "@/components/BackButton";

export const metadata: Metadata = {
  title: { default: "Karvan — profil linkiniz satış edir", template: "%s | Karvan" },
  description: "Instagram və TikTok-da xidmət satanlar üçün link-in-bio səhifə, sifariş formu, avtomatik PDF faktura və ödəniş izləmə.",
  applicationName: "Karvan",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <body className="min-h-screen antialiased">
        <NavigationTracker />
        {children}
      </body>
    </html>
  );
}
