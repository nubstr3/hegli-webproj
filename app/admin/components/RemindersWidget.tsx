'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import Pane from './Pane'
import { ACCENT, BORDER_SUBTLE, FONT_MONO, TEXT_DIM, TEXT_ERROR, TEXT_FAINT, TEXT_PRIMARY } from '@/app/components/theme'

type Reminder = {
  id: number
  text: string
  colour: string
  done?: boolean | null
  created_at?: string
}

// Colour = priority, most important first. The hex is what gets saved on the reminder.
const PRIORITIES = [
  { name: 'urgent', hint: 'drop everything', hex: '#F87171' },
  { name: 'important', hint: 'do soon', hex: '#FF8A5B' },
  { name: 'normal', hint: 'when you can', hex: '#FDE047' },
  { name: 'low', hint: 'fine to wait', hex: '#4ADE80' },
  { name: 'optional', hint: 'can do, or not', hex: '#60A5FA' },
]
const rankOf = (colour: string) => {
  const i = PRIORITIES.findIndex((p) => p.hex === colour)
  return i === -1 ? PRIORITIES.length : i // reminders saved with old colours sink below the ranked ones
}

const linkBtn = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
} as const

// open first, most important at the top (newest first within a priority); finished ones sink to the bottom
const sortReminders = (list: Reminder[]) =>
  list.slice().sort((a, b) => {
    const d = Number(!!a.done) - Number(!!b.done)
    if (d !== 0) return d
    const rank = rankOf(a.colour) - rankOf(b.colour)
    if (rank !== 0) return rank
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })

export default function RemindersWidget() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [newReminder, setNewReminder] = useState('')
  const [selectedColour, setSelectedColour] = useState(PRIORITIES[2].hex)
  const [error, setError] = useState('')

  const fetchReminders = useCallback(async () => {
    const { data } = await supabase.from('reminders').select('*').order('created_at', { ascending: false })
    if (data) setReminders(data)
  }, [])

  useEffect(() => {
    supabase
      .from('reminders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }: { data: Reminder[] | null; error: { message: string } | null }) => {
        if (err) setError("couldn't load reminders")
        if (data) setReminders(data)
        setLoading(false)
      })
  }, [])

  const addReminder = async (e: FormEvent) => {
    e.preventDefault()
    const text = newReminder.trim()
    if (!text) return
    const { error: err } = await supabase.from('reminders').insert({ text, colour: selectedColour })
    if (err) {
      setError("couldn't save that one")
      return
    }
    setError('')
    setNewReminder('')
    fetchReminders()
  }

  const toggleDone = async (r: Reminder) => {
    const done = !r.done
    setReminders((list) => list.map((x) => (x.id === r.id ? { ...x, done } : x)))
    const { error: err } = await supabase.from('reminders').update({ done }).eq('id', r.id)
    if (err) {
      setError("couldn't tick that off. has the done column been added?")
      fetchReminders()
    } else setError('')
  }

  const deleteReminder = async (id: number) => {
    setReminders((list) => list.filter((x) => x.id !== id))
    const { error: err } = await supabase.from('reminders').delete().eq('id', id)
    if (err) {
      setError("couldn't delete that one")
      fetchReminders()
    }
  }

  const clearDone = async () => {
    const ids = reminders.filter((r) => r.done).map((r) => r.id)
    if (ids.length === 0) return
    setReminders((list) => list.filter((x) => !x.done))
    const { error: err } = await supabase.from('reminders').delete().in('id', ids)
    if (err) {
      setError("couldn't clear those")
      fetchReminders()
    }
  }

  const open = reminders.filter((r) => !r.done).length
  const doneCount = reminders.length - open

  return (
    <Pane
      title="reminders.sh"
      right={
        <span style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
          {doneCount > 0 && (
            <button type="button" className="hegli-act hegli-act-danger" style={{ ...linkBtn, color: TEXT_FAINT }} onClick={clearDone}>
              clear done ({doneCount})
            </button>
          )}
          <span style={{ color: TEXT_FAINT }}>{open} open</span>
        </span>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {loading && <div style={{ color: TEXT_FAINT }}>loading...</div>}
        {!loading && reminders.length === 0 && <div style={{ color: TEXT_FAINT }}>nothing queued.</div>}
        {sortReminders(reminders).map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
              <button
                type="button"
                role="checkbox"
                aria-checked={!!r.done}
                aria-label={r.done ? 'Mark as not done' : 'Mark as done'}
                onClick={() => toggleDone(r)}
                style={{ ...linkBtn, flexShrink: 0, whiteSpace: 'pre', lineHeight: 1.5, color: r.colour }}
              >
                {r.done ? '[x]' : '[ ]'}
              </button>
              <span
                style={{
                  lineHeight: 1.5,
                  overflowWrap: 'anywhere',
                  color: r.done ? TEXT_DIM : TEXT_PRIMARY,
                  textDecoration: r.done ? 'line-through' : 'none',
                }}
              >
                {r.text}
              </span>
            </div>
            <button
              type="button"
              aria-label="Delete reminder"
              className="hegli-act hegli-act-danger"
              onClick={() => deleteReminder(r.id)}
              style={{ ...linkBtn, fontSize: 14, color: TEXT_FAINT, flexShrink: 0 }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={addReminder}
        style={{ marginTop: 'auto', borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px 12px', flexWrap: 'wrap' }}>
          <span style={{ color: TEXT_FAINT }}>priority:</span>
          {PRIORITIES.map((p) => {
            const on = selectedColour === p.hex
            return (
              <button
                key={p.hex}
                type="button"
                title={p.hint}
                aria-pressed={on}
                onClick={() => setSelectedColour(p.hex)}
                style={{ ...linkBtn, color: p.hex, opacity: on ? 1 : 0.45, textDecoration: on ? 'underline' : 'none', textUnderlineOffset: 3 }}
              >
                {on ? `[${p.name}]` : p.name}
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: TEXT_FAINT }}>&gt;</span>
          <input
            type="text"
            placeholder="add reminder..."
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: TEXT_PRIMARY, fontFamily: FONT_MONO, fontSize: 12 }}
          />
          <button type="submit" style={{ ...linkBtn, color: ACCENT }}>
            [ + ]
          </button>
        </div>
        {error && <div style={{ color: TEXT_ERROR }}>{error}</div>}
      </form>
    </Pane>
  )
}