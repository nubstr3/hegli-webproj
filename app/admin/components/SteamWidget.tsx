'use client'

import { useState, useEffect } from 'react'
import Pane from './Pane'
import { ACCENT, TEXT_ERROR, TEXT_FAINT, TEXT_PRIMARY } from '@/app/components/theme'

type Deal = {
  name: string
  originalPrice: number
  finalPrice: number
  discountPercent: number
  url: string
}

const formatPrice = (price: number) => '$' + (price / 100).toFixed(2)

export default function SteamWidget() {
  const [deals, setDeals] = useState<Deal[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch('/api/steam')
      .then((res) => {
        if (!res.ok) throw new Error('steam request failed')
        return res.json()
      })
      .then((data: { deals?: Deal[] }) => setDeals(data.deals ?? []))
      .catch(() => setFailed(true))
  }, [])

  return (
    <Pane
      title="steam.deals"
      right={
        <a
          href="https://store.steampowered.com/specials"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: TEXT_FAINT, textDecoration: 'none' }}
        >
          view all &rarr;
        </a>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}
    >
      {failed && <div style={{ color: TEXT_ERROR }}>couldn&apos;t load deals.</div>}
      {!failed && deals === null && <div style={{ color: TEXT_FAINT }}>fetching deals...</div>}
      {deals?.map((deal, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <a
            href={deal.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: TEXT_PRIMARY, textDecoration: 'none', flex: 1, minWidth: 0 }}
          >
            {deal.name}
          </a>
          <span style={{ color: TEXT_FAINT, textDecoration: 'line-through' }}>{formatPrice(deal.originalPrice)}</span>
          <span
            style={{
              color: ACCENT,
              border: `1px solid ${ACCENT}`,
              borderRadius: 3,
              padding: '1px 6px',
              fontSize: 11,
            }}
          >
            -{deal.discountPercent}%
          </span>
        </div>
      ))}
    </Pane>
  )
}