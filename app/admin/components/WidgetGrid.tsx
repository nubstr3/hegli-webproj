'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import GitHubWidget from './GitHubWidget'

type Reminder = {
  id: number
  text: string
  colour: string
}

export default function WidgetGrid() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [newReminder, setNewReminder] = useState('')
  const [selectedColour, setSelectedColour] = useState('#D85A30')

  const colours = ['#D85A30', '#1D9E75', '#7F77DD', '#BA7517', '#185FA5']

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    const { data } = await supabase.from('reminders').select('*').order('created_at', { ascending: false })
    if (data) setReminders(data)
  }

  const addReminder = async () => {
  if (!newReminder.trim()) return
  const { data, error } = await supabase.from('reminders').insert({ text: newReminder, colour: selectedColour })
  console.log('insert result:', data, error)
  setNewReminder('')
  fetchReminders()
}

  const deleteReminder = async (id: number) => {
    await supabase.from('reminders').delete().eq('id', id)
    fetchReminders()
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '10px',
    }}>

      <div style={{
        background: 'var(--background)',
        border: '0.5px solid #e5e5e5',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
      }}>
        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 10px' }}>Reminders</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
          {reminders.length === 0 && (
            <p style={{ fontSize: '13px', color: '#aaa', margin: '0' }}>No reminders yet</p>
          )}
          {reminders.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.colour, minWidth: '6px' }}></div>
                <p style={{ fontSize: '12px', margin: '0', color: '#333' }}>{r.text}</p>
              </div>
              <span
                onClick={() => deleteReminder(r.id)}
                style={{ fontSize: '11px', color: '#aaa', cursor: 'pointer' }}
              >✕</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '0.5px solid #e5e5e5', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {colours.map((c) => (
              <div
                key={c}
                onClick={() => setSelectedColour(c)}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: c,
                  cursor: 'pointer',
                  outline: selectedColour === c ? '2px solid #333' : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              placeholder="Add reminder..."
              value={newReminder}
              onChange={e => setNewReminder(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addReminder()}
              style={{ flex: 1, fontSize: '12px', padding: '5px 8px', borderRadius: '6px', border: '0.5px solid #e5e5e5' }}
            />
            <button
              onClick={addReminder}
              style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '6px', border: '0.5px solid #e5e5e5', cursor: 'pointer' }}
            >+</button>
          </div>
        </div>
      </div>

      <GitHubWidget />

      <div style={{
        background: 'var(--background)',
        border: '0.5px solid #e5e5e5',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
      }}>
        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 10px' }}>Stocks</p>
        <p style={{ fontSize: '13px', color: '#444', margin: '0' }}>Loading...</p>
      </div>

      <div style={{
        background: 'var(--background)',
        border: '0.5px solid #e5e5e5',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
      }}>
        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 10px' }}>Steam deals</p>
        <p style={{ fontSize: '13px', color: '#444', margin: '0' }}>Loading...</p>
      </div>

      <div style={{
        background: 'var(--background)',
        border: '0.5px solid #e5e5e5',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        gridColumn: 'span 2',
      }}>
        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 10px' }}>News & patch notes</p>
        <p style={{ fontSize: '13px', color: '#444', margin: '0' }}>Loading...</p>
      </div>

    </div>
  )
}