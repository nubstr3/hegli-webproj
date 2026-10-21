import type { ReactNode } from 'react'
import Pane from './Pane'
import RemindersWidget from './RemindersWidget'
import GitHubWidget from './GitHubWidget'
import SteamWidget from './SteamWidget'
import { TEXT_FAINT, TEXT_MUTED } from '@/app/components/theme'

function Placeholder({ command, status, planned }: { command: string; status: string; planned: string }) {
  return (
    <div style={{ lineHeight: 1.8 }}>
      <div style={{ color: TEXT_FAINT }}>$ {command}</div>
      <div style={{ color: TEXT_MUTED }}>{status}</div>
      <div style={{ color: TEXT_FAINT, marginTop: 14 }}>planned: {planned}</div>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 14 }}>{children}</div>
}

export default function WidgetGrid() {
  return (
    <>
      <Row>
        <RemindersWidget />
        <GitHubWidget />
        <Pane title="stocks.tick" right={<span style={{ color: TEXT_FAINT }}>not wired up</span>}>
          <Placeholder
            command="./stocks --watchlist"
            status="connecting to market feed..."
            planned="Finnhub watchlist with live prices."
          />
        </Pane>
      </Row>

      <Row>
        <SteamWidget />
        <Pane
          title="news.feed"
          right={<span style={{ color: TEXT_FAINT }}>not wired up</span>}
          style={{ flex: '2 1 660px' }}
        >
          <Placeholder
            command="./news --sources lol,overwatch"
            status="fetching patch notes..."
            planned="League of Legends and Overwatch patch notes."
          />
        </Pane>
      </Row>
    </>
  )
}