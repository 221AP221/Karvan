// `next dev` / `next start` bu skriptlə işə düşür: sistem sertifikat anbarı dəstəklənirsə
// qoşulur (bax: scripts/node-flags.mjs). Digər hər şey Next-in öz davranışıdır.
//
// Next-in CLI faylı birbaşa node ilə çağırılır: `shell: true` ilə .cmd çağırmaq Node 24-də
// DEP0190 xəbərdarlığı verirdi (arqumentlər qaçırılmır, sadəcə birləşdirilir).
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { withSystemCa } from "./node-flags.mjs";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const next = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: withSystemCa(),
});

next.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
