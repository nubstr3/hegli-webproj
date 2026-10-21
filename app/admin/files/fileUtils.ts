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
}

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