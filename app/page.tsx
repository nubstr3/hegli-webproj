"use client";

import { useEffect, useState } from "react";
import BootOverlay from "./components/BootOverlay";
import PageShell from "./components/PageShell";
import HomeDesktop from "./components/HomeDesktop";
import { BOOT_STORAGE_KEY, BOOT_TTL_MS, takeBootForce } from "./components/bootStorage";
import { readBootMode } from "./components/sitePrefs";

type BootDecision = { ready: boolean; showBoot: boolean };

export default function Home() {
  const [{ ready, showBoot }, setDecision] = useState<BootDecision>({
    ready: false,
    showBoot: false,
  });

  useEffect(() => {
    let reduceMotion = false;
    let isFresh = false;
    const mode = readBootMode();
    const forced = takeBootForce();

    try {
      reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const last = Number(window.localStorage.getItem(BOOT_STORAGE_KEY) || 0);
      isFresh = Date.now() - last < BOOT_TTL_MS;
    } catch {
      // localStorage/matchMedia unavailable (e.g. privacy mode) — fall back
      // to always showing the boot sequence rather than erroring out.
    }

    // Reading matchMedia/localStorage is inherently client-only and must
    // happen after mount to avoid a server/client markup mismatch, so a
    // one-time setState here (not a render-phase or event-driven update)
    // is the correct, intentional use of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDecision({ ready: true, showBoot: !reduceMotion && (forced || mode === "always" || (mode === "timed" && !isFresh)) });
  }, []);

  const finishBoot = () => {
    try {
      window.localStorage.setItem(BOOT_STORAGE_KEY, String(Date.now()));
    } catch {
      // best-effort; a failed write just means the sequence replays next time
    }
    setDecision((d) => ({ ...d, showBoot: false }));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D10" }}>
      {ready && showBoot && <BootOverlay onDone={finishBoot} />}
      {ready && !showBoot && (
        <PageShell>
          <HomeDesktop />
        </PageShell>
      )}
    </div>
  );
}