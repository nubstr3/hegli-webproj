'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { WIDGETS, widgetByType, type WidgetHeight, type WidgetSize } from './widgetRegistry'
import type { WidgetConfig } from './widgetTypes'
import {
  ACCENT,
  BG_PANEL,
  BORDER_SUBTLE,
  FONT_MONO,
  TEXT_DIM,
  TEXT_ERROR,
  TEXT_FAINT,
  TEXT_MUTED,
  TEXT_PRIMARY,
} from '@/app/components/theme'

type WidgetRow = {
  id: string
  type: string
  size: WidgetSize
  height: WidgetHeight
  position: number
  config: WidgetConfig | null
}

type Notice = { text: string; error: boolean } | null

const AMBER = '#FFB454'
const GAP = 14

// A row is 6 units wide: normal = 2 (a third), semi = 3 (half), wide = 4, huge = 6 (all of it).
// Widgets wrap onto a new line when the next one doesn't fit, and leftover space is shared out.
const SIZES: { id: WidgetSize; units: number; label: string }[] = [
  { id: 'normal', units: 2, label: '1' },
  { id: 'semi', units: 3, label: '1.5' },
  { id: 'wide', units: 4, label: '2' },
  { id: 'huge', units: 6, label: '3' },
]
const HEIGHTS: { id: WidgetHeight; px: number | null; label: string }[] = [
  { id: 'auto', px: null, label: 'auto' },
  { id: 'short', px: 240, label: 'S' },
  { id: 'medium', px: 380, label: 'M' },
  { id: 'tall', px: 560, label: 'L' },
]

function flexFor(size: WidgetSize) {
  const units = SIZES.find((s) => s.id === size)?.units ?? 2
  const basis = `calc(${((units / 6) * 100).toFixed(4)}% + ${((units / 6) * GAP - GAP).toFixed(3)}px)`
  return `${units} 1 ${basis}`
}

const actStyle = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
} as const

/**
 * The widget dashboard: your chosen widgets in your chosen order, saved in
 * Supabase (dashboard_widgets) so it follows you across devices. Starts empty.
 */
