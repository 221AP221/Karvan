// +994 50 123 45 67 / 050 123 45 67 → +994501234567; xarici nömrələr + ilə 8-15 rəqəm
export function normalizePhone(input: string): string | null {
  const raw = input.replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(raw)) return `+994${raw.slice(1)}`;
  if (/^\+994\d{9}$/.test(raw)) return raw;
  if (/^994\d{9}$/.test(raw)) return `+${raw}`;
  if (/^\+[1-9]\d{7,14}$/.test(raw)) return raw;
  return null;
}

// +994501234567 → +994 50 123 45 67 (yerli format); digərləri olduğu kimi
export function formatPhone(phone: string): string {
  const m = /^\+994(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return m ? `+994 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}
