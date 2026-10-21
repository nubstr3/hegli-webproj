'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, DragEvent } from 'react'
import { supabase } from '@/lib/supabase'
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

type FileRow = {
  id: string
  name: string
  path: string
  size: number
  mime_type: string | null
  created_at: string
  deleted_at: string | null
}

type Notice = { text: string; error: boolean } | null

const BUCKET = 'files'
const MAX_BYTES = 15 * 1024 * 1024 // keep in sync with the bucket's file_size_limit
const TRASH_DAYS = 30
const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024 // Supabase free plan: 1 GB
const DAY_MS = 24 * 60 * 60 * 1000

const GRID = 'minmax(0, 1fr) 90px 120px 190px'

// ---- helpers (module level so they stay out of the component body) ----

const formatSize = (bytes: number) => {
  if (bytes < 100 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })

const daysLeft = (deletedAt: string) =>
  Math.max(0, Math.ceil((new Date(deletedAt).getTime() + TRASH_DAYS * DAY_MS - Date.now()) / DAY_MS))

const iconFor = (row: FileRow) => {
  const mime = row.mime_type ?? ''
  const name = row.name.toLowerCase()
  if (mime.startsWith('image/')) return '▣'
  if (mime.includes('zip') || /\.(zip|tar|gz|7z|rar)$/.test(name)) return '▥'
  if (mime.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) return '▦'
  return '▤'
}

async function loadRows(): Promise<FileRow[]> {
  const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as FileRow[]
}

// Trash is emptied lazily: whenever the page loads, anything deleted more
// than TRASH_DAYS ago is removed for good (no cron job or service key needed).
async function purgeExpired(rows: FileRow[]): Promise<FileRow[]> {
  const cutoff = Date.now() - TRASH_DAYS * DAY_MS
  const expired = rows.filter((r) => r.deleted_at && new Date(r.deleted_at).getTime() < cutoff)
  if (expired.length === 0) return rows

  const { error } = await supabase.storage.from(BUCKET).remove(expired.map((r) => r.path))
  if (error) return rows
  await supabase.from('files').delete().in('id', expired.map((r) => r.id))
  return rows.filter((r) => !expired.includes(r))
}

// ---- styles ----

const actStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
}

const tabStyle = (active: boolean): CSSProperties => ({
  background: 'none',
  border: 'none',
  borderRight: `1px solid ${BORDER_SUBTLE}`,
  padding: '10px 16px',
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
  color: active ? ACCENT : TEXT_FAINT,
})

