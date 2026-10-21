'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { TEXT_ERROR, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { formatSize, iconFor, type FileRow } from '../files/fileUtils'

const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function RecentFilesWidget(_props: WidgetProps) {
  void _props
  const [files, setFiles] = useState<FileRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    supabase
      .from('files')
      .select('id, name, path, size, mime_type, created_at, deleted_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data, error }: { data: FileRow[] | null; error: unknown }) => {
        if (error) setFailed(true)
        else setFiles(data ?? [])
        setLoaded(true)
      })
  }, [])

  return (
    <Pane
      title="recent.files"
      right={
        <a href="/admin/files" style={{ color: TEXT_FAINT, textDecoration: 'none' }}>
          all files &rarr;
        </a>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {failed && <div style={{ color: TEXT_ERROR }}>couldn&apos;t load files.</div>}
      {!loaded && <div style={{ color: TEXT_FAINT }}>loading...</div>}
      {loaded && !failed && files.length === 0 && <div style={{ color: TEXT_FAINT }}>no files yet.</div>}
      {files.map((f) => (
        <a
          key={f.id}
          href="/admin/files"
          style={{ display: 'flex', justifyContent: 'space-between', gap: 10, textDecoration: 'none', color: TEXT_PRIMARY }}
        >
          <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <span style={{ color: TEXT_FAINT }}>{iconFor(f)} </span>
            {f.name}
          </span>
          <span style={{ color: TEXT_MUTED, whiteSpace: 'nowrap', fontSize: 11 }}>
            {formatSize(f.size)} · {timeAgo(f.created_at)}
          </span>
        </a>
      ))}
    </Pane>
  )
}