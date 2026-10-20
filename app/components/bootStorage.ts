// Shared with app/page.tsx (reads this to decide whether to play the boot
// sequence) and SiteNav (the reboot button clears it so the sequence can
// be replayed on demand).

export const BOOT_STORAGE_KEY = "hegli-boot-seen";
export const BOOT_TTL_MS = 45 * 60 * 1000; // 45 minutes

export function clearBootFlag() {
  try {
    window.localStorage.removeItem(BOOT_STORAGE_KEY);
  } catch {
    // best-effort; if storage isn't available there's nothing to clear
  }
}