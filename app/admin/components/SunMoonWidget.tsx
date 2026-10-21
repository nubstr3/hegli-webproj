'use client'

import { useState } from 'react'
import Pane from './Pane'
import LocationSearch, { readPlace } from './LocationSearch'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, BORDER_SUBTLE, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { linkBtn, useNow } from './widgetUi'

const RAD = Math.PI / 180
const fromJulian = (j: number) => new Date((j - 2440587.5) * 86400000)

type Sun = { rise: Date | null; set: Date | null; transit: Date; polar: 'day' | 'night' | null }

// Sunrise equation (https://en.wikipedia.org/wiki/Sunrise_equation); good to within a minute or two.
function solar(n: number, lat: number, lon: number): Sun {
  const lw = -lon
  const jStar = n + 0.0009 - lw / 360
  const m = (357.5291 + 0.98560028 * jStar) % 360
  const mr = m * RAD
  const c = 1.9148 * Math.sin(mr) + 0.02 * Math.sin(2 * mr) + 0.0003 * Math.sin(3 * mr)
  const lambda = ((m + c + 180 + 102.9372) % 360) * RAD
  const transit = fromJulian(2451545 + jStar + 0.0053 * Math.sin(mr) - 0.0069 * Math.sin(2 * lambda))
  const sinDec = Math.sin(lambda) * Math.sin(23.4397 * RAD)
  const cosW = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * Math.cos(Math.asin(sinDec)))
  if (cosW > 1) return { rise: null, set: null, transit, polar: 'night' }
  if (cosW < -1) return { rise: null, set: null, transit, polar: 'day' }
  const w = Math.acos(cosW) / RAD / 360
  return {
    rise: new Date(transit.getTime() - w * 86400000),
    set: new Date(transit.getTime() + w * 86400000),
    transit,
    polar: null,
  }
}

function sunToday(now: Date, lat: number, lon: number, tz: string): Sun {
  const target = now.toLocaleDateString('en-CA', { timeZone: tz })
  const [y, mo, d] = target.split('-').map(Number)
  const k = Math.round(Date.UTC(y, mo - 1, d, 12) / 86400000 + 2440587.5 - 2451545)
  for (const n of [k - 1, k, k + 1]) {
    const s = solar(n, lat, lon)
    if (s.transit.toLocaleDateString('en-CA', { timeZone: tz }) === target) return s
  }
  return solar(k, lat, lon)
}

const SYNODIC = 29.530588853
const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14)

function moon(now: Date) {
  const days = (now.getTime() - NEW_MOON_REF) / 86400000
  const p = (((days / SYNODIC) % 1) + 1) % 1
  const illum = ((1 - Math.cos(2 * Math.PI * p)) / 2) * 100
  const names = ['new moon', 'waxing crescent', 'first quarter', 'waxing gibbous', 'full moon', 'waning gibbous', 'last quarter', 'waning crescent']
  const glyphs = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']
  const i = Math.round(p * 8) % 8
  return {
    name: names[i],
    glyph: glyphs[i],
    illum: Math.round(illum),
    toFull: Math.ceil((((0.5 - p + 1) % 1) * SYNODIC) - 0.5),
    toNew: Math.ceil((((1 - p) % 1) * SYNODIC) - 0.5),
  }
}

export default function SunMoonWidget({ config, onConfigChange }: WidgetProps) {
  const place = readPlace(config.place)
  const now = useNow(60_000)
  const [changing, setChanging] = useState(false)

  const fmt = (d: Date | null) =>
    d ? d.toLocaleTimeString('en-NZ', { timeZone: place.tz, hour: 'numeric', minute: '2-digit' }).toLowerCase() : '--'

  const sun = now ? sunToday(now, place.lat, place.lon, place.tz) : null
  const mn = now ? moon(now) : null
  const lenMs = sun?.rise && sun.set ? sun.set.getTime() - sun.rise.getTime() : null

  return (
    <Pane
      title="sun.moon"
      right={
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: TEXT_FAINT }} onClick={() => setChanging((v) => !v)}>
          {place.name.toLowerCase()} ▾
        </button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sun?.polar ? (
          <div style={{ color: TEXT_MUTED }}>{sun.polar === 'day' ? 'sun stays up all day' : 'sun stays down all day'}</div>
        ) : (
          <>
            <Row label="sunrise" value={fmt(sun?.rise ?? null)} accent />
            <Row label="sunset" value={fmt(sun?.set ?? null)} accent />
            <Row
              label="daylight"
              value={lenMs ? `${Math.floor(lenMs / 3600000)}h ${String(Math.round((lenMs % 3600000) / 60000)).padStart(2, '0')}m` : '--'}
            />
          </>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ fontSize: 30, lineHeight: 1, display: 'inline-block', transform: place.lat < 0 ? 'scaleX(-1)' : 'none' }}>
          {mn?.glyph ?? '🌑'}
        </span>
        <div>
          <div style={{ color: TEXT_PRIMARY }}>{mn?.name ?? '--'}</div>
          <div style={{ color: TEXT_MUTED, marginTop: 3 }}>
            {mn ? `${mn.illum}% lit · full in ~${mn.toFull}d · new in ~${mn.toNew}d` : ''}
          </div>
        </div>
      </div>
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

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: TEXT_MUTED }}>{label}</span>
      <span style={{ color: accent ? ACCENT : TEXT_PRIMARY }}>{value}</span>
    </div>
  )
}