import { db } from "@/lib/db";

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;

// Faylın növünü adına yox, ilk baytlarına görə müəyyən edirik.
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return "image/webp";
  return null;
}

export const mediaUrl = (id: string) => `/api/media/${id}`;

const MEDIA_URL_RE = /^\/api\/media\/([a-z0-9]+)$/;

// Şəkil əvəz olunanda və ya silinəndə köhnə faylı da silirik (yalnız bu profilə aiddirsə).
export async function deleteMediaByUrl(profileId: string, url: string | null | undefined) {
  const id = url?.match(MEDIA_URL_RE)?.[1];
  if (id) await db.media.deleteMany({ where: { id, profileId } });
}

// Formadan gələn şəkil linki yalnız bu profilin yüklədiyi fayl ola bilər.
export async function ownedMediaUrl(profileId: string, url: string | null): Promise<string | null> {
  if (!url) return null;
  const id = url.match(MEDIA_URL_RE)?.[1];
  if (!id) return null;
  const media = await db.media.findFirst({ where: { id, profileId }, select: { id: true } });
  return media ? url : null;
}