export default function FilesManager() {
  const [rows, setRows] = useState<FileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'files' | 'trash'>('files')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    loadRows()
      .then(purgeExpired)
      .then((r) => {
        if (!cancelled) setRows(r)
      })
      .catch(() => {
        if (!cancelled) setNotice({ text: "couldn't load files.", error: true })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const refresh = async () => {
    try {
      setRows(await loadRows())
    } catch {
      setNotice({ text: "couldn't refresh the list.", error: true })
    }
  }

  const live = rows.filter((r) => !r.deleted_at)
  const trashed = rows.filter((r) => r.deleted_at)
  const shown = view === 'trash' ? trashed : live
  const usedBytes = rows.reduce((sum, r) => sum + r.size, 0)
  const usedPct = Math.max(0.5, (usedBytes / STORAGE_LIMIT_BYTES) * 100)

  const switchView = (next: 'files' | 'trash') => {
    setView(next)
    setConfirmId(null)
    setConfirmAll(false)
  }

  const uploadFiles = async (list: File[]) => {
    if (list.length === 0) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setNotice({ text: 'not signed in.', error: true })
      return
    }

    setUploading(true)
    setNotice(null)
    const problems: string[] = []
    let ok = 0

    for (const file of list) {
      if (file.size > MAX_BYTES) {
        problems.push(`${file.name} is over 15 MB`)
        continue
      }
      // Storage key is just <user id>/<random id>; the real name lives in the table.
      const path = `${user.id}/${crypto.randomUUID()}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined })
      if (uploadError) {
        problems.push(`${file.name} failed to upload: ${uploadError.message}`)
        continue
      }
      const { error: insertError } = await supabase
        .from('files')
        .insert({ name: file.name, path, size: file.size, mime_type: file.type || null })
      if (insertError) {
        await supabase.storage.from(BUCKET).remove([path])
        problems.push(`${file.name} couldn't be saved: ${insertError.message}`)
        continue
      }
      ok++
    }

    setUploading(false)
    await refresh()
    setView('files')
    if (problems.length > 0) {
      setNotice({ text: problems.join(' · '), error: true })
    } else {
      setNotice({ text: `uploaded ${ok} file${ok === 1 ? '' : 's'}.`, error: false })
    }
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = '' // lets the same file be picked again
    uploadFiles(picked)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    uploadFiles(Array.from(e.dataTransfer.files))
  }

  const download = async (row: FileRow) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(row.path, 60, { download: row.name })
    if (error || !data) {
      setNotice({ text: `couldn't download ${row.name}.`, error: true })
      return
    }
    window.location.assign(data.signedUrl)
  }

  const moveToTrash = async (row: FileRow) => {
    const { error } = await supabase.from('files').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (error) setNotice({ text: `couldn't trash ${row.name}.`, error: true })
    else setNotice({ text: `${row.name} moved to trash.`, error: false })
    refresh()
  }

  const restore = async (row: FileRow) => {
    const { error } = await supabase.from('files').update({ deleted_at: null }).eq('id', row.id)
    if (error) setNotice({ text: `couldn't restore ${row.name}.`, error: true })
    else setNotice({ text: `${row.name} restored.`, error: false })
    refresh()
  }

  const deleteForever = async (targets: FileRow[]) => {
    setConfirmId(null)
    setConfirmAll(false)
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(targets.map((t) => t.path))
    if (storageError) {
      setNotice({ text: "couldn't delete from storage.", error: true })
      return
    }
    await supabase.from('files').delete().in('id', targets.map((t) => t.id))
    setNotice({ text: `deleted ${targets.length} file${targets.length === 1 ? '' : 's'} permanently.`, error: false })
    refresh()
  }

  return (
    <div style={{ fontFamily: FONT_MONO }}>
      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>
        <span style={{ color: ACCENT }}>henry@hegli.dev</span>
        <span style={{ color: TEXT_FAINT }}>:~/admin/{view}$</span> ls -lh
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>
        <div
          style={{
            flex: '1 1 320px',
            minWidth: 0,
            background: BG_PANEL,
            border: `1px solid ${BORDER_SUBTLE}`,
            borderRadius: 6,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 10 }}>
            <span style={{ color: TEXT_MUTED }}>storage</span>
            <span style={{ color: TEXT_FAINT }}>{formatSize(usedBytes)} of 1 GB</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${usedPct}%`, background: ACCENT }} />
          </div>
          <div style={{ color: TEXT_FAINT, fontSize: 11, marginTop: 10 }}>
            private bucket &middot; only you can see these &middot; trash counts toward storage
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{
            flex: '2 1 400px',
            minWidth: 0,
            border: `1px dashed ${dragOver ? ACCENT : 'rgba(255,255,255,0.18)'}`,
            borderRadius: 6,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            <div style={{ color: TEXT_PRIMARY }}>
              {uploading ? 'uploading...' : 'drop files here, or pick from your computer'}
            </div>
            <div style={{ color: TEXT_FAINT }}>max 15 MB per file</div>
          </div>
          <input ref={inputRef} type="file" multiple onChange={onPick} style={{ display: 'none' }} />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            style={{
              background: 'transparent',
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              fontFamily: FONT_MONO,
              fontSize: 13,
              padding: '9px 18px',
              borderRadius: 4,
              cursor: uploading ? 'default' : 'pointer',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            [ upload ]
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ fontSize: 12, marginBottom: 14, color: notice.error ? TEXT_ERROR : ACCENT }}>{notice.text}</div>
      )}

      <div
        style={{
          background: BG_PANEL,
          border: `1px solid ${BORDER_SUBTLE}`,
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            borderBottom: `1px solid ${BORDER_SUBTLE}`,
            background: 'rgba(255,255,255,0.015)',
          }}
        >
          <div style={{ display: 'flex' }}>
            <button type="button" style={tabStyle(view === 'files')} onClick={() => switchView('files')}>
              files/ <span style={{ color: TEXT_FAINT }}>{live.length}</span>
            </button>
            <button type="button" style={tabStyle(view === 'trash')} onClick={() => switchView('trash')}>
              trash/ <span style={{ color: TEXT_FAINT }}>{trashed.length}</span>
            </button>
          </div>

          {view === 'trash' && trashed.length > 0 && (
            <div style={{ padding: '0 14px', fontSize: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              {confirmAll ? (
                <>
                  <span style={{ color: TEXT_ERROR }}>delete all {trashed.length} forever?</span>
                  <button type="button" className="hegli-act-yes" style={actStyle} onClick={() => deleteForever(trashed)}>
                    [y]
                  </button>
                  <button type="button" className="hegli-act" style={actStyle} onClick={() => setConfirmAll(false)}>
                    [n]
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="hegli-act hegli-act-danger"
                  style={actStyle}
                  onClick={() => {
                    setConfirmAll(true)
                    setConfirmId(null)
                  }}
                >
                  empty trash
                </button>
              )}
            </div>
          )}
        </div>

        {view === 'trash' && (
          <div style={{ color: TEXT_FAINT, padding: '10px 14px', fontSize: 11, borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
            deleted files stay here for {TRASH_DAYS} days, then are removed permanently.
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 600 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: GRID,
                gap: 12,
                padding: '10px 14px',
                fontSize: 11,
                color: TEXT_FAINT,
                borderBottom: `1px solid ${BORDER_SUBTLE}`,
              }}
            >
              <span>name</span>
              <span>size</span>
              <span>{view === 'trash' ? 'deleted' : 'added'}</span>
              <span style={{ textAlign: 'right' }}>actions</span>
            </div>

            {shown.length === 0 && (
              <div style={{ color: TEXT_FAINT, padding: '18px 14px', fontSize: 12 }}>
                {loading ? 'loading...' : view === 'trash' ? 'trash is empty.' : 'no files yet.'}
              </div>
            )}

            {shown.map((row) => (
              <div
                key={row.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  gap: 12,
                  alignItems: 'center',
                  padding: '11px 14px',
                  fontSize: 12,
                  color: TEXT_PRIMARY,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: ACCENT }}>{iconFor(row)}</span> {row.name}
                </span>
                <span style={{ color: TEXT_FAINT }}>{formatSize(row.size)}</span>
                <span style={{ color: TEXT_FAINT }}>
                  {view === 'trash' && row.deleted_at ? `purges in ${daysLeft(row.deleted_at)}d` : formatDate(row.created_at)}
                </span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
                  {view === 'files' ? (
                    <>
                      <button type="button" className="hegli-act" style={actStyle} onClick={() => download(row)}>
                        download
                      </button>
                      <button type="button" className="hegli-act hegli-act-danger" style={actStyle} onClick={() => moveToTrash(row)}>
                        trash
                      </button>
                    </>
                  ) : confirmId === row.id ? (
                    <>
                      <span style={{ color: TEXT_ERROR }}>forever?</span>
                      <button type="button" className="hegli-act-yes" style={actStyle} onClick={() => deleteForever([row])}>
                        [y]
                      </button>
                      <button type="button" className="hegli-act" style={actStyle} onClick={() => setConfirmId(null)}>
                        [n]
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="hegli-act" style={actStyle} onClick={() => restore(row)}>
                        restore
                      </button>
                      <button
                        type="button"
                        className="hegli-act hegli-act-danger"
                        style={actStyle}
                        onClick={() => {
                          setConfirmId(row.id)
                          setConfirmAll(false)
                        }}
                      >
                        delete forever
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ color: TEXT_DIM, fontSize: 11, marginTop: 14 }}>
        downloads use a link that expires after 60 seconds.
      </div>
    </div>
  )
}