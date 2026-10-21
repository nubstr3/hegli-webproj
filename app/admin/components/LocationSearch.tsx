'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { ACCENT, BORDER_SUBTLE, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { bareInput, linkBtn } from './widgetUi'

export type Place = { name: string; lat: number; lon: number; tz: string }

export const AUCKLAND: Place = { name: 'Auckland', lat: -36.85, lon: 174.76, tz: 'Pacific/Auckland' }

export function readPlace(v: unknown): Place {
  const p = v as Partial<Place> | null
  if (p && typeof p.name === 'string' && typeof p.lat === 'number' && typeof p.lon === 'number' && typeof p.tz === 'string') {
    return { name: p.name, lat: p.lat, lon: p.lon, tz: p.tz }
  }
  return AUCKLAND
}

type GeoResult = { name: string; latitude: number; longitude: number; timezone: string; country?: string; admin1?: string }

/** Search for a city (Open-Meteo's free geocoding) and pick one. */
export default function LocationSearch({ onPick, onCancel }: { onPick: (p: Place) => void; onCancel: () => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const search = (e: FormEvent) => {
    e.preventDefault()
    const query = q.trim()
    if (!query) return
    setBusy(true)
    setError('')
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`)
      .then((r) => {
        if (!r.ok) throw new Error('lookup failed')
        return r.json()
      })
      .then((d: { results?: GeoResult[] }) => {
        setResults(d.results ?? [])
        if (!d.results?.length) setError('no matches')
        setBusy(false)
      })
      .catch(() => {
        setError("couldn't search right now")
        setBusy(false)
      })
  }

  return (
    <div style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <form onSubmit={search} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: TEXT_FAINT }}>&gt;</span>
        <input autoFocus type="text" placeholder="search city..." value={q} onChange={(e) => setQ(e.target.value)} style={bareInput} />
        <button type="submit" style={{ ...linkBtn, color: ACCENT }}>
          {busy ? '...' : '[ go ]'}
        </button>
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: TEXT_FAINT }} onClick={onCancel}>
          cancel
        </button>
      </form>
      {results.map((r, i) => (
        <button
          key={`${r.latitude},${r.longitude},${i}`}
          type="button"
          className="hegli-act"
          style={{ ...linkBtn, textAlign: 'left', color: TEXT_PRIMARY }}
          onClick={() => onPick({ name: r.name, lat: r.latitude, lon: r.longitude, tz: r.timezone })}
        >
          {r.name} <span style={{ color: TEXT_MUTED }}>{[r.admin1, r.country].filter(Boolean).join(', ')}</span>
        </button>
      ))}
      {error && <div style={{ color: TEXT_ERROR }}>{error}</div>}
    </div>
  )
}