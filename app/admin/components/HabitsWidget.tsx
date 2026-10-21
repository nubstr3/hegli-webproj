'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, BORDER_SUBTLE, FONT_MONO, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { bareInput, dateKey, linkBtn, useNow } from './widgetUi'

type Habit = { id: string; name: string }
type Log = { habit_id: string; day: string }

const MAX_HABITS = 8
const LOOKBACK_DAYS = 400

function streakOf(days: Set<string>, today: Date): number {
  const d = new Date(today)
  // a habit not yet ticked today doesn't break the streak until the day is over
  if (!days.has(dateKey(d))) {
    d.setDate(d.getDate() - 1)
    if (!days.has(dateKey(d))) return 0
  }
  let n = 0
  while (days.has(dateKey(d))) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}

export default function HabitsWidget(_props: WidgetProps) {
  void _props
  const now = useNow(60_000)
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [loaded, setLoaded] = useState(false)
  const [tableMissing, setTableMissing] = useState(false)
  const [error, setError] = useState('')
  const [managing, setManaging] = useState(false)
  const [name, setName] = useState('')

  const load = useCallback(async () => {
    const since = dateKey(new Date(Date.now() - LOOKBACK_DAYS * 86400000))
    const [h, l] = await Promise.all([
      supabase.from('habits').select('id, name').order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('habit_id, day').gte('day', since),
    ])
    const err = h.error ?? l.error
    if (err) {
      if (err.code === '42P01' || /habit/.test(err.message)) setTableMissing(true)
      else setError("couldn't load habits")
    } else {
      setHabits((h.data ?? []) as Habit[])
      setLogs((l.data ?? []) as Log[])
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    Promise.resolve().then(load)
  }, [load])

  const days: string[] = []
  if (now) {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push(dateKey(d))
    }
  }
  const todayKey = days[6]

  const toggle = async (habitId: string, day: string) => {
    const on = logs.some((l) => l.habit_id === habitId && l.day === day)
    setLogs((cur) => (on ? cur.filter((l) => !(l.habit_id === habitId && l.day === day)) : [...cur, { habit_id: habitId, day }]))
    const { error: err } = on
      ? await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('day', day)
      : await supabase.from('habit_logs').insert({ habit_id: habitId, day })
    if (err) {
      setError("couldn't save that tick")
      load()
    } else setError('')
  }

  const addHabit = async (e: FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    if (habits.length >= MAX_HABITS) return setError(`max ${MAX_HABITS}`)
    const { error: err } = await supabase.from('habits').insert({ name: n })
    if (err) return setError("couldn't add that habit")
    setName('')
    setError('')
    load()
  }

  const removeHabit = async (h: Habit) => {
    setHabits((cur) => cur.filter((x) => x.id !== h.id))
    const { error: err } = await supabase.from('habits').delete().eq('id', h.id)
    if (err) {
      setError("couldn't remove it")
      load()
    }
  }

  return (
    <Pane
      title="habits.streak"
      right={
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: managing ? ACCENT : TEXT_FAINT }} onClick={() => setManaging((v) => !v)}>
          {managing ? '✓ done' : 'edit'}
        </button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {tableMissing && <div style={{ color: TEXT_MUTED }}>run the habits SQL in Supabase to turn this on.</div>}
      {!loaded && !tableMissing && <div style={{ color: TEXT_FAINT }}>loading...</div>}
      {loaded && !tableMissing && habits.length === 0 && <div style={{ color: TEXT_FAINT }}>no habits yet. hit edit to add one.</div>}
      {habits.length > 0 && now && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) repeat(7, 22px) 34px', gap: '8px 4px', alignItems: 'center' }}>
          <span />
          {days.map((d) => (
            <span key={d} style={{ textAlign: 'center', fontSize: 10, color: d === todayKey ? ACCENT : TEXT_FAINT }}>
              {new Date(d + 'T12:00:00').toLocaleDateString('en-NZ', { weekday: 'narrow' }).toLowerCase()}
            </span>
          ))}
          <span />
          {habits.map((h) => {
            const done = new Set(logs.filter((l) => l.habit_id === h.id).map((l) => l.day))
            const streak = streakOf(done, now)
            return (
              <HabitRow key={h.id}>
                <span style={{ color: TEXT_PRIMARY, minWidth: 0, overflowWrap: 'anywhere' }}>{h.name}</span>
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-label={`${h.name} ${d}: ${done.has(d) ? 'done' : 'not done'}`}
                    aria-pressed={done.has(d)}
                    onClick={() => toggle(h.id, d)}
                    style={{ ...linkBtn, fontFamily: FONT_MONO, color: done.has(d) ? ACCENT : d === todayKey ? TEXT_MUTED : TEXT_FAINT, textAlign: 'center' }}
                  >
                    {done.has(d) ? '■' : '□'}
                  </button>
                ))}
                {managing ? (
                  <button
                    type="button"
                    aria-label={`Remove ${h.name}`}
                    className="hegli-act hegli-act-danger"
                    style={{ ...linkBtn, fontSize: 14, color: TEXT_FAINT }}
                    onClick={() => removeHabit(h)}
                  >
                    &times;
                  </button>
                ) : (
                  <span style={{ color: streak > 0 ? ACCENT : TEXT_FAINT, textAlign: 'right', fontSize: 11 }}>{streak}d</span>
                )}
              </HabitRow>
            )
          })}
        </div>
      )}
      <div style={{ color: TEXT_FAINT, fontSize: 11 }}>missed a day? tick it later: the last 7 days stay editable.</div>
      {managing && !tableMissing && (
        <form onSubmit={addHabit} style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: TEXT_FAINT }}>&gt;</span>
          <input placeholder="new habit..." value={name} onChange={(e) => setName(e.target.value)} style={bareInput} />
          <button type="submit" style={{ ...linkBtn, color: ACCENT }}>
            [ + ]
          </button>
        </form>
      )}
      {error && <div style={{ color: TEXT_ERROR }}>{error}</div>}
    </Pane>
  )
}

// rows are laid out by the parent grid; display: contents lets each cell join it
function HabitRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'contents' }}>{children}</div>
}