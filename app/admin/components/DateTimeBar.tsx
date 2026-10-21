'use client'

import { useState, useEffect } from 'react'
import { ACCENT, TEXT_DIM, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY, PROMPT_USER } from '@/app/components/theme'

const TZ = 'Pacific/Auckland'

/**
 * Welcome prompt at the top of the dashboard. Everything is formatted in
 * Auckland time explicitly (not the browser's), and the zone label is
 * computed so it reads NZDT/NZST correctly through daylight saving.
 */
export default function DateTimeBar() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const dateStr = now.toLocaleDateString('en-NZ', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-NZ', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  const hour =
    Number(new Intl.DateTimeFormat('en-NZ', { timeZone: TZ, hour: 'numeric', hour12: false }).format(now)) % 24
  const zone =
    new Intl.DateTimeFormat('en-NZ', { timeZone: TZ, timeZoneName: 'short' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'NZ'

  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 24 }}>
      <div style={{ color: TEXT_MUTED }}>
        <span style={{ color: ACCENT }}>{PROMPT_USER.replace('guest', 'henry')}</span>
        <span style={{ color: TEXT_FAINT }}>:~/admin$</span> date
      </div>
      <div style={{ color: TEXT_PRIMARY, fontSize: 18, fontWeight: 600, margin: '4px 0 2px' }}>
        <span suppressHydrationWarning>{dateStr}</span> &middot; <span suppressHydrationWarning>{timeStr}</span>
      </div>
      <div style={{ color: TEXT_DIM }}>
        <span suppressHydrationWarning>{greeting}</span>, Henry &middot; Auckland, NZ &middot;{' '}
        <span suppressHydrationWarning>{zone}</span>
      </div>
    </div>
  )
}