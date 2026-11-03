import type { MetadataRoute } from "next";
import { SITE_URL } from "@/i18n/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Şəxsi səhifələr (faktura linkləri gizli qalmalıdır). Filtrli kataloq ünvanları bloklanmır:
        // onlarda noindex var, bunun görünməsi üçün robot səhifəni oxuya bilməlidir.
        disallow: ["/dashboard", "/admin", "/api/", "/i/", "/pay/", "/login", "/signup", "/forgot-password", "/reset-password"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
