import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { NavigationTracker } from "@/components/BackButton";

export const metadata: Metadata = {
  title: "BioFaktura",
  description: "Link-in-bio səhifə, sifariş və faktura bir yerdə",
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
