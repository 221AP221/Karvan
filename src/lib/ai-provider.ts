import { z } from "zod";

export class AiError extends Error {}
// Quraşdırma problemi (açar yanlışdır, icazə yoxdur): detalı yalnız admin görür
export class AiSetupError extends AiError {}
// AI ümumiyyətlə qoşulmayıb. Bunu gizlətmək mənasızdır: istifadəçi "sonra yenidən cəhd edin"
// mesajını görüb gözləyir, halbuki açar yazılmayana qədər heç nə dəyişmir.
export class AiNotConfiguredError extends AiSetupError {}

// AI təminatçıları. Hamısı yalnız mətn generasiyası üçündür. Pulsuz seçimlər OpenAI formatını (chat/completions)
// dəstəkləyir, ona görə bir adapter hamısına xidmət edir. Model adlarını təminatçının cari siyahısından yoxlayın
// və lazım olsa AI_MODEL ilə dəyişin: pulsuz modellər tez-tez yenilənir.
type OpenAiConfig = { kind: "openai"; name: string; baseUrl: string; model: string; apiKey?: string };
export type AiConfig = { kind: "anthropic" } | OpenAiConfig;

const PRESETS: Record<string, { baseUrl: string; model: string; keyEnv: string | null }> = {
  // Qeyd: Groq köhnə modelləri bağlayır (llama-3.3-70b-versatile 2026-cı ilin avqustunda ləğv olundu).
  // Model adı köhnəlsə, admin paneldə "AI-ı yoxla" düyməsi mövcud adları sadalayır.
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b", keyEnv: "GROQ_API_KEY" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash", keyEnv: "GEMINI_API_KEY" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free", keyEnv: "OPENROUTER_API_KEY" },
  // xAI (Grok): OpenAI formatındadır, ona görə eyni adapter işləyir. Model adları tez-tez dəyişir —
  // cari siyahı docs.x.ai-də və GET https://api.x.ai/v1/models cavabındadır, lazım olsa admin paneldən dəyişin.
  xai: { baseUrl: "https://api.x.ai/v1", model: "grok-4-fast", keyEnv: "XAI_API_KEY" },
  ollama: { baseUrl: "http://localhost:11434/v1", model: "llama3.1", keyEnv: null },
  custom: { baseUrl: "", model: "", keyEnv: "AI_API_KEY" },
};

export const KEY_NAMES: Record<string, string> = { groq: "GROQ_API_KEY", gemini: "GEMINI_API_KEY", openrouter: "OPENROUTER_API_KEY", xai: "XAI_API_KEY", custom: "AI_API_KEY", anthropic: "ANTHROPIC_API_KEY" };
const RESTART = "Dəyişiklikdən sonra saytı dayandırıb (Ctrl+C) yenidən işə salın: npm run dev.";

// İstifadəçiyə dəqiq deyir ki, nə çatışmır (açar yoxdur, provayder səhvdir və s.)
export function explainMissingAi(env: NodeJS.ProcessEnv = process.env): string {
  const provider = env.AI_PROVIDER?.toLowerCase();
  if (!provider) {
    return `AI açarı hələ yazılmayıb. Admin paneldə Parametrlər → AI bölməsində açarı bir dəfə yazın (Groq-un pulsuz açarı olar), sayt bundan sonra hər dəfə özü işləyəcək.`;
  }
  if (provider !== "ollama" && !PRESETS[provider] && provider !== "anthropic") {
    return `AI_PROVIDER="${env.AI_PROVIDER}" tanınmır. Düzgün dəyərlər: groq, gemini, openrouter, xai, ollama, custom, anthropic. ${RESTART}`;
  }
  if (provider === "custom" && (!env.AI_BASE_URL || !env.AI_MODEL)) return `AI_PROVIDER=custom üçün AI_BASE_URL və AI_MODEL də yazılmalıdır. ${RESTART}`;
  const key = KEY_NAMES[provider];
  if (key && !env[key]) return `AI_PROVIDER=${provider} seçilib, amma ${key} boşdur. Açarı .env faylına yazın (setup-ai.bat bunu avtomatik edir). ${RESTART}`;
  return `AI qoşulmayıb. ${RESTART}`;
}

