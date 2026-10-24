'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import { BUCKET, JOURNAL_FOLDER, MAX_BYTES, ensureFolder, ensureJournalFolder, formatSize } from '@/app/admin/files/fileUtils'
import { isPhotoFile, resizeImage } from '@/app/admin/journal/resizeImage'
import ConfirmSheet from '@/app/m/components/ConfirmSheet'
import { ACCENT, BG_PANEL, BORDER_SUBTLE, FONT_MONO, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'

type Status = 'draft' | 'published'

type PostRow = {
  id: string
  entry: string
  post_date: string
  location: string | null
  tz: string | null
  status: Status
  folder_id: string | null
  published_at: string | null
}

// One photo in the editor. Saved photos have a fileId; new ones carry the resized blob until saved.
type Photo = {
  key: string
  fileId: string | null
  path: string | null
  blob: Blob | null
  width: number
  height: number
  size: number
  url: string
}

type Editor = {
  id: string | null
  entry: string
  date: string
  location: string
  tz: string
  status: Status
  folderId: string | null
  publishedAt: string | null
  photos: Photo[]
  removed: { fileId: string; path: string }[]
  dirty: boolean
  loading: boolean
}

type Notice = { text: string; error: boolean } | null
type Confirm = 'discard' | 'delete' | null

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const today = () => ymd(new Date())
const browserTz = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

const blankEditor = (): Editor => ({
  id: null,
  entry: '',
  date: today(),
  location: '',
  tz: browserTz(),
  status: 'draft',
  folderId: null,
  publishedAt: null,
  photos: [],
  removed: [],
  dirty: false,
  loading: false,
})

const POST_COLUMNS = 'id, entry, post_date, location, tz, status, folder_id, published_at, journal_photos(count)'

/**
 * Touch version of the admin journal: a list of posts, and a full-screen editor you
 * open by tapping one. Saving, photo resizing and the files/blog-posts/ layout are
 * the same as the desktop journal, so a post written on either shows up on both.
 */
export default function MobileJournal() {
  const [posts, setPosts] = useState<(PostRow & { photoCount: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const mapPosts = (data: unknown[] | null) =>
    (data ?? []).map((p) => {
      const counts = (p as { journal_photos: { count: number }[] }).journal_photos
      return { ...(p as PostRow), photoCount: counts?.[0]?.count ?? 0 }
    })

  const refresh = async () => {
    const { data, error } = await supabase
      .from('journal_posts')
      .select(POST_COLUMNS)
      .order('post_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      setNotice({ text: `couldn't load posts: ${error.message}`, error: true })
      return
    }
    setPosts(mapPosts(data))
  }

  useEffect(() => {
    let cancelled = false
    supabase
      .from('journal_posts')
      .select(POST_COLUMNS)
      .order('post_date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setNotice({ text: `couldn't load posts: ${error.message}`, error: true })
        else setPosts(mapPosts(data))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const patch = (changes: Partial<Editor>) => setEditor((e) => (e ? { ...e, ...changes, dirty: true } : e))

  const openNew = () => {
    setNotice(null)
    setEditor(blankEditor())
  }

  const openPost = async (post: PostRow) => {
    setNotice(null)
    setEditor({
      ...blankEditor(),
      id: post.id,
      entry: post.entry,
      date: post.post_date,
      location: post.location ?? '',
      tz: post.tz ?? browserTz(),
      status: post.status,
      folderId: post.folder_id,
      publishedAt: post.published_at,
      loading: true,
    })

    const { data, error } = await supabase
      .from('journal_photos')
      .select('file_id, position, width, height, files ( path, size )')
      .eq('post_id', post.id)
      .order('position', { ascending: true })
    if (error) {
      setEditor(null)
      setNotice({ text: `couldn't open that post: ${error.message}`, error: true })
      return
    }

    type Joined = { file_id: string; width: number; height: number; files: { path: string; size: number } | { path: string; size: number }[] | null }
    const rows = ((data ?? []) as unknown as Joined[])
      .map((r) => ({ ...r, file: Array.isArray(r.files) ? r.files[0] : r.files }))
      .filter((r) => r.file)
    const signed = rows.length
      ? await supabase.storage.from(BUCKET).createSignedUrls(
          rows.map((r) => r.file!.path),
          3600,
        )
      : { data: [] as { signedUrl: string }[] }
    const photos: Photo[] = rows.map((r, i) => ({
      key: r.file_id,
      fileId: r.file_id,
      path: r.file!.path,
      blob: null,
      width: r.width,
      height: r.height,
      size: r.file!.size,
      url: signed.data?.[i]?.signedUrl ?? '',
    }))
    setEditor((e) => (e && e.id === post.id ? { ...e, photos, loading: false, dirty: false } : e))
  }

  const addFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return
    const added: Photo[] = []
    for (const file of Array.from(list)) {
      if (!isPhotoFile(file)) {
        setNotice({ text: `${file.name} isn't a photo, skipped.`, error: true })
        continue
      }
      try {
        const { blob, width, height } = await resizeImage(file)
        if (blob.size > MAX_BYTES) {
          setNotice({ text: `${file.name} is still over 15 MB after shrinking, skipped.`, error: true })
          continue
        }
        added.push({
          key: crypto.randomUUID(),
          fileId: null,
          path: null,
          blob,
          width,
          height,
          size: blob.size,
          url: URL.createObjectURL(blob),
        })
      } catch {
        setNotice({ text: `couldn't read ${file.name}.`, error: true })
      }
    }
    if (added.length) setEditor((e) => (e ? { ...e, photos: [...e.photos, ...added], dirty: true } : e))
    if (fileInput.current) fileInput.current.value = ''
  }

  const removePhoto = (key: string) =>
    setEditor((e) => {
      if (!e) return e
      const gone = e.photos.find((p) => p.key === key)
      if (!gone) return e
      if (gone.blob) URL.revokeObjectURL(gone.url)
      return {
        ...e,
        photos: e.photos.filter((p) => p.key !== key),
        removed: gone.fileId && gone.path ? [...e.removed, { fileId: gone.fileId, path: gone.path }] : e.removed,
        dirty: true,
      }
    })

  const movePhoto = (index: number, dir: -1 | 1) =>
    setEditor((e) => {
      if (!e) return e
      const to = index + dir
      if (to < 0 || to >= e.photos.length) return e
      const photos = [...e.photos]
      ;[photos[index], photos[to]] = [photos[to], photos[index]]
      return { ...e, photos, dirty: true }
    })

  const save = async (status: Status) => {
    if (!editor || editor.loading || saving) return
    const entry = editor.entry.trim()
    if (!entry && editor.photos.length === 0) {
      setNotice({ text: 'write an entry or add a photo first.', error: true })
      return
    }
    setSaving(true)
    setNotice(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('not signed in')

      // 1. folder for this post's photos: files/blog-posts/<date>-<place>/
      let folderId = editor.folderId
      if (!folderId) {
        const root = await ensureJournalFolder()
        const name = `${editor.date}-${slug(editor.location) || 'post'}`
        folderId = await ensureFolder(name, root)
      }

      // 2. the post row
      const publishedAt = status === 'published' ? editor.publishedAt ?? new Date().toISOString() : editor.publishedAt
      const fields = {
        title: editor.location.trim() || editor.date,
        entry,
        post_date: editor.date,
        location: editor.location.trim() || null,
        tz: editor.tz,
        status,
        folder_id: folderId,
        published_at: publishedAt,
      }
      let postId = editor.id
      if (postId) {
        const { error } = await supabase.from('journal_posts').update(fields).eq('id', postId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('journal_posts').insert(fields).select('id').single()
        if (error || !data) throw error ?? new Error('could not create the post')
        postId = data.id as string
      }

      // 3. photos removed in the editor: unlink, and move the file to the files trash
      for (const r of editor.removed) {
        await supabase.from('journal_photos').delete().eq('post_id', postId).eq('file_id', r.fileId)
        await supabase
          .from('files')
          .update({ deleted_at: new Date().toISOString(), trashed_from: `${JOURNAL_FOLDER}/` })
          .eq('id', r.fileId)
      }

      // 4. upload new photos, then record order for all of them
      const photos: Photo[] = []
      for (const p of editor.photos) {
        if (p.fileId) {
          photos.push(p)
        } else if (p.blob) {
          const path = `${user.id}/${crypto.randomUUID()}`
          const up = await supabase.storage.from(BUCKET).upload(path, p.blob, { contentType: 'image/jpeg', cacheControl: '3600' })
          if (up.error) throw up.error
          const name = `${editor.date}-${String(photos.length + 1).padStart(2, '0')}.jpg`
          const ins = await supabase
            .from('files')
            .insert({ name, path, size: p.size, mime_type: 'image/jpeg', folder_id: folderId })
            .select('id')
            .single()
          if (ins.error || !ins.data) {
            await supabase.storage.from(BUCKET).remove([path])
            throw ins.error ?? new Error('could not record a photo')
          }
          const link = await supabase
            .from('journal_photos')
            .insert({ post_id: postId, file_id: ins.data.id, position: photos.length, width: p.width, height: p.height })
          if (link.error) throw link.error
          photos.push({ ...p, fileId: ins.data.id as string, path, blob: null })
        }
      }
      // positions for photos that already existed
      for (let i = 0; i < photos.length; i++) {
        if (photos[i].fileId) {
          await supabase.from('journal_photos').update({ position: i }).eq('post_id', postId).eq('file_id', photos[i].fileId!)
        }
      }

      setEditor((e) =>
        e
          ? {
              ...e,
              id: postId,
              status,
              folderId,
              publishedAt,
              photos: photos.map((p) => ({ ...p, key: p.fileId ?? p.key })),
              removed: [],
              dirty: false,
            }
          : e,
      )
      setNotice({ text: status === 'published' ? 'published.' : 'saved as draft.', error: false })
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : (err as { message?: string })?.message ?? 'unknown error'
      setNotice({ text: `couldn't save: ${message}`, error: true })
    } finally {
      setSaving(false)
    }
  }

  const deletePost = async () => {
    setConfirm(null)
    if (!editor?.id) return
    setSaving(true)
    const { data } = await supabase.from('journal_photos').select('file_id').eq('post_id', editor.id)
    const ids = (data ?? []).map((r) => r.file_id as string)
    const { error } = await supabase.from('journal_posts').delete().eq('id', editor.id)
    if (error) {
      setNotice({ text: `couldn't delete: ${error.message}`, error: true })
    } else {
      if (ids.length) {
        await supabase
          .from('files')
          .update({ deleted_at: new Date().toISOString(), trashed_from: `${JOURNAL_FOLDER}/` })
          .in('id', ids)
      }
      setNotice({ text: 'post deleted (its photos are in the files trash for 30 days).', error: false })
      setEditor(null)
      await refresh()
    }
    setSaving(false)
  }

  const closeEditor = () => {
    if (editor?.dirty) setConfirm('discard')
    else setEditor(null)
  }

  const totalSize = editor?.photos.reduce((sum, p) => sum + p.size, 0) ?? 0

  return (
    <div style={{ fontFamily: FONT_MONO, paddingTop: 22, paddingBottom: editor ? 8 : 20 }}>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: TEXT_MUTED }}>
        <span style={{ color: ACCENT, fontWeight: 700 }}>henry@hegli.dev</span>
        <span style={{ color: TEXT_FAINT }}>:~/admin/journal$</span> <span style={{ color: '#f2f2f4' }}>{editor ? 'nano post' : 'ls'}</span>
      </div>

      {notice && (
        <div role="status" style={{ marginTop: 14, fontSize: 12, lineHeight: 1.6, color: notice.error ? TEXT_ERROR : ACCENT, overflowWrap: 'anywhere' }}>
          {notice.text}
        </div>
      )}

      {!editor && (
        <div style={{ marginTop: 16, background: BG_PANEL, border: `1px solid ${BORDER_SUBTLE}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={titleBar}>
            <span>journal/ (files/{JOURNAL_FOLDER}/)</span>
            <span style={{ color: '#8a8a93' }}>{posts.length}</span>
          </div>
          <div style={{ padding: '14px 14px 4px' }}>
            <button type="button" onClick={openNew} style={{ ...outlineBtn, width: '100%' }}>
              [ new post ]
            </button>
          </div>
          <div style={{ padding: '6px 0 6px' }}>
            {posts.length === 0 && (
              <div style={{ padding: '14px 16px', fontSize: 12, color: '#8a8a93' }}>{loading ? 'loading...' : 'no posts yet.'}</div>
            )}
            {posts.map((post) => (
              <button key={post.id} type="button" onClick={() => openPost(post)} style={postRow}>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, color: TEXT_PRIMARY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.post_date}
                    {post.location ? ` · ${post.location}` : ''}
                  </span>
                  <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: '#8a8a93' }}>
                    {post.photoCount} photo{post.photoCount === 1 ? '' : 's'}
                  </span>
                </span>
                <span style={{ flexShrink: 0, fontSize: 10, letterSpacing: '0.06em', padding: '4px 8px', borderRadius: 3, border: `1px solid ${post.status === 'published' ? ACCENT : BORDER_SUBTLE}`, color: post.status === 'published' ? ACCENT : '#8a8a93' }}>
                  {post.status === 'published' ? 'LIVE' : 'DRAFT'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {editor && (
        <div style={{ marginTop: 16, background: BG_PANEL, border: `1px solid ${BORDER_SUBTLE}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ ...titleBar, paddingRight: 4 }}>
            <span>
              {editor.id ? 'edit post' : 'new post'} <span style={{ color: editor.status === 'published' ? ACCENT : '#8a8a93' }}>· {editor.status}</span>
            </span>
            <button type="button" onClick={closeEditor} style={{ minWidth: 72, height: 44, background: 'none', border: 'none', color: TEXT_MUTED, fontFamily: FONT_MONO, fontSize: 12 }}>
              &larr; close
            </button>
          </div>

          {editor.loading ? (
            <div style={{ padding: '24px 16px', fontSize: 12, color: '#8a8a93' }}>loading...</div>
          ) : (
            <div style={{ padding: '18px 16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <label style={fieldLabel}>
                <span style={labelText}>date</span>
                <div style={{ ...underline, justifyContent: 'space-between' }}>
                  <input
                    type="date"
                    value={editor.date}
                    onChange={(e) => patch({ date: e.target.value || today() })}
                    style={{ ...input, colorScheme: 'dark', flex: 1 }}
                  />
                  <button type="button" onClick={() => patch({ date: today() })} style={{ minHeight: 44, padding: '0 4px', background: 'none', border: 'none', color: ACCENT, fontFamily: FONT_MONO, fontSize: 12, whiteSpace: 'nowrap' }}>
                    [ today ]
                  </button>
                </div>
                <span style={{ fontSize: 11, color: '#8a8a93' }}>timezone: {editor.tz}</span>
              </label>

              <label style={fieldLabel}>
                <span style={labelText}>location (optional)</span>
                <div style={underline}>
                  <input
                    value={editor.location}
                    onChange={(e) => patch({ location: e.target.value })}
                    placeholder="Kyoto, Japan"
                    autoComplete="off"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    style={input}
                  />
                </div>
              </label>

              <label style={fieldLabel}>
                <span style={labelText}>entry</span>
                <textarea
                  value={editor.entry}
                  onChange={(e) => patch({ entry: e.target.value })}
                  placeholder="what happened today..."
                  rows={10}
                  style={{ ...input, height: 'auto', minHeight: 200, padding: 12, lineHeight: 1.7, resize: 'vertical', border: `1px solid ${BORDER_SUBTLE}`, borderRadius: 6, boxSizing: 'border-box' }}
                />
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={labelText}>
                    photos <span style={{ color: '#8a8a93' }}>· {editor.photos.length} · {formatSize(totalSize || 1)}</span>
                  </span>
                  <button type="button" onClick={() => fileInput.current?.click()} style={{ ...outlineBtn, height: 44, padding: '0 14px', fontSize: 12 }}>
                    [ add photos ]
                  </button>
                  <input ref={fileInput} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => addFiles(e.target.files)} />
                </div>

                {editor.photos.length === 0 ? (
                  <div style={{ border: '1px dashed rgba(255,255,255,0.18)', borderRadius: 8, padding: '24px 16px', fontSize: 12, lineHeight: 1.8, color: '#8a8a93' }}>
                    no photos yet. tap add photos to pick from your camera roll, or take one now. they&apos;re shrunk to 1920px wide before upload and saved in files/{JOURNAL_FOLDER}/. the first photo is shown first in the slideshow.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                    {editor.photos.map((p, i) => (
                      <div key={p.key} style={{ border: `1px solid ${BORDER_SUBTLE}`, borderRadius: 6, overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block', background: '#0F0F12' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 8, fontSize: 11, color: '#8a8a93' }}>
                          <span>
                            {i + 1}
                            {p.blob ? ' · new' : ''}
                          </span>
                          <span style={{ display: 'flex' }}>
                            <button type="button" aria-label="move earlier" onClick={() => movePhoto(i, -1)} disabled={i === 0} style={{ ...photoBtn, opacity: i === 0 ? 0.3 : 1 }}>
                              &larr;
                            </button>
                            <button type="button" aria-label="move later" onClick={() => movePhoto(i, 1)} disabled={i === editor.photos.length - 1} style={{ ...photoBtn, opacity: i === editor.photos.length - 1 ? 0.3 : 1 }}>
                              &rarr;
                            </button>
                            <button type="button" aria-label="remove photo" onClick={() => removePhoto(p.key)} style={{ ...photoBtn, color: TEXT_ERROR }}>
                              &times;
                            </button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 11, lineHeight: 1.6, color: '#8a8a93' }}>drafts are invisible to everyone with a code.</div>

              {editor.id && (
                <button type="button" onClick={() => setConfirm('delete')} style={{ alignSelf: 'flex-start', minHeight: 44, padding: 0, background: 'none', border: 'none', color: TEXT_ERROR, fontFamily: FONT_MONO, fontSize: 12 }}>
                  delete post
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* sticky save bar: stays in reach however long the entry is */}
      {editor && !editor.loading && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            marginTop: 12,
            padding: '12px 0 calc(10px + env(safe-area-inset-bottom))',
            display: 'flex',
            gap: 10,
            background: 'linear-gradient(to top, #0f0f11 70%, rgba(15,15,17,0))',
          }}
        >
          <button type="button" disabled={saving} onClick={() => save('published')} style={{ ...outlineBtn, flex: 1, background: '#0f0f11', opacity: saving ? 0.6 : 1 }}>
            {saving ? '[ saving… ]' : editor.status === 'published' ? '[ update ]' : '[ publish ]'}
          </button>
          <button type="button" disabled={saving} onClick={() => save('draft')} style={{ ...outlineBtn, flex: 1, background: '#0f0f11', border: `1px solid ${BORDER_SUBTLE}`, color: TEXT_MUTED, opacity: saving ? 0.6 : 1 }}>
            {editor.status === 'published' ? '[ unpublish ]' : '[ save draft ]'}
          </button>
        </div>
      )}

      {confirm === 'discard' && (
        <ConfirmSheet
          title="close post"
          message="discard your changes to this post?"
          yes="[ discard ]"
          no="keep editing"
          onYes={() => {
            setConfirm(null)
            setEditor(null)
          }}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmSheet
          title="delete post"
          message="delete this post? its photos go to the files trash for 30 days."
          yes="[ delete post ]"
          onYes={deletePost}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

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

const outlineBtn: CSSProperties = {
  height: 52,
  background: 'transparent',
  border: `1px solid ${ACCENT}`,
  borderRadius: 6,
  color: ACCENT,
  fontFamily: FONT_MONO,
  fontSize: 13,
}

const postRow: CSSProperties = {
  width: '100%',
  minHeight: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px 16px',
  background: 'none',
  border: 'none',
  borderTop: `1px solid ${BORDER_SUBTLE}`,
  fontFamily: FONT_MONO,
  textAlign: 'left',
}

const fieldLabel: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }
const labelText: CSSProperties = { fontSize: 12, color: TEXT_MUTED }
const underline: CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${BORDER_SUBTLE}` }

const input: CSSProperties = {
  width: '100%',
  height: 48,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  color: TEXT_PRIMARY,
  caretColor: ACCENT,
  fontFamily: FONT_MONO,
  fontSize: 16, // 16px+ stops iOS Safari zooming in on focus
}

const photoBtn: CSSProperties = {
  width: 44,
  height: 44,
  background: 'none',
  border: 'none',
  color: TEXT_MUTED,
  fontFamily: FONT_MONO,
  fontSize: 15,
}