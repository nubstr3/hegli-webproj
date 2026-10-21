// Tiny simulations for the animated widgets (aquarium, bonsai, cat). Everything is drawn into a grid of
// text cells; "pixel" art uses half blocks so each cell holds two stacked pixels. No dependencies.

export type Tint = (alpha: number) => string

type Cell = { ch: string; c: string; bg: string } | null
type Grid = Cell[][]
export type Run = { t: string; c: string; bg: string }
export type Row = { runs: Run[] }

// ---- helpers ----

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const makeGrid = (w: number, h: number): Grid => Array.from({ length: h }, () => Array<Cell>(w).fill(null))

function put(g: Grid, x: number, y: number, ch: string, c: string, bg = 'transparent') {
  const xi = Math.round(x)
  const yi = Math.round(y)
  if (yi < 0 || yi >= g.length || xi < 0 || xi >= g[0].length) return
  g[yi][xi] = { ch, c, bg }
}

function putStr(g: Grid, x: number, y: number, s: string, c: string) {
  for (let i = 0; i < s.length; i++) if (s[i] !== ' ') put(g, x + i, y, s[i], c)
}

// rows = strings of palette letters ('.' = empty); pal maps letter -> colour; (tx, ty) are text cells
function drawPx(g: Grid, tx: number, ty: number, rows: string[], pal: Record<string, string>, flip = false) {
  const R = rows.map((r) => (flip ? r.split('').reverse().join('') : r))
  for (let j = 0; j * 2 < R.length; j++) {
    for (let x = 0; x < R[0].length; x++) {
      const a = pal[(R[2 * j] ?? '')[x]] ?? null
      const b = pal[(R[2 * j + 1] ?? '')[x]] ?? null
      if (!a && !b) continue
      if (a && b) {
        if (a === b) put(g, tx + x, ty + j, '█', a)
        else put(g, tx + x, ty + j, '▀', a, b)
      } else if (a) put(g, tx + x, ty + j, '▀', a)
      else put(g, tx + x, ty + j, '▄', b as string)
    }
  }
}

function toRows(g: Grid): Row[] {
  return g.map((row) => {
    const runs: Run[] = []
    for (const cell of row) {
      const ch = cell ? cell.ch : ' '
      const c = cell ? cell.c : 'transparent'
      const bg = cell ? cell.bg : 'transparent'
      const last = runs[runs.length - 1]
      if (last && last.c === c && last.bg === bg) last.t += ch
      else runs.push({ t: ch, c, bg })
    }
    return { runs }
  })
}

// ---- aquarium ----

const FISH = {
  tiny: ['..XX..', 'X.XXeX', 'X.XXXX', '..XX..'],
  mid: ['..XXXX....', 'X.XXXXXX..', 'XXXXXXXXeX', 'XXXXXXXXXX', 'X.XXXXXX..', '..XXXX....'],
  big: ['....XXX.....', 'X..XsXXXXX..', 'XXXXsXXXXXX.', 'XXXXsXXXXXeX', 'X..XsXXXXX..', '....XXX.....'],
}
type FishKind = keyof typeof FISH
type Fish = { kind: FishKind; w: number; h: number; x: number; y: number; ty: number; dir: 1 | -1; speed: number; ci: number }
type Bubble = { x: number; y: number }
type Flake = { x: number; y: number; age: number }

export type Aqua = {
  W: number
  H: number
  r: () => number
  fish: Fish[]
  bubbles: Bubble[]
  food: Flake[]
  t: number
  sand: string[]
  weeds: { x: number; h: number }[]
}

