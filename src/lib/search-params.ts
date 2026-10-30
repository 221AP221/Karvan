export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export function param(p: Record<string, string | string[] | undefined>, name: string): string {
  const v = p[name];
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

// "2026-10-30" → həmin günün başlanğıcı/sonu; yararsızdırsa undefined
export function dayStart(v: string): Date | undefined {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : undefined;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
}

export function dayEnd(v: string): Date | undefined {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T23:59:59.999`) : undefined;
  return d && !Number.isNaN(d.getTime()) ? d : undefined;
}
