'use client'

import { useCallback, useState } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, TEXT_DIM } from '@/app/components/theme'
import { AsciiScene, Mutable, accentColour, tint, useAnimation } from './AsciiScene'
import { feedAqua, makeAqua, renderAqua, stepAqua } from './asciiSim'
import { linkBtn } from './widgetUi'

export default function AquariumWidget(_props: WidgetProps) {
  void _props
  const [box] = useState(() => {
    const a = makeAqua()
    for (let i = 0; i < 30; i++) stepAqua(a) // so the fish aren't bunched up at the start
    return new Mutable(a)
  })
  const step = useCallback(() => stepAqua(box.v), [box])
  const { ref, bump } = useAnimation(step, 150)
  const feed = () => {
    feedAqua(box.v)
    bump()
  }

  return (
    <Pane title="aquarium.sh" right={<span style={{ color: TEXT_DIM }}>{box.v.fish.length} fish</span>} bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div ref={ref}>
        <AsciiScene rows={renderAqua(box.v, accentColour, tint)} onClick={feed} label="An aquarium with fish swimming" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 'auto' }}>
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: ACCENT }} onClick={feed}>
          [ feed ]
        </button>
        <span style={{ color: TEXT_DIM }}>click the tank to drop food</span>
      </div>
    </Pane>
  )
}