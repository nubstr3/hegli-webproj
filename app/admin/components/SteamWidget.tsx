'use client'

import { useState, useEffect } from 'react'

type Deal = {
  name: string
  originalPrice: number
  finalPrice: number
  discountPercent: number
  url: string
}

export default function SteamWidget() {
  const [deals, setDeals] = useState<Deal[]>([])

  useEffect(() => {
    fetch('/api/steam')
      .then(res => res.json())
      .then(data => setDeals(data.deals || []))
  }, [])

  const formatPrice = (price: number) => {
    return '$' + (price / 100).toFixed(2)
  }

  const widgetStyle = {
    background: 'var(--background)',
    border: '0.5px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
  }

  const scrollStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '7px',
    maxHeight: '180px',
    overflowY: 'auto' as const,
  }

  return (
    <div style={widgetStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>Steam deals</p>
        
          <a href="https://store.steampowered.com/specials"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '11px', color: '#185FA5', textDecoration: 'none' }}
        >
          View all →
        </a>
      </div>

      <div style={scrollStyle}>
        {deals.length === 0 && (
          <p style={{ fontSize: '13px', color: '#aaa', margin: '0' }}>Loading deals...</p>
        )}
        {deals.map((deal, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
                <a href={deal.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '12px', color: '#185FA5', textDecoration: 'none', flex: 1, marginRight: '8px' }}
              >
                {deal.name}
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#aaa', textDecoration: 'line-through' }}>
                  {formatPrice(deal.originalPrice)}
                </span>
                <span style={{
                  fontSize: '11px',
                  background: '#EAF3DE',
                  color: '#27500A',
                  padding: '2px 7px',
                  borderRadius: '6px',
                }}>
                  -{deal.discountPercent}%
                </span>
              </div>
            </div>
            {i < deals.length - 1 && (
              <div style={{ height: '0.5px', background: '#e5e5e5', marginTop: '7px' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}