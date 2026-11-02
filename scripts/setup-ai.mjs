// AI açarını .env faylına yazır: node scripts/setup-ai.mjs (Windows-da setup-ai.bat)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const PROVIDERS = [
  { id: "groq", label: "Groq (pulsuz, sürətli)", key: "GROQ_API_KEY", url: "https://console.groq.com/keys" },
  { id: "gemini", label: "Google Gemini (pulsuz)", key: "GEMINI_API_KEY", url: "https://aistudio.google.com/apikey" },
  { id: "openrouter", label: "OpenRouter (pulsuz modellər)", key: "OPENROUTER_API_KEY", url: "https://openrouter.ai/keys" },
  { id: "ollama", label: "Ollama (öz kompüterinizdə, açar lazım deyil)", key: null, url: "https://ollama.com" },
  { id: "anthropic", label: "Claude (ödənişli)", key: "ANTHROPIC_API_KEY", url: "https://console.anthropic.com" },
];

// .env-də yalnız lazım olan sətirləri dəyişir, qalanına toxunmur
export function setEnv(text, values) {
  let out = text;
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}="${value}"`;
    const re = new RegExp(`^${name}=.*$`, "m");
    out = re.test(out) ? out.replace(re, line) : `${out}${out && !out.endsWith("\n") ? "\n" : ""}${line}\n`;
  }
  return out;
}

// Sətirlər növbəyə yığılır: həm əl ilə yazanda, həm yapışdırılan/boru ilə verilən girişdə düz işləyir
const rl = createInterface({ input: process.stdin, output: process.stdout });
const lines = [];
const waiting = [];
let closed = false;
rl.on("line", (l) => (waiting.length ? waiting.shift()(l) : lines.push(l)));
rl.on("close", () => {
  closed = true;
  while (waiting.length) waiting.shift()("");
});
const ask = (q) =>
  new Promise((resolve) => {
    process.stdout.write(q);
    if (lines.length) resolve(lines.shift());
    else if (closed) resolve("");
    else waiting.push(resolve);
  });
console.log("\nAI quraşdırma\n");
PROVIDERS.forEach((p, i) => console.log(`  ${i + 1} - ${p.label}`));
const choice = PROVIDERS[Number((await ask("\nSeçim [1]: ")) || 1) - 1];
if (!choice) {
  console.error("Yanlış seçim.");
  process.exit(1);
}
const values = { AI_PROVIDER: choice.id };
if (choice.key) {
  console.log(`\nAçarı buradan alın (qeydiyyat pulsuzdur): ${choice.url}`);
  const key = (await ask("Açarı yapışdırın: ")).trim().replace(/^["']|["']$/g, "");
  if (key.length < 10) {
    console.error("Açar çox qısadır, yenidən cəhd edin.");
    process.exit(1);
  }
  values[choice.key] = key;
} else if (choice.id === "ollama") {
  console.log("\nOllama-nı https://ollama.com saytından qurun və bu əmri bir dəfə işlədin:  ollama pull llama3.1");
}
rl.close();

const file = ".env";
writeFileSync(file, setEnv(existsSync(file) ? readFileSync(file, "utf8") : "", values));
console.log(`\nHazırdır: ${choice.label} .env faylına yazıldı.`);
console.log("İndi saytı dayandırın (Ctrl+C) və yenidən işə salın:  npm run dev\n");
