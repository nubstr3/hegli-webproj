'use client'

import { useCallback, useEffect, useState } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { TEXT_DIM } from '@/app/components/theme'
import { AsciiScene, Mutable, accentColour, tint, useAnimation } from './AsciiScene'
import { makeBonsai, renderBonsai, stepBonsai } from './asciiSim'

type Day = { contributionCount: number; date: string }

// the tree's size follows this week's GitHub contributions
const sizeFor = (n: number): 1 | 2 | 3 => (n >= 30 ? 3 : n >= 8 ? 2 : 1)

function Tree({ size }: { size: 1 | 2 | 3 }) {
  const [box] = useState(() => new Mutable(makeBonsai(size)))
  const step = useCallback(() => stepBonsai(box.v), [box])
  const { ref } = useAnimation(step, 150, 200)
  return (
    <div ref={ref}>
      <AsciiScene rows={renderBonsai(box.v, accentColour, tint)} label="A bonsai tree" />
    </div>
  )
}

export default function BonsaiWidget(_props: WidgetProps) {
  void _props
  const [week, setWeek] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/github')
      .then((r) => {
        if (!r.ok) throw new Error('github request failed')
        return r.json()
      })
      .then((d) => {
        const weeks: { contributionDays: Day[] }[] = d.data.user.contributionsCollection.contributionCalendar.weeks
        const days = weeks.flatMap((w) => w.contributionDays).slice(-7)
        if (!cancelled) setWeek(days.reduce((n, x) => n + x.contributionCount, 0))
      })
      .catch(() => {
        if (!cancelled) setWeek(-1) // couldn't reach GitHub: show a medium tree
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Pane
      title="bonsai.sh"
      right={<span style={{ color: TEXT_DIM }}>{week === null ? '...' : week < 0 ? 'offline' : `grown by ${week} contributions this week`}</span>}
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {week !== null && <Tree key={week} size={week < 0 ? 2 : sizeFor(week)} />}
    </Pane>
  )
}