import { headers } from "next/headers";

/**
 * IP əsaslı sadə sürət limiti (NFR-SEC-10).
 *
 * Yaddaşda saxlanılan sabit pəncərə: eyni açar üçün `max` sorğudan sonra pəncərə
 * bitənə qədər imtina edilir. Bir prosesin yaddaşında saxlandığı üçün çox nüsxəli
 * quraşdırmada hər nüsxə öz sayğacını aparır; tək nüsxəli lansda bu kifayətdir,
 * miqyas artanda eyni interfeys Redis-ə köçürülə bilər.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

// Vaxtı keçmiş açarları təmizləyir ki, yaddaş böyüməsin
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

export type RateLimitResult = { ok: boolean; remaining: number; retryAfter: number };

export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, retryAfter: 0 };
  }
  bucket.count += 1;
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  return bucket.count > max
    ? { ok: false, remaining: 0, retryAfter }
    : { ok: true, remaining: max - bucket.count, retryAfter: 0 };
}

export async function clientIp() {
  const h = await headers();
  // `x-forwarded-for`-un İLK dəyəri müştərinin özü tərəfindən yazıla bilər (bəzi quraşdırmalarda
  // proksi onu əlavə etmir, üzərinə yazır) — kor-koranə ona güvənmək limiti saxtalaşdırılan başlıqla
  // keçməyə imkan verir. `cf-connecting-ip` (Cloudflare) və `x-real-ip` (adətən nginx `$remote_addr`-ı
  // özü yazır, müştəri dəyişə bilmir) daha etibarlıdır, ona görə əvvəlcə onlara baxırıq.
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-real-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "local"
  );
}

/** Verilmiş ad üçün IP-yə görə limit; nəticə `ok: false` olanda sorğu rədd edilməlidir. */
export async function limitByIp(name: string, max: number, windowMs: number) {
  return rateLimit(`${name}:${await clientIp()}`, max, windowMs);
}

/** API marşrutlarında istifadə üçün hazır 429 cavabı. */
export function tooMany(result: RateLimitResult, message = "Çox sayda sorğu göndərildi. Bir az sonra yenidən yoxlayın.") {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { "Content-Type": "application/json; charset=utf-8", "Retry-After": String(result.retryAfter), "Cache-Control": "no-store" },
  });
}

/** Hazır limit ayarları: bir yerdə saxlanılır ki, dəyişdirmək asan olsun. */
export const LIMITS = {
  // Mobil operatorlarda bir neçə müştəri eyni IP-ni paylaşa bilər: ümumi limit geniş,
  // eyni xidmətə təkrar sifariş limiti dardır (spam məhz orada olur)
  order: { max: 20, windowMs: 10 * 60_000 },
  orderPerService: { max: 4, windowMs: 10 * 60_000 },
  claimPaid: { max: 10, windowMs: 10 * 60_000 },
  track: { max: 240, windowMs: 60_000 },
  media: { max: 40, windowMs: 10 * 60_000 },
  ai: { max: 20, windowMs: 60_000 },
  chat: { max: 15, windowMs: 60_000 },
  review: { max: 5, windowMs: 10 * 60_000 },
  login: { max: 12, windowMs: 10 * 60_000 },
  // IP-dən asılı olmayan ikinci qat: hədəf hesab sabit qalır, IP saxtalaşdırılsa belə bu limit keçilmir
  loginByAccount: { max: 8, windowMs: 10 * 60_000 },
  signup: { max: 5, windowMs: 60 * 60_000 },
  passwordReset: { max: 5, windowMs: 60 * 60_000 },
} as const;
