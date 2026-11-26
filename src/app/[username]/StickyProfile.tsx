"use client";

import { useEffect, useState } from "react";

/**
 * Sol profil kartı scroll zamanı yoxa çıxmasın deyə kiçilir: şəkil, ad və peşə qalır,
 * qalan hissələr yığılır. Kart `lg:sticky` olduğu üçün kiçik halda ekranda qalır,
 * başa qayıdanda isə yenidən açılır. Yalnız geniş ekranda işləyir — mobildə kart
 * onsuz da axın içindədir.
 */
export function StickyProfile({ children }: { children: React.ReactNode }) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    // Eyni yerdə dayananda titrəməsin deyə açılma/yığılma hədləri fərqlidir
    const onScroll = () => setCompact((was) => (was ? window.scrollY > 120 : window.scrollY > 220));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div data-compact={compact} className="group/profile">
      {children}
    </div>
  );
}
