'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Pane from '../components/Pane'
import AboutNotepad from '@/app/about/AboutNotepad'
import {
  ABOUT_DEFAULTS,
  ABOUT_KEYS,
  rowsToAbout,
  type AboutFields,
  type UpdateEntry,
} from '@/app/about/aboutShared'
import { ACCENT, FONT_MONO, TEXT_DIM, TEXT_ERROR, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'

const RULE = '1px solid rgba(255,255,255,0.06)'
const AMBER = '#FFB454'

function todayLocal() {
  // en-CA formats as YYYY-MM-DD in the browser's own time zone
  return new Date().toLocaleDateString('en-CA')
}

/** Short name of the browser's time zone right now, e.g. "NZDT" (or "GMT+13" where there is no abbreviation). */
function zoneLabel() {
  const part = new Intl.DateTimeFormat('en-NZ', { timeZoneName: 'short' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')
  return part?.value ?? ''
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: TEXT_DIM }}>
        {label} {hint && <span style={{ color: '#45454c' }}>{hint}</span>}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 8,
        }}
      >
        <span style={{ color: TEXT_DIM }}>&gt;</span>
        {children}
      </div>
    </label>
  )
}

const inputStyle = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: TEXT_PRIMARY,
  fontFamily: FONT_MONO,
  fontSize: 13,
  width: '100%',
  caretColor: ACCENT,
  lineHeight: 1.7,
  colorScheme: 'dark',
} as const

const btnStyle = {
  background: 'transparent',
  border: `1px solid ${ACCENT}`,
  color: ACCENT,
  fontFamily: FONT_MONO,
  fontSize: 12,
  padding: '7px 14px',
  borderRadius: 4,
  cursor: 'pointer',
} as const

const actReset = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
} as const

