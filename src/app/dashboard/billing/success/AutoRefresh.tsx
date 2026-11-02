"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Gateway nəticəni webhook ilə bildirənə qədər status avtomatik yenilənir (ən çox ~1 dəqiqə)
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => (++n > 20 ? clearInterval(t) : router.refresh()), 3000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
