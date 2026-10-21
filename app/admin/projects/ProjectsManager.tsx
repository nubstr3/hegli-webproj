'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Pane from '../components/Pane'
import { ProjectCard, PublicationCard } from '@/app/projects/ProjectCard'
import {
  DATE_LABELS,
  TIER_META,
  TIER_ORDER,
  rowToProject,
  rowToPublication,
  type ProjectRow,
  type PublicationRow,
  type TierId,
} from '@/app/projects/projectsShared'
import { ACCENT, FONT_MONO, TEXT_DIM, TEXT_ERROR, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'

const RULE = '1px solid rgba(255,255,255,0.06)'

type ProjectForm = {
  name: string
  tier: TierId
  description: string
  stack: string // comma separated
  updated_label: (typeof DATE_LABELS)[number]
  updated: string
  live_url: string
  github_url: string
}
type PubForm = { title: string; venue: string; authors: string; summary: string; url: string }

const BLANK: ProjectForm = {
  name: '',
  tier: 'live',
  description: '',
  stack: '',
  updated_label: 'updated',
  updated: '',
  live_url: '',
  github_url: '',
}
const BLANK_PUB: PubForm = { title: '', venue: '', authors: '', summary: '', url: '' }

const parseStack = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)

const isHttpUrl = (s: string) => /^https?:\/\/\S+$/i.test(s)

/** e.g. "OCT 2026" (matches how dates are written on the projects page) */
const currentMonthLabel = () =>
  new Date().toLocaleDateString('en-NZ', { month: 'short', year: 'numeric' }).toUpperCase()