export function makeAqua(): Aqua {
  const r = rng(11)
  const W = 36
  const H = 13
  const kinds: FishKind[] = ['big', 'mid', 'mid', 'tiny', 'tiny', 'tiny']
  const ys = [2, 6, 4, 8, 3, 7]
  const fish: Fish[] = kinds.map((k, i) => ({
    kind: k,
    w: FISH[k][0].length,
    h: FISH[k].length / 2,
    x: 1 + i * 5.5,
    y: ys[i],
    ty: ys[i],
    dir: r() < 0.5 ? 1 : -1,
    speed: k === 'big' ? 0.14 : k === 'mid' ? 0.2 : 0.28,
    ci: i,
  }))
  const sand = Array.from({ length: W }, () => (r() < 0.3 ? '#4A4A50' : '#33333a'))
  return { W, H, r, fish, bubbles: [], food: [], t: 0, sand, weeds: [{ x: 4, h: 4 }, { x: 15, h: 5 }, { x: 30, h: 4 }] }
}

export function stepAqua(a: Aqua) {
  const { r, W, H } = a
  a.t++
  for (const f of a.fish) {
    const maxY = H - 2 - f.h
    let target: Flake | null = null
    let best = 14
    for (const fl of a.food) {
      const d = Math.abs(fl.x - (f.x + f.w / 2))
      if (d < best) {
        best = d
        target = fl
      }
    }
    if (target) {
      f.dir = target.x >= f.x + f.w / 2 ? 1 : -1
      f.x += f.dir * f.speed * 1.8
      const wantY = target.y - f.h / 2
      f.y += Math.sign(wantY - f.y) * Math.min(0.35, Math.abs(wantY - f.y))
      if (Math.abs(target.x - (f.x + f.w / 2)) < 2.5 && Math.abs(target.y - (f.y + f.h / 2)) < 1.6) {
        const eaten = target
        a.food = a.food.filter((x) => x !== eaten)
        a.bubbles.push({ x: f.dir > 0 ? f.x + f.w : f.x - 1, y: f.y })
      }
    } else {
      f.x += f.dir * f.speed
      if (f.x < 0) {
        f.x = 0
        f.dir = 1
      }
      if (f.x + f.w > W) {
        f.x = W - f.w
        f.dir = -1
      }
      if (r() < 0.02) f.ty = 2 + Math.floor(r() * (maxY - 1))
      f.y += Math.sign(f.ty - f.y) * Math.min(0.1, Math.abs(f.ty - f.y))
    }
    f.x = Math.max(0, Math.min(W - f.w, f.x))
    f.y = Math.max(1, Math.min(maxY, f.y))
    if (r() < 0.012) a.bubbles.push({ x: f.dir > 0 ? f.x + f.w : f.x - 1, y: f.y })
  }
  if (r() < 0.07) {
    const w = a.weeds[Math.floor(r() * a.weeds.length)]
    a.bubbles.push({ x: w.x, y: H - 3 })
  }
  for (const b of a.bubbles) {
    b.y -= 0.22
    if (r() < 0.12) b.x += r() < 0.5 ? -1 : 1
  }
  a.bubbles = a.bubbles.filter((b) => b.y > 1)
  for (const fl of a.food) fl.y = Math.min(H - 3, fl.y + 0.18)
  a.food = a.food.filter((fl) => fl.age++ < 160)
}

export function feedAqua(a: Aqua) {
  for (let i = 0; i < 5; i++) a.food.push({ x: 4 + a.r() * (a.W - 8), y: 1 + a.r() * 1.2, age: 0 })
}

export function renderAqua(a: Aqua, accent: string, tint: Tint): Row[] {
  const { W, H, t } = a
  const g = makeGrid(W, H)
  const body = [accent, tint(0.75), tint(0.55), '#FFB454', '#ECECEA', tint(0.65)]
  const WAVE = '▁▂▃▂▁▁'
  for (let x = 0; x < W; x++) put(g, x, 0, WAVE[(x + Math.floor(t / 2)) % WAVE.length], tint(0.4))
  for (let x = 0; x < W; x++) put(g, x, H - 1, '▄', a.sand[x])
  a.weeds.forEach((w, wi) => {
    for (let i = 0; i < w.h; i++) put(g, w.x, H - 2 - i, (Math.floor(t / 5) + i + wi) % 2 === 0 ? '▌' : '▐', tint(0.38))
  })
  for (const b of a.bubbles) put(g, b.x, b.y, b.y < 3 ? '·' : 'o', '#6B6B72')
  for (const fl of a.food) put(g, fl.x, fl.y, '▪', '#FFB454')
  for (const f of a.fish) {
    const c = body[f.ci % body.length]
    drawPx(g, Math.round(f.x), Math.round(f.y), FISH[f.kind], { X: c, s: 'rgba(13,13,16,0.35)', e: '#0D0D10' }, f.dir < 0)
  }
  return toRows(g)
}

