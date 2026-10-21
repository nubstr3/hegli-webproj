'use client'

import { useState } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { linkBtn, useNow } from './widgetUi'

// [quote, who said it (empty = just a saying)]
const QUOTES: [string, string][] = [
  ['There are only two hard things in computer science: cache invalidation and naming things.', 'Phil Karlton'],
  ['Premature optimization is the root of all evil.', 'Donald Knuth'],
  ['Make it work, make it right, make it fast.', 'Kent Beck'],
  ['Talk is cheap. Show me the code.', 'Linus Torvalds'],
  ['Simplicity is prerequisite for reliability.', 'Edsger Dijkstra'],
  ['The best way to predict the future is to invent it.', 'Alan Kay'],
  ['Any fool can write code that a computer can understand. Good programmers write code that humans can understand.', 'Martin Fowler'],
  ['First, solve the problem. Then, write the code.', 'John Johnson'],
  ['It always takes longer than you expect, even when you take into account Hofstadter’s Law.', 'Douglas Hofstadter'],
  ['Programs must be written for people to read, and only incidentally for machines to execute.', 'Abelson & Sussman'],
  ['Commit early. Commit often. Blame later.', ''],
  ['It works on my machine. Ship the machine.', ''],
  ['Delete code. It is the only change that never has bugs.', ''],
  ['Read the error message. Then read it again, slowly.', ''],
  ['Weeks of coding can save you hours of planning.', ''],
  ['A bug is just an undocumented feature with bad PR.', ''],
  ['Today’s quick hack is tomorrow’s legacy code.', ''],
  ['Done is better than perfect, but tested is better than done.', ''],
  ['Drink water. Stretch. Push to a branch.', ''],
  ['If it hurts, do it more often, until it stops hurting.', ''],
  ['Take a break. The bug will still be there, but you’ll be less tired.', ''],
  ['There is no cloud. It’s just someone else’s computer.', ''],
  ['Ship small. Ship often. Fix forward.', ''],
  ['Naming is hard. Rename until it’s obvious.', ''],
  ['Off-by-one errors are the second most common bug. The first is off-by-one errors.', ''],
  ['A little copying is better than a little dependency.', 'Go proverb'],
  ['Debugging is twice as hard as writing the code in the first place.', 'Brian Kernighan'],
  ['Walking on water and developing software from a specification are easy if both are frozen.', 'Edward V. Berard'],
  ['The only way to go fast is to go well.', 'Robert C. Martin'],
  ['Be conservative in what you send, liberal in what you accept.', 'Postel’s law'],
]

export default function FortuneWidget(_props: WidgetProps) {
  void _props
  const now = useNow(60_000)
  const dayNo = now ? Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000) : 0
  const [shift, setShift] = useState(0) // "another" steps through the list from today's pick
  const [quote, who] = QUOTES[(dayNo + shift) % QUOTES.length]

  return (
    <Pane
      title="fortune"
      right={
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: TEXT_FAINT }} onClick={() => setShift((s) => s + 1)}>
          another
        </button>
      }
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div style={{ color: TEXT_FAINT }}>
        <span style={{ color: ACCENT }}>$</span> fortune
      </div>
      {now ? (
        <>
          <div style={{ color: TEXT_PRIMARY, lineHeight: 1.7 }}>{quote}</div>
          {who && <div style={{ color: TEXT_MUTED }}>&mdash; {who}</div>}
        </>
      ) : (
        <div style={{ color: TEXT_FAINT }}>...</div>
      )}
    </Pane>
  )
}