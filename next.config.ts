import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: { "/api/invoices/*": ["./assets/fonts/*.ttf"] },
};

export default nextConfig;
