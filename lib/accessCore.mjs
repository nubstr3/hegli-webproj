// Server-only helpers for the access-code system (private pages such as /travel).
// Never import this from a client component: it uses the Supabase service role key.
//
// Needs two env vars (neither starts with NEXT_PUBLIC_, so they never reach the browser):
//   SUPABASE_SERVICE_ROLE_KEY   Supabase > Project Settings > API > service_role
//   ACCESS_CODE_PEPPER          a long random secret used to hash codes (changing it breaks every code)

import { createHmac, createHash, randomBytes, randomInt } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { normalizeCode } from './accessFormat.mjs'

// ---- settings you might want to change ----
export const SESSION_COOKIE = 'hegli_access'
export const SESSION_DAYS = 30 // how long a login lasts (a code's own expiry can shorten it)
export const MAX_MISSES_PER_IP = 10 // wrong code-shaped guesses allowed per visitor...
export const IP_WINDOW_MINUTES = 10 // ...in this many minutes
export const MAX_MISSES_GLOBAL = 100 // wrong guesses allowed from everyone combined...
export const GLOBAL_WINDOW_MINUTES = 60 // ...in this many minutes

const WORDS = [
  'amber', 'anchor', 'apple', 'arrow', 'aspen', 'atlas', 'aurora', 'autumn',
  'badger', 'bamboo', 'banner', 'basil', 'beacon', 'birch', 'bison', 'blossom',
  'breeze', 'bridge', 'brook', 'cabin', 'canyon', 'cedar', 'cherry', 'cider',
  'cinder', 'clover', 'cobalt', 'comet', 'copper', 'coral', 'cove', 'crane',
  'creek', 'crimson', 'daisy', 'dawn', 'delta', 'dune', 'eagle', 'ember',
  'falcon', 'fern', 'fjord', 'flint', 'forest', 'fox', 'frost', 'garden',
  'garnet', 'glacier', 'granite', 'harbor', 'hazel', 'heron', 'hollow', 'honey',
  'indigo', 'island', 'ivory', 'jasmine', 'juniper', 'kettle', 'lagoon', 'lantern',
  'lark', 'laurel', 'lemon', 'lichen', 'lotus', 'lunar', 'maple', 'marble',
  'meadow', 'mist', 'moss', 'nectar', 'nimbus', 'oak', 'ocean', 'olive',
  'onyx', 'orchard', 'otter', 'pebble', 'pine', 'plum', 'poppy', 'prairie',
  'quartz', 'quill', 'raven', 'reef', 'ridge', 'river', 'robin', 'saffron',
  'sage', 'sailor', 'sequoia', 'shadow', 'silver', 'sparrow', 'spruce', 'summit',
  'sunset', 'thistle', 'thunder', 'tide', 'timber', 'topaz', 'tulip', 'valley',
  'velvet', 'violet', 'willow', 'winter', 'wren', 'yarrow', 'zephyr',
]

function pepper() {
  const p = process.env.ACCESS_CODE_PEPPER
  if (!p || p.length < 16) throw new Error('ACCESS_CODE_PEPPER is missing or too short (use 32+ random characters)')
  return p
}

/** Supabase client that bypasses row level security. Server only. */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

// Codes and IPs are stored as keyed hashes. The session token is random and long, so a plain hash is enough.
export const hashCode = (code) => createHmac('sha256', pepper()).update('code:' + normalizeCode(code)).digest('hex')
export const hashIp = (ip) => createHmac('sha256', pepper()).update('ip:' + ip).digest('hex')
export const hashToken = (token) => createHash('sha256').update(token).digest('hex')

/** e.g. "tide-lantern-4821" */
export function generateCode() {
  const pick = () => WORDS[randomInt(WORDS.length)]
  return `${pick()}-${pick()}-${String(randomInt(10000)).padStart(4, '0')}`
}

const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000).toISOString()

/** True when this visitor (or everyone together) has missed too many times lately. */
export async function isRateLimited(admin, ipHash) {
  const [mine, everyone] = await Promise.all([
    admin
      .from('access_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('success', false)
      .gte('attempted_at', minutesAgo(IP_WINDOW_MINUTES)),
    admin
      .from('access_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('success', false)
      .gte('attempted_at', minutesAgo(GLOBAL_WINDOW_MINUTES)),
  ])
  if (mine.error || everyone.error) return true // can't check, so don't allow guessing
  return (mine.count ?? 0) >= MAX_MISSES_PER_IP || (everyone.count ?? 0) >= MAX_MISSES_GLOBAL
}

/** Forget attempts older than two days so the table stays tiny. */
export async function pruneOldAttempts(admin) {
  await admin.from('access_attempts').delete().lt('attempted_at', minutesAgo(60 * 48))
}

/** Is this code row usable right now? */
export function codeIsUsable(row) {
  if (!row || row.revoked_at) return false
  return !row.expires_at || new Date(row.expires_at).getTime() > Date.now()
}

/** Makes a login for a code. Returns the cookie token and when it expires. */
export async function createSession(admin, codeRow) {
  const token = randomBytes(32).toString('base64url')
  let expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  if (codeRow.expires_at) expires = Math.min(expires, new Date(codeRow.expires_at).getTime())
  const expiresAt = new Date(expires)
  const { error } = await admin
    .from('access_sessions')
    .insert({ code_id: codeRow.id, token_hash: hashToken(token), expires_at: expiresAt.toISOString() })
  if (error) throw error
  return { token, expires: expiresAt }
}

/**
 * Checks a cookie token against the database on every call, so revoking a code
 * (or it expiring) locks out everyone using it straight away.
 * Returns { label, codeId, scopes } or null.
 */
export async function verifyAccessToken(token, scope = 'travel') {
  if (!token) return null
  const admin = adminClient()
  const { data, error } = await admin
    .from('access_sessions')
    .select('id, expires_at, last_seen_at, access_codes ( id, label, scopes, expires_at, revoked_at )')
    .eq('token_hash', hashToken(token))
    .maybeSingle()
  if (error || !data) return null

  const code = Array.isArray(data.access_codes) ? data.access_codes[0] : data.access_codes
  if (!code || !codeIsUsable(code)) return null
  if (new Date(data.expires_at).getTime() <= Date.now()) return null
  if (!Array.isArray(code.scopes) || !code.scopes.includes(scope)) return null

  // note when this login was last used, at most once a minute
  if (Date.now() - new Date(data.last_seen_at).getTime() > 60 * 1000) {
    await admin.from('access_sessions').update({ last_seen_at: new Date().toISOString() }).eq('id', data.id)
  }
  return { label: code.label, codeId: code.id, scopes: code.scopes }
}
