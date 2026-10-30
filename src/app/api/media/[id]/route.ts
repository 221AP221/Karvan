import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const media = await db.media.findUnique({ where: { id: (await params).id } });
  if (!media) return new Response("Tapılmadı", { status: 404 });
  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mime,
      "Content-Length": String(media.size),
      // Fayl dəyişmir: yeni şəkil həmişə yeni id alır
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
