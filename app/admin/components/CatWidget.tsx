'use client'

import { useCallback, useState } from 'react'
import Pane from './Pane'
import type { WidgetProps } from './widgetTypes'
import { ACCENT, TEXT_DIM } from '@/app/components/theme'
import { AsciiScene, Mutable, tint, useAnimation } from './AsciiScene'
import { makeCat, petCat, renderCat, stepCat, type CatLook } from './asciiSim'
import { linkBtn } from './widgetUi'

export default function CatWidget({ config, onConfigChange }: WidgetProps) {
  const look: CatLook = config.look === 'tabby' ? 'tabby' : 'line'
  const [box] = useState(() => new Mutable(makeCat()))
  const step = useCallback(() => stepCat(box.v), [box])
  const { ref, bump } = useAnimation(step, 150, 0)
  const pet = () => {
    petCat(box.v)
    bump()
  }
  const status = box.v.mode === 'sleep' ? 'zzz' : box.v.mode === 'purr' ? 'purring' : 'awake'

  return (
    <Pane title="sleepy.cat" right={<span style={{ color: TEXT_DIM }}>{status}</span>} bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div ref={ref}>
        <AsciiScene rows={renderCat(box.v, tint, look)} onClick={pet} label={`A cat that is ${status}`} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 'auto' }}>
        <button type="button" className="hegli-act" style={{ ...linkBtn, color: ACCENT }} onClick={pet}>
          [ pet ]
        </button>
        <button
          type="button"
          className="hegli-act"
          style={{ ...linkBtn, color: TEXT_DIM }}
          onClick={() => onConfigChange({ ...config, look: look === 'tabby' ? 'line' : 'tabby' })}
        >
          look: {look === 'tabby' ? 'orange tabby' : 'line + classic'} &#9656;
        </button>
      </div>
    </Pane>
  )
}