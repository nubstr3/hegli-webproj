// Per-browser site preferences (accent colour + boot sequence mode), saved in
// localStorage and edited from /admin/settings. Kept in one place so the
// settings page, the root layout and the home page agree on the keys.

import { useSyncExternalStore } from "react";

export const ACCENT_KEY = "hegli-accent";
export const BOOT_MODE_KEY = "hegli-boot-mode";

export const DEFAULT_ACCENT = "#5EEAD4";

export const ACCENT_OPTIONS = [
  { name: "teal", hex: "#5EEAD4" },
  { name: "phosphor", hex: "#4ADE80" },
  { name: "lime", hex: "#BEF264" },
  { name: "amber", hex: "#FFB454" },
  { name: "orange", hex: "#FF8A5B" },
  { name: "yellow", hex: "#FDE047" },
  { name: "blue", hex: "#60A5FA" },
  { name: "violet", hex: "#A78BFA" },
];

export type BootMode = "timed" | "always" | "never";
export const DEFAULT_BOOT_MODE: BootMode = "timed";

export const BOOT_MODES: { id: BootMode; label: string }[] = [
  { id: "timed", label: "once per 45 min" },
  { id: "always", label: "every visit" },
  { id: "never", label: "never" },
];

const listeners = new Set<() => void>();

function read(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // best-effort; the choice just won't persist if storage is blocked
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function readBootMode(): BootMode {
  const v = read(BOOT_MODE_KEY, DEFAULT_BOOT_MODE);
  return v === "always" || v === "never" || v === "timed" ? v : DEFAULT_BOOT_MODE;
}

export function setBootMode(mode: BootMode) {
  write(BOOT_MODE_KEY, mode);
}

export function setAccent(hex: string) {
  if (!ACCENT_OPTIONS.some((o) => o.hex === hex)) return;
  document.documentElement.style.setProperty("--accent", hex);
  write(ACCENT_KEY, hex);
}

// Server render / first hydration pass uses the defaults, then the real
// stored value takes over (no hydration mismatch, no setState-in-effect).
export function useAccent(): string {
  return useSyncExternalStore(
    subscribe,
    () => {
      const v = read(ACCENT_KEY, DEFAULT_ACCENT);
      return ACCENT_OPTIONS.some((o) => o.hex === v) ? v : DEFAULT_ACCENT;
    },
    () => DEFAULT_ACCENT,
  );
}

export function useBootMode(): BootMode {
  return useSyncExternalStore(subscribe, readBootMode, () => DEFAULT_BOOT_MODE);
}