// ---- bonsai (a cloud-pruned tree in blocks) ----

const WOOD = '#B08968'
type BCell = { x: number; y: number; ch: string; kind: 'wood' | 'leaf'; ph: number }
export type Bonsai = { W: number; H: number; cells: BCell[]; shown: number; t: number; r: () => number; fall: Bubble | null }

/** size: 1 = sapling, 2 = small tree, 3 = full tree (three foliage pads) */
export function makeBonsai(size: 1 | 2 | 3): Bonsai {
  const r = rng(2026)
  const W = 36
  const H = 16
  const cx = 18
  const trunkH = size === 1 ? 4 : size === 2 ? 6 : 8
  const bend = [0, 0, 1, 1, 1, 0, 0, -1]
  const cells: BCell[] = []
  const seen = new Set<string>()
  const add = (x: number, y: number, ch: string, kind: 'wood' | 'leaf') => {
    const k = x + ',' + y
    if (x < 0 || x >= W || y < 0 || y > H - 3 || (seen.has(k) && kind === 'leaf')) return
    seen.add(k)
    cells.push({ x, y, ch, kind, ph: Math.floor(r() * 9) })
  }
  let tx = cx
  for (let i = 0; i < trunkH; i++) {
    tx += bend[i % bend.length]
    const y = H - 3 - i
    add(tx, y, '█', 'wood')
    add(tx + 1, y, '█', 'wood')
    if (i === 0) {
      add(tx - 1, y, '▄', 'wood')
      add(tx + 2, y, '▄', 'wood')
    }
  }
  const topY = H - 3 - trunkH
  const pads = [{ x: tx + 1, y: topY - 1, rx: 7, ry: 3 }]
  if (size >= 2) pads.push({ x: tx - 7, y: topY + 3, rx: 5, ry: 2 })
  if (size >= 3) pads.push({ x: tx + 9, y: topY + 2, rx: 5.5, ry: 2.2 })
  if (size === 1) {
    pads[0].rx = 4
    pads[0].ry = 2
  }
  pads.slice(1).forEach((p) => {
    const dir = p.x < tx ? -1 : 1
    let bx = tx + (dir > 0 ? 2 : -1)
    let by = topY + 4
    while (Math.abs(bx - p.x) > 1 && by > p.y) {
      add(bx, by, '▀', 'wood')
      bx += dir
      if ((bx + by) % 2 === 0) by -= 1
    }
  })
  pads.forEach((p) => {
    for (let y = Math.floor(p.y - p.ry); y <= Math.ceil(p.y + p.ry); y++) {
      for (let x = Math.floor(p.x - p.rx); x <= Math.ceil(p.x + p.rx); x++) {
        const e = ((x - p.x) / p.rx) ** 2 + ((y - p.y) / p.ry) ** 2
        if (e > 1) continue
        const ch = e > 0.72 ? (r() < 0.5 ? '▒' : '▓') : e > 0.4 ? (r() < 0.25 ? '▓' : '█') : '█'
        add(x, y, ch, 'leaf')
      }
    }
  })
  cells.sort((a, b) => b.y - a.y) // grows upward from the pot
  return { W, H, cells, shown: 0, t: 0, r, fall: null }
}

