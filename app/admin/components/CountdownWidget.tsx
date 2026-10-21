'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, BORDER_SUBTLE, FONT_MONO, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { bareInput, dateKey, linkBtn, newId, readList, useNow } from './widgetUi'

export type CountdownItem = { id: string; title: string; date: string } // date = YYYY-MM-DD
export const isCountdownItem = (x: unknown): x is CountdownItem => {
  const i = x as CountdownItem
  return !!i && typeof i.id === 'string' && typeof i.title === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(i.date)
}

const MAX_ITEMS = 6

/** Whole calendar days from `from` (a local date) until `date` (YYYY-MM-DD). */
export function daysUntil(date: string, from: Date): number {
  const [y, m, d] = date.split('-').map(Number)
  const today = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())
  return Math.round((Date.UTC(y, m - 1, d) - today) / 86400000)
}

function phrase(days: number) {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days === -1) return 'yesterday'
  return days > 0 ? `${days} days` : `${-days} days ago`
}

export default function CountdownWidget({ config, onConfigChange }: WidgetProps) {
  const items = readList(config.items, isCountdownItem) ?? []
  const now = useNow(60_000)
  const [managing, setManaging] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')

  const save = (next: CountdownItem[]) => onConfigChange({ ...config, items: next })
  const sorted = items.slice().sort((a, b) => a.date.localeCompare(b.date))
  // the headline is the soonest one that hasn't passed (or the most recent past one)
  const todayKey = now ? dateKey(now) : ''
  const headline = sorted.find((i) => i.date >= todayKey) ?? sorted[sorted.length - 1]

  const add = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return setError('give it a title')
    if (!date) return setError('pick a date')
    if (items.length >= MAX_ITEMS) return setError(`max ${MAX_ITEMS}`)
    setError('')
    setTitle('')
    setDate('')
    save([...items, { id: newId(), title: title.trim(), date }])
  }

  const days = now && headline ? daysUntil(headline.date, now) : null

  return (
    <Pane
      title="countdown"
      right={
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: managing ? ACCENT : TEXT_FAINT }} onClick={() => setManaging((v) => !v)}>
          {managing ? '✓ done' : items.length ? 'edit' : '+ add'}
        </button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {!headline && !managing && <div style={{ color: TEXT_FAINT }}>nothing to count down to. hit + add.</div>}
      {headline && (
        <div>
          <div style={{ fontSize: 30, color: ACCENT, lineHeight: 1.1 }}>
            {days === null ? '--' : days > 1 || days < -1 ? days : phrase(days)}
            {days !== null && (days > 1 || days < -1) && <span style={{ fontSize: 13, color: TEXT_MUTED }}> {days > 0 ? 'days to go' : 'days ago'}</span>}
          </div>
          <div style={{ color: TEXT_PRIMARY, marginTop: 6 }}>{headline.title}</div>
          <div style={{ color: TEXT_FAINT, marginTop: 2 }}>
            {new Date(headline.date + 'T12:00:00').toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            {days !== null && days > 13 ? ` · ${Math.floor(days / 7)}w ${days % 7}d` : ''}
          </div>
        </div>
      )}
      {sorted.length > 1 && (
        <div style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {sorted
            .filter((i) => i.id !== headline?.id)
            .map((i) => {
              const d = now ? daysUntil(i.date, now) : null
              return (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, color: d !== null && d < 0 ? TEXT_FAINT : TEXT_MUTED }}>
                  <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{i.title}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{d === null ? '--' : phrase(d)}</span>
                </div>
              )
            })}
        </div>
      )}
      {managing && (
        <div style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {sorted.map((i) => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: TEXT_MUTED, minWidth: 0, overflowWrap: 'anywhere' }}>
                {i.title} <span style={{ color: TEXT_FAINT }}>{i.date}</span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${i.title}`}
                className="hegli-act hegli-act-danger"
                style={{ ...linkBtn, fontSize: 14, color: TEXT_FAINT }}
                onClick={() => save(items.filter((x) => x.id !== i.id))}
              >
                &times;
              </button>
            </div>
          ))}
          <form onSubmit={add} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: TEXT_FAINT }}>&gt;</span>
              <input placeholder="title, e.g. japan trip" value={title} onChange={(e) => setTitle(e.target.value)} style={bareInput} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ ...bareInput, flex: 'none', colorScheme: 'dark', fontFamily: FONT_MONO }}
              />
              <button type="submit" style={{ ...linkBtn, color: ACCENT }}>
                [ + ]
              </button>
            </div>
            {error && <div style={{ color: TEXT_ERROR }}>{error}</div>}
          </form>
        </div>
      )}
    </Pane>
  )
}