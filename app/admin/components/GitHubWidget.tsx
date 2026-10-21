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
const LEVELS = ['rgba(255,255,255,0.06)', '#134e4a', '#0f766e', '#14b8a6', ACCENT]

const getColour = (count: number) => {
  if (count === 0) return LEVELS[0]
  if (count < 3) return LEVELS[1]
  if (count < 6) return LEVELS[2]
  if (count < 9) return LEVELS[3]
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

          <div style={{ display: 'flex', gap: 2, overflow: 'hidden', marginBottom: 14, justifyContent: 'flex-end' }}>
            {weeks.slice(-WEEKS_SHOWN).map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.contributionDays.map((day, di) => (
                  <div
                    key={di}
                    title={day.date + ': ' + day.contributionCount + ' contributions'}
                    style={{ width: 7, height: 7, borderRadius: 1, background: getColour(day.contributionCount) }}
                  />
                ))}
              </div>
            ))}
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