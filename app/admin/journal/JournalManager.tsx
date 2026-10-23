'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Pane from '../components/Pane'
import { BUCKET, JOURNAL_FOLDER, MAX_BYTES, ensureFolder, ensureJournalFolder, formatSize } from '../files/fileUtils'
import { isPhotoFile, resizeImage } from './resizeImage'
import { ACCENT, FONT_MONO, TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'

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
  confirmDiscard: boolean
  confirmDelete: boolean
}

type Notice = { text: string; error: boolean } | null

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
  confirmDiscard: false,
  confirmDelete: false,
})

const fieldStyle = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: TEXT_PRIMARY,
  fontFamily: FONT_MONO,
  fontSize: 13,
  width: '100%',
  caretColor: ACCENT,
} as const

const btn = {
  background: 'transparent',
  border: `1px solid ${ACCENT}`,
  color: ACCENT,
  fontFamily: FONT_MONO,
  fontSize: 12,
  padding: '6px 12px',
  borderRadius: 4,
  cursor: 'pointer',
} as const

const act = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
} as const

export default function JournalManager() {
  const [posts, setPosts] = useState<(PostRow & { photoCount: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [editor, setEditor] = useState<Editor | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const refresh = async () => {
    const { data, error } = await supabase
      .from('journal_posts')
      .select('id, entry, post_date, location, tz, status, folder_id, published_at, journal_photos(count)')
      .order('post_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) {
      setNotice({ text: `couldn't load posts: ${error.message}`, error: true })
      return
    }
    setPosts(
      (data ?? []).map((p) => {
        const counts = (p as unknown as { journal_photos: { count: number }[] }).journal_photos
        return { ...(p as unknown as PostRow), photoCount: counts?.[0]?.count ?? 0 }
      }),
    )
  }

  useEffect(() => {
    let cancelled = false
    supabase
      .from('journal_posts')
      .select('id, entry, post_date, location, tz, status, folder_id, published_at, journal_photos(count)')
      .order('post_date', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setNotice({ text: `couldn't load posts: ${error.message}`, error: true })
        else
          setPosts(
            (data ?? []).map((p) => {
              const counts = (p as unknown as { journal_photos: { count: number }[] }).journal_photos
              return { ...(p as unknown as PostRow), photoCount: counts?.[0]?.count ?? 0 }
            }),
          )
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const patch = (changes: Partial<Editor>) =>
    setEditor((e) => (e ? { ...e, ...changes, dirty: true, confirmDiscard: false } : e))

  const busy = () => {
    if (editor?.dirty) {
      setNotice({ text: 'save or close the open post first.', error: true })
      return true
    }
    return false
  }

  const openNew = () => {
    if (busy()) return
    setNotice(null)
    setEditor(blankEditor())
  }

  const openPost = async (post: PostRow) => {
    if (editor?.id === post.id || busy()) return
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
    if (!editor) return
    if (editor.dirty && !editor.confirmDiscard) {
      setEditor({ ...editor, confirmDiscard: true })
      return
    }
    setEditor(null)
  }

  const totalSize = editor?.photos.reduce((sum, p) => sum + p.size, 0) ?? 0

  return (
    <div style={{ fontFamily: FONT_MONO }}>
      <div style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 20 }}>
        <span style={{ color: ACCENT }}>henry@hegli.dev</span>
        <span style={{ color: TEXT_FAINT }}>:~/admin/journal$</span> ls
      </div>

      {notice && (
        <div style={{ fontSize: 12, marginBottom: 14, color: notice.error ? TEXT_ERROR : ACCENT }}>{notice.text}</div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        <Pane
          title={`journal/ (files/${JOURNAL_FOLDER}/)`}
          right={<span style={{ color: TEXT_FAINT }}>{posts.length}</span>}
          style={{ flex: '1 1 260px', maxWidth: 360 }}
          bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <button type="button" onClick={openNew} style={{ ...btn, alignSelf: 'flex-start' }}>
            [ new post ]
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {posts.length === 0 && <div style={{ color: TEXT_FAINT }}>{loading ? 'loading...' : 'no posts yet.'}</div>}
            {posts.map((post) => {
              const active = editor?.id === post.id
              return (
                <button
                  key={post.id}
                  type="button"
                  className={active ? undefined : 'hegli-act'}
                  onClick={() => openPost(post)}
                  style={{
                    ...act,
                    textAlign: 'left',
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    color: active ? ACCENT : TEXT_PRIMARY,
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.post_date}
                    {post.location ? ` · ${post.location}` : ''}
                  </div>
                  <div style={{ color: TEXT_FAINT, fontSize: 11, marginTop: 2 }}>
                    <span style={{ color: post.status === 'published' ? ACCENT : TEXT_FAINT }}>{post.status}</span>
                    {' · '}
                    {post.photoCount} photo{post.photoCount === 1 ? '' : 's'}
                  </div>
                </button>
              )
            })}
          </div>
        </Pane>

        <div style={{ flex: '3 1 480px', minWidth: 0 }}>
          {editor ? (
            <Pane
              title={editor.id ? 'edit post' : 'new post'}
              right={
                <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span style={{ color: editor.status === 'published' ? ACCENT : TEXT_FAINT }}>{editor.status}</span>
                  {editor.confirmDiscard ? (
                    <span style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: TEXT_MUTED }}>discard changes?</span>
                      <button type="button" className="hegli-act hegli-act-yes" style={act} onClick={() => setEditor(null)}>
                        [y]
                      </button>
                      <button
                        type="button"
                        className="hegli-act"
                        style={act}
                        onClick={() => setEditor((e) => (e ? { ...e, confirmDiscard: false } : e))}
                      >
                        [n]
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="hegli-act" style={act} onClick={closeEditor}>
                      close
                    </button>
                  )}
                </span>
              }
              bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '18px 16px 20px' }}
            >
              {editor.loading ? (
                <div style={{ color: TEXT_FAINT }}>loading...</div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 200px' }}>
                      <span style={{ color: TEXT_MUTED }}>date</span>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                        <input
                          type="date"
                          value={editor.date}
                          onChange={(e) => patch({ date: e.target.value || today() })}
                          style={{ ...fieldStyle, colorScheme: 'dark' }}
                        />
                        <button type="button" className="hegli-act" style={{ ...act, whiteSpace: 'nowrap' }} onClick={() => patch({ date: today() })}>
                          [ today ]
                        </button>
                      </div>
                      <span style={{ color: TEXT_FAINT, fontSize: 11 }}>timezone: {editor.tz}</span>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 200px' }}>
                      <span style={{ color: TEXT_MUTED }}>location (optional)</span>
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                        <input
                          value={editor.location}
                          onChange={(e) => patch({ location: e.target.value })}
                          placeholder="Kyoto, Japan"
                          style={fieldStyle}
                          autoComplete="off"
                        />
                      </div>
                    </label>
                  </div>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ color: TEXT_MUTED }}>entry</span>
                    <textarea
                      value={editor.entry}
                      onChange={(e) => patch({ entry: e.target.value })}
                      placeholder="what happened today..."
                      rows={10}
                      style={{
                        ...fieldStyle,
                        resize: 'vertical',
                        lineHeight: 1.7,
                        padding: 12,
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 4,
                        minHeight: 180,
                      }}
                    />
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ color: TEXT_MUTED }}>
                        photos <span style={{ color: TEXT_FAINT }}>· {editor.photos.length} · {formatSize(totalSize || 1)}</span>
                      </span>
                      <button type="button" style={btn} onClick={() => fileInput.current?.click()}>
                        [ add photos ]
                      </button>
                      <input
                        ref={fileInput}
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        hidden
                        onChange={(e) => addFiles(e.target.files)}
                      />
                    </div>

                    {editor.photos.length === 0 ? (
                      <div style={{ border: '1px dashed rgba(255,255,255,0.14)', borderRadius: 6, padding: '28px 16px', color: TEXT_FAINT, lineHeight: 1.8 }}>
                        no photos yet. they&apos;re shrunk to 1920px wide before upload and saved in files/{JOURNAL_FOLDER}/.
                        <br />
                        the first photo is shown first in the slideshow.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                        {editor.photos.map((p, i) => (
                          <div key={p.key} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.url} alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block', background: '#0F0F12' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', fontSize: 11 }}>
                              <span style={{ color: TEXT_FAINT }}>
                                {i + 1}
                                {p.blob ? ' · new' : ''}
                              </span>
                              <span style={{ display: 'flex', gap: 8 }}>
                                <button type="button" className="hegli-act" style={act} onClick={() => movePhoto(i, -1)} disabled={i === 0} title="move earlier">
                                  ←
                                </button>
                                <button type="button" className="hegli-act" style={act} onClick={() => movePhoto(i, 1)} disabled={i === editor.photos.length - 1} title="move later">
                                  →
                                </button>
                                <button type="button" className="hegli-act hegli-act-danger" style={act} onClick={() => removePhoto(p.key)}>
                                  remove
                                </button>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <button type="button" disabled={saving} style={{ ...btn, opacity: saving ? 0.6 : 1 }} onClick={() => save('published')}>
                      {saving ? '[ saving… ]' : editor.status === 'published' ? '[ update published ]' : '[ publish ]'}
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      style={{ ...btn, border: '1px solid rgba(255,255,255,0.14)', color: TEXT_MUTED, opacity: saving ? 0.6 : 1 }}
                      onClick={() => save('draft')}
                    >
                      {editor.status === 'published' ? '[ unpublish to draft ]' : '[ save draft ]'}
                    </button>
                    <span style={{ color: TEXT_FAINT, fontSize: 11 }}>
                      drafts are invisible to everyone with a code.
                    </span>
                    {editor.id && (
                      <span style={{ marginLeft: 'auto' }}>
                        {editor.confirmDelete ? (
                          <span style={{ display: 'flex', gap: 8 }}>
                            <span style={{ color: TEXT_MUTED }}>delete this post?</span>
                            <button type="button" className="hegli-act hegli-act-yes" style={act} onClick={deletePost}>
                              [y]
                            </button>
                            <button type="button" className="hegli-act" style={act} onClick={() => setEditor((e) => (e ? { ...e, confirmDelete: false } : e))}>
                              [n]
                            </button>
                          </span>
                        ) : (
                          <button type="button" className="hegli-act hegli-act-danger" style={act} onClick={() => setEditor((e) => (e ? { ...e, confirmDelete: true } : e))}>
                            delete post
                          </button>
                        )}
                      </span>
                    )}
                  </div>
                </>
              )}
            </Pane>
          ) : (
            <div style={{ border: '1px dashed rgba(255,255,255,0.14)', borderRadius: 6, padding: '40px 24px', color: TEXT_FAINT, fontSize: 12, lineHeight: 1.8 }}>
              select a post to edit it, or start a new one.
              <br />
              photos are saved in your private files storage, in the {JOURNAL_FOLDER}/ folder.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}