export function resolveAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig | null {
  let provider = env.AI_PROVIDER?.toLowerCase();
  if (!provider) {
    // Avtomatik seçim: hansı açar yazılıbsa
    if (env.ANTHROPIC_API_KEY) provider = "anthropic";
    else provider = ["groq", "gemini", "openrouter", "xai"].find((p) => env[PRESETS[p].keyEnv!]);
  }
  if (!provider) return null;
  if (provider === "anthropic") return env.ANTHROPIC_API_KEY ? { kind: "anthropic" } : null;
  const preset = PRESETS[provider];
  if (!preset) return null;
  const apiKey = preset.keyEnv ? env[preset.keyEnv] : undefined;
  if (preset.keyEnv && !apiKey) return null;
  const baseUrl = (env.AI_BASE_URL || preset.baseUrl).replace(/\/$/, "");
  const model = env.AI_MODEL || preset.model;
  if (!baseUrl || !model) return null;
  return { kind: "openai", name: provider, baseUrl, model, apiKey };
}

// Model JSON-u bəzən ```json ... ``` içində və ya izahatla qaytarır
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new AiError("AI cavabı gözlənilən formatda deyil.");
  return JSON.parse(cleaned.slice(start, end + 1));
}


/**
 * Təminatçının öz izahını cavabdan çıxarır: "model decommissioned", "insufficient credits" kimi
 * səbəblər yalnız orada yazılır. Bunu gizlətmək diaqnozu çətinləşdirirdi.
 */
async function providerMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return "";
  try {
    const body = JSON.parse(text) as { error?: { message?: string; code?: string } | string; message?: string };
    const raw = typeof body.error === "string" ? body.error : (body.error?.message ?? body.message ?? "");
    const code = typeof body.error === "object" ? body.error?.code : undefined;
    const message = [raw, code && !raw.includes(code) ? `(${code})` : ""].filter(Boolean).join(" ").trim();
    return message.slice(0, 200);
  } catch {
    return text.slice(0, 200);
  }
}

async function chat(cfg: OpenAiConfig, messages: { role: string; content: string }[], jsonMode: boolean) {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: 0.3,
      max_tokens: 1800,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(60_000),
  });
  return res;
}

/**
 * Qoşulma uğursuz olanda hansı ünvana və niyə çatmadığımızı yazır.
 * "İnterneti yoxlayın" tək başına az şey deyir: ən çox rast gələn hallar ayrıca izah olunur.
 */
