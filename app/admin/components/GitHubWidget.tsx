'use client'

import { useState, useEffect } from 'react'
import Pane from './Pane'
import { ACCENT, BORDER_SUBTLE, TEXT_ERROR, TEXT_FAINT } from '@/app/components/theme'

type ContributionDay = {
  contributionCount: number
  date: string
}

type Week = {
  contributionDays: ContributionDay[]
}

type Repo = {
  name: string
  url: string
  pushedAt: string
}

type GitHubResponse = {
  data?: {
    user?: {
      contributionsCollection: {
        contributionCalendar: { totalContributions: number; weeks: Week[] }
      }
      repositories: { nodes: Repo[] }
    }
  }
}

// Only the most recent weeks are drawn so the graph fits the pane.
const WEEKS_SHOWN = 36
// Tiles are shades of the site accent colour, so they follow the accent picker in settings.
const mix = (pct: number) => `color-mix(in srgb, ${ACCENT} ${pct}%, transparent)`
const LEVELS = ['rgba(255,255,255,0.06)', mix(28), mix(50), mix(75), ACCENT]

// Levels are relative to your busiest day in view, so a quiet stretch still shows a spread of shades.
const getColour = (count: number, max: number) => {
  if (count <= 0 || max <= 0) return LEVELS[0]
  const r = count / max
  if (r <= 0.25) return LEVELS[1]
  if (r <= 0.5) return LEVELS[2]
  if (r <= 0.75) return LEVELS[3]
  return LEVELS[4]
}

const timeAgo = (dateStr: string) => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function GitHubWidget() {
  const [weeks, setWeeks] = useState<Week[]>([])
  const [totalContributions, setTotalContributions] = useState(0)
  const [repos, setRepos] = useState<Repo[]>([])
  const [failed, setFailed] = useState(false)
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME ?? 'nubstr3'

  useEffect(() => {
    fetch('/api/github')
      .then((res) => {
        if (!res.ok) throw new Error('github request failed')
        return res.json()
      })
      .then((data: GitHubResponse) => {
        const user = data.data?.user
        if (!user) throw new Error('no github user in response')
        const calendar = user.contributionsCollection.contributionCalendar
        setWeeks(calendar.weeks)
        setTotalContributions(calendar.totalContributions)
        setRepos(user.repositories.nodes)
      })
      .catch(() => setFailed(true))
  }, [])

  const shown = weeks.slice(-WEEKS_SHOWN)
  const max = Math.max(0, ...shown.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)))

  return (
    <Pane
      title="github.log"
      right={
        <a
          href={'https://github.com/' + username}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: TEXT_FAINT, textDecoration: 'none' }}
        >
          profile &rarr;
        </a>
      }
    >
      {failed ? (
        <div style={{ color: TEXT_ERROR }}>couldn&apos;t reach github.</div>
      ) : (
        <>
          <div style={{ color: TEXT_FAINT, marginBottom: 10 }}>{totalContributions} contributions this year</div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${shown.length || 1}, 1fr)`,
              gap: 3,
              marginBottom: 8,
            }}
          >
            {shown.map((week, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateRows: 'repeat(7, auto)', gap: 3 }}>
                {week.contributionDays.map((day, di) => (
                  <div
                    key={di}
                    title={day.date + ': ' + day.contributionCount + ' contributions'}
                    style={{ aspectRatio: '1', borderRadius: 2, background: getColour(day.contributionCount, max) }}
                  />
                ))}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginBottom: 14, color: TEXT_FAINT, fontSize: 11 }}>
            <span style={{ marginRight: 3 }}>less</span>
            {LEVELS.map((c, i) => (
              <span key={i} style={{ width: 9, height: 9, borderRadius: 2, background: c }} />
            ))}
            <span style={{ marginLeft: 3 }}>more</span>
          </div>

          <div
            style={{
              borderTop: `1px solid ${BORDER_SUBTLE}`,
              paddingTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {repos.map((repo) => (
              <div key={repo.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: ACCENT, textDecoration: 'none' }}
                >
                  {repo.name}
                </a>
                <span style={{ color: TEXT_FAINT }}>{timeAgo(repo.pushedAt)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Pane>
  )
}