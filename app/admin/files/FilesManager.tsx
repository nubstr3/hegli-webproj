'use client'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, DragEvent, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BUCKET,
  DAY_MS,
  MAX_BYTES,
  NOTES_FOLDER,
  STORAGE_LIMIT_BYTES,
  TRASH_DAYS,
  daysLeft,
  descendantIds,
  folderLabel,
  folderPathNames,
  formatDate,
  formatSize,
  iconFor,
  loadFolders,
  loadRows,
  type FileRow,
  type FolderRow,
} from './fileUtils'
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

type Notice = { text: string; error: boolean } | null
type MoveTarget = { kind: 'file' | 'folder'; id: string } | null

const GRID = 'minmax(0, 1fr) 90px 130px 270px'

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

const inlineInput: CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.25)',
  outline: 'none',
  color: TEXT_PRIMARY,
  fontFamily: FONT_MONO,
  fontSize: 12,
  padding: '2px 0',
  width: '100%',
  caretColor: ACCENT,
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

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: GRID,
  gap: 12,
  alignItems: 'center',
  padding: '11px 14px',
  fontSize: 12,
  color: TEXT_PRIMARY,
  borderBottom: '1px solid rgba(255,255,255,0.04)',
}

const nameCell: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

// The Notes page saves into this top-level folder, so it can't be renamed, moved or trashed.
const isLocked = (f: FolderRow) => f.parent_id === null && f.name === NOTES_FOLDER

const sortByName = (a: FolderRow, b: FolderRow) => a.name.localeCompare(b.name)

