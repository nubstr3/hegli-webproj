'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, BORDER_SUBTLE, FONT_MONO, TEXT_ERROR, TEXT_FAINT, TEXT_PRIMARY } from '@/app/components/theme'

const HOME_TZ = 'Pacific/Auckland'
const MAX_CITIES = 8
const DEFAULT_CITIES = ['Pacific/Auckland', 'Asia/Tokyo', 'Europe/London', 'America/New_York']

// Names you can type. Anything else works too if you enter an IANA zone like "Asia/Seoul".
const CITY_LIST: { label: string; tz: string }[] = [
  { label: 'Auckland', tz: 'Pacific/Auckland' },
  { label: 'Sydney', tz: 'Australia/Sydney' },
  { label: 'Melbourne', tz: 'Australia/Melbourne' },
  { label: 'Brisbane', tz: 'Australia/Brisbane' },
  { label: 'Perth', tz: 'Australia/Perth' },
  { label: 'Fiji', tz: 'Pacific/Fiji' },
  { label: 'Honolulu', tz: 'Pacific/Honolulu' },
  { label: 'Tokyo', tz: 'Asia/Tokyo' },
  { label: 'Osaka', tz: 'Asia/Tokyo' },
  { label: 'Seoul', tz: 'Asia/Seoul' },
  { label: 'Beijing', tz: 'Asia/Shanghai' },
  { label: 'Shanghai', tz: 'Asia/Shanghai' },
  { label: 'Hong Kong', tz: 'Asia/Hong_Kong' },
  { label: 'Taipei', tz: 'Asia/Taipei' },
  { label: 'Manila', tz: 'Asia/Manila' },
  { label: 'Singapore', tz: 'Asia/Singapore' },
  { label: 'Bangkok', tz: 'Asia/Bangkok' },
  { label: 'Jakarta', tz: 'Asia/Jakarta' },
  { label: 'Delhi', tz: 'Asia/Kolkata' },
  { label: 'Mumbai', tz: 'Asia/Kolkata' },
  { label: 'Dubai', tz: 'Asia/Dubai' },
  { label: 'Istanbul', tz: 'Europe/Istanbul' },
  { label: 'Moscow', tz: 'Europe/Moscow' },
  { label: 'Cairo', tz: 'Africa/Cairo' },
  { label: 'Johannesburg', tz: 'Africa/Johannesburg' },
  { label: 'Nairobi', tz: 'Africa/Nairobi' },
  { label: 'Lagos', tz: 'Africa/Lagos' },
  { label: 'Lisbon', tz: 'Europe/Lisbon' },
  { label: 'London', tz: 'Europe/London' },
  { label: 'Dublin', tz: 'Europe/Dublin' },
  { label: 'Paris', tz: 'Europe/Paris' },
  { label: 'Madrid', tz: 'Europe/Madrid' },
  { label: 'Berlin', tz: 'Europe/Berlin' },
  { label: 'Amsterdam', tz: 'Europe/Amsterdam' },
  { label: 'Rome', tz: 'Europe/Rome' },
  { label: 'Zurich', tz: 'Europe/Zurich' },
  { label: 'Stockholm', tz: 'Europe/Stockholm' },
  { label: 'Athens', tz: 'Europe/Athens' },
  { label: 'Reykjavik', tz: 'Atlantic/Reykjavik' },
  { label: 'Sao Paulo', tz: 'America/Sao_Paulo' },
  { label: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires' },
  { label: 'Mexico City', tz: 'America/Mexico_City' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Toronto', tz: 'America/Toronto' },
  { label: 'Chicago', tz: 'America/Chicago' },
  { label: 'Denver', tz: 'America/Denver' },
  { label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { label: 'San Francisco', tz: 'America/Los_Angeles' },
  { label: 'Vancouver', tz: 'America/Vancouver' },
  { label: 'Anchorage', tz: 'America/Anchorage' },
]

const isValidZone = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

function labelFor(tz: string) {
  const known = CITY_LIST.find((c) => c.tz === tz)
  if (known) return known.label
  return (tz.split('/').pop() ?? tz).replace(/_/g, ' ')
}

// "Tokyo" -> Asia/Tokyo; "asia/seoul" -> Asia/Seoul; unknown -> null
function resolveZone(input: string): string | null {
  const q = input.trim().toLowerCase()
  if (!q) return null
  const exact = CITY_LIST.find((c) => c.label.toLowerCase() === q)
  if (exact) return exact.tz
  const starts = CITY_LIST.filter((c) => c.label.toLowerCase().startsWith(q))
  if (starts.length === 1) return starts[0].tz
  if (q.includes('/')) {
    const cased = input
      .trim()
      .split('/')
      .map((p) => p.split(/([_-])/).map((s) => (s.length > 1 ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s)).join(''))
      .join('/')
    return isValidZone(cased) ? cased : null
  }
  return null
}

const dayKey = (d: Date, tz: string) => d.toLocaleDateString('en-CA', { timeZone: tz })

function dayLabel(now: Date, tz: string) {
  const here = dayKey(now, HOME_TZ)
  const there = dayKey(now, tz)
  if (there === here) return 'today'
  return there > here ? 'tomorrow' : 'yesterday'
}

function offsetLabel(now: Date, tz: string) {
  const diffH =
    (new Date(now.toLocaleString('en-US', { timeZone: tz })).getTime() -
      new Date(now.toLocaleString('en-US', { timeZone: HOME_TZ })).getTime()) /
    3_600_000
  if (diffH === 0) return 'home'
  const sign = diffH > 0 ? '+' : '-'
  const abs = Math.abs(diffH)
  const whole = Math.floor(abs)
  const mins = Math.round((abs - whole) * 60)
  return `${sign}${whole}${mins ? ':' + String(mins).padStart(2, '0') : ''}h`
}

export default function ClockWidget({ config, onConfigChange }: WidgetProps) {
  const saved = Array.isArray(config.cities) ? (config.cities as unknown[]).filter((c): c is string => typeof c === 'string') : null
  const cities = saved ?? DEFAULT_CITIES

  const [now, setNow] = useState<Date | null>(null)
  const [managing, setManaging] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const first = setTimeout(() => setNow(new Date()), 0)
    const interval = setInterval(() => setNow(new Date()), 15_000)
    return () => {
      clearTimeout(first)
      clearInterval(interval)
    }
  }, [])

  const save = (next: string[]) => onConfigChange({ ...config, cities: next })

  const addCity = (e: FormEvent) => {
    e.preventDefault()
    const tz = resolveZone(input)
    if (!tz) {
      setError('not sure about that one. pick from the list, or use a zone like Asia/Seoul')
      return
    }
    if (cities.includes(tz)) {
      setError('already on the list')
      return
    }
    if (cities.length >= MAX_CITIES) {
      setError(`max ${MAX_CITIES} clocks`)
      return
    }
    setError('')
    setInput('')
    save([...cities, tz])
  }

  return (
    <Pane
      title="world.clock"
      right={
        <button
          type="button"
          className="hegli-act"
          onClick={() => {
            setManaging((v) => !v)
            setError('')
          }}
          style={{ background: 'none', border: 'none', padding: 0, fontFamily: FONT_MONO, fontSize: 12, cursor: 'pointer', color: managing ? ACCENT : TEXT_FAINT }}
        >
          {managing ? '✓ done' : 'edit'}
        </button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {cities.length === 0 && <div style={{ color: TEXT_FAINT }}>no clocks. hit edit to add one.</div>}
      {cities.map((tz) => (
        <div key={tz} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
          <span style={{ color: tz === HOME_TZ ? ACCENT : TEXT_PRIMARY, minWidth: 0 }}>{labelFor(tz)}</span>
          <span style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
            <span style={{ color: TEXT_FAINT, fontSize: 11 }}>{now ? offsetLabel(now, tz) : ''}</span>
            <span>
              {now ? now.toLocaleTimeString('en-NZ', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).toLowerCase() : '--:--'}
            </span>
            <span style={{ color: TEXT_FAINT, minWidth: 64, textAlign: 'right' }}>{now ? dayLabel(now, tz) : ''}</span>
            {managing && (
              <button
                type="button"
                aria-label={`Remove ${labelFor(tz)}`}
                className="hegli-act hegli-act-danger"
                onClick={() => save(cities.filter((c) => c !== tz))}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: FONT_MONO, fontSize: 14, cursor: 'pointer', color: TEXT_FAINT }}
              >
                &times;
              </button>
            )}
          </span>
        </div>
      ))}

      {managing && (
        <form
          onSubmit={addCity}
          style={{ marginTop: 'auto', borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: TEXT_FAINT }}>&gt;</span>
            <input
              type="text"
              list="hegli-city-list"
              placeholder="add city..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: TEXT_PRIMARY, fontFamily: FONT_MONO, fontSize: 12 }}
            />
            <datalist id="hegli-city-list">
              {CITY_LIST.map((c) => (
                <option key={c.label} value={c.label} />
              ))}
            </datalist>
            <button
              type="submit"
              style={{ background: 'none', border: 'none', padding: 0, color: ACCENT, fontFamily: FONT_MONO, fontSize: 12, cursor: 'pointer' }}
            >
              [ + ]
            </button>
          </div>
          {error && <div style={{ color: TEXT_ERROR }}>{error}</div>}
        </form>
      )}
    </Pane>
  )
}