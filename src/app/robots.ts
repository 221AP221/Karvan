import type { MetadataRoute } from "next";
import { SITE_URL } from "@/i18n/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/", "/i/", "/login", "/signup", "/forgot-password", "/reset-password"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
