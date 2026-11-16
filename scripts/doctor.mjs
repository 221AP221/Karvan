// Sürətli diaqnostika: "yeni funksiya görünmür" hallarında nəyin köhnə qaldığını göstərir.
// İşə salmaq: npm run doctor
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

await import("dotenv/config");

const ok = (t) => console.log(`  ✓ ${t}`);
const bad = (t) => console.log(`  ✗ ${t}`);

console.log("\nKarvan — vəziyyət yoxlaması\n");

console.log("Kod:");
const files = {
  "Komanda bölməsi (src/app/dashboard/team)": "src/app/dashboard/team/page.tsx",
  "İcazə matrisi (src/lib/team.ts)": "src/lib/team.ts",
  "Rəylər (src/lib/reviews.ts)": "src/lib/reviews.ts",
  "Bildirişlər (src/lib/notifications.ts)": "src/lib/notifications.ts",
};
for (const [label, file] of Object.entries(files)) (existsSync(file) ? ok : bad)(label);
const layout = existsSync("src/app/dashboard/layout.tsx") ? readFileSync("src/app/dashboard/layout.tsx", "utf8") : "";
(layout.includes("/dashboard/team") ? ok : bad)("Panel menyusunda Komanda bəndi");

console.log("\nBaza:");
if (!process.env.DATABASE_URL) {
  const { LOCAL_DATABASE_URL, findLocalDatabases } = await import("../src/lib/local-db.ts");
  const all = findLocalDatabases();
  if (!all.length) bad("`prisma dev` bazası tapılmadı (server.json yoxdur) — 51214 portu sınanacaq");
  for (const d of all) console.log(`  · tapıldı: ${d.name} → ${d.url.replace(/\/\/[^@]*@/, "//")}`);
  console.log(`  · işlənən ünvan: ${LOCAL_DATABASE_URL.replace(/\/\/[^@]*@/, "//")}`);
}
{
  try {
    if (!process.env.DATABASE_URL) {
      const { startLocalDatabase } = await import("./local-database.mjs");
      startLocalDatabase();
    }
    const out = execSync("npx prisma migrate status", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    if (/Database schema is up to date/.test(out)) ok("Miqrasiyalar tətbiq olunub");
    else { bad("Miqrasiyalar natamamdır — `npx prisma migrate deploy`"); console.log(out.trim().split("\n").map((l) => "    " + l).join("\n")); }
  } catch (error) {
    const text = String(error.stdout ?? "") + String(error.stderr ?? "");
    if (text.includes("P3009")) {
      bad("Yarımçıq qalmış miqrasiya var. Həll yolu:");
      const name = text.match(/The `([^`]+)` migration started/)?.[1] ?? "<miqrasiya_adı>";
      console.log(`    npx prisma migrate resolve --rolled-back ${name}`);
      console.log("    npx prisma migrate deploy");
    } else if (text.includes("P1001")) {
      bad("Baza işləmir. Ayrı pəncərədə qaldırın, pəncərəni açıq saxlayın:");
      console.log("    npx prisma dev -n karvan");
    } else {
      bad("Baza ilə əlaqə yoxdur və ya miqrasiya statusu oxunmadı");
      console.log("    " + text.trim().split("\n").slice(0, 4).join("\n    "));
    }
  }
}

console.log("\nAI köməkçi:");
try {
  const { ensureSecret } = await import("./ensure-secret.mjs");
  ensureSecret();
  const { getAiConfig } = await import("../src/lib/ai-settings.ts");
  const cfg = await getAiConfig();
  if (!cfg) {
    bad("qoşulmayıb — admin paneldə Parametrlər → AI bölməsində açar yazın");
    console.log("    (Groq pulsuzdur: https://console.groq.com/keys)");
  } else if (cfg.kind === "anthropic") ok("Claude qoşulub");
  else {
    ok(`${cfg.name} · model: ${cfg.model}`);
    // Ayar var, amma ünvana çatırıqmı? Ən çox rast gələn problem elə buradadır.
    const host = new URL(cfg.baseUrl).host;
    try {
      const res = await fetch(`${cfg.baseUrl}/models`, {
        headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {},
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const ids = (data.data ?? []).map((m) => m.id).filter(Boolean);
        ok(`${host} cavab verir${ids.length ? ` · ${ids.length} model` : ""}`);
        if (ids.length && !ids.includes(cfg.model)) {
          bad(`"${cfg.model}" siyahıda yoxdur. Mövcud: ${ids.slice(0, 8).join(", ")}`);
        }
      } else if (res.status === 401 || res.status === 403) bad(`${host}: açar qəbul edilmədi (${res.status})`);
      else bad(`${host}: ${res.status} qaytardı`);
    } catch (error) {
      const code = error?.cause?.code ?? error?.name ?? "";
      bad(`${host} ünvanına çatmaq olmur${code ? ` (${code})` : ""}`);
      // Antivirus/korporativ şəbəkə HTTPS-i öz sertifikatı ilə əvəz edir: brauzer qəbul edir, Node yox
      if (String(code).startsWith("CERT_") || ["SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "DEPTH_ZERO_SELF_SIGNED_CERT"].includes(code)) {
        const { systemCaSupported } = await import("./node-flags.mjs");
        console.log("    Səbəb: şəbəkədəki antivirus/proksi sertifikatı əvəz edir.");
        if (systemCaSupported()) {
          console.log("    `npm run dev` artıq Windows sertifikat anbarını işlədir — saytı yenidən başladın.");
          console.log("    Davam edərsə, antivirusun HTTPS yoxlamasını söndürün və ya onun kök sertifikatını");
          console.log("    fayla çıxarıb bu dəyişəni verin: NODE_EXTRA_CA_CERTS=C:\\yol\\sertifikat.pem");
        } else {
          console.log("    Node-un bu versiyası sistem anbarını oxuya bilmir. İki yoldan biri:");
          console.log("      1) Node-u 22.15+ və ya 24 versiyasına yeniləyin (nodejs.org), sonra `npm run dev`");
          console.log("      2) Antivirusun kök sertifikatını fayla çıxarıb: NODE_EXTRA_CA_CERTS=C:\\yol\\sertifikat.pem");
        }
      }
    }
  }
} catch (error) {
  bad(`yoxlanmadı: ${String(error).split("\n")[0]}`);
}

console.log("\nServer:");
try {
  const res = await fetch("http://localhost:3000/api/health", { signal: AbortSignal.timeout(3000) });
  const body = await res.json().catch(() => ({}));
  ok(`localhost:3000 cavab verir (${res.status}${body.version ? `, versiya ${body.version}` : ""})`);
  console.log("    Qeyd: port məşğuldursa, `next dev` özünü 3001-ə keçirir və brauzerdə KÖHNƏ server görünür.");
} catch {
  console.log("  · localhost:3000-də işləyən server yoxdur (normaldır, `npm run dev` işləmirsə)");
}
console.log("");
