"use client";

import { useEffect, useState } from "react";

/**
 * Lowercase "h:mm am/pm" clock for the status bar, matching the
 * terminal/desktop theme (e.g. "2:47 pm"). Starts empty so SSR and the
 * first client render match (no hydration mismatch), then fills in once
 * mounted.
 */
export function useLiveClock(): string {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now
          .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
          .toLowerCase()
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return time;
}
