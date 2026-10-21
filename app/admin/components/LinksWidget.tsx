'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, BORDER_SUBTLE, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { bareInput, linkBtn, newId, readList } from './widgetUi'

type QuickLink = { id: string; label: string; url: string }
const isLink = (x: unknown): x is QuickLink => {
  const l = x as QuickLink
  return !!l && typeof l.id === 'string' && typeof l.label === 'string' && typeof l.url === 'string'
}

const DEFAULTS: QuickLink[] = [
  { id: 'd1', label: 'github', url: 'https://github.com' },
  { id: 'd2', label: 'vercel', url: 'https://vercel.com/dashboard' },
  { id: 'd3', label: 'supabase', url: 'https://supabase.com/dashboard' },
  { id: 'd4', label: 'hegli.dev', url: 'https://hegli.dev' },
]
const MAX_LINKS = 12

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function LinksWidget({ config, onConfigChange }: WidgetProps) {
  const links = readList(config.links, isLink) ?? DEFAULTS
  const [managing, setManaging] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const save = (next: QuickLink[]) => onConfigChange({ ...config, links: next })

  const add = (e: FormEvent) => {
    e.preventDefault()
    const raw = url.trim()
    if (!raw) return setError('paste a url')
    let parsed: URL
    try {
      parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    } catch {
      return setError("that doesn't look like a url")
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return setError('http(s) links only')
    if (links.length >= MAX_LINKS) return setError(`max ${MAX_LINKS}`)
    setError('')
    setLabel('')
    setUrl('')
    save([...links, { id: newId(), label: label.trim() || hostOf(parsed.href), url: parsed.href }])
  }

  return (
    <Pane
      title="quick.links"
      right={
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: managing ? ACCENT : TEXT_FAINT }} onClick={() => setManaging((v) => !v)}>
          {managing ? '✓ done' : 'edit'}
        </button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 9 }}
    >
      {links.length === 0 && <div style={{ color: TEXT_FAINT }}>no links yet. hit edit to add some.</div>}
      {links.map((l) => (
        <div key={l.id} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <a
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hegli-act"
            style={{ color: TEXT_PRIMARY, textDecoration: 'none', minWidth: 0, overflowWrap: 'anywhere' }}
          >
            <span style={{ color: TEXT_FAINT }}>&gt; </span>
            {l.label}
          </a>
          <span style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <span style={{ color: TEXT_FAINT, fontSize: 11 }}>{hostOf(l.url)}</span>
            {managing && (
              <button
                type="button"
                aria-label={`Remove ${l.label}`}
                className="hegli-act hegli-act-danger"
                style={{ ...linkBtn, fontSize: 14, color: TEXT_FAINT }}
                onClick={() => save(links.filter((x) => x.id !== l.id))}
              >
                &times;
              </button>
            )}
          </span>
        </div>
      ))}
      {managing && (
        <form onSubmit={add} style={{ marginTop: 'auto', borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: TEXT_FAINT }}>&gt;</span>
            <input placeholder="name (optional)" value={label} onChange={(e) => setLabel(e.target.value)} style={bareInput} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: TEXT_MUTED }}>@</span>
            <input placeholder="url" value={url} onChange={(e) => setUrl(e.target.value)} style={bareInput} />
            <button type="submit" style={{ ...linkBtn, color: ACCENT }}>
              [ + ]
            </button>
          </div>
          {error && <div style={{ color: TEXT_ERROR }}>{error}</div>}
        </form>
      )}
    </Pane>
  )
}