type Msg = { text: string; error: boolean } | null

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: TEXT_DIM }}>
        {label} {hint && <span style={{ color: '#45454c' }}>{hint}</span>}
      </span>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: 8,
        }}
      >
        <span style={{ color: TEXT_DIM }}>&gt;</span>
        {children}
      </div>
    </label>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  colorFor,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  colorFor?: (id: T) => string
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {options.map((o, i) => {
        const on = o.id === value
        const c = on ? (colorFor ? colorFor(o.id) : ACCENT) : TEXT_MUTED
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              background: 'transparent',
              border: `1px solid ${on ? c : 'rgba(255,255,255,0.12)'}`,
              color: c,
              fontFamily: FONT_MONO,
              fontSize: 12,
              padding: '7px 12px',
              cursor: 'pointer',
              borderRadius: i === 0 ? '4px 0 0 4px' : i === options.length - 1 ? '0 4px 4px 0' : 0,
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const inputStyle = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: TEXT_PRIMARY,
  fontFamily: FONT_MONO,
  fontSize: 13,
  width: '100%',
  caretColor: ACCENT,
  lineHeight: 1.7,
} as const

const btnStyle = {
  background: 'transparent',
  border: `1px solid ${ACCENT}`,
  color: ACCENT,
  fontFamily: FONT_MONO,
  fontSize: 12,
  padding: '7px 14px',
  borderRadius: 4,
  cursor: 'pointer',
} as const

const tinyBtn = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: FONT_MONO,
  fontSize: 12,
  cursor: 'pointer',
} as const

export default function ProjectsManager() {
  const [view, setView] = useState<'projects' | 'pubs'>('projects')
  const [msg, setMsg] = useState<Msg>(null)
  const [busy, setBusy] = useState(false)

  // --- projects ---
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const [f, setF] = useState<ProjectForm>(BLANK)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  // --- publications ---
  const [pubs, setPubs] = useState<PublicationRow[]>([])
  const [selPubId, setSelPubId] = useState<string | null>(null)
  const [g, setG] = useState<PubForm>(BLANK_PUB)
  const [confirmPubId, setConfirmPubId] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    const { data, error } = await supabase.from('projects').select('*').order('sort_order', { ascending: true })
    if (error) return setMsg({ text: `couldn't load projects: ${error.message}`, error: true })
    setProjects((data ?? []) as ProjectRow[])
  }, [])

  const loadPubs = useCallback(async () => {
    const { data, error } = await supabase.from('publications').select('*').order('sort_order', { ascending: true })
    if (error) return setMsg({ text: `couldn't load publications: ${error.message}`, error: true })
    setPubs((data ?? []) as PublicationRow[])
  }, [])

  useEffect(() => {
    supabase
      .from('projects')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) setMsg({ text: `couldn't load projects: ${error.message}`, error: true })
        else setProjects((data ?? []) as ProjectRow[])
      })
    supabase
      .from('publications')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) setMsg({ text: `couldn't load publications: ${error.message}`, error: true })
        else setPubs((data ?? []) as PublicationRow[])
      })
  }, [])

  const switchView = (v: 'projects' | 'pubs') => {
    setView(v)
    setMsg(null)
  }

  // ---------- projects ----------

  const newProject = () => {
    setSelId(null)
    setF(BLANK)
    setConfirmId(null)
    setMsg(null)
  }

  const editProject = (p: ProjectRow) => {
    setSelId(p.id)
    setF({
      name: p.name,
      tier: p.tier,
      description: p.description,
      stack: (p.stack ?? []).join(', '),
      updated_label: p.updated_label,
      updated: p.updated,
      live_url: p.live_url ?? '',
      github_url: p.github_url ?? '',
    })
    setConfirmId(null)
    setMsg(null)
  }

  const saveProject = async () => {
    setMsg(null)
    if (!f.name.trim()) return setMsg({ text: 'give the project a name first.', error: true })
    if (f.live_url.trim() && !isHttpUrl(f.live_url.trim()))
      return setMsg({ text: 'live site url must start with http:// or https://', error: true })
    if (f.github_url.trim() && !isHttpUrl(f.github_url.trim()))
      return setMsg({ text: 'github url must start with http:// or https://', error: true })

    setBusy(true)
    const row = {
      tier: f.tier,
      name: f.name.trim(),
      description: f.description.trim(),
      stack: parseStack(f.stack),
      updated_label: f.updated_label,
      updated: f.updated.trim() || currentMonthLabel(),
      live_url: f.live_url.trim() || null,
      github_url: f.github_url.trim() || null,
    }

    if (selId) {
      const { error } = await supabase.from('projects').update(row).eq('id', selId)
      setBusy(false)
      if (error) return setMsg({ text: `couldn't save: ${error.message}`, error: true })
      setMsg({ text: '✓ saved. /projects is updated.', error: false })
    } else {
      const nextOrder = projects.reduce((m, p) => Math.max(m, p.sort_order), 0) + 10
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...row, sort_order: nextOrder })
        .select('id')
        .single()
      setBusy(false)
      if (error) return setMsg({ text: `couldn't add: ${error.message}`, error: true })
      setSelId(data.id)
      setMsg({ text: '✓ added. /projects is updated.', error: false })
    }
    await loadProjects()
  }

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    setConfirmId(null)
    if (error) return setMsg({ text: `couldn't delete: ${error.message}`, error: true })
    if (selId === id) newProject()
    setMsg({ text: '✓ project deleted.', error: false })
    await loadProjects()
  }

  const moveProject = async (p: ProjectRow, dir: -1 | 1) => {
    const inTier = projects.filter((x) => x.tier === p.tier)
    const i = inTier.findIndex((x) => x.id === p.id)
    const other = inTier[i + dir]
    if (!other) return
    const [a, b] = await Promise.all([
      supabase.from('projects').update({ sort_order: other.sort_order }).eq('id', p.id),
      supabase.from('projects').update({ sort_order: p.sort_order }).eq('id', other.id),
    ])
    if (a.error || b.error) setMsg({ text: `couldn't reorder: ${(a.error ?? b.error)?.message}`, error: true })
    await loadProjects()
  }

  // ---------- publications ----------

  const newPub = () => {
    setSelPubId(null)
    setG(BLANK_PUB)
    setConfirmPubId(null)
    setMsg(null)
  }

  const editPub = (p: PublicationRow) => {
    setSelPubId(p.id)
    setG({ title: p.title, venue: p.venue, authors: p.authors, summary: p.summary, url: p.url })
    setConfirmPubId(null)
    setMsg(null)
  }

  const savePub = async () => {
    setMsg(null)
    if (!g.title.trim()) return setMsg({ text: 'give the publication a title first.', error: true })
    if (g.url.trim() && !isHttpUrl(g.url.trim()))
      return setMsg({ text: 'paper url must start with http:// or https://', error: true })

    setBusy(true)
    const row = {
      title: g.title.trim(),
      venue: g.venue.trim(),
      authors: g.authors.trim(),
      summary: g.summary.trim(),
      url: g.url.trim(),
    }
    if (selPubId) {
      const { error } = await supabase.from('publications').update(row).eq('id', selPubId)
      setBusy(false)
      if (error) return setMsg({ text: `couldn't save: ${error.message}`, error: true })
      setMsg({ text: '✓ saved. /projects is updated.', error: false })
    } else {
      const nextOrder = pubs.reduce((m, p) => Math.max(m, p.sort_order), 0) + 10
      const { data, error } = await supabase
        .from('publications')
        .insert({ ...row, sort_order: nextOrder })
        .select('id')
        .single()
      setBusy(false)
      if (error) return setMsg({ text: `couldn't add: ${error.message}`, error: true })
      setSelPubId(data.id)
      setMsg({ text: '✓ added. /projects is updated.', error: false })
    }
    await loadPubs()
  }

  const deletePub = async (id: string) => {
    const { error } = await supabase.from('publications').delete().eq('id', id)
    setConfirmPubId(null)
    if (error) return setMsg({ text: `couldn't delete: ${error.message}`, error: true })
    if (selPubId === id) newPub()
    setMsg({ text: '✓ publication deleted.', error: false })
    await loadPubs()
  }

  const msgLine = msg && <div style={{ color: msg.error ? TEXT_ERROR : ACCENT }}>{msg.text}</div>

  const confirmRow = (onYes: () => void, onNo: () => void) => (
    <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ color: TEXT_DIM }}>delete?</span>
      <button type="button" className="hegli-act hegli-act-yes" style={tinyBtn} onClick={onYes}>
        [y]
      </button>
      <button type="button" className="hegli-act" style={tinyBtn} onClick={onNo}>
        [n]
      </button>
    </span>
  )

  const previewProject = rowToProject({
    id: 'preview',
    tier: f.tier,
    name: f.name.trim() || 'project-name',
    description: f.description || 'What it does or what it is for.',
    stack: parseStack(f.stack),
    updated_label: f.updated_label,
    updated: f.updated.trim() || currentMonthLabel(),
    live_url: isHttpUrl(f.live_url.trim()) ? f.live_url.trim() : null,
    github_url: isHttpUrl(f.github_url.trim()) ? f.github_url.trim() : null,
    sort_order: 0,
  })

  return (
    <div style={{ fontFamily: FONT_MONO }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 13, color: TEXT_MUTED }}>
          <span style={{ color: ACCENT }}>henry@hegli.dev</span>
          <span style={{ color: TEXT_DIM }}>:~/admin/projects$</span> ls -la {view === 'projects' ? 'projects/' : 'publications/'}
        </div>
        <Segmented
          options={[
            { id: 'projects' as const, label: 'projects' },
            { id: 'pubs' as const, label: 'publications' },
          ]}
          value={view}
          onChange={switchView}
        />
      </div>

      {view === 'projects' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
          {/* list */}
          <Pane
            title="projects/ — public /projects page"
            right={
              <button type="button" className="hegli-act" style={{ ...tinyBtn, color: ACCENT }} onClick={newProject}>
                + new project
              </button>
            }
            style={{ flex: '1 1 420px' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 10px 14px' }}
          >
            {TIER_ORDER.map((id) => {
              const items = projects.filter((p) => p.tier === id)
              const tier = TIER_META[id]
              return (
                <div key={id}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '14px 10px 6px' }}>
                    <span style={{ color: TEXT_DIM }}>
                      {tier.heading} ({items.length})
                    </span>
                    <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                  {items.length === 0 && <div style={{ padding: '6px 10px', color: '#45454c' }}>— nothing here yet —</div>}
                  {items.map((p, i) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '9px 10px',
                        borderRadius: 4,
                        background: selId === p.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                      }}
                    >
                      <div
                        style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, cursor: 'pointer' }}
                        onClick={() => editProject(p)}
                      >
                        <span>
                          <span style={{ color: id === 'queued' ? TEXT_MUTED : tier.color, fontSize: 13 }}>{p.name}/</span>
                          &nbsp;
                          <span style={{ color: '#55555c', fontSize: 11 }}>
                            {p.updated_label} {p.updated}
                          </span>
                        </span>
                        <span style={{ color: TEXT_DIM, fontSize: 11 }}>{(p.stack ?? []).join(', ') || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                        {confirmId === p.id ? (
                          confirmRow(() => deleteProject(p.id), () => setConfirmId(null))
                        ) : (
                          <span style={{ display: 'flex', gap: 12 }}>
                            <button
                              type="button"
                              className="hegli-act"
                              style={{ ...tinyBtn, opacity: i === 0 ? 0.3 : 1 }}
                              title="move up"
                              disabled={i === 0}
                              onClick={() => moveProject(p, -1)}
                            >
                              &uarr;
                            </button>
                            <button
                              type="button"
                              className="hegli-act"
                              style={{ ...tinyBtn, opacity: i === items.length - 1 ? 0.3 : 1 }}
                              title="move down"
                              disabled={i === items.length - 1}
                              onClick={() => moveProject(p, 1)}
                            >
                              &darr;
                            </button>
                            <button type="button" className="hegli-act" style={tinyBtn} onClick={() => editProject(p)}>
                              edit
                            </button>
                            <button
                              type="button"
                              className="hegli-act hegli-act-danger"
                              style={tinyBtn}
                              onClick={() => setConfirmId(p.id)}
                            >
                              delete
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </Pane>

          {/* editor */}
          <Pane
            title={selId ? `edit — ${f.name}` : 'new project'}
            right={<span style={{ color: TEXT_DIM }}>{selId ? 'editing' : 'new'}</span>}
            style={{ flex: '1.1 1 460px' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '18px 16px 20px' }}
          >
            <Field label="name" hint="(folder name, shown as name/)">
              <input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={inputStyle} />
            </Field>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: TEXT_DIM }}>tier</span>
              <Segmented
                options={TIER_ORDER.map((id) => ({ id, label: TIER_META[id].adminLabel }))}
                value={f.tier}
                onChange={(tier) => setF({ ...f, tier })}
                colorFor={(id) => TIER_META[id].color}
              />
            </div>

            <Field label="description">
              <textarea
                rows={3}
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>

            <Field label="stack" hint="(comma separated)">
              <input type="text" value={f.stack} onChange={(e) => setF({ ...f, stack: e.target.value })} style={inputStyle} />
            </Field>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
              <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: TEXT_DIM }}>date label</span>
                <Segmented
                  options={DATE_LABELS.map((l) => ({ id: l, label: l }))}
                  value={f.updated_label}
                  onChange={(updated_label) => setF({ ...f, updated_label })}
                />
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <Field label="date shown" hint="(blank = this month)">
                  <input
                    type="text"
                    placeholder="OCT 2026"
                    value={f.updated}
                    onChange={(e) => setF({ ...f, updated: e.target.value })}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>

            <Field label="live site url" hint="(optional)">
              <input
                type="text"
                placeholder="https://"
                value={f.live_url}
                onChange={(e) => setF({ ...f, live_url: e.target.value })}
                style={inputStyle}
              />
            </Field>
            <Field label="github url" hint="(optional)">
              <input
                type="text"
                placeholder="https://github.com/"
                value={f.github_url}
                onChange={(e) => setF({ ...f, github_url: e.target.value })}
                style={inputStyle}
              />
            </Field>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: RULE, paddingTop: 16 }}>
              <span style={{ color: TEXT_DIM }}>preview</span>
              <ProjectCard p={previewProject} tier={TIER_META[f.tier]} />
            </div>

            {msgLine}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, borderTop: RULE, paddingTop: 16 }}>
              <button type="button" onClick={saveProject} disabled={busy} style={{ ...btnStyle, opacity: busy ? 0.5 : 1 }}>
                {busy ? '[ saving… ]' : selId ? '[ save changes ]' : '[ add project ]'}
              </button>
              {selId && (
                <button type="button" className="hegli-act" style={{ ...tinyBtn, color: '#9A9AA0' }} onClick={newProject}>
                  cancel
                </button>
              )}
            </div>
            <span style={{ color: TEXT_DIM, lineHeight: 1.6 }}>saving updates the public /projects page straight away.</span>
          </Pane>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
          <Pane
            title="publications/ — shown under the tiers"
            right={
              <button type="button" className="hegli-act" style={{ ...tinyBtn, color: ACCENT }} onClick={newPub}>
                + new publication
              </button>
            }
            style={{ flex: '1 1 420px' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 10px 14px' }}
          >
            {pubs.length === 0 && <div style={{ padding: '6px 10px', color: '#45454c' }}>— nothing here yet —</div>}
            {pubs.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 4,
                  background: selPubId === p.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                }}
              >
                <div
                  style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, cursor: 'pointer' }}
                  onClick={() => editPub(p)}
                >
                  <span style={{ color: TEXT_PRIMARY, fontSize: 13 }}>{p.title}</span>
                  <span style={{ color: TEXT_DIM, fontSize: 11 }}>{p.venue}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                  {confirmPubId === p.id ? (
                    confirmRow(() => deletePub(p.id), () => setConfirmPubId(null))
                  ) : (
                    <span style={{ display: 'flex', gap: 12 }}>
                      <button type="button" className="hegli-act" style={tinyBtn} onClick={() => editPub(p)}>
                        edit
                      </button>
                      <button
                        type="button"
                        className="hegli-act hegli-act-danger"
                        style={tinyBtn}
                        onClick={() => setConfirmPubId(p.id)}
                      >
                        delete
                      </button>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </Pane>

          <Pane
            title={selPubId ? 'edit publication' : 'new publication'}
            right={<span style={{ color: TEXT_DIM }}>{selPubId ? 'editing' : 'new'}</span>}
            style={{ flex: '1.1 1 460px' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '18px 16px 20px' }}
          >
            <Field label="title">
              <textarea
                rows={2}
                value={g.title}
                onChange={(e) => setG({ ...g, title: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
            <Field label="venue">
              <input type="text" value={g.venue} onChange={(e) => setG({ ...g, venue: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="authors" hint="(lead author et al. style)">
              <input type="text" value={g.authors} onChange={(e) => setG({ ...g, authors: e.target.value })} style={inputStyle} />
            </Field>
            <Field label="short summary">
              <textarea
                rows={3}
                value={g.summary}
                onChange={(e) => setG({ ...g, summary: e.target.value })}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </Field>
            <Field label="paper url" hint="(IEEE Xplore page or DOI)">
              <input type="text" value={g.url} onChange={(e) => setG({ ...g, url: e.target.value })} style={inputStyle} />
            </Field>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: RULE, paddingTop: 16 }}>
              <span style={{ color: TEXT_DIM }}>preview</span>
              <PublicationCard
                pub={rowToPublication({
                  id: 'preview',
                  title: g.title || 'Publication title',
                  venue: g.venue || 'Venue',
                  authors: g.authors,
                  summary: g.summary,
                  url: isHttpUrl(g.url.trim()) ? g.url.trim() : '',
                  sort_order: 0,
                })}
              />
            </div>

            {msgLine}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, borderTop: RULE, paddingTop: 16 }}>
              <button type="button" onClick={savePub} disabled={busy} style={{ ...btnStyle, opacity: busy ? 0.5 : 1 }}>
                {busy ? '[ saving… ]' : selPubId ? '[ save changes ]' : '[ add publication ]'}
              </button>
              {selPubId && (
                <button type="button" className="hegli-act" style={{ ...tinyBtn, color: '#9A9AA0' }} onClick={newPub}>
                  cancel
                </button>
              )}
            </div>
          </Pane>
        </div>
      )}
    </div>
  )
}