export function stepBonsai(b: Bonsai) {
  b.t++
  if (b.shown < b.cells.length) {
    b.shown = Math.min(b.cells.length, b.shown + 4)
    return
  }
  if (!b.fall && b.r() < 0.02) {
    const leaves = b.cells.filter((c) => c.kind === 'leaf' && c.ch !== '█')
    if (leaves.length) {
      const l = leaves[Math.floor(b.r() * leaves.length)]
      b.fall = { x: l.x, y: l.y }
    }
  } else if (b.fall) {
    b.fall.y += 0.28
    b.fall.x += Math.sin(b.t / 3) * 0.35
    if (b.fall.y >= b.H - 3) b.fall = null
  }
}

export function renderBonsai(b: Bonsai, accent: string, tint: Tint): Row[] {
  const g = makeGrid(b.W, b.H)
  const grown = b.shown >= b.cells.length
  for (let i = 0; i < b.shown; i++) {
    const c = b.cells[i]
    if (c.kind === 'wood') {
      put(g, c.x, c.y, c.ch, WOOD)
      continue
    }
    let ch = c.ch
    if (grown && ch !== '█' && (Math.floor(b.t / (6 + (c.ph % 4))) + c.ph) % 3 === 0) ch = ch === '▓' ? '▒' : '▓' // edges shimmer
    put(g, c.x, c.y, ch, ch === '█' ? accent : ch === '▓' ? tint(0.75) : tint(0.5))
  }
  if (b.fall) put(g, b.fall.x, b.fall.y, '▪', tint(0.6))
  const mid = Math.floor(b.W / 2)
  putStr(g, mid - 7, b.H - 2, '▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄', '#6B6B72')
  putStr(g, mid - 6, b.H - 1, '▀█████████████▀', '#55555c')
  return toRows(g)
}

// ---- cat: line drawing while asleep, the classic stick cat once awake ----

type Eyes = 'open' | 'blink' | 'happy'
const eyeText = (e: Eyes) => (e === 'open' ? 'o.o' : e === 'blink' ? '-.-' : '^.^')
const CAT_SLEEP_IN = ['', '  /\\_/\\', ' ( -.- )__________', ' ╭╯               ╰╮', ' │                  │~', ' ╰──────────────────╯']
const CAT_SLEEP_OUT = ['', '  /\\_/\\', ' ( -.- ) _________', ' ╭╯               ╰╮', ' │                  │ ~', ' ╰──────────────────╯']
const catAwake = (eyes: Eyes, tail: boolean) => [
  '',
  '   /\\_/\\',
  `  ( ${eyeText(eyes)} )`,
  '   > ^ <',
  '   /|   |\\',
  `  (_|___|_)_${tail ? '~' : 's'}`,
]
const HEART = ['.X.X.', 'XXXXX', '.XXX.', '..X..']

// the orange tabby: pixel art in half blocks, with blue eyes
const CAT_SLEEP_PX = [
  '.X....X..................',
  '.XX..XX..................',
  '.XXSXSX.........XXXXXX...',
  'XXXXXXXXX....XXXXXXXXXXX.',
  'XkkXXkkXXXXXXXXXXXXXXXXXX',
  'XXXXXXXXXXXXXXXXXXXXXXXXX',
  '.XXXXXXXXXXXXXXXXXXXXXXXX',
  '..XXXXXXXXXXXXXXXXXXXXXXX',
  '...XXXXXXXXXXXXXXXXXXXXXX',
  '....XXXXXXXXXXXXXXXXXXXX.',
].map((r, y) =>
  r
    .split('')
    .map((ch, x) => (ch === 'X' && x >= 11 && y >= 2 && (x + 2 * y) % 4 === 0 ? 'S' : ch))
    .join(''),
)
// breathing out: the back sits one pixel lower
const CAT_SLEEP_PX_OUT = CAT_SLEEP_PX.map((r, y) => (y === 2 || y === 3 ? r.slice(0, 12) + '.'.repeat(r.length - 12) : r))

