// Shared with app/page.tsx (reads this to decide whether to play the boot
// sequence) and SiteNav / the settings page (they call replayBoot so the
// sequence can be replayed on demand).

export const BOOT_STORAGE_KEY = "hegli-boot-seen";
export const BOOT_FORCE_KEY = "hegli-boot-force";
export const BOOT_TTL_MS = 45 * 60 * 1000; // 45 minutes

export function clearBootFlag() {
  try {
    window.localStorage.removeItem(BOOT_STORAGE_KEY);
  } catch {
    // best-effort; if storage isn't available there's nothing to clear
  }
}

/** Ask the home page to play the boot sequence on its next load, whatever the boot mode is. */
export function replayBoot() {
  clearBootFlag();
  try {
    window.sessionStorage.setItem(BOOT_FORCE_KEY, "1");
  } catch {
    // without sessionStorage the replay still works unless the mode is "never"
  }
}

/** True once if a replay was requested (and clears the request). */
export function takeBootForce(): boolean {
  try {
    const forced = window.sessionStorage.getItem(BOOT_FORCE_KEY) === "1";
    window.sessionStorage.removeItem(BOOT_FORCE_KEY);
    return forced;
  } catch {
    return false;
  }
}