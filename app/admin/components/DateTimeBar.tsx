'use client'

import { useState, useEffect } from 'react'

export default function DateTimeBar() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' }

  const dateStr = time.toLocaleDateString('en-NZ', dateOptions)
  const timeStr = time.toLocaleTimeString('en-NZ', timeOptions)

  const hour = time.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{
      background: 'var(--background)',
      border: '0.5px solid #e5e5e5',
      borderRadius: '12px',
      padding: '1.1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '10px',
    }}>
      <div>
        <p style={{ fontSize: '22px', fontWeight: '500', margin: '0' }}>{dateStr}</p>
        <p style={{ fontSize: '13px', color: '#888', margin: '3px 0 0' }}>{greeting}, Henry · Auckland, NZ</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '22px', fontWeight: '500', margin: '0' }}>{timeStr}</p>
        <p style={{ fontSize: '13px', color: '#888', margin: '3px 0 0' }}>NZST</p>
      </div>
    </div>
  )
}