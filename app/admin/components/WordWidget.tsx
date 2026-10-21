'use client'

import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, BORDER_SUBTLE, TEXT_FAINT, TEXT_MUTED, TEXT_PRIMARY } from '@/app/components/theme'
import { dateKey, readList, useNow } from './widgetUi'
import { daysUntil, isCountdownItem } from './CountdownWidget'

// [japanese, romaji, meaning]: travel-flavoured, a new one each day
const WORDS: [string, string, string][] = [
  ['ありがとう', 'arigatō', 'thank you'],
  ['すみません', 'sumimasen', 'excuse me / sorry'],
  ['おはよう', 'ohayō', 'good morning'],
  ['こんにちは', 'konnichiwa', 'hello / good afternoon'],
  ['こんばんは', 'konbanwa', 'good evening'],
  ['お願いします', 'onegai shimasu', 'please'],
  ['いくら', 'ikura', 'how much?'],
  ['駅', 'eki', 'station'],
  ['電車', 'densha', 'train'],
  ['切符', 'kippu', 'ticket'],
  ['地図', 'chizu', 'map'],
  ['水', 'mizu', 'water'],
  ['温泉', 'onsen', 'hot spring'],
  ['雪', 'yuki', 'snow'],
  ['寒い', 'samui', 'cold'],
  ['美味しい', 'oishii', 'delicious'],
  ['乾杯', 'kanpai', 'cheers'],
  ['トイレ', 'toire', 'toilet'],
  ['入口', 'iriguchi', 'entrance'],
  ['出口', 'deguchi', 'exit'],
  ['右', 'migi', 'right'],
  ['左', 'hidari', 'left'],
  ['まっすぐ', 'massugu', 'straight ahead'],
  ['宿', 'yado', 'inn / lodging'],
  ['予約', 'yoyaku', 'reservation'],
  ['朝ごはん', 'asagohan', 'breakfast'],
  ['お会計', 'okaikei', 'the bill, please'],
  ['ラーメン', 'rāmen', 'ramen'],
  ['お箸', 'ohashi', 'chopsticks'],
  ['大丈夫', 'daijōbu', "it's okay / I'm fine"],
  ['わかりません', 'wakarimasen', "I don't understand"],
  ['英語', 'eigo', 'English'],
  ['ここ', 'koko', 'here'],
  ['どこ', 'doko', 'where'],
  ['いつ', 'itsu', 'when'],
  ['今日', 'kyō', 'today'],
  ['明日', 'ashita', 'tomorrow'],
  ['昨日', 'kinō', 'yesterday'],
  ['朝', 'asa', 'morning'],
  ['夜', 'yoru', 'night'],
  ['空港', 'kūkō', 'airport'],
  ['バス', 'basu', 'bus'],
  ['道', 'michi', 'road / way'],
  ['山', 'yama', 'mountain'],
  ['海', 'umi', 'sea'],
  ['川', 'kawa', 'river'],
  ['桜', 'sakura', 'cherry blossom'],
  ['神社', 'jinja', 'shrine'],
  ['寺', 'tera', 'temple'],
  ['お土産', 'omiyage', 'souvenir'],
  ['安い', 'yasui', 'cheap'],
  ['高い', 'takai', 'expensive / tall'],
  ['大きい', 'ōkii', 'big'],
  ['小さい', 'chiisai', 'small'],
  ['おやすみ', 'oyasumi', 'good night'],
  ['さようなら', 'sayōnara', 'goodbye'],
  ['楽しい', 'tanoshii', 'fun'],
  ['綺麗', 'kirei', 'beautiful / clean'],
]

export default function WordWidget({ siblings }: WidgetProps) {
  const now = useNow(60_000)
  // the day number since 1970 in local time, so the word changes at local midnight
  const dayNo = now ? Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000) : 0
  const [jp, romaji, en] = WORDS[dayNo % WORDS.length]

  // linked to the countdown widget: shows the nearest upcoming date, if there is one
  const items = readList(siblings.countdown?.items, isCountdownItem) ?? []
  const todayKey = now ? dateKey(now) : ''
  const next = items.filter((i) => i.date >= todayKey).sort((a, b) => a.date.localeCompare(b.date))[0]
  const days = next && now ? daysUntil(next.date, now) : null

  return (
    <Pane
      title="word.of.the.day"
      right={<span style={{ color: TEXT_FAINT }}>日本語</span>}
      bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {now ? (
        <>
          <div style={{ fontSize: 34, lineHeight: 1.2, color: TEXT_PRIMARY }}>{jp}</div>
          <div style={{ color: ACCENT, fontSize: 14 }}>{romaji}</div>
          <div style={{ color: TEXT_MUTED }}>{en}</div>
        </>
      ) : (
        <div style={{ color: TEXT_FAINT }}>loading...</div>
      )}
      {next && days !== null && (
        <div style={{ borderTop: `1px solid ${BORDER_SUBTLE}`, paddingTop: 10, color: TEXT_FAINT, fontSize: 11 }}>
          {days === 0 ? 'today is' : `${days} day${days === 1 ? '' : 's'} until`} <span style={{ color: TEXT_MUTED }}>{next.title}</span>
        </div>
      )}
    </Pane>
  )
}