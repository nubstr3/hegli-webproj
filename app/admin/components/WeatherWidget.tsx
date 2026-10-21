'use client'

import { useEffect, useState } from 'react'
import Pane from './Pane'
import LocationSearch, { readPlace } from './LocationSearch'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, BORDER_SUBTLE, TEXT_DIM, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { linkBtn } from './widgetUi'

type Day = { date: string; code: number; max: number; min: number }
type Data = { key: string; temp: number; feels: number; wind: number; code: number; days: Day[] }

// WMO weather codes -> a glyph and a short description
function describe(code: number): { glyph: string; text: string } {
  if (code === 0) return { glyph: '☀', text: 'clear' }
  if (code === 1) return { glyph: '☀', text: 'mostly clear' }
  if (code === 2) return { glyph: '⛅', text: 'partly cloudy' }
  if (code === 3) return { glyph: '☁', text: 'overcast' }
  if (code === 45 || code === 48) return { glyph: '≋', text: 'fog' }
  if (code >= 51 && code <= 57) return { glyph: '☂', text: 'drizzle' }
  if (code >= 61 && code <= 67) return { glyph: '☂', text: 'rain' }
  if (code >= 71 && code <= 77) return { glyph: '❄', text: 'snow' }
  if (code >= 80 && code <= 82) return { glyph: '☂', text: 'showers' }
  if (code === 85 || code === 86) return { glyph: '❄', text: 'snow showers' }
  if (code >= 95) return { glyph: '⚡', text: 'thunderstorm' }
  return { glyph: '·', text: 'unknown' }
}

export default function WeatherWidget({ config, onConfigChange }: WidgetProps) {
  const place = readPlace(config.place)
  const key = `${place.lat},${place.lon}`
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)
  const [changing, setChanging] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15 * 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error('weather request failed')
        return r.json()
      })
      .then((d) => {
        if (cancelled) return
        setData({
          key,
          temp: d.current.temperature_2m,
          feels: d.current.apparent_temperature,
          wind: d.current.wind_speed_10m,
          code: d.current.weather_code,
          days: d.daily.time.map((date: string, i: number) => ({
            date,
            code: d.daily.weather_code[i],
            max: d.daily.temperature_2m_max[i],
            min: d.daily.temperature_2m_min[i],
          })),
        })
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [place.lat, place.lon, key, tick])

  const ready = data && data.key === key ? data : null
  const now = ready ? describe(ready.code) : null

  return (
    <Pane
      title="weather.now"
      right={
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: TEXT_FAINT }} onClick={() => setChanging((v) => !v)}>
          {place.name.toLowerCase()} ▾
        </button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {failed && !ready && <div style={{ color: TEXT_ERROR }}>couldn&apos;t reach the weather service.</div>}
      {!ready && !failed && <div style={{ color: TEXT_FAINT }}>loading...</div>}
      {ready && now && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 34, color: ACCENT, lineHeight: 1 }}>{now.glyph}</span>
            <div>
              <div style={{ fontSize: 24, color: TEXT_PRIMARY, lineHeight: 1.1 }}>{Math.round(ready.temp)}°C</div>
              <div style={{ color: TEXT_MUTED, marginTop: 4 }}>
                {now.text} · feels {Math.round(ready.feels)}° · wind {Math.round(ready.wind)} km/h
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
            {ready.days.map((d, i) => (
              <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: i === 0 ? ACCENT : TEXT_MUTED, width: 44 }}>
                  {i === 0 ? 'today' : new Date(d.date + 'T12:00:00').toLocaleDateString('en-NZ', { weekday: 'short' }).toLowerCase()}
                </span>
                <span style={{ flex: 1, color: TEXT_DIM }}>
                  {describe(d.code).glyph} {describe(d.code).text}
                </span>
                <span>
                  {Math.round(d.max)}° <span style={{ color: TEXT_FAINT }}>{Math.round(d.min)}°</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      {changing && (
        <LocationSearch
          onCancel={() => setChanging(false)}
          onPick={(p) => {
            setChanging(false)
            onConfigChange({ ...config, place: p })
          }}
        />
      )}
    </Pane>
  )
}