import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BioFaktura",
  description: "Link-in-bio səhifə, sifariş və faktura bir yerdə",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
