import type { ComponentType } from 'react'
import RemindersWidget from './RemindersWidget'
import GitHubWidget from './GitHubWidget'
import SteamWidget from './SteamWidget'
import ClockWidget from './ClockWidget'
import WeatherWidget from './WeatherWidget'
import FxWidget from './FxWidget'
import CountdownWidget from './CountdownWidget'
import FocusWidget from './FocusWidget'
import HackerNewsWidget from './HackerNewsWidget'
import SunMoonWidget from './SunMoonWidget'
import LinksWidget from './LinksWidget'
import HabitsWidget from './HabitsWidget'
import RecentFilesWidget from './RecentFilesWidget'
import WordWidget from './WordWidget'
import FortuneWidget from './FortuneWidget'
import AquariumWidget from './AquariumWidget'
import BonsaiWidget from './BonsaiWidget'
import CatWidget from './CatWidget'
import type { WidgetProps } from './widgetTypes'

// width in thirds of a row: normal = 1, semi = 1.5, wide = 2, huge = 3 (the whole row)
export type WidgetSize = 'normal' | 'semi' | 'wide' | 'huge'
export type WidgetHeight = 'auto' | 'short' | 'medium' | 'tall'

export type WidgetDef = {
  type: string // stored in the dashboard_widgets table
  title: string // shown in the add-widget picker
  description: string
  tag: 'READY' | 'NO SETUP' | 'NEEDS SQL' | 'NEEDS API KEY' | 'EXPERIMENTAL'
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
  {
    type: 'weather',
    title: 'weather.now',
    description: 'Current conditions and a 5-day forecast for any city.',
    tag: 'NO SETUP',
    defaultSize: 'normal',
    Component: WeatherWidget,
  },
  {
    type: 'fx',
    title: 'fx.rates',
    description: 'Exchange rates with a 30-day trend, and a quick converter.',
    tag: 'NO SETUP',
    defaultSize: 'normal',
    Component: FxWidget,
  },
  {
    type: 'countdown',
    title: 'countdown',
    description: 'Days until the dates you set, like a trip. Set a title and a date and leave it.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: CountdownWidget,
  },
  {
    type: 'focus',
    title: 'focus.timer',
    description: 'Pomodoro timer. The countdown shows in the browser tab while it runs.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: FocusWidget,
  },
  {
    type: 'hn',
    title: 'hn.top',
    description: 'The Hacker News front page, refreshed every 10 minutes.',
    tag: 'NO SETUP',
    defaultSize: 'normal',
    Component: HackerNewsWidget,
  },
  {
    type: 'sunmoon',
    title: 'sun.moon',
    description: 'Sunrise, sunset, daylight length and the moon phase.',
    tag: 'NO SETUP',
    defaultSize: 'normal',
    Component: SunMoonWidget,
  },
  {
    type: 'links',
    title: 'quick.links',
    description: 'A launcher for your own sites and dashboards.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: LinksWidget,
  },
  {
    type: 'habits',
    title: 'habits.streak',
    description: 'Tick off daily habits and keep streaks. Missed days can be filled in later.',
    tag: 'NEEDS SQL',
    defaultSize: 'normal',
    Component: HabitsWidget,
  },
  {
    type: 'recentfiles',
    title: 'recent.files',
    description: 'Your latest uploads and notes.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: RecentFilesWidget,
  },
  {
    type: 'word',
    title: 'word.of.the.day',
    description: 'A new Japanese word each day. Shows days left on your countdown too.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: WordWidget,
  },
  {
    type: 'fortune',
    title: 'fortune',
    description: 'A daily programmer-flavoured quote, with another on demand.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: FortuneWidget,
  },
  {
    type: 'aquarium',
    title: 'aquarium.sh',
    description: 'Pixel fish swimming in a little tank. Click to drop food.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: AquariumWidget,
  },
  {
    type: 'bonsai',
    title: 'bonsai.sh',
    description: 'A bonsai that grows with your GitHub contributions this week.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: BonsaiWidget,
  },
  {
    type: 'cat',
    title: 'sleepy.cat',
    description: 'A cat that sleeps. Wake it up and give it a pet.',
    tag: 'READY',
    defaultSize: 'normal',
    Component: CatWidget,
  },
]

export const widgetByType = (type: string) => WIDGETS.find((w) => w.type === type)