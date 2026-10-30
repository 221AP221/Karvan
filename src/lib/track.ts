// Brauzer tərəfi: anonim ziyarətçi id-si və hadisələrin göndərilməsi (sendBeacon — səhifəni ləngitmir)

const KEY = "karvan_vid";
let memoryId: string | undefined;

export function visitorId(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    const id = crypto.randomUUID().replace(/-/g, "");
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    // Gizli rejim və ya bloklanmış yaddaş: id yalnız bu səhifə açıq olduqca yaşayır
    memoryId ??= Math.random().toString(36).slice(2) + Date.now().toString(36);
    return memoryId;
  }
}

let page = "";
export function setTrackedPage(username: string) {
  page = username;
}

export function track(type: "VIEW" | "ORDER_OPEN" | "PHONE_CLICK" | "LINK_CLICK", extra: { target?: string; referrer?: string; tag?: string } = {}) {
  if (!page) return;
  const body = JSON.stringify({ u: page, t: type, v: visitorId(), x: extra.target, r: extra.referrer, s: extra.tag });
  try {
    if (navigator.sendBeacon?.(new URL("/api/track", location.href), new Blob([body], { type: "text/plain" }))) return;
  } catch {}
  fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
}
