"use client";

import { useEffect, useState } from "react";

/**
 * 지금 시각 "HH:MM". 서버에서 미리 그린 화면과 어긋나지 않게 마운트 전에는 null 이고,
 * 이후 1분마다 갱신한다.
 */
export function useNowHM(): string | null {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date().toTimeString().slice(0, 5));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}
