import { type AiConfig, KEY_NAMES, resolveAiConfig } from "@/lib/ai-provider";
import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/secrets";

// Admin paneldə yazılmış AI ayarı (bazada, şifrələnmiş). Varsa .env-dən üstündür: bir dəfə yazılır, sayt hər dəfə özü işləyir.
export type StoredAi = { provider: string; apiKey?: string; model?: string };

let cache: { at: number; value: StoredAi | null } | undefined;

export async function getStoredAi(): Promise<StoredAi | null> {
  if (cache && Date.now() - cache.at < 30_000) return cache.value;
  const row = await db.appSetting.findUnique({ where: { key: "ai" } }).catch(() => null);
  const json = row ? decrypt(row.value) : null;
  const value = json ? (JSON.parse(json) as StoredAi) : null;
  cache = { at: Date.now(), value };
  return value;
}

export async function saveStoredAi(value: StoredAi | null) {
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
