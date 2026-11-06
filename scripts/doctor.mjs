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