export default function WidgetDashboard() {
  const [rows, setRows] = useState<WidgetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tableMissing, setTableMissing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const rowsRef = useRef<WidgetRow[]>([])

  const apply = useCallback((next: WidgetRow[]) => {
    rowsRef.current = next
    setRows(next)
  }, [])

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('dashboard_widgets')
      .select('id, type, size, height, position, config')
      .order('position', { ascending: true })
    if (error) {
      // 42P01 = relation does not exist (the SQL hasn't been run yet)
      if (error.code === '42P01' || /dashboard_widgets/.test(error.message)) setTableMissing(true)
      else setNotice({ text: `couldn't load widgets: ${error.message}`, error: true })
      return
    }
    apply((data ?? []) as WidgetRow[])
  }, [apply])

  useEffect(() => {
    supabase
      .from('dashboard_widgets')
      .select('id, type, size, height, position, config')
      .order('position', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          if (error.code === '42P01' || /dashboard_widgets/.test(error.message)) setTableMissing(true)
          else setNotice({ text: `couldn't load widgets: ${error.message}`, error: true })
        } else {
          apply((data ?? []) as WidgetRow[])
        }
        setLoading(false)
      })
  }, [apply])

  // ---- changes: update the screen first, then save; reload if saving fails ----

  const fail = async (what: string, message: string) => {
    setNotice({ text: `couldn't ${what}: ${message}`, error: true })
    await load()
  }

  const addWidget = async (type: string) => {
    const def = widgetByType(type)
    if (!def || rowsRef.current.some((r) => r.type === type)) return
    setPickerOpen(false)
    setNotice(null)
    const position = rowsRef.current.reduce((m, r) => Math.max(m, r.position), -1) + 1
    const { error } = await supabase.from('dashboard_widgets').insert({ type, size: def.defaultSize, height: 'auto', position })
    if (error) return fail('add that widget', error.message)
    await load()
  }

  const removeWidget = async (row: WidgetRow) => {
    apply(rowsRef.current.filter((r) => r.id !== row.id))
    const { error } = await supabase.from('dashboard_widgets').delete().eq('id', row.id)
    if (error) await fail('remove it', error.message)
    else if (rowsRef.current.length === 0) setEditing(false)
  }

  const setSize = async (row: WidgetRow, size: WidgetSize) => {
    if (row.size === size) return
    apply(rowsRef.current.map((r) => (r.id === row.id ? { ...r, size } : r)))
    const { error } = await supabase.from('dashboard_widgets').update({ size }).eq('id', row.id)
    if (error) await fail('resize it', error.message)
  }

  const setHeight = async (row: WidgetRow, height: WidgetHeight) => {
    if (row.height === height) return
    apply(rowsRef.current.map((r) => (r.id === row.id ? { ...r, height } : r)))
    const { error } = await supabase.from('dashboard_widgets').update({ height }).eq('id', row.id)
    if (error) await fail('change its height', error.message)
  }

  const saveConfig = async (id: string, config: WidgetConfig) => {
    apply(rowsRef.current.map((r) => (r.id === id ? { ...r, config } : r)))
    const { error } = await supabase.from('dashboard_widgets').update({ config }).eq('id', id)
    if (error) await fail('save widget settings', error.message)
  }

  const reorder = async (fromId: string, toId: string) => {
    if (fromId === toId) return
    const list = rowsRef.current.slice()
    const from = list.findIndex((r) => r.id === fromId)
    const to = list.findIndex((r) => r.id === toId)
    if (from < 0 || to < 0) return
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved)
    const next = list.map((r, i) => ({ ...r, position: i }))
    const changed = next.filter((r, i) => rowsRef.current[i]?.id !== r.id || rowsRef.current[i]?.position !== r.position)
    apply(next)
    const results = await Promise.all(
      changed.map((r) => supabase.from('dashboard_widgets').update({ position: r.position }).eq('id', r.id)),
    )
    const failed = results.find((r) => r.error)
    if (failed?.error) await fail('save the new order', failed.error.message)
  }

  const moveBy = (row: WidgetRow, dir: -1 | 1) => {
    const i = rowsRef.current.findIndex((r) => r.id === row.id)
    const other = rowsRef.current[i + dir]
    if (other) reorder(row.id, other.id)
  }

  const onDragEnd = () => {
    setDragId(null)
    setOverId(null)
  }

  const siblings = Object.fromEntries(rows.map((r) => [r.type, r.config ?? {}]))
  const has = (type: string) => rows.some((r) => r.type === type)
  const empty = !loading && rows.length === 0

  return (
    <div style={{ fontFamily: FONT_MONO }}>
      {/* toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 14,
          paddingTop: 14,
          borderTop: `1px solid ${BORDER_SUBTLE}`,
        }}
      >
        <div style={{ fontSize: 13, color: TEXT_MUTED }}>
          <span style={{ color: TEXT_FAINT }}>~/admin$</span> ls widgets/{' '}
          <span style={{ color: TEXT_FAINT }}>
            &nbsp;({rows.length} widget{rows.length === 1 ? '' : 's'})
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {rows.length > 0 && (
            <button
              type="button"
              className="hegli-act"
              style={{ ...actStyle, color: editing ? ACCENT : '#9A9AA0' }}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? '✓ done' : 'edit layout'}
            </button>
          )}
          <button
            type="button"
            disabled={tableMissing}
            onClick={() => setPickerOpen(true)}
            style={{
              background: 'transparent',
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              fontFamily: FONT_MONO,
              fontSize: 12,
              padding: '7px 14px',
              borderRadius: 4,
              cursor: tableMissing ? 'default' : 'pointer',
              opacity: tableMissing ? 0.5 : 1,
            }}
          >
            [ + add widget ]
          </button>
        </div>
      </div>

      {tableMissing && (
        <div style={{ fontSize: 12, marginBottom: 14, color: TEXT_MUTED }}>
          widgets aren&apos;t set up yet: run the dashboard_widgets SQL (including the width/height update) in Supabase to turn them on.
        </div>
      )}
      {notice && (
        <div style={{ fontSize: 12, marginBottom: 14, color: notice.error ? TEXT_ERROR : ACCENT }}>{notice.text}</div>
      )}

      {empty && !tableMissing && (
        <div
          style={{
            border: '1px dashed rgba(255,255,255,0.14)',
            borderRadius: 6,
            padding: '72px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            textAlign: 'center',
          }}
        >
          <div style={{ color: TEXT_DIM }}>$ ls widgets/</div>
          <div style={{ color: TEXT_MUTED, fontSize: 14 }}>total 0 &mdash; no widgets yet.</div>
          <div style={{ color: TEXT_FAINT, maxWidth: 420, lineHeight: 1.7, fontSize: 12 }}>
            pick the ones you want on your dashboard. you can reorder, resize or remove them any time.
          </div>
        </div>
      )}

      {/* widgets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'stretch' }}>
        {rows.map((row, i) => {
          const def = widgetByType(row.type)
          if (!def) return null
          const Widget = def.Component
          const isOver = editing && overId === row.id && dragId !== null && dragId !== row.id
          return (
            <div
              key={row.id}
              draggable={editing}
              onDragStart={() => setDragId(row.id)}
              onDragOver={(e) => {
                if (!editing || !dragId) return
                e.preventDefault()
                if (overId !== row.id) setOverId(row.id)
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (dragId) reorder(dragId, row.id)
                onDragEnd()
              }}
              onDragEnd={onDragEnd}
              style={{
                flex: flexFor(row.size),
                minWidth: 'min(100%, 280px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                outline: editing ? `1px dashed ${isOver ? ACCENT : 'rgba(255,255,255,0.18)'}` : 'none',
                outlineOffset: 3,
                opacity: dragId === row.id ? 0.4 : 1,
                cursor: editing ? 'grab' : 'default',
              }}
            >
              {editing && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    fontSize: 12,
                    color: TEXT_FAINT,
                  }}
                >
                  <span>⠿ drag to reorder</span>
                  <span style={{ display: 'flex', gap: 14 }}>
                    <button
                      type="button"
                      className="hegli-act"
                      style={{ ...actStyle, opacity: i === 0 ? 0.3 : 1 }}
                      disabled={i === 0}
                      title="move earlier"
                      onClick={() => moveBy(row, -1)}
                    >
                      &larr;
                    </button>
                    <button
                      type="button"
                      className="hegli-act"
                      style={{ ...actStyle, opacity: i === rows.length - 1 ? 0.3 : 1 }}
                      disabled={i === rows.length - 1}
                      title="move later"
                      onClick={() => moveBy(row, 1)}
                    >
                      &rarr;
                    </button>
                    <button
                      type="button"
                      className="hegli-act hegli-act-danger"
                      style={actStyle}
                      onClick={() => removeWidget(row)}
                    >
                      &times; remove
                    </button>
                  </span>
                </div>
              )}
              {editing && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 12, color: TEXT_FAINT }}>
                  <span style={{ display: 'flex', gap: 10 }}>
                    width
                    {SIZES.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className="hegli-act"
                        title={o.id}
                        style={{ ...actStyle, color: row.size === o.id ? ACCENT : '#9A9AA0' }}
                        onClick={() => setSize(row, o.id)}
                      >
                        {row.size === o.id ? `[${o.label}]` : o.label}
                      </button>
                    ))}
                  </span>
                  <span style={{ display: 'flex', gap: 10 }}>
                    height
                    {HEIGHTS.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className="hegli-act"
                        title={o.id}
                        style={{ ...actStyle, color: row.height === o.id ? ACCENT : '#9A9AA0' }}
                        onClick={() => setHeight(row, o.id)}
                      >
                        {row.height === o.id ? `[${o.label}]` : o.label}
                      </button>
                    ))}
                  </span>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  // a fixed height needs flex-basis auto: "flex: 1" would set the basis to 0 and ignore it
                  flex: HEIGHTS.find((h) => h.id === row.height)?.px ? '0 0 auto' : 1,
                  minWidth: 0,
                  minHeight: 0,
                  height: HEIGHTS.find((h) => h.id === row.height)?.px ?? undefined,
                  pointerEvents: editing ? 'none' : 'auto',
                }}
              >
                <Widget config={row.config ?? {}} onConfigChange={(c) => saveConfig(row.id, c)} siblings={siblings} />
              </div>
            </div>
          )
        })}
      </div>

      {/* add-widget picker */}
      {pickerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            boxSizing: 'border-box',
          }}
        >
          <div onClick={() => setPickerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,7,0.72)' }} />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 760,
              maxHeight: '100%',
              background: BG_PANEL,
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '11px 16px',
                borderBottom: `1px solid ${BORDER_SUBTLE}`,
                background: 'rgba(255,255,255,0.015)',
                fontSize: 12,
                color: TEXT_MUTED,
              }}
            >
              <span>add-widget.sh</span>
              <button type="button" className="hegli-act" style={actStyle} onClick={() => setPickerOpen(false)}>
                &times; close
              </button>
            </div>
            <div style={{ padding: '16px 16px 6px', fontSize: 12, color: TEXT_MUTED }}>
              pick a widget &mdash; it&apos;s added to the end of your dashboard.
            </div>
            <div
              style={{
                padding: '10px 16px 18px',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 12,
              }}
            >
              {WIDGETS.map((w) => {
                const added = has(w.type)
                return (
                  <div
                    key={w.type}
                    style={{
                      background: '#1B1B1F',
                      border: `1px solid ${BORDER_SUBTLE}`,
                      borderRadius: 6,
                      padding: '14px 14px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      opacity: added ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: TEXT_PRIMARY, fontSize: 13 }}>{w.title}</span>
                      <span
                        style={{
                          fontSize: 10,
                          letterSpacing: '0.04em',
                          padding: '2px 7px',
                          borderRadius: 3,
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: w.tag === 'NEEDS API KEY' || w.tag === 'NEEDS SQL' || w.tag === 'EXPERIMENTAL' ? AMBER : TEXT_MUTED,
                        }}
                      >
                        {w.tag}
                      </span>
                    </div>
                    <div style={{ color: TEXT_DIM, lineHeight: 1.6, minHeight: 38, fontSize: 12 }}>{w.description}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {added ? (
                        <span style={{ color: TEXT_DIM, fontSize: 12 }}>&#10003; on dashboard</span>
                      ) : (
                        <button
                          type="button"
                          className="hegli-act"
                          style={{ ...actStyle, color: ACCENT }}
                          onClick={() => addWidget(w.type)}
                        >
                          [ add ]
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}