function catAwakePx(eyes: Eyes, tail: boolean): string[] {
  const base = [
    '..X........X..  ',
    '..XX......XX..  ',
    '..XXXXXXXXXX..  ',
    '.XXXSXXXXSXXX.  ',
    '.XXXXSXXSXXXX.  ',
    '.XXXXXXXXXXXX.  ',
    '..XXLLnnLLXX..  ',
    '...XXLLLLXX...  ',
    '..XXXXXXXXXX...',
    '.XXSXXSXXSXXXX..',
    '.XXXSXXSXXSXXX..',
    '.XXSXXSXXSXX....',
    '..XX......XX....',
    '..XX......XX....',
  ]
  const rows = base.map((r) => r.padEnd(16, '.').split(''))
  const set = (y: number, x: number, ch: string) => {
    rows[y][x] = ch
  }
  if (eyes === 'open') {
    set(4, 3, 'e')
    set(4, 10, 'e')
  } else if (eyes === 'blink') {
    set(5, 3, 'k')
    set(5, 10, 'k')
  } else {
    set(3, 4, 'k')
    set(3, 9, 'k')
    set(4, 3, 'k')
    set(4, 10, 'k')
  }
  ;(tail ? [9, 10, 11] : [8, 9, 10]).forEach((y, i) => set(y, 14, i === 1 ? 'S' : 'X'))
  set(tail ? 12 : 7, 15, 'S')
  return rows.map((r) => r.join(''))
}
const TABBY = { X: '#E8913A', S: '#B8641A', L: '#F7D3A0', k: '#6B3A12', e: '#5AB0FF', n: '#F4A6B7' }

export type CatLook = 'line' | 'tabby'

export type Cat = { t: number; mode: 'sleep' | 'awake' | 'purr'; since: number }
export const makeCat = (): Cat => ({ t: 0, mode: 'sleep', since: 0 })

export function stepCat(c: Cat) {
  c.t++
  c.since++
  if (c.mode === 'awake' && c.since > 60) {
    c.mode = 'sleep'
    c.since = 0
  }
  if (c.mode === 'purr' && c.since > 50) {
    c.mode = 'awake'
    c.since = 0
  }
}

export function petCat(c: Cat) {
  c.mode = c.mode === 'sleep' ? 'awake' : 'purr'
  c.since = 0
}

export function renderCat(c: Cat, tint: Tint, look: CatLook): Row[] {
  const g = makeGrid(34, 11)
  const body = '#ECECEA'
  const RED = '#F87171'
  const tabby = look === 'tabby'
  const eyes: Eyes = c.mode === 'purr' ? 'happy' : c.t % 34 > 31 ? 'blink' : 'open'
  const tail = Math.floor(c.t / 6) % 2 === 0
  if (c.mode === 'sleep') {
    const breathIn = Math.floor(c.t / 9) % 2 === 0
    if (tabby) drawPx(g, 4, 5, breathIn ? CAT_SLEEP_PX : CAT_SLEEP_PX_OUT, TABBY)
    else (breathIn ? CAT_SLEEP_IN : CAT_SLEEP_OUT).forEach((line, i) => putStr(g, 5, i + 4, line, body))
    const on = Math.floor(c.t / 7) % 4
    const zs: [string, number, number][] = [['z', 16, 4], ['Z', 19, 3], ['z', 22, 2]]
    zs.forEach(([ch, x, y], i) => {
      if (i < on || on === 0) put(g, x, y, ch, tint(0.35 + 0.2 * i))
    })
  } else {
    if (tabby) drawPx(g, 9, 3, catAwakePx(eyes, tail), TABBY)
    else catAwake(eyes, tail).forEach((line, i) => putStr(g, 10, i + 3, line, body))
    if (c.mode === 'purr') {
      for (let i = 0; i < 3; i++) {
        const age = (c.since + i * 9) % 27
        drawPx(g, 3 + i * 11 + Math.round(Math.sin((c.since + i * 5) / 4) * 1.5), 2 - Math.floor(age / 13), HEART, { X: RED })
      }
    }
  }
  return toRows(g)
}