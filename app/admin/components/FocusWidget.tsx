'use client'

import { useEffect, useRef, useState } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, BORDER_SUBTLE, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { dateKey, linkBtn } from './widgetUi'

const PRESETS = [
  { focus: 25, rest: 5 },
  { focus: 50, rest: 10 },
  { focus: 15, rest: 3 },
]
const COUNT_KEY = 'hegli-focus-count' // { day, n }: focus sessions finished today

type Mode = 'focus' | 'rest'

function readCount(): number {
  try {
    const v = JSON.parse(localStorage.getItem(COUNT_KEY) ?? 'null')
    return v && v.day === dateKey(new Date()) ? Number(v.n) || 0 : 0
  } catch {
    return 0
  }
}
function writeCount(n: number) {
  try {
    localStorage.setItem(COUNT_KEY, JSON.stringify({ day: dateKey(new Date()), n }))
  } catch {
    /* storage unavailable: the count just won't persist */
  }
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.35)
  } catch {
    /* audio blocked: the tab title still changes */
  }
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function FocusWidget({ config, onConfigChange }: WidgetProps) {
  const presetIdx = typeof config.preset === 'number' && PRESETS[config.preset] ? config.preset : 0
  const preset = PRESETS[presetIdx]
  const lengthOf = (m: Mode) => (m === 'focus' ? preset.focus : preset.rest) * 60_000

  const [mode, setMode] = useState<Mode>('focus')
  const [leftMs, setLeftMs] = useState(lengthOf('focus'))
  const [endAt, setEndAt] = useState<number | null>(null) // set while running
  const [nowMs, setNowMs] = useState(0) // updated by the ticker while running
  const [sessions, setSessions] = useState(0)
  const originalTitle = useRef('')

  useEffect(() => {
    Promise.resolve().then(() => setSessions(readCount()))
  }, [])

  const running = endAt !== null
  const remaining = endAt !== null ? Math.max(0, endAt - nowMs) : leftMs

  useEffect(() => {
    if (endAt === null) return
    const interval = setInterval(() => {
      if (Date.now() >= endAt) {
        beep()
        const next: Mode = mode === 'focus' ? 'rest' : 'focus'
        if (mode === 'focus') {
          const n = readCount() + 1
          writeCount(n)
          setSessions(n)
        }
        setMode(next)
        setLeftMs(lengthOf(next))
        setEndAt(null)
      } else setNowMs(Date.now())
    }, 250)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endAt, mode, presetIdx])

  // show the countdown in the browser tab while it runs
  useEffect(() => {
    if (endAt === null) return
    originalTitle.current = originalTitle.current || document.title
    const t = setInterval(() => {
      document.title = `${mmss(endAt - Date.now())} ${mode} · hegli`
    }, 500)
    return () => {
      clearInterval(t)
      if (originalTitle.current) document.title = originalTitle.current
      originalTitle.current = ''
    }
  }, [endAt, mode])

  const start = () => {
    const t = Date.now()
    setNowMs(t)
    setEndAt(t + leftMs)
  }
  const pause = () => {
    if (endAt !== null) setLeftMs(Math.max(0, endAt - Date.now()))
    setEndAt(null)
  }
  const reset = () => {
    setEndAt(null)
    setLeftMs(lengthOf(mode))
  }
  const switchMode = (m: Mode) => {
    setEndAt(null)
    setMode(m)
    setLeftMs(lengthOf(m))
  }
  const choosePreset = (i: number) => {
    setEndAt(null)
    setLeftMs((mode === 'focus' ? PRESETS[i].focus : PRESETS[i].rest) * 60_000)
    onConfigChange({ ...config, preset: i })
  }

  const total = lengthOf(mode)
  const done = Math.min(1, Math.max(0, 1 - remaining / total))
  const cells = 20
  const filled = Math.round(done * cells)

  return (
    <Pane
      title="focus.timer"
      right={<span style={{ color: TEXT_FAINT }}>{sessions} done today</span>}
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', gap: 14 }}>
        {(['focus', 'rest'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            className="hegli-act"
            style={{ ...linkBtn, color: mode === m ? ACCENT : TEXT_FAINT }}
            onClick={() => switchMode(m)}
          >
            {mode === m ? `[${m}]` : m}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 40, lineHeight: 1, color: running ? ACCENT : TEXT_PRIMARY }}>{mmss(remaining)}</div>
      <div style={{ color: ACCENT, letterSpacing: 1 }}>
        [{'█'.repeat(filled)}
        <span style={{ color: TEXT_FAINT }}>{'░'.repeat(cells - filled)}</span>]
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <button type="button" style={{ ...linkBtn, color: ACCENT }} onClick={running ? pause : start}>
          {running ? '[ pause ]' : leftMs < total ? '[ resume ]' : '[ start ]'}
        </button>
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: TEXT_MUTED }} onClick={reset}>
          reset
        </button>
      </div>
      <div style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 10, display: 'flex', gap: 14, color: TEXT_FAINT }}>
        {PRESETS.map((p, i) => (
          <button
            key={i}
            type="button"
            className="hegli-act"
            style={{ ...linkBtn, color: i === presetIdx ? ACCENT : TEXT_FAINT }}
            onClick={() => choosePreset(i)}
          >
            {p.focus}/{p.rest}
          </button>
        ))}
        <span>min</span>
      </div>
    </Pane>
  )
}