export default function AboutManager() {
  // --- about text ---
  const [saved, setSaved] = useState<AboutFields>(ABOUT_DEFAULTS)
  const [form, setForm] = useState<AboutFields>(ABOUT_DEFAULTS)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aboutMsg, setAboutMsg] = useState<{ text: string; error: boolean } | null>(null)

  // --- updates ---
  const [updates, setUpdates] = useState<UpdateEntry[]>([])
  const [uDate, setUDate] = useState('')
  const [zone, setZone] = useState('')
  const [uTitle, setUTitle] = useState('')
  const [uBody, setUBody] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [updMsg, setUpdMsg] = useState<{ text: string; error: boolean } | null>(null)

  const loadUpdates = useCallback(async () => {
    const { data, error } = await supabase
      .from('updates')
      .select('id, posted_on, title, body')
      .order('posted_on', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      setUpdMsg({ text: `couldn't load updates: ${error.message}`, error: true })
      return
    }
    setUpdates((data ?? []) as UpdateEntry[])
  }, [])

  useEffect(() => {
    // Today's local date + zone are browser-only values, so they are filled in after mount.
Promise.resolve().then(() => {
  setUDate((d) => d || todayLocal())
  setZone(zoneLabel())
})
    supabase
      .from('site_content')
      .select('key, value')
      .in('key', Object.values(ABOUT_KEYS))
      .then(({ data, error }) => {
        if (error) {
          setAboutMsg({ text: `couldn't load about text: ${error.message}`, error: true })
        } else {
          const fields = rowsToAbout(data)
          setSaved(fields)
          setForm(fields)
        }
        setLoaded(true)
      })

    supabase
      .from('updates')
      .select('id, posted_on, title, body')
      .order('posted_on', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setUpdMsg({ text: `couldn't load updates: ${error.message}`, error: true })
        else setUpdates((data ?? []) as UpdateEntry[])
      })
  }, [])

  const dirty = form.headline !== saved.headline || form.bio !== saved.bio || form.playing !== saved.playing

  const saveAbout = async () => {
    setSaving(true)
    setAboutMsg(null)
    const now = new Date().toISOString()
    const { error } = await supabase.from('site_content').upsert([
      { key: ABOUT_KEYS.headline, value: form.headline, updated_at: now },
      { key: ABOUT_KEYS.bio, value: form.bio, updated_at: now },
      { key: ABOUT_KEYS.playing, value: form.playing, updated_at: now },
    ])
    setSaving(false)
    if (error) return setAboutMsg({ text: `couldn't save: ${error.message}`, error: true })
    setSaved(form)
    setAboutMsg({ text: '✓ saved. /about is updated.', error: false })
  }

  const resetComposer = () => {
    setUDate(todayLocal())
    setUTitle('')
    setUBody('')
    setEditingId(null)
  }

  const postUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdMsg(null)
    if (!uTitle.trim() && !uBody.trim()) return setUpdMsg({ text: 'add a title or some details first.', error: true })

    setPosting(true)
    const row = {
      posted_on: uDate || todayLocal(),
      title: uTitle.trim() || 'untitled',
      body: uBody.trim(),
    }
    const { error } = editingId
      ? await supabase.from('updates').update(row).eq('id', editingId)
      : await supabase.from('updates').insert(row)
    setPosting(false)
    if (error) return setUpdMsg({ text: `couldn't save update: ${error.message}`, error: true })

    resetComposer()
    setUpdMsg({ text: editingId ? '✓ update saved.' : '✓ update posted.', error: false })
    await loadUpdates()
  }

  const startEdit = (u: UpdateEntry) => {
    setEditingId(u.id)
    setUDate(u.posted_on)
    setUTitle(u.title)
    setUBody(u.body)
    setConfirmId(null)
    setUpdMsg(null)
  }

  const deleteUpdate = async (id: string) => {
    const { error } = await supabase.from('updates').delete().eq('id', id)
    setConfirmId(null)
    if (error) return setUpdMsg({ text: `couldn't delete: ${error.message}`, error: true })
    if (editingId === id) resetComposer()
    setUpdMsg({ text: '✓ update deleted.', error: false })
    await loadUpdates()
  }

  const status = !loaded ? 'loading…' : dirty ? '● unsaved changes' : aboutMsg && !aboutMsg.error ? '✓ saved' : 'up to date'
  const statusColor = dirty ? AMBER : aboutMsg && !aboutMsg.error ? ACCENT : TEXT_DIM

  return (
    <div style={{ fontFamily: FONT_MONO }}>
      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 24 }}>
        <span style={{ color: ACCENT }}>henry@hegli.dev</span>
        <span style={{ color: TEXT_DIM }}>:~/admin/about$</span> nano about.txt
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        {/* editor */}
        <Pane
          title="about.txt — edit"
          right={<span style={{ color: statusColor }}>{status}</span>}
          style={{ flex: '1 1 380px' }}
          bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '18px 16px 20px' }}
        >
          <Field label="headline" hint="(shown in the accent colour)">
            <input
              type="text"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              style={inputStyle}
            />
          </Field>
          <Field label="about you">
            <textarea
              rows={6}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>
          <Field label="currently playing with">
            <input
              type="text"
              value={form.playing}
              onChange={(e) => setForm({ ...form, playing: e.target.value })}
              style={inputStyle}
            />
          </Field>

          {aboutMsg && aboutMsg.error && <div style={{ color: TEXT_ERROR }}>{aboutMsg.text}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, borderTop: RULE, paddingTop: 16 }}>
            <button
              type="button"
              onClick={saveAbout}
              disabled={saving || !dirty}
              style={{ ...btnStyle, opacity: saving || !dirty ? 0.5 : 1, cursor: saving || !dirty ? 'default' : 'pointer' }}
            >
              {saving ? '[ saving… ]' : '[ save ]'}
            </button>
            <button
              type="button"
              className="hegli-act"
              style={{ ...actReset, color: '#9A9AA0' }}
              onClick={() => {
                setForm(saved)
                setAboutMsg(null)
              }}
            >
              revert changes
            </button>
          </div>
          <span style={{ color: TEXT_DIM, lineHeight: 1.6 }}>saving updates the public /about page straight away.</span>
        </Pane>

        {/* live preview */}
        <Pane
          title="preview — /about"
          right={<span style={{ color: TEXT_DIM }}>live</span>}
          style={{ flex: '1 1 420px' }}
          bodyStyle={{ padding: '24px 16px', display: 'flex', justifyContent: 'center' }}
        >
          <AboutNotepad headline={form.headline} bio={form.bio} playing={form.playing} compact />
        </Pane>
      </div>

      {/* updates */}
      <Pane
        title="updates.log — shown on /about"
        right={<span style={{ color: TEXT_DIM }}>{updates.length === 1 ? '1 entry' : `${updates.length} entries`}</span>}
        style={{ marginTop: 14, flex: 'none', width: '100%', boxSizing: 'border-box' }}
        bodyStyle={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start', padding: '18px 16px 20px' }}
      >
        <form
          onSubmit={postUpdate}
          style={{ flex: '1 1 340px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <span style={{ color: TEXT_MUTED }}>{editingId ? 'edit update' : 'new update'}</span>
          <Field label={zone ? `date (${zone})` : 'date'} hint="(defaults to today, editable)">
            <input type="date" value={uDate} onChange={(e) => setUDate(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="title">
            <input
              type="text"
              placeholder="what happened?"
              value={uTitle}
              onChange={(e) => setUTitle(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="details">
            <textarea
              rows={4}
              placeholder="a few lines on what you have been up to"
              value={uBody}
              onChange={(e) => setUBody(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>
          {updMsg && <div style={{ color: updMsg.error ? TEXT_ERROR : ACCENT }}>{updMsg.text}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <button type="submit" disabled={posting} style={{ ...btnStyle, opacity: posting ? 0.5 : 1 }}>
              {posting ? '[ saving… ]' : editingId ? '[ save changes ]' : '[ post update ]'}
            </button>
            {editingId && (
              <button
                type="button"
                className="hegli-act"
                style={{ ...actReset, color: '#9A9AA0' }}
                onClick={() => {
                  resetComposer()
                  setUpdMsg(null)
                }}
              >
                cancel
              </button>
            )}
          </div>
        </form>

        <div style={{ flex: '1.3 1 380px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {updates.length === 0 && <div style={{ color: TEXT_DIM, padding: '12px 0' }}>no updates yet.</div>}
          {updates.map((u) => (
            <div
              key={u.id}
              style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0', borderTop: RULE }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  <span style={{ color: ACCENT }}>{u.posted_on}</span>&nbsp;&nbsp;
                  <span style={{ color: TEXT_PRIMARY }}>{u.title}</span>
                </span>
                {confirmId === u.id ? (
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ color: TEXT_DIM }}>delete?</span>
                    <button
                      type="button"
                      className="hegli-act hegli-act-yes"
                      style={actReset}
                      onClick={() => deleteUpdate(u.id)}
                    >
                      [y]
                    </button>
                    <button type="button" className="hegli-act" style={actReset} onClick={() => setConfirmId(null)}>
                      [n]
                    </button>
                  </span>
                ) : (
                  <span style={{ display: 'flex', gap: 14 }}>
                    <button type="button" className="hegli-act" style={actReset} onClick={() => startEdit(u)}>
                      edit
                    </button>
                    <button
                      type="button"
                      className="hegli-act hegli-act-danger"
                      style={actReset}
                      onClick={() => setConfirmId(u.id)}
                    >
                      delete
                    </button>
                  </span>
                )}
              </div>
              {u.body && (
                <div style={{ color: '#9A9AA0', lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {u.body}
                </div>
              )}
            </div>
          ))}
        </div>
      </Pane>
    </div>
  )
}