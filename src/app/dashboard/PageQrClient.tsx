"use client";

import { Download } from "lucide-react";

export function DownloadQr({ dataUrl, fileName }: { dataUrl: string; fileName: string }) {
  return (
    <a
      href={dataUrl}
      download={fileName}
      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)] transition hover:opacity-70"
    >
      <Download size={15} aria-hidden /> Yüklə
    </a>
  );
}
