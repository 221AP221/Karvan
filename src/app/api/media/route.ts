import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { db } from "@/lib/db";
import { MAX_UPLOAD_BYTES, mediaUrl, sniffImageType } from "@/lib/media";
import { LIMITS, limitByIp, tooMany } from "@/lib/rate-limit";

// TODO: profil üzrə ümumi həcm limiti
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Daxil olun" }, { status: 401 });

  const limit = await limitByIp("media", LIMITS.media.max, LIMITS.media.windowMs);
  if (!limit.ok) return tooMany(limit, "Çox sayda şəkil yükləndi. Bir az sonra davam edin.");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Fayl seçilməyib" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Şəkil 3 MB-dan böyük olmamalıdır" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) return NextResponse.json({ error: "Yalnız JPG, PNG və ya WebP şəkil yükləyin" }, { status: 415 });

  const media = await db.media.create({ data: { profileId: profile.id, mime, size: bytes.length, data: bytes } });
  return NextResponse.json({ url: mediaUrl(media.id) });
}
