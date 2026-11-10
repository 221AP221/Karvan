import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: { "/api/invoices/*": ["./assets/fonts/*.ttf"] },
  experimental: {
    // Panel səhifələri dinamikdir: standart olaraq hər keçid serverə gedir.
    // 30 saniyəlik müştəri keşi "geri/irəli" və menyu arasında gedib-gəlməni ani edir.
    // Dəyişiklik edən əməliyyatlar revalidatePath çağırdığı üçün köhnə məlumat qalmır.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
