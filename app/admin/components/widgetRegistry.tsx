import type { ComponentType } from 'react'
import RemindersWidget from './RemindersWidget'
import GitHubWidget from './GitHubWidget'
import SteamWidget from './SteamWidget'
import ClockWidget from './ClockWidget'
import type { WidgetProps } from './widgetTypes'

export type WidgetSize = 'normal' | 'wide'

export type WidgetDef = {
  type: string // stored in the dashboard_widgets table
  title: string // shown in the add-widget picker
  description: string
  tag: 'READY' | 'NO SETUP' | 'NEEDS API KEY' | 'EXPERIMENTAL'
  defaultSize: WidgetSize
  Component: ComponentType<WidgetProps>
}

/**
 * Every widget the dashboard can show. To add a new one: build the component
 * (a <Pane> like the others), then add one entry here.
 */
export const WIDGETS: WidgetDef[] = [
  {
    type: 'reminders',
    title: 'reminders.sh',
    description: 'A quick to-do list with colour tags.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: RemindersWidget,
  },
  {
    type: 'github',
    title: 'github.log',
    description: 'Contribution heatmap and your most recently pushed repos.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: GitHubWidget,
  },
  {
    type: 'steam',
    title: 'steam.deals',
    description: 'Current Steam discounts.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: SteamWidget,
  },
  {
    type: 'clock',
    title: 'world.clock',
    description: 'Current time in the cities you choose. Handy for Japan.',
    tag: 'NO SETUP',
    defaultSize: 'normal',
    Component: ClockWidget,
  },
]

export const widgetByType = (type: string) => WIDGETS.find((w) => w.type === type)