import QRCode from "qrcode";
import { DownloadQr } from "./PageQrClient";

/**
 * Səhifənin QR kodu: serverdə bir dəfə qurulur (link sabit olduğu üçün nəticə də sabitdir),
 * müştəri onu skan edib birbaşa satıcının səhifəsinə düşür.
 */
export async function PageQr({ url, username }: { url: string; username: string }) {
  const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 1, color: { dark: "#111827", light: "#ffffff" } });

  return (
    <DownloadQr dataUrl={dataUrl} fileName={`karvan-${username}-qr.png`} alt={`${username} səhifəsinin QR kodu`} />
  );
}
