import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { looksLikeCode, normalizeCode } from '@/lib/accessFormat.mjs'
import {
  SESSION_COOKIE,
  adminClient,
  codeIsUsable,
  createSession,
  hashCode,
  hashIp,
  isRateLimited,
  pruneOldAttempts,
} from '@/lib/accessCore.mjs'

// The homepage terminal posts anything code-shaped here. Every failure (wrong
// code, revoked, expired, rate limited) gets the same quiet answer, so nobody
// can tell a code system exists or why a guess failed.
const NO = () => NextResponse.json({ ok: false })

export async function POST(request: NextRequest) {
  let raw: unknown
  try {
    raw = (await request.json())?.code
  } catch {
    return NO()
  }

  const code = normalizeCode(raw)
  if (!looksLikeCode(code)) return NO() // never checked, never counted

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ipHash = hashIp(forwarded || request.headers.get('x-real-ip') || 'unknown')
  const admin = adminClient()

  if (await isRateLimited(admin, ipHash)) return NO()

  const { data: row } = await admin
    .from('access_codes')
    .select('id, label, scopes, expires_at, revoked_at')
    .eq('code_hash', hashCode(code))
    .maybeSingle()
  const valid = !!row && codeIsUsable(row)

  await admin.from('access_attempts').insert({ ip_hash: ipHash, success: valid })
  if (Math.random() < 0.02) await pruneOldAttempts(admin) // now and then, tidy old rows
  if (!valid || !row) return NO()

  const { token, expires } = await createSession(admin, row)
  await admin.from('access_codes').update({ last_used_at: new Date().toISOString() }).eq('id', row.id)

  const store = await cookies()
  store.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })

  return NextResponse.json({ ok: true, label: row.label })
}