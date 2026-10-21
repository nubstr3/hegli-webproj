'use client'

import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import Pane from './Pane'
import { ACCENT, BORDER_SUBTLE, FONT_MONO, TEXT_ERROR, TEXT_FAINT, TEXT_PRIMARY } from '@/app/components/theme'

type Reminder = {
  id: number
  text: string
  colour: string
}

const COLOURS = ['#D85A30', '#1D9E75', '#7F77DD', '#BA7517', '#185FA5']

export default function RemindersWidget() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [newReminder, setNewReminder] = useState('')
  const [selectedColour, setSelectedColour] = useState(COLOURS[0])
  const [error, setError] = useState('')

  const fetchReminders = useCallback(async () => {
    const { data } = await supabase.from('reminders').select('*').order('created_at', { ascending: false })
    if (data) setReminders(data)
  }, [])

  // Initial load: state is set inside the promise callback, not synchronously
  // in the effect body. fetchReminders is reused to refresh after add/delete.
  useEffect(() => {
    supabase
      .from('reminders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }: { data: Reminder[] | null }) => {
        if (data) setReminders(data)
      })
  }, [])

  const addReminder = async (e: FormEvent) => {
    e.preventDefault()
    if (!newReminder.trim()) return
    const { error } = await supabase.from('reminders').insert({ text: newReminder, colour: selectedColour })
    if (error) {
      setError("couldn't save that one")
      return
    }
    setError('')
    setNewReminder('')
    fetchReminders()
  }

  const deleteReminder = async (id: number) => {
    await supabase.from('reminders').delete().eq('id', id)
    fetchReminders()
  }

  return (
    <Pane
      title="reminders.sh"
      right={<span style={{ color: TEXT_FAINT }}>{reminders.length} open</span>}
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {reminders.length === 0 && <div style={{ color: TEXT_FAINT }}>nothing queued.</div>}
        {reminders.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: r.colour }} />
              <span style={{ lineHeight: 1.5 }}>{r.text}</span>
            </div>
            <button
              type="button"
              aria-label="Delete reminder"
              onClick={() => deleteReminder(r.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                color: TEXT_FAINT,
                fontFamily: FONT_MONO,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <form
        onSubmit={addReminder}
        style={{
          marginTop: 'auto',
          borderTop: `1px solid ${BORDER_SUBTLE}`,
          paddingTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {COLOURS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label="Pick colour"
              onClick={() => setSelectedColour(c)}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: c,
                outline: selectedColour === c ? `1px solid ${TEXT_PRIMARY}` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: TEXT_FAINT }}>&gt;</span>
          <input
            type="text"
            placeholder="add reminder..."
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: TEXT_PRIMARY,
              fontFamily: FONT_MONO,
              fontSize: 12,
            }}
          />
          <button
            type="submit"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: ACCENT,
              fontFamily: FONT_MONO,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            [ + ]
          </button>
        </div>
        {error && <div style={{ color: TEXT_ERROR }}>{error}</div>}
      </form>
    </Pane>
  )
}