"use client";

import { useEffect, useState } from "react";

const PING_INTERVAL_MS = 15000;

/**
 * Real round-trip latency to our own /api/ping route, not a fake number.
 * Each check is a tiny no-store JSON response (a few bytes), polled every
 * 15s, so the total traffic this adds is negligible — far less than a
 * single page's fonts or images.
 *
 * Returns null until the first measurement lands (so SSR/client markup
 * matches on first paint), and keeps the last successful reading on a
 * failed check rather than flickering to an error state.
 */
export function useLivePing(): number | null {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const start = performance.now();
      try {
        await fetch("/api/ping", { cache: "no-store" });
        if (cancelled) return;
        setMs(Math.round(performance.now() - start));
      } catch {
        // offline / request failed — leave the last known value in place
      }
    };

    check();
    const id = setInterval(check, PING_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return ms;
}