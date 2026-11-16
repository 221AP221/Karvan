// `next dev` / `next start` bu skriptlə işə düşür: sistem sertifikat anbarı dəstəklənirsə qoşulur
// (bax: scripts/node-flags.mjs). Digər hər şey Next-in öz davranışıdır.
import { spawn } from "node:child_process";
import { withSystemCa } from "./node-flags.mjs";

const args = process.argv.slice(2);
const next = spawn(process.platform === "win32" ? "next.cmd" : "next", args, {
  stdio: "inherit",
  env: withSystemCa(),
  shell: process.platform === "win32",
});

next.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