export default function FilesManager() {
  const [rows, setRows] = useState<FileRow[]>([])
  const [folders, setFolders] = useState<FolderRow[]>([])
  const [foldersOk, setFoldersOk] = useState(true) // false until the folders SQL has been run
  const [cwd, setCwd] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'files' | 'trash'>('files')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')
  const [moving, setMoving] = useState<MoveTarget>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      loadRows().then(purgeExpired),
      loadFolders().then(
        (f) => ({ ok: true, folders: f }),
        () => ({ ok: false, folders: [] as FolderRow[] }), // table not created yet
      ),
    ])
      .then(([r, f]) => {
        if (cancelled) return
        setRows(r)
        setFolders(f.folders)
        setFoldersOk(f.ok)
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
      const [r, f] = await Promise.all([loadRows(), foldersOk ? loadFolders() : Promise.resolve([] as FolderRow[])])
      setRows(r)
      setFolders(f)
      // if the folder we were looking at no longer exists, go back to the top
      setCwd((c) => (c && !f.some((x) => x.id === c) ? null : c))
    } catch {
      setNotice({ text: "couldn't refresh the list.", error: true })
    }
  }

  const live = rows.filter((r) => !r.deleted_at)
  const trashed = rows.filter((r) => r.deleted_at)
  const usedBytes = rows.reduce((sum, r) => sum + r.size, 0)
  const usedPct = Math.max(0.5, (usedBytes / STORAGE_LIMIT_BYTES) * 100)

  const inFolder = (folderId: string | null) => live.filter((r) => (r.folder_id ?? null) === folderId)
  const shownFiles = view === 'trash' ? trashed : inFolder(cwd)
  const shownFolders = view === 'files' && foldersOk ? folders.filter((f) => f.parent_id === cwd).sort(sortByName) : []
  const here = folderPathNames(folders, cwd)
  const cwdLabel = '~/' + folderLabel(folders, cwd)
  const parentOfCwd = cwd ? (folders.find((f) => f.id === cwd)?.parent_id ?? null) : null

  const folderStats = (id: string) => {
    const ids = descendantIds(folders, id)
    const files = live.filter((r) => r.folder_id && ids.includes(r.folder_id)).length
    return { files, subs: ids.length - 1, ids }
  }

  const switchView = (next: 'files' | 'trash') => {
    setView(next)
    setConfirmId(null)
    setConfirmAll(false)
    setCreating(false)
    setRenamingId(null)
  }

  const goTo = (id: string | null) => {
    setCwd(id)
    setConfirmId(null)
    setRenamingId(null)
    setNotice(null)
  }

  // ---------- uploads ----------

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
      // Storage key is just <user id>/<random id>; the real name and folder live in the table.
      const path = `${user.id}/${crypto.randomUUID()}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type || undefined })
      if (uploadError) {
        problems.push(`${file.name} failed to upload: ${uploadError.message}`)
        continue
      }
      const record: Record<string, unknown> = { name: file.name, path, size: file.size, mime_type: file.type || null }
      if (foldersOk) record.folder_id = cwd
      const { error: insertError } = await supabase.from('files').insert(record)
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
      setNotice({ text: `uploaded ${ok} file${ok === 1 ? '' : 's'} to ${cwdLabel}`, error: false })
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

  // ---------- folders ----------

  const cleanFolderName = (raw: string): string | null => {
    const name = raw.trim()
    if (!name) {
      setNotice({ text: 'give the folder a name first.', error: true })
      return null
    }
    if (name.includes('/')) {
      setNotice({ text: "folder names can't contain a slash.", error: true })
      return null
    }
    if (name.length > 80) {
      setNotice({ text: 'that folder name is too long (80 characters max).', error: true })
      return null
    }
    return name
  }

  const createFolder = async (e: FormEvent) => {
    e.preventDefault()
    const name = cleanFolderName(newName)
    if (!name) return
    const { error } = await supabase.from('folders').insert({ name, parent_id: cwd })
    if (error) {
      setNotice({
        text: error.code === '23505' ? `there's already a folder called ${name} here.` : `couldn't create folder: ${error.message}`,
        error: true,
      })
      return
    }
    setCreating(false)
    setNewName('')
    setNotice({ text: `created ${name}/`, error: false })
    refresh()
  }

  const saveRename = async (e: FormEvent, folder: FolderRow) => {
    e.preventDefault()
    if (isLocked(folder)) return
    const name = cleanFolderName(renameText)
    if (!name) return
    if (name !== folder.name) {
      const { error } = await supabase.from('folders').update({ name }).eq('id', folder.id)
      if (error) {
        setNotice({
          text: error.code === '23505' ? `there's already a folder called ${name} here.` : `couldn't rename: ${error.message}`,
          error: true,
        })
        return
      }
      setNotice({ text: `renamed to ${name}/`, error: false })
    }
    setRenamingId(null)
    refresh()
  }

  // Trashing a folder sends every file inside it (and in its subfolders) to the
  // trash, then removes the folders. Restored files go back to the top level.
  const trashFolder = async (folder: FolderRow) => {
    setConfirmId(null)
    if (isLocked(folder)) return
    const { ids } = folderStats(folder.id)
    const targets = live.filter((r) => r.folder_id && ids.includes(r.folder_id))
    const now = new Date().toISOString()

    for (const file of targets) {
      const from = folderLabel(folders, file.folder_id ?? null)
      const { error } = await supabase.from('files').update({ deleted_at: now, trashed_from: from }).eq('id', file.id)
      if (error) {
        setNotice({ text: `couldn't trash ${file.name}: ${error.message}`, error: true })
        refresh()
        return
      }
    }
    const { error } = await supabase.from('folders').delete().eq('id', folder.id)
    if (error) {
      setNotice({ text: `couldn't remove the folder: ${error.message}`, error: true })
    } else {
      setNotice({
        text: `${folder.name}/ removed${targets.length ? `; ${targets.length} file${targets.length === 1 ? '' : 's'} moved to trash` : ''}.`,
        error: false,
      })
    }
    refresh()
  }

  // ---------- moving ----------

  const moveTargetName = () => {
    if (!moving) return ''
    if (moving.kind === 'folder') return (folders.find((f) => f.id === moving.id)?.name ?? '') + '/'
    return rows.find((r) => r.id === moving.id)?.name ?? ''
  }

  const moveCurrentParent = (): string | null => {
    if (!moving) return null
    if (moving.kind === 'folder') return folders.find((f) => f.id === moving.id)?.parent_id ?? null
    return rows.find((r) => r.id === moving.id)?.folder_id ?? null
  }

  const moveTo = async (dest: string | null) => {
    if (!moving) return
    const target = moving
    setMoving(null)
    if (dest === moveCurrentParent()) return
    const { error } =
      target.kind === 'folder'
        ? await supabase.from('folders').update({ parent_id: dest }).eq('id', target.id)
        : await supabase.from('files').update({ folder_id: dest }).eq('id', target.id)
    if (error) {
      setNotice({
        text: error.code === '23505' ? 'a folder with that name already exists there.' : `couldn't move: ${error.message}`,
        error: true,
      })
    } else {
      setNotice({ text: `moved ${moveTargetName()} to ~/${folderLabel(folders, dest)}`, error: false })
    }
    refresh()
  }

  // destinations for the move dialog: top level, then folders as an indented tree
  const moveDestinations = () => {
    const blocked = moving?.kind === 'folder' ? descendantIds(folders, moving.id) : []
    const out: { id: string | null; label: string; depth: number }[] = [{ id: null, label: '~/ (top level)', depth: 0 }]
    const walk = (parent: string | null, depth: number) => {
      folders
        .filter((f) => f.parent_id === parent && !blocked.includes(f.id))
        .sort(sortByName)
        .forEach((f) => {
          out.push({ id: f.id, label: f.name + '/', depth })
          walk(f.id, depth + 1)
        })
    }
    walk(null, 1)
    return out
  }

  // ---------- files: trash / restore / delete ----------

  const moveToTrash = async (row: FileRow) => {
    const patch: Record<string, unknown> = { deleted_at: new Date().toISOString() }
    if (foldersOk) patch.trashed_from = folderLabel(folders, row.folder_id ?? null) || null
    const { error } = await supabase.from('files').update(patch).eq('id', row.id)
    if (error) setNotice({ text: `couldn't trash ${row.name}: ${error.message}`, error: true })
    else setNotice({ text: `${row.name} moved to trash.`, error: false })
    refresh()
  }

  const restore = async (row: FileRow) => {
    const patch: Record<string, unknown> = { deleted_at: null }
    if (foldersOk) patch.trashed_from = null
    const { error } = await supabase.from('files').update(patch).eq('id', row.id)
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

  const showEmpty = shownFiles.length === 0 && shownFolders.length === 0 && !(view === 'files' && cwd)

  return (
    <div style={{ fontFamily: FONT_MONO }}>
      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline' }}>
        <span style={{ color: ACCENT }}>henry@hegli.dev</span>
        <span style={{ color: TEXT_FAINT }}>:</span>
        {view === 'trash' ? (
          <span style={{ color: TEXT_FAINT }}>~/trash</span>
        ) : (
          <>
            <button type="button" className="hegli-act" style={{ ...actStyle, fontSize: 13, color: here.length ? TEXT_MUTED : ACCENT }} onClick={() => goTo(null)}>
              ~
            </button>
            {here.map((name, i) => {
              // walk up from cwd to find the id of the i-th crumb
              let id: string | null = cwd
              for (let up = here.length - 1; up > i; up--) id = folders.find((f) => f.id === id)?.parent_id ?? null
              const last = i === here.length - 1
              return (
                <span key={`${name}-${i}`}>
                  <span style={{ color: TEXT_FAINT }}>/</span>
                  <button
                    type="button"
                    className="hegli-act"
                    style={{ ...actStyle, fontSize: 13, color: last ? ACCENT : TEXT_MUTED }}
                    onClick={() => goTo(id)}
                  >
                    {name}
                  </button>
                </span>
              )
            })}
          </>
        )}
        <span style={{ color: TEXT_FAINT }}>&nbsp;$&nbsp;</span>
        <span>ls -lh</span>
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
            <div style={{ color: TEXT_FAINT }}>
              {foldersOk && (
                <>
                  uploads into <span style={{ color: ACCENT }}>{cwdLabel}</span> &middot;{' '}
                </>
              )}
              max 15 MB per file
            </div>
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

      {!foldersOk && !loading && (
        <div style={{ fontSize: 12, marginBottom: 14, color: TEXT_MUTED }}>
          folders aren&apos;t set up yet: run the folders SQL in Supabase to turn them on.
        </div>
      )}

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

          {view === 'files' && foldersOk && (
            <div style={{ padding: '0 14px', fontSize: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              {creating ? (
                <form onSubmit={createFolder} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: TEXT_FAINT }}>mkdir</span>
                  <input
                    autoFocus
                    type="text"
                    placeholder="folder-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ ...inlineInput, width: 160 }}
                  />
                  <button type="submit" className="hegli-act" style={{ ...actStyle, color: ACCENT }}>
                    [ create ]
                  </button>
                  <button
                    type="button"
                    className="hegli-act"
                    style={actStyle}
                    onClick={() => {
                      setCreating(false)
                      setNewName('')
                    }}
                  >
                    cancel
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  className="hegli-act"
                  style={{ ...actStyle, color: ACCENT }}
                  onClick={() => {
                    setCreating(true)
                    setNotice(null)
                  }}
                >
                  + new folder
                </button>
              )}
            </div>
          )}

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
            {foldersOk && ' restored files go back to their folder (or the top level if the folder was deleted).'}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 720 }}>
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
              <span>{view === 'trash' ? 'deleted' : 'added / contents'}</span>
              <span style={{ textAlign: 'right' }}>actions</span>
            </div>

            {/* ".." row */}
            {view === 'files' && cwd && (
              <div style={rowStyle}>
                <span style={nameCell}>
                  <button type="button" className="hegli-act" style={{ ...actStyle, color: TEXT_PRIMARY }} onClick={() => goTo(parentOfCwd)}>
                    <span style={{ color: ACCENT }}>&#9652;</span> ..
                  </button>
                </span>
                <span />
                <span />
                <span />
              </div>
            )}

            {showEmpty && (
              <div style={{ color: TEXT_FAINT, padding: '18px 14px', fontSize: 12 }}>
                {loading ? 'loading...' : view === 'trash' ? 'trash is empty.' : 'no files yet.'}
              </div>
            )}
            {view === 'files' && cwd && !loading && shownFiles.length === 0 && shownFolders.length === 0 && (
              <div style={{ color: TEXT_FAINT, padding: '18px 14px', fontSize: 12 }}>
                this folder is empty. upload something or make a folder.
              </div>
            )}

            {/* folders */}
            {shownFolders.map((folder) => {
              const stats = folderStats(folder.id)
              const summary = `${stats.files} file${stats.files === 1 ? '' : 's'}${stats.subs ? `, ${stats.subs} sub` : ''}`
              return (
                <div key={folder.id} style={rowStyle}>
                  <span style={nameCell}>
                    {renamingId === folder.id ? (
                      <form
                        onSubmit={(e) => saveRename(e, folder)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 420 }}
                      >
                        <span style={{ color: ACCENT }}>&#9656;</span>
                        <input
                          autoFocus
                          type="text"
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          style={inlineInput}
                        />
                        <button type="submit" className="hegli-act" style={{ ...actStyle, color: ACCENT }}>
                          [ save ]
                        </button>
                        <button type="button" className="hegli-act" style={actStyle} onClick={() => setRenamingId(null)}>
                          cancel
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="hegli-act"
                        style={{ ...actStyle, color: TEXT_PRIMARY }}
                        onClick={() => goTo(folder.id)}
                      >
                        <span style={{ color: ACCENT }}>&#9656;</span> {folder.name}/
                      </button>
                    )}
                  </span>
                  <span style={{ color: TEXT_FAINT }}>&mdash;</span>
                  <span style={{ color: TEXT_FAINT }}>{summary}</span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
                    {isLocked(folder) ? (
                      <>
                        <span style={{ color: TEXT_FAINT }} title="the Notes page saves here">
                          locked
                        </span>
                        <button type="button" className="hegli-act" style={actStyle} onClick={() => goTo(folder.id)}>
                          open
                        </button>
                      </>
                    ) : confirmId === folder.id ? (
                      <>
                        <span style={{ color: TEXT_ERROR }}>
                          trash folder{stats.files ? ` + ${stats.files} file${stats.files === 1 ? '' : 's'}` : ''}?
                        </span>
                        <button type="button" className="hegli-act-yes" style={actStyle} onClick={() => trashFolder(folder)}>
                          [y]
                        </button>
                        <button type="button" className="hegli-act" style={actStyle} onClick={() => setConfirmId(null)}>
                          [n]
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" className="hegli-act" style={actStyle} onClick={() => goTo(folder.id)}>
                          open
                        </button>
                        <button
                          type="button"
                          className="hegli-act"
                          style={actStyle}
                          onClick={() => {
                            setRenamingId(folder.id)
                            setRenameText(folder.name)
                            setConfirmId(null)
                          }}
                        >
                          rename
                        </button>
                        <button
                          type="button"
                          className="hegli-act"
                          style={actStyle}
                          onClick={() => setMoving({ kind: 'folder', id: folder.id })}
                        >
                          move
                        </button>
                        <button
                          type="button"
                          className="hegli-act hegli-act-danger"
                          style={actStyle}
                          onClick={() => {
                            setConfirmId(folder.id)
                            setRenamingId(null)
                          }}
                        >
                          trash
                        </button>
                      </>
                    )}
                  </span>
                </div>
              )
            })}

            {/* files */}
            {shownFiles.map((row) => (
              <div key={row.id} style={rowStyle}>
                <span style={nameCell}>
                  <span style={{ color: ACCENT }}>{iconFor(row)}</span> {row.name}
                  {view === 'trash' && row.trashed_from && (
                    <span style={{ color: TEXT_FAINT }}> &nbsp;from {row.trashed_from}</span>
                  )}
                </span>
                <span style={{ color: TEXT_FAINT }}>{formatSize(row.size)}</span>
                <span style={{ color: TEXT_FAINT }}>
                  {view === 'trash' && row.deleted_at ? `purges in ${daysLeft(row.deleted_at)}d` : formatDate(row.created_at)}
                </span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, flexWrap: 'wrap' }}>
                  {view === 'files' ? (
                    <>
                      <button type="button" className="hegli-act" style={actStyle} onClick={() => download(row)}>
                        download
                      </button>
                      {foldersOk && (
                        <button
                          type="button"
                          className="hegli-act"
                          style={actStyle}
                          onClick={() => setMoving({ kind: 'file', id: row.id })}
                        >
                          move
                        </button>
                      )}
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

      {/* move-to dialog */}
      {moving && (
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
          <div onClick={() => setMoving(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,7,0.72)' }} />
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 440,
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
              <span>mv {moveTargetName()} &rarr; ?</span>
              <button type="button" className="hegli-act" style={actStyle} onClick={() => setMoving(null)}>
                &times; close
              </button>
            </div>
            <div style={{ padding: '10px 10px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {moveDestinations().map((d) => {
                const current = d.id === moveCurrentParent()
                return (
                  <button
                    key={d.id ?? 'root'}
                    type="button"
                    className="hegli-act"
                    onClick={() => moveTo(d.id)}
                    style={{
                      ...actStyle,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      width: '100%',
                      textAlign: 'left',
                      padding: `9px 10px 9px ${10 + d.depth * 18}px`,
                      color: TEXT_PRIMARY,
                      opacity: current ? 0.45 : 1,
                    }}
                  >
                    <span>
                      <span style={{ color: ACCENT }}>&#9656;</span> {d.label}
                    </span>
                    <span style={{ color: TEXT_FAINT }}>{current ? 'current' : ''}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}