'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { formatDate } from '@/app/admin/files/fileUtils'
import { ACCENT_OPTIONS, setAccent, useAccent } from '@/app/components/sitePrefs'
import BottomSheet from '@/app/m/components/BottomSheet'
import ConfirmSheet from '@/app/m/components/ConfirmSheet'
import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_DIM, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'

type Code = {
  id: string
  label: string
  scopes: string[]
  expires_at: string | null
  revoked_at: string | null
  last_used_at: string | null
  created_at: string
  rotated_at: string | null
}

type Sheet =
  | { type: 'edit'; code: Code }
  | { type: 'confirm'; kind: 'rotate' | 'revoke'; code: Code }
  | { type: 'fresh'; code: string; label: string; rotated: boolean }
  | null

const API = '/api/admin/access-codes'

const statusOf = (c: Code) => {
  if (c.revoked_at) return 'revoked'
  if (c.expires_at && new Date(c.expires_at).getTime() <= Date.now()) return 'expired'
  return 'active'
}

const ago = (iso: string | null) => {
  if (!iso) return 'never'
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`
  return formatDate(iso)
}

const dateInput = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '')

/**
 * Touch version of the admin settings. Only the two things you asked for on a phone:
 * the accent colour (saved on this device only, same as desktop) and the access codes
 * that unlock the travel page. Password and boot-sequence settings stay on desktop.
 */
export default function MobileSettings() {
  const accent = useAccent()

  const [codes, setCodes] = useState<Code[]>([])
  const [allScopes, setAllScopes] = useState<string[]>(['travel'])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  // new-code form
  const [label, setLabel] = useState('')
  const [scopes, setScopes] = useState<string[]>(['travel'])
  const [expires, setExpires] = useState('')

  // edit-sheet form
  const [editLabel, setEditLabel] = useState('')
  const [editScopes, setEditScopes] = useState<string[]>([])
  const [editExpires, setEditExpires] = useState('')

  const closeSheet = useCallback(() => setSheet(null), [])

  const load = useCallback(async () => {
    const res = await fetch(API, { cache: 'no-store' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'failed')
    return data as { codes: Code[]; scopes: string[] }
  }, [])

  useEffect(() => {
    let cancelled = false
    load()
      .then((data) => {
        if (cancelled) return
        setCodes(data.codes)
        setAllScopes(data.scopes)
      })
      .catch((e) => {
        if (!cancelled) setMsg({ text: `couldn't load codes: ${e instanceof Error ? e.message : 'failed'}`, error: true })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [load])

  const reload = async () => {
    try {
      const data = await load()
      setCodes(data.codes)
      setAllScopes(data.scopes)
    } catch (e) {
      setMsg({ text: `couldn't refresh codes: ${e instanceof Error ? e.message : 'failed'}`, error: true })
    }
  }

  const toggle = (list: string[], s: string) => (list.includes(s) ? list.filter((x) => x !== s) : [...list, s])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!label.trim()) return setMsg({ text: 'give the code a label first.', error: true })
    if (scopes.length === 0) return setMsg({ text: 'pick at least one page for it to unlock.', error: true })
    setBusy(true)
    const expiresAt = expires ? new Date(`${expires}T23:59:59`).toISOString() : null
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, scopes, expiresAt }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return setMsg({ text: data.error ?? "couldn't make the code.", error: true })
    setCopied(false)
    setSheet({ type: 'fresh', code: data.code, label: data.label, rotated: false })
    setLabel('')
    setExpires('')
    reload()
  }

  const openEdit = (c: Code) => {
    setEditLabel(c.label)
    setEditScopes(c.scopes)
    setEditExpires(dateInput(c.expires_at))
    setMsg(null)
    setSheet({ type: 'edit', code: c })
  }

  const saveEdit = async (e: FormEvent, c: Code) => {
    e.preventDefault()
    if (!editLabel.trim()) return setMsg({ text: 'the label can’t be empty.', error: true })
    if (editScopes.length === 0) return setMsg({ text: 'pick at least one page for it to unlock.', error: true })
    const payload: Record<string, unknown> = { id: c.id, label: editLabel, scopes: editScopes }
    // only send the expiry if it was changed, so an already-passed date doesn't block other edits
    if (editExpires !== dateInput(c.expires_at)) payload.expiresAt = editExpires ? new Date(`${editExpires}T23:59:59`).toISOString() : null
    setBusy(true)
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    setSheet(null)
    if (!res.ok) return setMsg({ text: data.error ?? "couldn't save the changes.", error: true })
    setMsg({ text: 'saved.', error: false })
    reload()
  }

  const rotate = async (c: Code) => {
    setSheet(null)
    setMsg(null)
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rotateId: c.id }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setMsg({ text: data.error ?? "couldn't rotate it.", error: true })
    setCopied(false)
    setSheet({ type: 'fresh', code: data.code, label: data.label, rotated: true })
    reload()
  }

  const revoke = async (c: Code) => {
    setSheet(null)
    setMsg(null)
    const res = await fetch(`${API}?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setMsg({ text: data.error ?? "couldn't revoke it.", error: true })
    setMsg({ text: 'revoked. the code is gone and anyone using it is logged out.', error: false })
    reload()
  }

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setMsg({ text: "couldn't copy automatically, press and hold the code to copy it.", error: true })
    }
  }

  const share = async (code: string, name: string) => {
    try {
      await navigator.share({ title: 'hegli.dev', text: `${name}: type this code into the terminal on hegli.dev  ${code}` })
    } catch {
      // cancelled or unsupported: nothing to do
    }
  }

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  const activeCount = codes.filter((c) => statusOf(c) === 'active').length
  const colour = (status: string) => (status === 'active' ? ACCENT : status === 'expired' ? TEXT_MUTED : TEXT_ERROR)

  const renderSheet = () => {
    if (!sheet) return null

    if (sheet.type === 'fresh') {
      return (
        <BottomSheet title={sheet.rotated ? `new code for ${sheet.label}` : `code for ${sheet.label}`} onClose={closeSheet}>
          <div style={{ padding: '14px 8px 6px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <code
              style={{
                display: 'block',
                padding: '18px 12px',
                textAlign: 'center',
                fontFamily: FONT_MONO,
                fontSize: 20,
                letterSpacing: '0.03em',
                color: ACCENT,
                background: '#0e0f11',
                border: `1px solid ${ACCENT}`,
                borderRadius: 6,
                userSelect: 'all',
                overflowWrap: 'anywhere',
              }}
            >
              {sheet.code}
            </code>
            <div style={{ fontSize: 11, lineHeight: 1.6, color: '#8a8a93' }}>
              shown once, copy it now.{sheet.rotated ? ' the old code has stopped working.' : ''} they type it into the homepage terminal.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => copy(sheet.code)} style={{ ...bigBtn, flex: 1, color: ACCENT, border: `1px solid ${ACCENT}` }}>
                {copied ? '✓ copied' : '[ copy ]'}
              </button>
              {canShare && (
                <button type="button" onClick={() => share(sheet.code, sheet.label)} style={{ ...bigBtn, flex: 1, color: TEXT_PRIMARY, border: `1px solid ${BORDER_SUBTLE}` }}>
                  [ share ]
                </button>
              )}
              <button type="button" onClick={closeSheet} style={{ ...bigBtn, flex: 1, color: TEXT_MUTED, border: `1px solid ${BORDER_SUBTLE}` }}>
                done
              </button>
            </div>
          </div>
        </BottomSheet>
      )
    }

    if (sheet.type === 'confirm') {
      const c = sheet.code
      return sheet.kind === 'rotate' ? (
        <ConfirmSheet
          title={`rotate ${c.label}`}
          message="make a new code? the old one stops working straight away and anyone using it is logged out."
          yes="[ rotate ]"
          onYes={() => rotate(c)}
          onClose={closeSheet}
        />
      ) : (
        <ConfirmSheet
          title={`revoke ${c.label}`}
          message="remove this code for good? anyone using it is logged out. to give them access again you'll need a new code."
          yes="[ revoke ]"
          onYes={() => revoke(c)}
          onClose={closeSheet}
        />
      )
    }

    const c = sheet.code
    const status = statusOf(c)
    return (
      <BottomSheet title={`edit ${c.label}`} onClose={closeSheet}>
        <form onSubmit={(e) => saveEdit(e, c)} style={{ padding: '8px 8px 4px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={fieldLabel}>
            <span style={labelText}>label:</span>
            <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} maxLength={60} autoComplete="off" style={input} />
          </label>
          <ScopeChips all={allScopes} on={editScopes} toggle={(s) => setEditScopes((cur) => toggle(cur, s))} />
          <label style={fieldLabel}>
            <span style={labelText}>expires (optional):</span>
            <input type="date" value={editExpires} onChange={(e) => setEditExpires(e.target.value)} style={{ ...input, colorScheme: 'dark' }} />
          </label>
          <div style={{ fontSize: 11, lineHeight: 1.7, color: '#8a8a93' }}>
            <span style={{ color: colour(status) }}>{status}</span> · rotated {c.rotated_at ? ago(c.rotated_at) : 'never'} · last used {ago(c.last_used_at)}
          </div>
          <button type="submit" disabled={busy} style={{ ...bigBtn, color: ACCENT, border: `1px solid ${ACCENT}`, opacity: busy ? 0.6 : 1 }}>
            {busy ? '[ saving… ]' : '[ save changes ]'}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            {status !== 'revoked' && (
              <button type="button" onClick={() => setSheet({ type: 'confirm', kind: 'rotate', code: c })} style={{ ...bigBtn, flex: 1, color: TEXT_PRIMARY, border: `1px solid ${BORDER_SUBTLE}` }}>
                rotate
              </button>
            )}
            <button type="button" onClick={() => setSheet({ type: 'confirm', kind: 'revoke', code: c })} style={{ ...bigBtn, flex: 1, color: TEXT_ERROR, border: `1px solid ${BORDER_SUBTLE}` }}>
              {status === 'revoked' ? 'remove' : 'revoke'}
            </button>
          </div>
        </form>
      </BottomSheet>
    )
  }

  return (
    <div style={{ fontFamily: FONT_MONO, paddingTop: 22, paddingBottom: 24 }}>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: TEXT_MUTED }}>
        <span style={{ color: ACCENT, fontWeight: 700 }}>henry@hegli.dev</span>
        <span style={{ color: TEXT_FAINT }}>:~/admin/settings$</span> <span style={{ color: '#f2f2f4' }}>cat settings.conf</span>
      </div>

      {/* site.conf */}
      <section style={panel}>
        <div style={titleBar}>
          <span>site.conf</span>
          <span style={{ color: '#8a8a93' }}>this device only</span>
        </div>
        <div style={{ padding: '16px 16px 18px' }}>
          <div style={{ fontSize: 12, color: TEXT_PRIMARY }}>accent colour</div>
          <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.6, color: '#8a8a93' }}>
            used for the prompt, links and highlights on this device. visitors always see teal.
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ACCENT_OPTIONS.map((o) => {
              const on = o.hex === accent
              return (
                <button
                  key={o.hex}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setAccent(o.hex)}
                  style={{
                    height: 44,
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 6,
                    fontFamily: FONT_MONO,
                    fontSize: 12,
                    border: `1px solid ${on ? o.hex : BORDER_SUBTLE}`,
                    background: on ? `${o.hex}1A` : 'transparent',
                    color: on ? o.hex : TEXT_MUTED,
                  }}
                >
                  <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: o.hex }} />
                  {o.name}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* access.conf */}
      <section style={panel}>
        <div style={titleBar}>
          <span>access.conf</span>
          <span style={{ color: '#8a8a93' }}>{activeCount} active</span>
        </div>

        {msg && (
          <div role="status" style={{ padding: '12px 16px 0', fontSize: 12, lineHeight: 1.6, color: msg.error ? TEXT_ERROR : ACCENT, overflowWrap: 'anywhere' }}>
            {msg.text}
          </div>
        )}

        <div style={{ paddingTop: 6 }}>
          {codes.length === 0 && <div style={{ padding: '14px 16px', fontSize: 12, color: '#8a8a93' }}>{loading ? 'loading...' : 'no codes yet.'}</div>}
          {codes.map((c) => {
            const status = statusOf(c)
            return (
              <button key={c.id} type="button" onClick={() => openEdit(c)} style={codeRow}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: TEXT_PRIMARY, overflowWrap: 'anywhere' }}>{c.label}</span>
                  <span style={{ display: 'block', marginTop: 4, fontSize: 11, lineHeight: 1.5, color: '#8a8a93' }}>
                    unlocks {c.scopes.join(', ')} · last used {ago(c.last_used_at)} · expires {c.expires_at ? formatDate(c.expires_at) : 'never'}
                  </span>
                </span>
                <span style={{ flexShrink: 0, fontSize: 10, letterSpacing: '0.06em', padding: '4px 8px', borderRadius: 3, border: `1px solid ${status === 'active' ? ACCENT : BORDER_SUBTLE}`, color: colour(status) }}>
                  {status.toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
        <div style={{ padding: '10px 16px 14px', fontSize: 11, lineHeight: 1.7, color: TEXT_DIM, borderTop: `1px solid ${BORDER_SUBTLE}` }}>
          one code per person or group · typed into the homepage terminal · tap a code to edit, rotate or revoke it
        </div>

        {/* new code */}
        <form onSubmit={create} style={{ padding: '16px 16px 18px', borderTop: `1px solid ${BORDER_SUBTLE}`, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 12, color: TEXT_MUTED }}>new code</div>
          <label style={fieldLabel}>
            <span style={labelText}>label:</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Aunty and cousins" maxLength={60} autoComplete="off" style={input} />
          </label>
          <ScopeChips all={allScopes} on={scopes} toggle={(s) => setScopes((cur) => toggle(cur, s))} />
          <label style={fieldLabel}>
            <span style={labelText}>expires (optional):</span>
            <input type="date" value={expires} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setExpires(e.target.value)} style={{ ...input, colorScheme: 'dark' }} />
          </label>
          <button type="submit" disabled={busy} style={{ ...bigBtn, color: ACCENT, border: `1px solid ${ACCENT}`, opacity: busy ? 0.6 : 1 }}>
            {busy ? '[ generating… ]' : '[ generate ]'}
          </button>
        </form>
      </section>

      {renderSheet()}
    </div>
  )
}

function ScopeChips({ all, on, toggle }: { all: string[]; on: string[]; toggle: (s: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={labelText}>unlocks:</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {all.map((s) => {
          const active = on.includes(s)
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(s)}
              style={{
                height: 44,
                padding: '0 18px',
                borderRadius: 6,
                fontFamily: FONT_MONO,
                fontSize: 13,
                border: `1px solid ${active ? ACCENT : BORDER_SUBTLE}`,
                background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                color: active ? ACCENT : TEXT_MUTED,
              }}
            >
              {s}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const panel: CSSProperties = { marginTop: 16, background: BG_PANEL, border: `1px solid ${BORDER_SUBTLE}`, borderRadius: 8, overflow: 'hidden' }

const titleBar: CSSProperties = {
  minHeight: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '0 16px',
  borderBottom: `1px solid ${BORDER_SUBTLE}`,
  background: 'rgba(255,255,255,0.015)',
  fontSize: 12,
  color: TEXT_MUTED,
}

const codeRow: CSSProperties = {
  width: '100%',
  minHeight: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '10px 16px',
  background: 'none',
  border: 'none',
  borderTop: `1px solid ${BORDER_SUBTLE}`,
  fontFamily: FONT_MONO,
  textAlign: 'left',
}

const fieldLabel: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 }
const labelText: CSSProperties = { fontSize: 11, color: '#8a8a93' }

const input: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 48,
  padding: 0,
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${BORDER_SUBTLE}`,
  outline: 'none',
  color: TEXT_PRIMARY,
  caretColor: ACCENT,
  fontFamily: FONT_MONO,
  fontSize: 16, // 16px+ stops iOS Safari zooming in on focus
}

const bigBtn: CSSProperties = {
  height: 52,
  background: 'transparent',
  borderRadius: 6,
  fontFamily: FONT_MONO,
  fontSize: 13,
}