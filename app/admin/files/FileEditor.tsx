'use client'

import type { KeyboardEvent } from 'react'
import {
  ACCENT,
  BG_PANEL,
  BORDER_SUBTLE,
  FONT_MONO,
  TEXT_ERROR,
  TEXT_FAINT,
  TEXT_PRIMARY,
} from '@/app/components/theme'
import { formatSize } from './fileUtils'

type Props = {
  name: string
  content: string
  isNew: boolean
  dirty: boolean
  loading: boolean
  saving: boolean
  confirmDiscard: boolean
  onName: (value: string) => void
  onContent: (value: string) => void
  onSave: () => void
  onClose: () => void
  onDiscardYes: () => void
  onDiscardNo: () => void
}

const buttonBase = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
} as const

/**
 * Notepad-style text editor pane (same look as the contact page's
 * contact.txt window): a tab with the file name, the text area, and a
 * status line with the save / close controls. Ctrl/Cmd+S saves.
 */
export default function FileEditor({
  name,
  content,
  isNew,
  dirty,
  loading,
  saving,
  confirmDiscard,
  onName,
  onContent,
  onSave,
  onClose,
  onDiscardYes,
  onDiscardNo,
}: Props) {
  const lines = content.split('\n').length
  const bytes = new TextEncoder().encode(content).length

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      onSave()
    }
  }

  return (
    <div
      style={{
        background: BG_PANEL,
        border: `1px solid ${BORDER_SUBTLE}`,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 14,
        fontFamily: FONT_MONO,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderBottom: `1px solid ${BORDER_SUBTLE}`,
          background: 'rgba(255,255,255,0.015)',
        }}
      >
        <span
          style={{ width: 6, height: 6, borderRadius: '50%', background: dirty ? ACCENT : TEXT_FAINT, flexShrink: 0 }}
        />
        <input
          aria-label="file name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="untitled.txt"
          maxLength={120}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: TEXT_PRIMARY,
            fontFamily: FONT_MONO,
            fontSize: 12,
          }}
        />
        <span style={{ color: TEXT_FAINT, fontSize: 11 }}>{isNew ? 'new file' : dirty ? 'unsaved changes' : 'saved'}</span>
      </div>

      <textarea
        aria-label="file contents"
        value={loading ? 'loading...' : content}
        disabled={loading}
        onChange={(e) => onContent(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        rows={16}
        placeholder="start typing..."
        style={{
          display: 'block',
          width: '100%',
          boxSizing: 'border-box',
          padding: '16px 18px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'vertical',
          color: TEXT_PRIMARY,
          fontFamily: FONT_MONO,
          fontSize: 13,
          lineHeight: 1.7,
          caretColor: ACCENT,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '8px 16px',
          borderTop: `1px solid ${BORDER_SUBTLE}`,
          background: 'rgba(255,255,255,0.015)',
          fontSize: 11,
          color: TEXT_FAINT,
        }}
      >
        <span>
          UTF-8 &middot; {lines} {lines === 1 ? 'line' : 'lines'} &middot; {formatSize(bytes)}
        </span>

        <span style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {confirmDiscard ? (
            <>
              <span style={{ color: TEXT_ERROR }}>discard changes?</span>
              <button type="button" className="hegli-act-yes" style={buttonBase} onClick={onDiscardYes}>
                [y]
              </button>
              <button type="button" className="hegli-act" style={buttonBase} onClick={onDiscardNo}>
                [n]
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="hegli-act"
                style={buttonBase}
                onClick={onClose}
                disabled={saving}
              >
                close
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving || loading}
                style={{
                  background: 'transparent',
                  border: `1px solid ${ACCENT}`,
                  color: ACCENT,
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                  padding: '5px 12px',
                  borderRadius: 4,
                  cursor: saving || loading ? 'default' : 'pointer',
                  opacity: saving || loading ? 0.6 : 1,
                }}
              >
                {saving ? 'saving...' : '[ save ]'}
              </button>
            </>
          )}
        </span>
      </div>
    </div>
  )
}