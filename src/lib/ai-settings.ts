import { type AiConfig, KEY_NAMES, resolveAiConfig } from "@/lib/ai-provider";
import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/secrets";

// Admin paneldə yazılmış AI ayarı (bazada, şifrələnmiş). Varsa .env-dən üstündür: bir dəfə yazılır, sayt hər dəfə özü işləyir.
export type StoredAi = { provider: string; apiKey?: string; model?: string };

// Yeni zip-dən sonra sayt yenidən başladılmayıbsa, Prisma klienti köhnə qala bilər: çökmək əvəzinə aydın xəbər veririk
export const settingsReady = () => typeof db.appSetting !== "undefined";
export const STALE_CLIENT = "Sayt yeni versiyaya uyğun deyil. Saytı dayandırıb (Ctrl+C) yenidən işə salın: npm run dev (baza və Prisma avtomatik yenilənəcək).";

let cache: { at: number; value: StoredAi | null } | undefined;

export async function getStoredAi(): Promise<StoredAi | null> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  if (!settingsReady()) return null;
  const row = await db.appSetting.findUnique({ where: { key: "ai" } }).catch(() => null);
  const json = row ? decrypt(row.value) : null;
  const value = json ? (JSON.parse(json) as StoredAi) : null;
  cache = { at: Date.now(), value };
  return value;
}

export async function saveStoredAi(value: StoredAi | null) {
  if (!settingsReady()) throw new Error(STALE_CLIENT);
  if (value) {
    await db.appSetting.upsert({ where: { key: "ai" }, update: { value: encrypt(JSON.stringify(value)) }, create: { key: "ai", value: encrypt(JSON.stringify(value)) } });
  } else {
    await db.appSetting.deleteMany({ where: { key: "ai" } });
  }
  cache = undefined;
}

export async function getAiConfig(): Promise<AiConfig | null> {
  const stored = await getStoredAi();
  if (stored) {
    const env = { ...process.env, AI_PROVIDER: stored.provider, AI_MODEL: stored.model ?? "", AI_BASE_URL: "" } as NodeJS.ProcessEnv;
    const keyName = KEY_NAMES[stored.provider];
    if (keyName && stored.apiKey) env[keyName] = stored.apiKey;
    const config = resolveAiConfig(env);
    if (config) return config;
  }
  return resolveAiConfig(process.env);
}
