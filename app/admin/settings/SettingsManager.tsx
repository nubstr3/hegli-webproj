'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Pane from '../components/Pane'
import { replayBoot } from '@/app/components/bootStorage'
import {
  ACCENT_OPTIONS,
  BOOT_MODES,
  setAccent,
  setBootMode,
  useAccent,
  useBootMode,
} from '@/app/components/sitePrefs'
import {
  ACCENT,
  FONT_MONO,
  TEXT_DIM,
  TEXT_ERROR,
  TEXT_FAINT,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from '@/app/components/theme'

const RULE = '1px solid rgba(255,255,255,0.06)'

const labelStyle = { color: TEXT_MUTED } as const
const hintStyle = { color: TEXT_DIM, lineHeight: 1.6 } as const

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  hint?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: TEXT_DIM }}>{label}</span>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 8,
        }}
      >
        <span style={{ color: TEXT_DIM }}>&gt;</span>
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder="••••••••"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: TEXT_PRIMARY,
            fontFamily: FONT_MONO,
            fontSize: 13,
            width: '100%',
            caretColor: ACCENT,
          }}
        />
      </div>
      {hint && <span style={{ color: TEXT_DIM, fontSize: 11 }}>{hint}</span>}
    </label>
  )
}

// Decorative preview only: shows how the accent looks on code.
type Seg = [string, 'k' | 's' | 'd' | '']
const PREVIEW: Seg[][] = [
  [['// hegli.dev', 'd']],
  [['const', 'k'], [' dev = {', '']],
  [['  name: ', ''], ['"henry"', 's'], [',', '']],
  [['  status: ', ''], ['"building"', 's'], [',', '']],
  [['  stack: [', ''], ['"next"', 's'], [', ', ''], ['"supabase"', 's'], ['],', '']],
  [['};', '']],
  [],
  [['function', 'k'], [' ', ''], ['ship', 'k'], ['(project) {', '']],
  [['  ', ''], ['return', 'k'], [' project.tested ? ', ''], ['"deploy"', 's'], [' : ', ''], ['"keep going"', 's'], [';', '']],
  [['}', '']],
  [['henry@hegli.dev', 'k'], [':~$ ', 'd'], ['█', 'k']],
]

function segColor(kind: Seg[1]) {
  if (kind === 'k') return ACCENT
  if (kind === 's') return '#C9C9CF'
  if (kind === 'd') return TEXT_DIM
  return TEXT_PRIMARY
}

