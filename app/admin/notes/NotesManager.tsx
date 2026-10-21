'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Pane from '../components/Pane'
import FileEditor from '../files/FileEditor'
import {
  BUCKET,
  MAX_BYTES,
  formatDate,
  formatSize,
  isEditable,
  loadRows,
  mimeForName,
  withDefaultExtension,
  type FileRow,
} from '../files/fileUtils'
import { ACCENT, FONT_MONO, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'

type Notice = { text: string; error: boolean } | null

type Editor = {
  id: string | null // null until a brand-new note has been saved once
  path: string | null
  name: string
  content: string
  savedName: string
  savedContent: string
  loading: boolean
  confirmDiscard: boolean
}

/**
 * Notes are just text files in the same private bucket as the Files page,
 * so everything saved here also shows up there (and can be downloaded,
 * trashed or restored from either place).
 */
export default function NotesManager() {
  const [rows, setRows] = useState<FileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [editor, setEditor] = useState<Editor | null>(null)

  useEffect(() => {
    let cancelled = false
    loadRows()
      .then((r) => {
        if (!cancelled) setRows(r)
      })
      .catch(() => {
        if (!cancelled) setNotice({ text: "couldn't load notes.", error: true })
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

  const notes = rows.filter((r) => !r.deleted_at && isEditable(r))
  const dirty = editor ? editor.name !== editor.savedName || editor.content !== editor.savedContent : false

  // Don't silently replace an editor that has unsaved work in it.
  const editorBusy = () => {
    if (editor && dirty) {
      setNotice({ text: 'save or close the open note first.', error: true })
      return true
    }
    return false
  }

  const openNew = () => {
    if (editorBusy()) return
    setNotice(null)
    setEditor({
      id: null,
      path: null,
      name: '',
      content: '',
      savedName: '',
      savedContent: '',
      loading: false,
      confirmDiscard: false,
    })
  }

  const openNote = async (row: FileRow) => {
    if (editor?.id === row.id) return
    if (editorBusy()) return
    setNotice(null)
    setEditor({
      id: row.id,
      path: row.path,
      name: row.name,
      content: '',
      savedName: row.name,
      savedContent: '',
      loading: true,
      confirmDiscard: false,
    })
    const { data, error } = await supabase.storage.from(BUCKET).download(row.path)
    if (error || !data) {
      setEditor(null)
      setNotice({ text: `couldn't open ${row.name}.`, error: true })
      return
    }
    const text = await data.text()
    setEditor((e) => (e && e.id === row.id ? { ...e, content: text, savedContent: text, loading: false } : e))
  }

  const saveNote = async () => {
    if (!editor || editor.loading || saving) return
    const trimmed = editor.name.trim()
    if (!trimmed) {
      setNotice({ text: 'give the note a name first.', error: true })
      return
    }
    const name = withDefaultExtension(trimmed)
    const mime = mimeForName(name)
    const content = editor.content
    const blob = new Blob([content], { type: mime })
    if (blob.size > MAX_BYTES) {
      setNotice({ text: 'that note is over 15 MB.', error: true })
      return
    }

    setSaving(true)
    setNotice(null)

    if (editor.id && editor.path) {
      // existing note: overwrite the stored text and update its row
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(editor.path, blob, { upsert: true, contentType: mime, cacheControl: '0' })
      if (uploadError) {
        setSaving(false)
        setNotice({ text: `couldn't save ${name}: ${uploadError.message}`, error: true })
        return
      }
      const { error: updateError } = await supabase
        .from('files')
        .update({ name, size: blob.size, mime_type: mime })
        .eq('id', editor.id)
      if (updateError) {
        setSaving(false)
        setNotice({ text: `saved the text but not its details: ${updateError.message}`, error: true })
        return
      }
      setEditor((e) => (e ? { ...e, name, savedName: name, savedContent: content } : e))
    } else {
      // new note: same flow as an upload
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setSaving(false)
        setNotice({ text: 'not signed in.', error: true })
        return
      }
      const path = `${user.id}/${crypto.randomUUID()}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: mime, cacheControl: '0' })
      if (uploadError) {
        setSaving(false)
        setNotice({ text: `couldn't create ${name}: ${uploadError.message}`, error: true })
        return
      }
      const { data: inserted, error: insertError } = await supabase
        .from('files')
        .insert({ name, path, size: blob.size, mime_type: mime })
        .select('id')
        .single()
      if (insertError || !inserted) {
        await supabase.storage.from(BUCKET).remove([path])
        setSaving(false)
        setNotice({ text: `couldn't save ${name}: ${insertError?.message ?? 'unknown error'}`, error: true })
        return
      }
      // the editor now points at the note it just created
      setEditor((e) => (e ? { ...e, id: inserted.id, path, name, savedName: name, savedContent: content } : e))
    }

    setSaving(false)
    setNotice({ text: `saved ${name}.`, error: false })
    refresh()
  }

  const closeEditor = () => {
    if (!editor) return
    if (dirty && !editor.confirmDiscard) {
      setEditor({ ...editor, confirmDiscard: true })
      return
    }
    setEditor(null)
  }

  const trashNote = async (row: FileRow) => {
    const { error } = await supabase.from('files').update({ deleted_at: new Date().toISOString() }).eq('id', row.id)
    if (error) setNotice({ text: `couldn't trash ${row.name}.`, error: true })
    else setNotice({ text: `${row.name} moved to trash (restore it from files).`, error: false })
    if (editor?.id === row.id) setEditor(null)
    refresh()
  }

  return (
    <div style={{ fontFamily: FONT_MONO }}>
      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>
        <span style={{ color: ACCENT }}>henry@hegli.dev</span>
        <span style={{ color: TEXT_FAINT }}>:~/admin/notes$</span> ls
      </div>

      {notice && (
        <div style={{ fontSize: 12, marginBottom: 14, color: notice.error ? TEXT_ERROR : ACCENT }}>{notice.text}</div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        <Pane
          title="notes/"
          right={<span style={{ color: TEXT_FAINT }}>{notes.length}</span>}
          style={{ flex: '1 1 260px', maxWidth: 360 }}
          bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <button
            type="button"
            onClick={openNew}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: `1px solid ${ACCENT}`,
              color: ACCENT,
              fontFamily: FONT_MONO,
              fontSize: 12,
              padding: '6px 12px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            [ new note ]
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {notes.length === 0 && (
              <div style={{ color: TEXT_FAINT }}>{loading ? 'loading...' : 'no notes yet.'}</div>
            )}
            {notes.map((row) => {
              const active = editor?.id === row.id
              return (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <button
                    type="button"
                    className={active ? undefined : 'hegli-act'}
                    onClick={() => openNote(row)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      minWidth: 0,
                      textAlign: 'left',
                      fontFamily: FONT_MONO,
                      fontSize: 12,
                      cursor: 'pointer',
                      color: active ? ACCENT : TEXT_PRIMARY,
                    }}
                  >
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                    <div style={{ color: TEXT_FAINT, fontSize: 11, marginTop: 2 }}>
                      {formatDate(row.created_at)} &middot; {formatSize(row.size)}
                    </div>
                  </button>
                  <button
                    type="button"
                    className="hegli-act hegli-act-danger"
                    onClick={() => trashNote(row)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontFamily: FONT_MONO,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    trash
                  </button>
                </div>
              )
            })}
          </div>
        </Pane>

        <div style={{ flex: '3 1 420px', minWidth: 0 }}>
          {editor ? (
            <FileEditor
              name={editor.name}
              content={editor.content}
              isNew={editor.id === null}
              dirty={dirty}
              loading={editor.loading}
              saving={saving}
              confirmDiscard={editor.confirmDiscard}
              onName={(value) => setEditor((e) => (e ? { ...e, name: value, confirmDiscard: false } : e))}
              onContent={(value) => setEditor((e) => (e ? { ...e, content: value, confirmDiscard: false } : e))}
              onSave={saveNote}
              onClose={closeEditor}
              onDiscardYes={() => setEditor(null)}
              onDiscardNo={() => setEditor((e) => (e ? { ...e, confirmDiscard: false } : e))}
            />
          ) : (
            <div
              style={{
                border: '1px dashed rgba(255,255,255,0.14)',
                borderRadius: 6,
                padding: '40px 24px',
                color: TEXT_FAINT,
                fontSize: 12,
                lineHeight: 1.8,
              }}
            >
              select a note to edit it, or start a new one.
              <br />
              notes are saved as text files in your private files storage.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}