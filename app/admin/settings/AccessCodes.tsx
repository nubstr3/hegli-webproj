'use client'

import { useCallback, useEffect, useState } from 'react'
import Pane from '../components/Pane'
import { formatDate } from '../files/fileUtils'
import { ACCENT, FONT_MONO, TEXT_DIM, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'

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

type Fresh = { code: string; label: string }

const API = '/api/admin/access-codes'

const act = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
} as const

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

/** The access.conf panel: make, rotate and revoke the codes that unlock private areas of the site. */
export default function AccessCodes() {
  const [codes, setCodes] = useState<Code[]>([])
  const [allScopes, setAllScopes] = useState<string[]>(['travel'])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [fresh, setFresh] = useState<Fresh | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState<{ id: string; kind: 'revoke' | 'rotate' } | null>(null)

  const [label, setLabel] = useState('')
  const [expires, setExpires] = useState('')
  const [scopes, setScopes] = useState<string[]>(['travel'])
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<Code | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(API, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'failed')
      setCodes(data.codes)
      setAllScopes(data.scopes)
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'failed'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(API, { cache: 'no-store' })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'failed')
        return data as { codes: Code[]; scopes: string[] }
      })
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
  }, [])

  const reload = async () => {
    const err = await load()
    if (err) setMsg({ text: `couldn't refresh codes: ${err}`, error: true })
  }

  const showFresh = (code: string, name: string) => {
    setFresh({ code, label: name })
    setCopied(false)
  }

  const startEdit = (c: Code) => {
    setEditing(c)
    setLabel(c.label)
    setScopes(c.scopes)
    setExpires(c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-CA') : '')
    setMsg(null)
  }

  const cancelEdit = () => {
    setEditing(null)
    setLabel('')
    setExpires('')
    setScopes(['travel'])
  }

  const saveEdit = async () => {
    if (!editing) return
    setMsg(null)
    if (!label.trim()) return setMsg({ text: 'the label can’t be empty.', error: true })
    if (scopes.length === 0) return setMsg({ text: 'pick at least one page for it to unlock.', error: true })
    const originalExpiry = editing.expires_at ? new Date(editing.expires_at).toLocaleDateString('en-CA') : ''
    const payload: Record<string, unknown> = { id: editing.id, label, scopes }
    // only send the expiry if it was changed, so an already-passed date doesn't block other edits
    if (expires !== originalExpiry) payload.expiresAt = expires ? new Date(`${expires}T23:59:59`).toISOString() : null
    setBusy(true)
    const res = await fetch(API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return setMsg({ text: data.error ?? "couldn't save the changes.", error: true })
    cancelEdit()
    setMsg({ text: 'saved.', error: false })
    reload()
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) return saveEdit()
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
    showFresh(data.code, data.label)
    setLabel('')
    setExpires('')
    reload()
  }

  const rotate = async (id: string) => {
    setConfirm(null)
    setMsg(null)
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rotateId: id }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setMsg({ text: data.error ?? "couldn't rotate it.", error: true })
    showFresh(data.code, data.label)
    reload()
  }

  const revoke = async (id: string) => {
    setConfirm(null)
    setMsg(null)
    const res = await fetch(`${API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setMsg({ text: data.error ?? "couldn't revoke it.", error: true })
    if (editing?.id === id) cancelEdit()
    setMsg({ text: 'revoked. the code is gone and anyone using it is logged out.', error: false })
    reload()
  }

  const copy = async () => {
    if (!fresh) return
    try {
      await navigator.clipboard.writeText(fresh.code)
      setCopied(true)
    } catch {
      setMsg({ text: "couldn't copy automatically, select the code and copy it.", error: true })
    }
  }

  const toggleScope = (s: string) => setScopes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))

  const sure = (id: string, kind: 'revoke' | 'rotate', run: (id: string) => void, label: string, danger = false) =>
    confirm?.id === id && confirm.kind === kind ? (
      <span style={{ display: 'inline-flex', gap: 6 }}>
        <span style={{ color: TEXT_MUTED }}>sure?</span>
        <button type="button" className="hegli-act hegli-act-yes" style={act} onClick={() => run(id)}>
          [y]
        </button>
        <button type="button" className="hegli-act" style={act} onClick={() => setConfirm(null)}>
          [n]
        </button>
      </span>
    ) : (
      <button
        type="button"
        className={danger ? 'hegli-act hegli-act-danger' : 'hegli-act'}
        style={act}
        onClick={() => setConfirm({ id, kind })}
      >
        {label}
      </button>
    )

  const colour = (status: string) => (status === 'active' ? ACCENT : status === 'expired' ? TEXT_MUTED : TEXT_ERROR)

  const activeCount = codes.filter((c) => statusOf(c) === 'active').length

  const field = {
    background: 'none',
    border: 0,
    outline: 0,
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    padding: 0,
    color: TEXT_PRIMARY,
    fontFamily: FONT_MONO,
    fontSize: 13,
    caretColor: ACCENT,
  } as const
  const underline = { display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.12)' } as const

  return (
    <Pane
      title="access.conf"
      right={
        <span style={{ color: TEXT_DIM }}>
          codes for private pages · {activeCount} active
        </span>
      }
      style={{ flex: '1 1 100%', marginTop: 14 }}
      bodyStyle={{ padding: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', overflow: 'visible' }}
    >
      {/* left: the codes */}
      <div style={{ flex: '2 1 560px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 320, overflow: 'auto' }}>
          <div style={{ minWidth: 640 }}>
            <div style={{ display: 'flex', gap: 12, padding: '12px 20px 8px', color: TEXT_DIM, fontSize: 11 }}>
              <span style={{ flex: '2 1 0' }}>label</span>
              <span style={{ flex: '1 1 0' }}>unlocks</span>
              <span style={{ flex: '1 1 0' }}>status</span>
              <span style={{ flex: '1.2 1 0' }}>rotated</span>
              <span style={{ flex: '1.2 1 0' }}>last used</span>
              <span style={{ flex: '1.2 1 0' }}>expires</span>
              <span style={{ flex: '1.6 1 0', textAlign: 'right' }}>actions</span>
            </div>
            {codes.length === 0 && (
              <div style={{ color: TEXT_FAINT, padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {loading ? 'loading...' : 'no codes yet.'}
              </div>
            )}
            {codes.map((c) => {
              const status = statusOf(c)
              return (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  title="click to edit"
                  onClick={() => startEdit(c)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') startEdit(c)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    background: editing?.id === c.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                    boxShadow: editing?.id === c.id ? `inset 2px 0 0 ${ACCENT}` : 'none',
                  }}
                >
                  <span style={{ flex: '2 1 0', minWidth: 0, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                  <span style={{ flex: '1 1 0', minWidth: 0, color: TEXT_MUTED }}>{c.scopes.join(', ')}</span>
                  <span style={{ flex: '1 1 0', minWidth: 0, color: colour(status) }}>{status}</span>
                  <span style={{ flex: '1.2 1 0', minWidth: 0, color: TEXT_MUTED }}>{c.rotated_at ? ago(c.rotated_at) : 'never'}</span>
                  <span style={{ flex: '1.2 1 0', minWidth: 0, color: TEXT_MUTED }}>{ago(c.last_used_at)}</span>
                  <span style={{ flex: '1.2 1 0', minWidth: 0, color: TEXT_MUTED }}>{c.expires_at ? formatDate(c.expires_at) : 'never'}</span>
                  <span
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    style={{ flex: '1.6 1 0', minWidth: 0, display: 'flex', justifyContent: 'flex-end', gap: 14 }}
                  >
                    {status !== 'revoked' && sure(c.id, 'rotate', rotate, 'rotate')}
                    {sure(c.id, 'revoke', revoke, status === 'revoked' ? 'remove' : 'revoke', true)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ marginTop: 'auto', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', color: TEXT_DIM, fontSize: 11, lineHeight: 1.7 }}>
          one code per person or group · typed into the homepage terminal · rotate gives a new code and kills the old one · revoke removes it and logs everyone on it out
        </div>
      </div>

      {/* right: make a new code */}
      <form
        onSubmit={create}
        style={{
          flex: '1 1 320px',
          minWidth: 0,
          boxSizing: 'border-box',
          padding: 20,
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ height: 18, lineHeight: '18px', fontSize: 11, display: 'flex', justifyContent: 'space-between', color: TEXT_DIM }}>
          {editing ? (
            <>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                editing <span style={{ color: ACCENT }}>{editing.label}</span>
              </span>
              <button type="button" className="hegli-act" style={{ ...act, fontSize: 11 }} onClick={cancelEdit}>
                cancel
              </button>
            </>
          ) : (
            <span>click a code on the left to edit it</span>
          )}
        </div>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: TEXT_DIM, fontSize: 11 }}>label:</span>
          <div style={underline}>
            <span style={{ color: TEXT_DIM }}>&gt;</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Aunty and cousins" maxLength={60} autoComplete="off" style={field} />
          </div>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ color: TEXT_DIM, fontSize: 11 }}>unlocks:</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {allScopes.map((s) => {
              const on = scopes.includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleScope(s)}
                  style={{
                    ...act,
                    minHeight: 34,
                    padding: '0 16px',
                    borderRadius: 4,
                    border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.12)'}`,
                    background: on ? 'rgba(255,255,255,0.04)' : 'none',
                    color: on ? ACCENT : TEXT_MUTED,
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        <label style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: TEXT_DIM, fontSize: 11 }}>expires (optional):</span>
          <div style={underline}>
            <span style={{ color: TEXT_DIM }}>&gt;</span>
            <input
              type="date"
              value={expires}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setExpires(e.target.value)}
              style={{ ...field, colorScheme: 'dark' }}
            />
          </div>
        </label>

        <div>
          <button
            type="submit"
            disabled={busy}
            style={{ ...act, minHeight: 40, padding: '0 20px', border: `1px solid ${ACCENT}`, color: ACCENT, borderRadius: 4, fontSize: 13, opacity: busy ? 0.6 : 1 }}
          >
            {busy ? (editing ? '[ saving… ]' : '[ generating… ]') : editing ? '[ save changes ]' : '[ generate ]'}
          </button>
        </div>

        {/* fixed-size result: the new code, messages and errors all show here, so nothing around it moves */}
        <div
          style={{
            height: 72,
            boxSizing: 'border-box',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: 4,
            background: '#0e0f11',
            border: fresh ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <code
              style={{
                fontFamily: FONT_MONO,
                fontSize: 15,
                letterSpacing: '0.03em',
                color: fresh ? ACCENT : TEXT_FAINT,
                userSelect: fresh ? 'all' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {fresh ? fresh.code : 'xxxx-xxxx-0000'}
            </code>
            {fresh && (
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
                <button type="button" className="hegli-act" style={act} onClick={copy}>
                  {copied ? '✓ copied' : '→ copy'}
                </button>
                <button type="button" className="hegli-act" style={act} onClick={() => setFresh(null)}>
                  done
                </button>
              </span>
            )}
          </div>
          <div
            title={msg?.text}
            style={{
              height: 18,
              lineHeight: '18px',
              fontSize: 11,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: msg ? (msg.error ? TEXT_ERROR : ACCENT) : TEXT_DIM,
            }}
          >
            {msg
              ? msg.text
              : fresh
                ? `for ${fresh.label} · shown once, copy it now`
                : 'a new code appears here'}
          </div>
        </div>
      </form>
    </Pane>
  )
}