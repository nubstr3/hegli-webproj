'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'

const PASSWORD = 'devereux2026'

export default function HotelPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('hotel-unlocked')
    if (saved === 'true') setUnlocked(true)
  }, [])

  const handleUnlock = () => {
    if (input === PASSWORD) {
      sessionStorage.setItem('hotel-unlocked', 'true')
      setUnlocked(true)
    } else {
      setError('Incorrect password')
    }
  }

  if (!unlocked) {
    return (
      <main style={{
        minHeight: '100vh',
        background: '#1a1a1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <p style={{ fontSize: '11px', color: '#c9a96e', margin: '0', letterSpacing: '0.2em', textTransform: 'uppercase' }}>The Devereux</p>
        <p style={{ fontSize: '20px', color: '#fff', margin: '0', fontFamily: 'Georgia, serif' }}>Private Access</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '280px', marginTop: '8px' }}>
          <input
            type="password"
            placeholder="Enter password"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              background: '#2a2a2a',
              border: '0.5px solid #333',
              borderRadius: '2px',
              color: '#fff',
              outline: 'none',
            }}
          />
          {error && <p style={{ fontSize: '12px', color: '#e57373', margin: '0' }}>{error}</p>}
          <button
            onClick={handleUnlock}
            style={{
              padding: '10px',
              fontSize: '11px',
              background: '#c9a96e',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Enter
          </button>
        </div>
      </main>
    )
  }

  return (
    <>
      <Script src="https://widget.siteminder.com/ibe.min.js" strategy="afterInteractive" />

      <main style={{ background: '#f9f6f1', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 2.5rem',
          background: '#1a1a1a',
        }}>
          <p style={{ fontSize: '13px', letterSpacing: '0.15em', color: '#c9a96e', margin: '0', textTransform: 'uppercase' }}>The Devereux</p>
          <div style={{ display: 'flex', gap: '28px' }}>
            {['Rooms', 'Dining', 'Gallery', 'Contact'].map(item => (
              <a key={item} style={{ fontSize: '11px', color: '#aaa', textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>{item}</a>
            ))}
          </div>
          
            <a href="#booking"
            style={{
              fontSize: '11px',
              background: '#c9a96e',
              color: '#1a1a1a',
              padding: '8px 20px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: '2px',
            }}
          >
            Book Now
          </a>
        </nav>

        <div style={{
          height: '70vh',
          background: '#2a2420',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '11px', color: '#c9a96e', margin: '0 0 12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Auckland, New Zealand</p>
          <p style={{ fontSize: '48px', fontWeight: '400', color: '#fff', margin: '0', letterSpacing: '0.05em' }}>The Devereux Hotel</p>
          <p style={{ fontSize: '12px', color: '#bbb', margin: '10px 0 0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Boutique Hotel</p>
        </div>

        <section id="booking" style={{ padding: '4rem 2.5rem', maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '10px', color: '#c9a96e', margin: '0 0 12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Reservations</p>
          <p style={{ fontSize: '24px', fontWeight: '400', margin: '0 0 2rem', color: '#1a1a1a' }}>Book Your Stay</p>
          <div
            className="ibe"
            data-region="apac"
            data-channelcode="thedevereuxboutiquehotel"
            data-widget="embed"
          />
        </section>

        <section style={{ padding: '4rem 2.5rem', maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '10px', color: '#c9a96e', margin: '0 0 12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Our Rooms</p>
          <p style={{ fontSize: '24px', fontWeight: '400', margin: '0 0 2rem', color: '#1a1a1a' }}>A Place to Rest & Restore</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '16px' }}>
            {[
              { title: 'Deluxe King', desc: 'City views · 32m²', price: '$320', bg: '#3a3028' },
              { title: 'Garden Suite', desc: 'Courtyard views · 48m²', price: '$480', bg: '#2a3028' },
              { title: 'Penthouse Suite', desc: 'Panoramic views · 80m²', price: '$780', bg: '#28202a' },
            ].map((room) => (
              <div key={room.title} style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '120px', background: room.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#888', margin: '0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{room.title}</p>
                </div>
                <div style={{ padding: '1rem' }}>
                  <p style={{ fontSize: '14px', fontWeight: '400', margin: '0 0 4px', color: '#1a1a1a' }}>{room.title}</p>
                  <p style={{ fontSize: '12px', color: '#888', margin: '0 0 10px' }}>{room.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '13px', color: '#c9a96e', margin: '0' }}>{room.price} <span style={{ fontSize: '11px', color: '#aaa' }}>/ night</span></p>
                    <button style={{
                      fontSize: '11px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      letterSpacing: '0.05em',
                    }}>Select</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ padding: '2rem 2.5rem', background: '#1a1a1a', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#666', margin: '0', letterSpacing: '0.08em' }}>© 2026 The Devereux Boutique Hotel · Auckland, New Zealand</p>
        </footer>

      </main>
    </>
  )
}