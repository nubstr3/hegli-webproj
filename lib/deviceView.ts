// Shared by proxy.ts, the touch detector and the /api/view route.

/** Set by <TouchDetect/> in the browser: "1" = touch-first device, "0" = mouse/trackpad. */
export const COOKIE_TOUCH = 'hegli-touch'

/** Set by /api/view when someone taps "view desktop site". Only ever "desktop". */
export const COOKIE_VIEW = 'hegli-view'

/** Phones and Android tablets. iPads can't be spotted this way (see COOKIE_TOUCH). */
const TOUCH_UA = /Android|iPhone|iPod|iPad|Mobile|Silk|Kindle|Tablet|Windows Phone|IEMobile|Opera Mini|BlackBerry|webOS/i

export function isTouchUserAgent(ua: string | null | undefined): boolean {
  return !!ua && TOUCH_UA.test(ua)
}