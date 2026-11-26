"use client";

import { Download } from "lucide-react";

/** QR-ın özü yükləmə linkidir: ayrıca düymə və izah mətni olmasın deyə. */
export function DownloadQr({ dataUrl, fileName, alt }: { dataUrl: string; fileName: string; alt: string }) {
  return (
    <a href={dataUrl} download={fileName} title="QR kodu yüklə" className="group relative shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL, optimallaşdırma lazım deyil */}
      <img src={dataUrl} alt={alt} className="h-20 w-20 rounded-xl border border-gray-200" />
      <span className="absolute inset-0 grid place-items-center rounded-xl bg-white/85 opacity-0 transition group-hover:opacity-100">
        <Download size={18} className="text-gray-700" aria-hidden />
      </span>
    </a>
  );
}
