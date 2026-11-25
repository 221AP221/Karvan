import QRCode from "qrcode";
import { DownloadQr } from "./PageQrClient";

/**
 * Səhifənin QR kodu: serverdə bir dəfə qurulur (link sabit olduğu üçün nəticə də sabitdir),
 * müştəri onu skan edib birbaşa satıcının səhifəsinə düşür.
 */
export async function PageQr({ url, username }: { url: string; username: string }) {
  const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 1, color: { dark: "#111827", light: "#ffffff" } });

  return (
    <div className="max-w-[15rem]">
      <h2 className="font-semibold">QR kod</h2>
      <div className="mt-3 flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URL, optimallaşdırma lazım deyil */}
        <img src={dataUrl} alt={`${username} səhifəsinin QR kodu`} className="h-24 w-24 shrink-0 rounded-xl border border-gray-200" />
        <div className="min-w-0">
          <p className="text-xs text-gray-500">Vizitkartda və ya vitrində istifadə edin.</p>
          <DownloadQr dataUrl={dataUrl} fileName={`karvan-${username}-qr.png`} />
        </div>
      </div>
    </div>
  );
}
