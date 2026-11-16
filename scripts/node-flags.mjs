// Antivirus və korporativ şəbəkələr HTTPS trafikini öz sertifikatı ilə əvəzləyir. Brauzer ona etibar edir
// (Windows sertifikat anbarından), Node isə öz daxili siyahısına baxdığına görə etmir: AI sorğuları
// SELF_SIGNED_CERT_IN_CHAIN xətası ilə dayanır.
//
// Node 22.15+ və 24-də `--use-system-ca` bayrağı var: Node sistemin anbarını oxuyur. Dəstəklənirsə,
// onu özümüz əlavə edirik. Dəstəklənmirsə heç nə dəyişmir — yoxlamanı zəiflətmirik.
export function withSystemCa(env = process.env) {
  if (!process.allowedNodeEnvironmentFlags.has("--use-system-ca")) return env;
  const existing = env.NODE_OPTIONS ?? "";
  if (existing.includes("--use-system-ca")) return env;
  return { ...env, NODE_OPTIONS: `${existing} --use-system-ca`.trim() };
}

export const systemCaSupported = () => process.allowedNodeEnvironmentFlags.has("--use-system-ca");
