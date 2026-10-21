import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { FONT_MONO, TEXT_PRIMARY } from '@/app/components/theme'

export const linkBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
}

export const bareInput: CSSProperties = {
  flex: 1,
  minWidth: 0,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: TEXT_PRIMARY,
  fontFamily: FONT_MONO,
  fontSize: 12,
}

/** The current time, or null until the page has mounted (keeps server and first client render identical). */
export function useNow(intervalMs: number): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0)
    const interval = setInterval(() => setNow(new Date()), intervalMs)
    return () => {
      clearTimeout(first)
      clearInterval(interval)
    }
  }, [intervalMs])
  return now
}

/** Read a saved list from widget settings, or null if it was never saved. */
export function readList<T>(value: unknown, ok: (x: unknown) => x is T): T[] | null {
  return Array.isArray(value) ? value.filter(ok) : null
}

export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

/** Local calendar date as YYYY-MM-DD. */
export const dateKey = (d: Date) => d.toLocaleDateString('en-CA')

const BLOCKS = '▁▂▃▄▅▆▇█'
export function sparkline(values: number[]): string {
  if (values.length === 0) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return BLOCKS[3].repeat(values.length)
  return values.map((v) => BLOCKS[Math.round(((v - min) / (max - min)) * (BLOCKS.length - 1))]).join('')
}