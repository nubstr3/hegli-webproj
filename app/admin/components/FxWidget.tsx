'use client'

import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, BORDER_SUBTLE, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { bareInput, linkBtn, sparkline } from './widgetUi'

const API = 'https://api.frankfurter.dev/v1'
const DEFAULT_BASE = 'NZD'
const DEFAULT_TARGETS = ['JPY', 'USD', 'AUD']
const MAX_TARGETS = 6
const HISTORY_DAYS = 30

type Series = { key: string; history: Record<string, number[]> }

const isCode = (s: string) => /^[A-Z]{3}$/.test(s)

export default function FxWidget({ config, onConfigChange }: WidgetProps) {
  const base = typeof config.base === 'string' && isCode(config.base) ? config.base : DEFAULT_BASE
  const targets = (Array.isArray(config.targets) ? config.targets : DEFAULT_TARGETS).filter(
    (t): t is string => typeof t === 'string' && isCode(t),
  )
  const key = `${base}>${targets.join(',')}`

  const [series, setSeries] = useState<Series | null>(null)
  const [failed, setFailed] = useState(false)
  const [amount, setAmount] = useState('1')
  const [managing, setManaging] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (targets.length === 0) return
    let cancelled = false
    const start = new Date(Date.now() - HISTORY_DAYS * 86400000).toISOString().slice(0, 10)
    fetch(`${API}/${start}..?base=${base}&symbols=${targets.join(',')}`)
      .then((r) => {
        if (!r.ok) throw new Error('fx request failed')
        return r.json()
      })
      .then((d: { rates: Record<string, Record<string, number>> }) => {
        if (cancelled) return
        const history: Record<string, number[]> = {}
        for (const day of Object.keys(d.rates).sort()) {
          for (const [code, rate] of Object.entries(d.rates[day])) (history[code] ??= []).push(rate)
        }
        setSeries({ key, history })
        setFailed(false)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const save = (next: { base?: string; targets?: string[] }) => onConfigChange({ ...config, base, targets, ...next })

  const addCode = (e: FormEvent) => {
    e.preventDefault()
    const code = input.trim().toUpperCase()
    if (!isCode(code)) return setError('use a 3-letter code, like EUR')
    if (code === base || targets.includes(code)) return setError('already there')
    if (targets.length >= MAX_TARGETS) return setError(`max ${MAX_TARGETS}`)
    fetch(`${API}/latest?base=${base}&symbols=${code}`)
      .then((r) => {
        if (!r.ok) throw new Error('unknown')
        setError('')
        setInput('')
        save({ targets: [...targets, code] })
      })
      .catch(() => setError(`don't know ${code}`))
  }

  const mult = Number(amount) > 0 ? Number(amount) : 1
  const ready = series && series.key === key ? series : null

  return (
    <Pane
      title="fx.rates"
      right={
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: managing ? ACCENT : TEXT_FAINT }} onClick={() => setManaging((v) => !v)}>
          {managing ? '✓ done' : 'edit'}
        </button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT_MUTED }}>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-label="Amount"
          style={{ ...bareInput, flex: 'none', width: 64, borderBottom: `1px solid ${BORDER_SUBTLE}`, color: ACCENT }}
        />
        <span>{base} =</span>
      </div>
      {targets.length === 0 && <div style={{ color: TEXT_FAINT }}>no currencies. hit edit to add one.</div>}
      {failed && !ready && targets.length > 0 && <div style={{ color: TEXT_ERROR }}>couldn&apos;t reach the rates service.</div>}
      {targets.map((code) => {
        const h = ready?.history[code] ?? []
        const last = h[h.length - 1]
        const change = h.length > 1 ? ((last - h[0]) / h[0]) * 100 : null
        return (
          <div key={code} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ color: TEXT_PRIMARY, width: 34 }}>{code}</span>
            <span style={{ color: ACCENT, opacity: 0.8, flex: 1, letterSpacing: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>{sparkline(h)}</span>
            <span style={{ minWidth: 70, textAlign: 'right' }}>
              {last ? (last * mult).toLocaleString('en-NZ', { maximumFractionDigits: last * mult < 10 ? 3 : 2 }) : '--'}
            </span>
            <span style={{ minWidth: 48, textAlign: 'right', color: change === null ? TEXT_FAINT : change >= 0 ? ACCENT : TEXT_ERROR, fontSize: 11 }}>
              {change === null ? '' : `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`}
            </span>
            {managing && (
              <button
                type="button"
                aria-label={`Remove ${code}`}
                className="hegli-act hegli-act-danger"
                style={{ ...linkBtn, fontSize: 14, color: TEXT_FAINT }}
                onClick={() => save({ targets: targets.filter((t) => t !== code) })}
              >
                &times;
              </button>
            )}
          </div>
        )
      })}
      <div style={{ color: TEXT_FAINT, fontSize: 11 }}>30-day trend · ECB rates, updated on weekdays</div>
      {managing && (
        <form onSubmit={addCode} style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: TEXT_FAINT }}>&gt;</span>
            <input placeholder="add currency, e.g. EUR" value={input} onChange={(e) => setInput(e.target.value)} style={bareInput} />
            <button type="submit" style={{ ...linkBtn, color: ACCENT }}>
              [ + ]
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TEXT_MUTED }}>
            <span>from</span>
            <input
              defaultValue={base}
              maxLength={3}
              aria-label="Base currency"
              onBlur={(e) => {
                const v = e.target.value.trim().toUpperCase()
                if (isCode(v) && v !== base) save({ base: v, targets: targets.filter((t) => t !== v) })
                else e.target.value = base
              }}
              style={{ ...bareInput, flex: 'none', width: 40, color: ACCENT }}
            />
          </div>
          {error && <div style={{ color: TEXT_ERROR }}>{error}</div>}
        </form>
      )}
    </Pane>
  )
}