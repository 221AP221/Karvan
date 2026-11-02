import { z } from "zod";

export class AiError extends Error {}

// AI təminatçıları. Hamısı yalnız mətn generasiyası üçündür. Pulsuz seçimlər OpenAI formatını (chat/completions)
// dəstəkləyir, ona görə bir adapter hamısına xidmət edir. Model adlarını təminatçının cari siyahısından yoxlayın
// və lazım olsa AI_MODEL ilə dəyişin: pulsuz modellər tez-tez yenilənir.
type OpenAiConfig = { kind: "openai"; name: string; baseUrl: string; model: string; apiKey?: string };
export type AiConfig = { kind: "anthropic" } | OpenAiConfig;

const PRESETS: Record<string, { baseUrl: string; model: string; keyEnv: string | null }> = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile", keyEnv: "GROQ_API_KEY" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash", keyEnv: "GEMINI_API_KEY" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free", keyEnv: "OPENROUTER_API_KEY" },
  ollama: { baseUrl: "http://localhost:11434/v1", model: "llama3.1", keyEnv: null },
  custom: { baseUrl: "", model: "", keyEnv: "AI_API_KEY" },
};

export const NOT_CONFIGURED =
  "AI qoşulmayıb. .env faylında AI_PROVIDER (groq, gemini, openrouter, ollama) və açarını təyin edin, və ya ANTHROPIC_API_KEY yazın.";

export function resolveAiConfig(env: NodeJS.ProcessEnv = process.env): AiConfig | null {
  let provider = env.AI_PROVIDER?.toLowerCase();
  if (!provider) {
    // Avtomatik seçim: hansı açar yazılıbsa
    if (env.ANTHROPIC_API_KEY) provider = "anthropic";
    else provider = ["groq", "gemini", "openrouter"].find((p) => env[PRESETS[p].keyEnv!]);
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
    } catch {
      throw new AiError("AI xidmətinə qoşulmaq alınmadı. İnterneti və ya AI_BASE_URL-i yoxlayın.");
    }
    if (res.status === 400 && jsonMode) {
      jsonMode = false; // bəzi modellər response_format-ı dəstəkləmir
      continue;
    }
    if (res.status === 401 || res.status === 403) throw new AiError("AI açarı yanlışdır və ya icazəsi yoxdur.");
    if (res.status === 429) throw new AiError("AI xidməti hazırda məşğuldur (pulsuz limit dolub). Bir az sonra yenidən cəhd edin.");
    if (!res.ok) throw new AiError(`AI xidməti xəta qaytardı (${res.status}).`);

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
