'use client'

import { useEffect } from 'react'
import { COOKIE_TOUCH } from '@/lib/deviceView'

/**
 * iPads claim to be Macs, so the server can't tell them from laptops. This runs
 * once in the browser, records whether the main pointer is a finger, and reloads
 * a single time when that answer changes so proxy.ts can serve the right site.
 */
export default function TouchDetect() {
  useEffect(() => {
    try {
      const touch = window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0
      const want = touch ? '1' : '0'
      const read = () => document.cookie.match(new RegExp(`(?:^|; )${COOKIE_TOUCH}=(\\d)`))?.[1]
      if (read() === want) return

      const secure = window.location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `${COOKIE_TOUCH}=${want}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`

      // Reload only when it matters: the cookie stuck (cookies off => no reload loop),
      // this is a touch device, and it's currently being shown the desktop site.
      // (A phone already on the mobile site must not reload - it would wipe what's typed.)
      const onMobileSite = !!document.querySelector('[data-site="mobile"]')
      if (read() === want && want === '1' && !onMobileSite) window.location.reload()
    } catch {
      // matchMedia/cookies unavailable - stay on whichever site we're on.
    }
  }, [])

  return null
}