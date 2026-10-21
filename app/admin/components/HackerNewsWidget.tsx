'use client'

import { useEffect, useState } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, TEXT_ERROR, TEXT_FAINT, TEXT_PRIMARY } from '@/app/components/theme'
import { linkBtn } from './widgetUi'

type Hit = { objectID: string; title: string; url: string | null; points: number; num_comments: number }

const domainOf = (url: string | null) => {
  if (!url) return 'news.ycombinator.com'
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export default function HackerNewsWidget(_props: WidgetProps) {
  void _props
  const [hits, setHits] = useState<Hit[]>([])
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 10 * 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=8')
      .then((r) => {
        if (!r.ok) throw new Error('hn request failed')
        return r.json()
      })
      .then((d: { hits: Hit[] }) => {
        if (cancelled) return
        setHits(d.hits)
        setFailed(false)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [tick])

  return (
    <Pane
      title="hn.top"
      right={
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: TEXT_FAINT }} onClick={() => setTick((t) => t + 1)}>
          refresh
        </button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 11 }}
    >
      {failed && !loaded && <div style={{ color: TEXT_ERROR }}>couldn&apos;t reach hacker news.</div>}
      {!loaded && !failed && <div style={{ color: TEXT_FAINT }}>loading...</div>}
      {hits.map((h, i) => (
        <div key={h.objectID} style={{ display: 'flex', gap: 10 }}>
          <span style={{ color: TEXT_FAINT, width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
          <div style={{ minWidth: 0 }}>
            <a
              href={h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: TEXT_PRIMARY, textDecoration: 'none', lineHeight: 1.5, overflowWrap: 'anywhere' }}
            >
              {h.title}
            </a>
            <div style={{ color: TEXT_FAINT, fontSize: 11, marginTop: 2 }}>
              {domainOf(h.url)} · <span style={{ color: ACCENT }}>{h.points}</span> pts ·{' '}
              <a
                href={`https://news.ycombinator.com/item?id=${h.objectID}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: TEXT_FAINT }}
              >
                {h.num_comments} comments
              </a>
            </div>
          </div>
        </div>
      ))}
    </Pane>
  )
}