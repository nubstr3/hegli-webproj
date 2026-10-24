'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BUCKET,
  DAY_MS,
  JOURNAL_FOLDER,
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
} from '@/app/admin/files/fileUtils'
import BottomSheet from '@/app/m/components/BottomSheet'
import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_DIM, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'

type Notice = { text: string; error: boolean } | null
type Target = { kind: 'file' | 'folder'; id: string }
type Sheet =
  | { type: 'menu'; target: Target }
  | { type: 'move'; target: Target }
  | { type: 'rename'; folderId: string }
  | { type: 'confirm'; what: 'folder' | 'forever' | 'empty'; id?: string }
  | null

// Trash is emptied lazily: whenever the page loads, anything deleted more than
// TRASH_DAYS ago is removed for good (same rule as the desktop files page).
async function purgeExpired(rows: FileRow[]): Promise<FileRow[]> {
  const cutoff = Date.now() - TRASH_DAYS * DAY_MS
  const expired = rows.filter((r) => r.deleted_at && new Date(r.deleted_at).getTime() < cutoff)
  if (expired.length === 0) return rows
  const { error } = await supabase.storage.from(BUCKET).remove(expired.map((r) => r.path))
  if (error) return rows
  await supabase.from('files').delete().in('id', expired.map((r) => r.id))
  return rows.filter((r) => !expired.includes(r))
}

// The Notes and Journal pages save into these top-level folders, so they can't be renamed, moved or trashed.
const isLocked = (f: FolderRow) => f.parent_id === null && (f.name === NOTES_FOLDER || f.name === JOURNAL_FOLDER)
const sortByName = (a: FolderRow, b: FolderRow) => a.name.localeCompare(b.name)

/**
 * Touch version of the admin files page: same data, same rules, but rows open an
 * action sheet instead of a row of tiny text buttons.
 */