function connectionError(cfg: OpenAiConfig, error: unknown): AiError {
  const host = (() => {
    try {
      return new URL(cfg.baseUrl).host;
    } catch {
      return cfg.baseUrl || "(ünvan boşdur)";
    }
  })();
  const cause = (error as { cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code ?? "";
  const name = (error as { name?: string })?.name ?? "";

  if (name === "TimeoutError" || cause === "UND_ERR_CONNECT_TIMEOUT") {
    return new AiError(`${host} ünvanı vaxtında cavab vermədi. Şəbəkə yavaşdırsa, bir az sonra yenidən yoxlayın.`);
  }
  if (cause === "ECONNREFUSED") {
    return new AiSetupError(
      `${host} qoşulmanı qəbul etmir. Lokal model (Ollama) seçilibsə, o, işləməlidir; əks halda admin paneldə düzgün təminatçını seçin.`,
    );
  }
  if (cause === "ENOTFOUND" || cause === "EAI_AGAIN") {
    return new AiError(`${host} ünvanı tapılmadı: internet və ya DNS problemi ola bilər.`);
  }
  if (cause.startsWith("CERT_") || cause === "SELF_SIGNED_CERT_IN_CHAIN" || cause === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    return new AiError(`${host} ilə təhlükəsiz bağlantı qurulmadı (sertifikat): korporativ şəbəkə və ya antivirus mane ola bilər.`);
  }
  return new AiError(`${host} ünvanına qoşulmaq alınmadı${cause ? ` (${cause})` : ""}. İnterneti və təminatçı ayarını yoxlayın.`);
}

export async function generateWithOpenAi<T extends z.ZodType>(cfg: OpenAiConfig, schema: T, system: string, prompt: string): Promise<z.infer<T>> {
  const jsonSchema = JSON.stringify(z.toJSONSchema(schema));
  const messages = [
    { role: "system", content: `${system}\n\nCavabı YALNIZ bir JSON obyekti kimi qaytar (izahat, markdown və kod bloku olmadan). JSON bu sxemə uyğun olmalıdır:\n${jsonSchema}` },
    { role: "user", content: prompt },
  ];

  let jsonMode = true;
  let lastProblem = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response;
    try {
      res = await chat(cfg, attempt === 0 || !lastProblem ? messages : [...messages, { role: "user", content: `Əvvəlki cavab düzgün deyildi (${lastProblem}). Yalnız sxemə uyğun JSON qaytar.` }], jsonMode);
    } catch (error) {
      throw connectionError(cfg, error);
    }
    if (res.status === 400 && jsonMode) {
      jsonMode = false; // bəzi modellər response_format-ı dəstəkləmir
      continue;
    }
    if (res.status === 401 || res.status === 403)
      throw new AiSetupError(`AI açarı yanlışdır və ya icazəsi yoxdur. Admin paneldə Parametrlər → AI bölməsində yeniləyin. ${await providerMessage(res)}`.trim());
    if (res.status === 429) throw new AiError("AI xidməti hazırda məşğuldur (pulsuz limit dolub). Bir az sonra yenidən cəhd edin.");
    if (!res.ok) throw new AiError(`AI xidməti xəta qaytardı (${res.status}). ${await providerMessage(res)}`.trim());

    const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
    const content = data?.choices?.[0]?.message?.content ?? "";
    try {
      const parsed = schema.safeParse(extractJson(content));
      if (parsed.success) return parsed.data;
      lastProblem = parsed.error.issues[0]?.message ?? "sxemə uyğun deyil";
    } catch (error) {
      lastProblem = error instanceof AiError ? "JSON tapılmadı" : "JSON oxunmadı";
    }
  }
  throw new AiError("AI cavabı gözlənilən formatda deyil. Yenidən cəhd edin.");
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** Sərbəst mətn cavabı (chatbot). Strukturlu çıxış tələb olunmur. */
export async function chatWithOpenAi(cfg: OpenAiConfig, system: string, turns: ChatTurn[]): Promise<string> {
  let res: Response;
  try {
    res = await chat(cfg, [{ role: "system", content: system }, ...turns], false);
  } catch (error) {
    throw connectionError(cfg, error);
  }
  if (res.status === 401 || res.status === 403) throw new AiSetupError(`AI açarı yanlışdır və ya icazəsi yoxdur. ${await providerMessage(res)}`.trim());
  if (res.status === 429) throw new AiError("AI xidməti hazırda məşğuldur. Bir az sonra yenidən yazın.");
  if (!res.ok) throw new AiError(`AI xidməti xəta qaytardı (${res.status}). ${await providerMessage(res)}`.trim());

  const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AiError("AI cavab qaytarmadı.");
  return text;
}

/**
 * Təminatçının mövcud model adlarını soruşur. Model adları tez-tez dəyişir; əlimizdə sabit siyahı
 * saxlamaq əvəzinə lazım olanda özündən soruşuruq (OpenAI formatında /models hamısında var).
 */
export async function listModels(cfg: OpenAiConfig): Promise<string[]> {
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, {
      headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: { id?: string }[] };
    return (data.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id)).sort();
  } catch {
    return [];
  }
}
