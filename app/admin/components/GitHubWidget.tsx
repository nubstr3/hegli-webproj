'use client'

import { useState, useEffect } from 'react'

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

export default function GitHubWidget() {
  const [weeks, setWeeks] = useState<Week[]>([])
  const [totalContributions, setTotalContributions] = useState(0)
  const [repos, setRepos] = useState<Repo[]>([])
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME

  useEffect(() => {
    fetch('/api/github')
      .then(res => res.json())
      .then(data => {
        const calendar = data.data.user.contributionsCollection.contributionCalendar
        setWeeks(calendar.weeks)
        setTotalContributions(calendar.totalContributions)
        setRepos(data.data.user.repositories.nodes)
      })
  }, [])

  const getColour = (count: number) => {
    if (count === 0) return '#ebedf0'
    if (count < 3) return '#9be9a8'
    if (count < 6) return '#40c463'
    if (count < 9) return '#30a14e'
    return '#216e39'
  }

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  const widgetStyle = {
    background: 'var(--background)',
    border: '0.5px solid #e5e5e5',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
  }

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  }

  const graphStyle = {
    display: 'flex',
    gap: '2px',
    overflowX: 'auto' as const,
    marginBottom: '12px',
  }

  const repoListStyle = {
    borderTop: '0.5px solid #e5e5e5',
    paddingTop: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  }

  return (
    <div style={widgetStyle}>
      <div style={headerStyle}>
        <p style={{ fontSize: '12px', color: '#888', margin: '0' }}>GitHub activity</p>
        
          <a href={'https://github.com/' + username}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '11px', color: '#185FA5', textDecoration: 'none' }}
        >
          View profile →
        </a>
      </div>

      <p style={{ fontSize: '11px', color: '#888', margin: '0 0 8px' }}>
        {totalContributions} contributions this year
      </p>

      <div style={graphStyle}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column' as const, gap: '2px' }}>
            {week.contributionDays.map((day, di) => (
              <div
                key={di}
                title={day.date + ': ' + day.contributionCount + ' contributions'}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  background: getColour(day.contributionCount),
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div style={repoListStyle}>
        {repos.map((repo) => (
          <div key={repo.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
              <a href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: '#185FA5', textDecoration: 'none' }}
            >
              {repo.name}
            </a>
            <p style={{ fontSize: '11px', color: '#aaa', margin: '0' }}>
              {timeAgo(repo.pushedAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}