export default function MobileFiles() {
  const [rows, setRows] = useState<FileRow[]>([])
  const [folders, setFolders] = useState<FolderRow[]>([])
  const [foldersOk, setFoldersOk] = useState(true) // false until the folders SQL has been run
  const [cwd, setCwd] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'files' | 'trash'>('files')
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [renameText, setRenameText] = useState('')
  const [sheet, setSheet] = useState<Sheet>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const closeSheet = useCallback(() => setSheet(null), [])

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
      setCwd((c) => (c && !f.some((x) => x.id === c) ? null : c)) // folder gone? back to the top
    } catch {
      setNotice({ text: "couldn't refresh the list.", error: true })
    }
  }

  const live = rows.filter((r) => !r.deleted_at)
  const trashed = rows.filter((r) => r.deleted_at)
  const usedBytes = rows.reduce((sum, r) => sum + r.size, 0)
  const usedPct = Math.max(0.5, (usedBytes / STORAGE_LIMIT_BYTES) * 100)

  const shownFiles = view === 'trash' ? trashed : live.filter((r) => (r.folder_id ?? null) === cwd)
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
    setCreating(false)
    setSheet(null)
  }

  const goTo = (id: string | null) => {
    setCwd(id)
    setSheet(null)
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
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined })
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
    if (problems.length > 0) setNotice({ text: problems.join(' · '), error: true })
    else setNotice({ text: `uploaded ${ok} file${ok === 1 ? '' : 's'} to ${cwdLabel}`, error: false })
  }

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = '' // lets the same file be picked again
    uploadFiles(picked)
  }

  const download = async (row: FileRow) => {
    setSheet(null)
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.path, 60, { download: row.name })
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
    if (!name) {
      setSheet(null)
      return
    }
    if (name !== folder.name) {
      const { error } = await supabase.from('folders').update({ name }).eq('id', folder.id)
      if (error) {
        setSheet(null)
        setNotice({
          text: error.code === '23505' ? `there's already a folder called ${name} here.` : `couldn't rename: ${error.message}`,
          error: true,
        })
        return
      }
      setNotice({ text: `renamed to ${name}/`, error: false })
    }
    setSheet(null)
    refresh()
  }

  // Trashing a folder sends every file inside it (and in its subfolders) to the
  // trash, then removes the folders. Restored files go back to the top level.
  const trashFolder = async (folder: FolderRow) => {
    setSheet(null)
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

  const targetName = (t: Target) =>
    t.kind === 'folder' ? (folders.find((f) => f.id === t.id)?.name ?? '') + '/' : (rows.find((r) => r.id === t.id)?.name ?? '')

  const currentParent = (t: Target): string | null =>
    t.kind === 'folder' ? (folders.find((f) => f.id === t.id)?.parent_id ?? null) : (rows.find((r) => r.id === t.id)?.folder_id ?? null)

  const moveTo = async (target: Target, dest: string | null) => {
    setSheet(null)
    if (dest === currentParent(target)) return
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
      setNotice({ text: `moved ${targetName(target)} to ~/${folderLabel(folders, dest)}`, error: false })
    }
    refresh()
  }

  // destinations: top level, then folders as an indented tree
  const moveDestinations = (target: Target) => {
    const blocked = target.kind === 'folder' ? descendantIds(folders, target.id) : []
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
    setSheet(null)
    const patch: Record<string, unknown> = { deleted_at: new Date().toISOString() }
    if (foldersOk) patch.trashed_from = folderLabel(folders, row.folder_id ?? null) || null
    const { error } = await supabase.from('files').update(patch).eq('id', row.id)
    if (error) setNotice({ text: `couldn't trash ${row.name}: ${error.message}`, error: true })
    else setNotice({ text: `${row.name} moved to trash.`, error: false })
    refresh()
  }

  const restore = async (row: FileRow) => {
    setSheet(null)
    const patch: Record<string, unknown> = { deleted_at: null }
    if (foldersOk) patch.trashed_from = null
    const { error } = await supabase.from('files').update(patch).eq('id', row.id)
    if (error) setNotice({ text: `couldn't restore ${row.name}.`, error: true })
    else setNotice({ text: `${row.name} restored.`, error: false })
    refresh()
  }

  const deleteForever = async (targets: FileRow[]) => {
    setSheet(null)
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(targets.map((t) => t.path))
    if (storageError) {
      setNotice({ text: "couldn't delete from storage.", error: true })
      return
    }
    await supabase.from('files').delete().in('id', targets.map((t) => t.id))
    setNotice({ text: `deleted ${targets.length} file${targets.length === 1 ? '' : 's'} permanently.`, error: false })
    refresh()
  }

  const showEmpty = shownFiles.length === 0 && shownFolders.length === 0

  // ---------- sheets ----------

  const renderSheet = () => {
    if (!sheet) return null

    if (sheet.type === 'menu') {
      const t = sheet.target
      if (t.kind === 'file') {
        const row = rows.find((r) => r.id === t.id)
        if (!row) return null
        return (
          <BottomSheet title={row.name} onClose={closeSheet}>
            {view === 'files' ? (
              <>
                <SheetAction onClick={() => download(row)}>download</SheetAction>
                {foldersOk && <SheetAction onClick={() => setSheet({ type: 'move', target: t })}>move to...</SheetAction>}
                <SheetAction danger onClick={() => moveToTrash(row)}>
                  move to trash
                </SheetAction>
              </>
            ) : (
              <>
                <SheetAction onClick={() => restore(row)}>restore</SheetAction>
                <SheetAction danger onClick={() => setSheet({ type: 'confirm', what: 'forever', id: row.id })}>
                  delete forever
                </SheetAction>
              </>
            )}
          </BottomSheet>
        )
      }
      const folder = folders.find((f) => f.id === t.id)
      if (!folder) return null
      return (
        <BottomSheet title={folder.name + '/'} onClose={closeSheet}>
          <SheetAction onClick={() => goTo(folder.id)}>open</SheetAction>
          <SheetAction
            onClick={() => {
              setRenameText(folder.name)
              setSheet({ type: 'rename', folderId: folder.id })
            }}
          >
            rename
          </SheetAction>
          <SheetAction onClick={() => setSheet({ type: 'move', target: t })}>move to...</SheetAction>
          <SheetAction danger onClick={() => setSheet({ type: 'confirm', what: 'folder', id: folder.id })}>
            move to trash
          </SheetAction>
        </BottomSheet>
      )
    }

    if (sheet.type === 'move') {
      const t = sheet.target
      const cur = currentParent(t)
      return (
        <BottomSheet title={`mv ${targetName(t)} → ?`} onClose={closeSheet}>
          {moveDestinations(t).map((d) => (
            <button
              key={d.id ?? 'root'}
              type="button"
              onClick={() => moveTo(t, d.id)}
              style={{
                ...sheetRow,
                paddingLeft: 12 + d.depth * 18,
                color: TEXT_PRIMARY,
                opacity: d.id === cur ? 0.45 : 1,
                justifyContent: 'space-between',
              }}
            >
              <span>
                <span style={{ color: ACCENT }}>&#9656;</span> {d.label}
              </span>
              <span style={{ color: TEXT_FAINT, fontSize: 11 }}>{d.id === cur ? 'current' : ''}</span>
            </button>
          ))}
        </BottomSheet>
      )
    }

    if (sheet.type === 'rename') {
      const folder = folders.find((f) => f.id === sheet.folderId)
      if (!folder) return null
      return (
        <BottomSheet title={`rename ${folder.name}/`} onClose={closeSheet}>
          <form onSubmit={(e) => saveRename(e, folder)} style={{ padding: '8px 8px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              autoFocus
              type="text"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              aria-label="folder name"
              style={textField}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ ...bigButton, flex: 1, color: ACCENT, border: `1px solid ${ACCENT}` }}>
                [ save ]
              </button>
              <button type="button" onClick={closeSheet} style={{ ...bigButton, flex: 1, color: TEXT_MUTED, border: `1px solid ${BORDER_SUBTLE}` }}>
                cancel
              </button>
            </div>
          </form>
        </BottomSheet>
      )
    }

    // confirmations for the things that can't be undone (or are big)
    if (sheet.what === 'folder') {
      const folder = folders.find((f) => f.id === sheet.id)
      if (!folder) return null
      const n = folderStats(folder.id).files
      return (
        <ConfirmSheet
          title={`trash ${folder.name}/`}
          message={`trash folder${n ? ` + ${n} file${n === 1 ? '' : 's'}` : ''}? files go to trash for ${TRASH_DAYS} days.`}
          yes="[ trash it ]"
          onYes={() => trashFolder(folder)}
          onClose={closeSheet}
        />
      )
    }
    if (sheet.what === 'forever') {
      const row = rows.find((r) => r.id === sheet.id)
      if (!row) return null
      return (
        <ConfirmSheet
          title={row.name}
          message="delete this file forever? this can't be undone."
          yes="[ delete forever ]"
          onYes={() => deleteForever([row])}
          onClose={closeSheet}
        />
      )
    }
    return (
      <ConfirmSheet
        title="empty trash"
        message={`delete all ${trashed.length} file${trashed.length === 1 ? '' : 's'} forever? this can't be undone.`}
        yes="[ empty trash ]"
        onYes={() => deleteForever(trashed)}
        onClose={closeSheet}
      />
    )
  }

  return (
    <div style={{ fontFamily: FONT_MONO, paddingTop: 22, paddingBottom: 20 }}>
      {/* prompt / breadcrumb */}
      <div style={{ fontSize: 13, lineHeight: 1.5, color: TEXT_MUTED, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline' }}>
        <span style={{ color: ACCENT, fontWeight: 700 }}>henry@hegli.dev</span>
        <span style={{ color: TEXT_FAINT }}>:</span>
        {view === 'trash' ? (
          <span style={{ color: TEXT_FAINT }}>~/trash</span>
        ) : (
          <>
            <button type="button" onClick={() => goTo(null)} style={{ ...crumb, color: here.length ? TEXT_MUTED : ACCENT }}>
              ~
            </button>
            {here.map((name, i) => {
              let id: string | null = cwd
              for (let up = here.length - 1; up > i; up--) id = folders.find((f) => f.id === id)?.parent_id ?? null
              const last = i === here.length - 1
              return (
                <span key={`${name}-${i}`}>
                  <span style={{ color: TEXT_FAINT }}>/</span>
                  <button type="button" onClick={() => goTo(id)} style={{ ...crumb, color: last ? ACCENT : TEXT_MUTED }}>
                    {name}
                  </button>
                </span>
              )
            })}
          </>
        )}
        <span style={{ color: TEXT_FAINT }}>&nbsp;$&nbsp;</span>
        <span style={{ color: '#f2f2f4' }}>ls -lh</span>
      </div>

      {/* storage */}
      <div style={{ marginTop: 16, background: BG_PANEL, border: `1px solid ${BORDER_SUBTLE}`, borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, lineHeight: 1 }}>
          <span style={{ color: TEXT_MUTED }}>storage</span>
          <span style={{ color: '#8a8a93' }}>{formatSize(usedBytes)} of 1 GB</span>
        </div>
        <div aria-hidden="true" style={{ marginTop: 12, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${usedPct}%`, background: ACCENT }} />
        </div>
        <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.6, color: '#8a8a93' }}>
          private bucket &middot; only you can see these &middot; trash counts toward storage
        </div>
      </div>

      {/* upload */}
      <div
        style={{
          marginTop: 12,
          padding: 16,
          border: '1px dashed rgba(255,255,255,0.22)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: '#f2f2f4' }}>{uploading ? 'uploading...' : 'tap to upload from your phone'}</div>
          <div style={{ color: '#8a8a93', fontSize: 11 }}>
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
            height: 48,
            padding: '0 20px',
            background: 'transparent',
            border: `1px solid ${ACCENT}`,
            borderRadius: 6,
            color: ACCENT,
            fontFamily: FONT_MONO,
            fontSize: 13,
            opacity: uploading ? 0.6 : 1,
          }}
        >
          [ upload ]
        </button>
      </div>

      {!foldersOk && !loading && (
        <div style={{ marginTop: 14, fontSize: 12, lineHeight: 1.6, color: TEXT_MUTED }}>
          folders aren&apos;t set up yet: run the folders SQL in Supabase to turn them on.
        </div>
      )}

      {notice && (
        <div role="status" style={{ marginTop: 14, fontSize: 12, lineHeight: 1.6, color: notice.error ? TEXT_ERROR : ACCENT, overflowWrap: 'anywhere' }}>
          {notice.text}
        </div>
      )}

      {/* the list */}
      <div style={{ marginTop: 14, background: BG_PANEL, border: `1px solid ${BORDER_SUBTLE}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${BORDER_SUBTLE}`, background: 'rgba(255,255,255,0.015)' }}>
          <button type="button" onClick={() => switchView('files')} style={tab(view === 'files')}>
            files/ <span style={{ color: TEXT_FAINT }}>{live.length}</span>
          </button>
          <button type="button" onClick={() => switchView('trash')} style={tab(view === 'trash')}>
            trash/ <span style={{ color: TEXT_FAINT }}>{trashed.length}</span>
          </button>
          <span style={{ flex: 1 }} />
          {view === 'files' && foldersOk && !creating && (
            <button
              type="button"
              onClick={() => {
                setCreating(true)
                setNotice(null)
              }}
              style={{ ...tab(false), color: ACCENT, borderRight: 'none' }}
            >
              + new folder
            </button>
          )}
          {view === 'trash' && trashed.length > 0 && (
            <button
              type="button"
              onClick={() => setSheet({ type: 'confirm', what: 'empty' })}
              style={{ ...tab(false), color: TEXT_ERROR, borderRight: 'none' }}
            >
              empty trash
            </button>
          )}
        </div>

        {view === 'files' && creating && (
          <form onSubmit={createFolder} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px 4px 16px', borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
            <span style={{ fontSize: 12, color: TEXT_FAINT }}>mkdir</span>
            <input
              autoFocus
              type="text"
              placeholder="folder-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              aria-label="new folder name"
              style={{ ...textField, flex: 1, minWidth: 0, borderBottom: 'none', height: 48 }}
            />
            <button type="submit" style={{ ...miniBtn, color: ACCENT }}>
              [ create ]
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false)
                setNewName('')
              }}
              style={miniBtn}
            >
              cancel
            </button>
          </form>
        )}

        {view === 'trash' && (
          <div style={{ padding: '12px 16px', fontSize: 11, lineHeight: 1.6, color: '#8a8a93', borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
            deleted files stay here for {TRASH_DAYS} days, then are removed permanently.
            {foldersOk && ' restored files go back to their folder (or the top level if the folder was deleted).'}
          </div>
        )}

        {/* ".." row */}
        {view === 'files' && cwd && (
          <button type="button" onClick={() => goTo(parentOfCwd)} style={{ ...listRow, color: TEXT_PRIMARY }}>
            <span>
              <span style={{ color: ACCENT }}>&#9652;</span> ..
            </span>
          </button>
        )}

        {showEmpty && (
          <div style={{ padding: '18px 16px', fontSize: 12, lineHeight: 1.6, color: '#8a8a93' }}>
            {loading
              ? 'loading...'
              : view === 'trash'
                ? 'trash is empty.'
                : cwd
                  ? 'this folder is empty. upload something or make a folder.'
                  : 'no files yet.'}
          </div>
        )}

        {/* folders */}
        {shownFolders.map((folder) => {
          const stats = folderStats(folder.id)
          const summary = `${stats.files} file${stats.files === 1 ? '' : 's'}${stats.subs ? `, ${stats.subs} sub` : ''}`
          const locked = isLocked(folder)
          return (
            <div key={folder.id} style={{ display: 'flex', alignItems: 'stretch', borderTop: `1px solid ${BORDER_SUBTLE}` }}>
              <button type="button" onClick={() => goTo(folder.id)} style={{ ...rowMain, color: TEXT_PRIMARY }}>
                <span style={rowName}>
                  <span style={{ color: ACCENT }}>&#9656;</span> {folder.name}/
                </span>
                <span style={rowSub}>
                  {summary}
                  {locked && ' · locked'}
                </span>
              </button>
              {!locked && (
                <button
                  type="button"
                  aria-label={`actions for ${folder.name}`}
                  onClick={() => setSheet({ type: 'menu', target: { kind: 'folder', id: folder.id } })}
                  style={dotsBtn}
                >
                  &middot;&middot;&middot;
                </button>
              )}
            </div>
          )
        })}

        {/* files */}
        {shownFiles.map((row) => (
          <div key={row.id} style={{ display: 'flex', alignItems: 'stretch', borderTop: `1px solid ${BORDER_SUBTLE}` }}>
            <button type="button" onClick={() => setSheet({ type: 'menu', target: { kind: 'file', id: row.id } })} style={{ ...rowMain, color: TEXT_PRIMARY }}>
              <span style={rowName}>
                <span style={{ color: ACCENT }}>{iconFor(row)}</span> {row.name}
              </span>
              <span style={rowSub}>
                {formatSize(row.size)} &middot;{' '}
                {view === 'trash' && row.deleted_at ? `purges in ${daysLeft(row.deleted_at)}d` : formatDate(row.created_at)}
                {view === 'trash' && row.trashed_from ? ` · from ${row.trashed_from}` : ''}
              </span>
            </button>
            <button
              type="button"
              aria-label={`actions for ${row.name}`}
              onClick={() => setSheet({ type: 'menu', target: { kind: 'file', id: row.id } })}
              style={dotsBtn}
            >
              &middot;&middot;&middot;
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, fontSize: 11, lineHeight: 1.6, color: TEXT_DIM }}>downloads use a link that expires after 60 seconds.</div>

      {renderSheet()}
    </div>
  )
}

// ---------- small pieces ----------

function SheetAction({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} style={{ ...sheetRow, color: danger ? TEXT_ERROR : TEXT_PRIMARY }}>
      {children}
    </button>
  )
}

function ConfirmSheet({
  title,
  message,
  yes,
  onYes,
  onClose,
}: {
  title: string
  message: string
  yes: string
  onYes: () => void
  onClose: () => void
}) {
  return (
    <BottomSheet title={title} onClose={onClose}>
      <div style={{ padding: '12px 8px 4px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: TEXT_ERROR }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onYes} style={{ ...bigButton, flex: 1, color: TEXT_ERROR, border: `1px solid ${TEXT_ERROR}` }}>
            {yes}
          </button>
          <button type="button" onClick={onClose} style={{ ...bigButton, flex: 1, color: TEXT_MUTED, border: `1px solid ${BORDER_SUBTLE}` }}>
            cancel
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

const crumb: CSSProperties = {
  minHeight: 32,
  padding: 0,
  background: 'none',
  border: 'none',
  fontFamily: FONT_MONO,
  fontSize: 13,
}

const tab = (active: boolean): CSSProperties => ({
  minHeight: 48,
  padding: '0 16px',
  background: 'none',
  border: 'none',
  borderRight: `1px solid ${BORDER_SUBTLE}`,
  fontFamily: FONT_MONO,
  fontSize: 12,
  color: active ? ACCENT : '#8a8a93',
})

const miniBtn: CSSProperties = {
  minHeight: 44,
  padding: '0 6px',
  background: 'none',
  border: 'none',
  fontFamily: FONT_MONO,
  fontSize: 12,
  color: TEXT_MUTED,
}

const listRow: CSSProperties = {
  width: '100%',
  minHeight: 52,
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  background: 'none',
  border: 'none',
  borderTop: `1px solid ${BORDER_SUBTLE}`,
  fontFamily: FONT_MONO,
  fontSize: 13,
  textAlign: 'left',
}

const rowMain: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 60,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 4,
  padding: '8px 4px 8px 16px',
  background: 'none',
  border: 'none',
  fontFamily: FONT_MONO,
  textAlign: 'left',
}

const rowName: CSSProperties = { fontSize: 13, lineHeight: 1.4, overflowWrap: 'anywhere' }
const rowSub: CSSProperties = { fontSize: 11, lineHeight: 1.4, color: '#8a8a93' }

const dotsBtn: CSSProperties = {
  width: 56,
  flexShrink: 0,
  background: 'none',
  border: 'none',
  color: TEXT_MUTED,
  fontFamily: FONT_MONO,
  fontSize: 18,
  letterSpacing: 1,
}

const sheetRow: CSSProperties = {
  width: '100%',
  minHeight: 52,
  display: 'flex',
  alignItems: 'center',
  padding: '0 12px',
  background: 'none',
  border: 'none',
  borderRadius: 6,
  fontFamily: FONT_MONO,
  fontSize: 14,
  textAlign: 'left',
}

const bigButton: CSSProperties = {
  height: 52,
  background: 'transparent',
  borderRadius: 6,
  fontFamily: FONT_MONO,
  fontSize: 13,
}

const textField: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  height: 52,
  padding: '0 4px',
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${BORDER_SUBTLE}`,
  outline: 'none',
  color: TEXT_PRIMARY,
  caretColor: ACCENT,
  fontFamily: FONT_MONO,
  fontSize: 16, // 16px+ stops iOS Safari zooming in on focus
}