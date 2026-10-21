'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import type { Row, Tint } from './asciiSim'
import { ACCENT, FONT_MONO } from '@/app/components/theme'

/** Shades of the site accent colour, following the accent picker in settings. */
export const tint: Tint = (alpha) => `color-mix(in srgb, ${ACCENT} ${Math.round(alpha * 100)}%, transparent)`
export const accentColour = ACCENT

/** Holds a simulation that is updated in place (so it isn't re-created on every frame). */
export class Mutable<T> {
  v: T
  constructor(v: T) {
    this.v = v
  }
}

/**
 * Runs `step` on a timer and returns a frame counter that changes each time, so the scene re-renders.
 * It pauses while the tab is hidden or the widget is scrolled out of view. If the system asks for
 * reduced motion it fast-forwards once and shows a still frame instead of animating.
 */
export function useAnimation(step: () => void, ms: number, fastForward = 80): { frame: number; ref: RefObject<HTMLDivElement | null>; bump: () => void } {
  const [frame, setFrame] = useState(0)
  const ref = useRef<HTMLDivElement | null>(null)
  const bump = useCallback(() => setFrame((f) => f + 1), [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (let i = 0; i < fastForward; i++) step()
      Promise.resolve().then(bump)
      return
    }
    let visible = true
    const el = ref.current
    const observer = el && 'IntersectionObserver' in window ? new IntersectionObserver((entries) => (visible = entries[0].isIntersecting)) : null
    if (el && observer) observer.observe(el)
    const interval = setInterval(() => {
      if (document.hidden || !visible) return
      step()
      setFrame((f) => f + 1)
    }, ms)
    return () => {
      clearInterval(interval)
      observer?.disconnect()
    }
  }, [step, ms, fastForward, bump])

  return { frame, ref, bump }
}

const sceneStyle: CSSProperties = { fontFamily: FONT_MONO, fontSize: 13, lineHeight: 1.22, overflow: 'hidden' }

/** Draws rows of coloured text runs. */
export function AsciiScene({ rows, onClick, label }: { rows: Row[]; onClick?: () => void; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      onClick={onClick}
      style={{ ...sceneStyle, cursor: onClick ? 'pointer' : 'default', userSelect: 'none' }}
    >
      {rows.map((row, y) => (
        <div key={y} style={{ whiteSpace: 'pre', minHeight: '1.22em' }}>
          {row.runs.map((run, i) => (
            <span key={i} style={{ color: run.c, background: run.bg }}>
              {run.t}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}