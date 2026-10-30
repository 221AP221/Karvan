"use client";

import { useEffect } from "react";
import { setTrackedPage, track } from "@/lib/track";

// React-in dev rejimindəki ikiqat mount-u bir baxış sayırıq
let lastView = { username: "", at: 0 };

// Səhifə baxışını və [data-track] elementlərinə klikləri qeyd edir
export function PageTracker({ username }: { username: string }) {
  useEffect(() => {
    setTrackedPage(username);
    const params = new URLSearchParams(location.search);
    if (lastView.username !== username || Date.now() - lastView.at > 1500) track("VIEW", { referrer: document.referrer, tag: params.get("s") ?? params.get("utm_source") ?? undefined });
    lastView = { username, at: Date.now() };

    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-track]");
      if (el) track(el.dataset.track as "PHONE_CLICK" | "LINK_CLICK", { target: el.dataset.trackTarget });
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [username]);
  return null;
}
