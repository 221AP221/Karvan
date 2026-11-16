import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import type { NextConfig } from "next";

// Turbopack layihənin kökünü lock faylına görə tapır. İstifadəçinin ev qovluğunda
// təsadüfi bir package-lock.json qalıbsa, kök oraya sürüşür və xəbərdarlıq çıxır.
// Kökü açıq göstəririk: bu fayl layihənin kökündədir.
const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: { "/api/invoices/*": ["./assets/fonts/*.ttf"] },
  turbopack: { root },
  experimental: {
    // Panel səhifələri dinamikdir: standart olaraq hər keçid serverə gedir.
    // 30 saniyəlik müştəri keşi "geri/irəli" və menyu arasında gedib-gəlməni ani edir.
    // Dəyişiklik edən əməliyyatlar revalidatePath çağırdığı üçün köhnə məlumat qalmır.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
