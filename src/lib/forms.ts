import { z } from "zod";

export type FormState = { error?: string; ok?: boolean } | undefined;

export const optional = z
  .string()
  .trim()
  .max(200)
  .transform((v) => v || null);

export function firstError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Məlumatlar düzgün deyil";
}
