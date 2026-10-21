// Shared types, constants and small helpers for the admin files and notes pages.

import { supabase } from '@/lib/supabase'

export type FileRow = {
  id: string
  name: string
  path: string
  size: number
  mime_type: string | null
  created_at: string
  deleted_at: string | null
  // added with folders (optional so the pages keep working before the SQL is run)
  folder_id?: string | null
  trashed_from?: string | null
}

export type FolderRow = {
  id: string
  name: string
  parent_id: string | null
  created_at: string
}

/** Notes made on the Notes page are saved in this top-level folder. */
export const NOTES_FOLDER = 'site-notes'

export const BUCKET = 'files'
export const MAX_BYTES = 15 * 1024 * 1024 // keep in sync with the bucket's file_size_limit
export const MAX_EDIT_BYTES = 1024 * 1024 // bigger text files open fine to download, but not in the editor
export const TRASH_DAYS = 30
export const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024 // Supabase free plan: 1 GB
export const DAY_MS = 24 * 60 * 60 * 1000

const TEXT_EXT = /\.(txt|md|json|csv|log|ya?ml|xml|html?|css|jsx?|tsx?|ini|sh)$/i

export const formatSize = (bytes: number) => {
  if (bytes < 100 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })

export const daysLeft = (deletedAt: string) =>
  Math.max(0, Math.ceil((new Date(deletedAt).getTime() + TRASH_DAYS * DAY_MS - Date.now()) / DAY_MS))

export const iconFor = (row: FileRow) => {
  const mime = row.mime_type ?? ''
  const name = row.name.toLowerCase()
  if (mime.startsWith('image/')) return '▣'
  if (mime.includes('zip') || /\.(zip|tar|gz|7z|rar)$/.test(name)) return '▥'
  if (mime.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) return '▦'
  return '▤'
}

/** Can this file be opened in the built-in text editor? */
export const isEditable = (row: FileRow) => {
  if (row.size > MAX_EDIT_BYTES) return false
  const mime = row.mime_type ?? ''
  return mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml' || TEXT_EXT.test(row.name)
}

/** "notes" -> "notes.txt"; names that already have an extension are left alone. */
export const withDefaultExtension = (name: string) => (/\.[A-Za-z0-9]+$/.test(name) ? name : name + '.txt')

export const mimeForName = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
      return 'text/markdown'
    case 'json':
      return 'application/json'
    case 'csv':
      return 'text/csv'
    case 'html':
    case 'htm':
      return 'text/html'
    case 'css':
      return 'text/css'
    default:
      return 'text/plain'
  }
}

/** Every row in the files table (RLS already limits this to the signed-in user). */
export async function loadRows(): Promise<FileRow[]> {
  const { data, error } = await supabase.from('files').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as FileRow[]
}

/** Every folder (RLS limits this to the signed-in user). Throws if the folders table doesn't exist yet. */
export async function loadFolders(): Promise<FolderRow[]> {
  const { data, error } = await supabase.from('folders').select('*').order('name', { ascending: true })
  if (error) throw error
  return (data ?? []) as FolderRow[]
}

/** ['projects', 'atlas-fitness'] for a folder id; [] for the top level. */
export function folderPathNames(folders: FolderRow[], id: string | null): string[] {
  const parts: string[] = []
  let cur = id
  const seen = new Set<string>()
  while (cur && !seen.has(cur)) {
    seen.add(cur)
    const f = folders.find((x) => x.id === cur)
    if (!f) break
    parts.unshift(f.name)
    cur = f.parent_id
  }
  return parts
}

/** 'projects/atlas-fitness/' (or '' for the top level) */
export const folderLabel = (folders: FolderRow[], id: string | null) => {
  const names = folderPathNames(folders, id)
  return names.length ? names.join('/') + '/' : ''
}

/** The folder itself plus every folder nested inside it. */
export function descendantIds(folders: FolderRow[], id: string): string[] {
  const out = [id]
  for (const f of folders) {
    if (f.parent_id === id) out.push(...descendantIds(folders, f.id))
  }
  return out
}

/** Finds the top-level notes folder, creating it the first time. Returns its id. */
export async function ensureNotesFolder(): Promise<string> {
  const found = await supabase
    .from('folders')
    .select('id')
    .is('parent_id', null)
    .eq('name', NOTES_FOLDER)
    .limit(1)
  if (found.error) throw found.error
  if (found.data && found.data.length > 0) return found.data[0].id as string

  const created = await supabase.from('folders').insert({ name: NOTES_FOLDER, parent_id: null }).select('id').single()
  if (created.error || !created.data) throw created.error ?? new Error('could not create notes folder')
  return created.data.id as string
}