function CodePreview() {
  return (
    <div
      style={{
        marginTop: 10,
        background: '#0F0F12',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '6px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          color: TEXT_DIM,
          fontSize: 11,
        }}
      >
        preview.ts
      </div>
      <div style={{ padding: '10px 12px 12px', fontSize: 12, lineHeight: 1.75, whiteSpace: 'pre', overflowX: 'auto' }}>
        {PREVIEW.map((line, i) => (
          <div key={i}>
            <span style={{ color: TEXT_FAINT }}>{String(i + 1).padEnd(3, ' ')}</span>
            {line.map(([text, kind], j) => (
              <span key={j} style={{ color: segColor(kind) }}>
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SettingsManager() {
  const router = useRouter()
  const accent = useAccent()
  const bootMode = useBootMode()

  const [email, setEmail] = useState<string | null>(null)
  const [pw0, setPw0] = useState('')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [confirmSignOut, setConfirmSignOut] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)

    if (!email) return setMsg({ text: "couldn't read your account email. reload and try again.", error: true })
    if (!pw0) return setMsg({ text: 'enter your current password.', error: true })
    if (pw1.length < 8) return setMsg({ text: 'use at least 8 characters.', error: true })
    if (pw1 !== pw2) return setMsg({ text: "passwords don't match.", error: true })
    if (pw1 === pw0) return setMsg({ text: 'new password must be different from the current one.', error: true })

    setBusy(true)
    // Re-authenticate with the current password first, so a stolen/open session alone can't change it.
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password: pw0 })
    if (authError) {
      setBusy(false)
      return setMsg({ text: 'current password is incorrect.', error: true })
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: pw1 })
    setBusy(false)
    if (updateError) return setMsg({ text: `couldn't update password: ${updateError.message}`, error: true })

    setPw0('')
    setPw1('')
    setPw2('')
    setMsg({ text: '✓ password updated.', error: false })
  }

  const signOutEverywhere = async () => {
    await supabase.auth.signOut({ scope: 'global' })
    router.push('/login')
  }

  const replay = () => {
    replayBoot()
    window.location.href = '/'
  }

  return (
    <div style={{ fontFamily: FONT_MONO }}>
      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 24 }}>
        <span style={{ color: ACCENT }}>henry@hegli.dev</span>
        <span style={{ color: TEXT_DIM }}>:~/admin/settings$</span> cat settings.conf
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        {/* account */}
        <Pane
          title="account.conf"
          right={<span style={{ color: TEXT_DIM }}>signed in</span>}
          style={{ flex: '1 1 360px' }}
          bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '18px 16px 20px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: TEXT_DIM }}>email</span>
            <span style={{ fontSize: 13 }}>{email ?? '…'}</span>
          </div>

          <form
            onSubmit={changePassword}
            style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: RULE, paddingTop: 16 }}
          >
            <span style={labelStyle}>change password</span>
            <PasswordField label="new password:" value={pw1} onChange={setPw1} autoComplete="new-password" />
            <PasswordField label="confirm:" value={pw2} onChange={setPw2} autoComplete="new-password" />
            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: 14 }}>
              <PasswordField
                label="current password:"
                value={pw0}
                onChange={setPw0}
                autoComplete="current-password"
                hint="required to confirm it's you."
              />
            </div>
            {msg && <div style={{ color: msg.error ? TEXT_ERROR : ACCENT }}>{msg.text}</div>}
            <button
              type="submit"
              disabled={busy}
              style={{
                alignSelf: 'flex-start',
                background: 'transparent',
                border: `1px solid ${ACCENT}`,
                color: ACCENT,
                fontFamily: FONT_MONO,
                fontSize: 12,
                padding: '7px 14px',
                borderRadius: 4,
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? '[ updating… ]' : '[ update password ]'}
            </button>
          </form>

          <div style={{ borderTop: RULE, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={labelStyle}>sessions</span>
            <span style={hintStyle}>signs you out on every device, including this one.</span>
            {confirmSignOut ? (
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: TEXT_MUTED }}>sure?</span>
                <button type="button" className="hegli-act hegli-act-yes" style={actReset} onClick={signOutEverywhere}>
                  [y]
                </button>
                <button type="button" className="hegli-act" style={actReset} onClick={() => setConfirmSignOut(false)}>
                  [n]
                </button>
              </span>
            ) : (
              <button
                type="button"
                className="hegli-act hegli-act-danger"
                style={actReset}
                onClick={() => setConfirmSignOut(true)}
              >
                sign out everywhere
              </button>
            )}
          </div>
        </Pane>

        {/* site */}
        <Pane
          title="site.conf"
          right={<span style={{ color: TEXT_DIM }}>this browser only</span>}
          style={{ flex: '1 1 360px' }}
          bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '18px 16px 20px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>boot sequence</span>
            <span style={hintStyle}>the intro on the public homepage.</span>
            <div style={{ display: 'flex', marginTop: 4, flexWrap: 'wrap' }}>
              {BOOT_MODES.map((m, i) => {
                const on = bootMode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setBootMode(m.id)}
                    style={{
                      background: 'transparent',
                      border: `1px solid ${on ? ACCENT : 'rgba(255,255,255,0.12)'}`,
                      color: on ? ACCENT : TEXT_MUTED,
                      fontFamily: FONT_MONO,
                      fontSize: 12,
                      padding: '7px 12px',
                      cursor: 'pointer',
                      borderRadius: i === 0 ? '4px 0 0 4px' : i === BOOT_MODES.length - 1 ? '0 4px 4px 0' : 0,
                    }}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ borderTop: RULE, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>accent colour</span>
            <span style={hintStyle}>used for the prompt, links and highlights across the site.</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {ACCENT_OPTIONS.map((o) => {
                const on = o.hex === accent
                return (
                  <button
                    key={o.hex}
                    type="button"
                    onClick={() => setAccent(o.hex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontFamily: FONT_MONO,
                      fontSize: 12,
                      border: `1px solid ${on ? o.hex : 'rgba(255,255,255,0.12)'}`,
                      background: on ? `${o.hex}1A` : 'transparent',
                      color: on ? o.hex : TEXT_MUTED,
                    }}
                  >
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: o.hex }} />
                    {o.name}
                  </button>
                )
              })}
            </div>
            <CodePreview />
          </div>

          <button type="button" className="hegli-act" style={actReset} onClick={replay}>
            &#8635; replay boot sequence now
          </button>
        </Pane>
      </div>
    </div>
  )
}

const actReset = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
  alignSelf: 'flex-start',
} as const