import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Paylaşım şəkli (Open Graph): sosial şəbəkədə və WhatsApp-da link göndəriləndə görünür.
// DejaVu şrifti Azərbaycan, türk və kiril hərflərini dəstəkləyir.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const fontFile = (name: string) => readFile(path.join(process.cwd(), "assets/fonts", name));

export async function ogImage({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  const [regular, bold] = await Promise.all([fontFile("DejaVuSans.ttf"), fontFile("DejaVuSans-Bold.ttf")]);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #17181c 0%, #3d0b29 55%, #d6127e 100%)",
        color: "#ffffff",
        fontFamily: "DejaVu",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>KARVAN</div>
        {badge ? (
          <div style={{ fontSize: 24, padding: "8px 18px", borderRadius: 999, background: "rgba(255,255,255,0.14)" }}>{badge}</div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: title.length > 60 ? 58 : 72, fontWeight: 700, lineHeight: 1.1 }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 30, lineHeight: 1.35, color: "rgba(255,255,255,0.82)" }}>{subtitle}</div> : null}
      </div>
      <div style={{ fontSize: 26, color: "rgba(255,255,255,0.65)" }}>karvan.az</div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "DejaVu", data: regular, style: "normal", weight: 400 },
        { name: "DejaVu", data: bold, style: "normal", weight: 700 },
      ],
    },
  );
}

// Uzun mətn şəkildə kəsilməsin
export const ogText = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
