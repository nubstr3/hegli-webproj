import { NextResponse, type NextRequest } from 'next/server'
import { isAdmin } from '@/lib/adminAuth'
import { adminClient, generateCode, hashCode } from '@/lib/accessCore.mjs'

// Manages access codes for the Settings page. Only the signed-in admin may call this
// (checked against Supabase on every request); the codes table itself is service-role only.

// Areas a code can unlock. Add a name here when a new private area is built.
const ALLOWED_SCOPES = ['travel']

const NO = (status = 401) => NextResponse.json({ error: 'not allowed' }, { status })

const COLUMNS = 'id, label, scopes, expires_at, revoked_at, last_used_at, created_at, rotated_at'

/** Makes a code and saves its hash. Returns the plain code, which exists only in this response. */
async function createCode(label: string, scopes: string[], expiresAt: string | null) {
  const admin = adminClient()
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode()
    const { error } = await admin
      .from('access_codes')
      .insert({ label, code_hash: hashCode(code), scopes, expires_at: expiresAt })
    if (!error) return { code }
    if (error.code !== '23505') throw error // anything except "that code already exists"
  }
  throw new Error('could not make a unique code')
}

function cleanScopes(input: unknown): string[] {
  const list = Array.isArray(input) ? input.filter((s): s is string => typeof s === 'string') : []
  const valid = list.filter((s) => ALLOWED_SCOPES.includes(s))
  return valid.length ? Array.from(new Set(valid)) : ['travel']
}

function cleanExpiry(input: unknown): string | null | 'bad' {
  if (input === null || input === undefined || input === '') return null
  if (typeof input !== 'string') return 'bad'
  const t = new Date(input).getTime()
  return Number.isNaN(t) || t <= Date.now() ? 'bad' : new Date(t).toISOString()
}

export async function GET() {
  if (!(await isAdmin())) return NO()
  const { data, error } = await adminClient().from('access_codes').select(COLUMNS).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ codes: data, scopes: ALLOWED_SCOPES })
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) return NO()
  const body = await request.json().catch(() => ({}))
  const admin = adminClient()

  // rotate: swap this row's code for a fresh one. Same label, scopes and expiry, no extra row;
  // the old code stops working at once and anyone logged in with it is signed out.
  if (body.rotateId) {
    const { data: old } = await admin.from('access_codes').select('id, label, revoked_at').eq('id', body.rotateId).maybeSingle()
    if (!old || old.revoked_at) return NextResponse.json({ error: 'code not found' }, { status: 404 })
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = generateCode()
      const { error } = await admin
        .from('access_codes')
        .update({ code_hash: hashCode(code), last_used_at: null, rotated_at: new Date().toISOString() })
        .eq('id', old.id)
      if (!error) {
        await admin.from('access_sessions').delete().eq('code_id', old.id)
        return NextResponse.json({ code, label: old.label })
      }
      if (error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'could not make a unique code' }, { status: 500 })
  }

  const label = typeof body.label === 'string' ? body.label.trim().slice(0, 60) : ''
  if (!label) return NextResponse.json({ error: 'give the code a label' }, { status: 400 })
  const expiresAt = cleanExpiry(body.expiresAt)
  if (expiresAt === 'bad') return NextResponse.json({ error: 'expiry must be a future date' }, { status: 400 })

  try {
    const { code } = await createCode(label, cleanScopes(body.scopes), expiresAt)
    return NextResponse.json({ code, label })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'could not save the code' }, { status: 500 })
  }
}

// Edit a code's label, what it unlocks, or its expiry. The code itself never changes.
// Logins are re-checked against these values on every visit, so it applies immediately.
export async function PATCH(request: NextRequest) {
  if (!(await isAdmin())) return NO()
  const body = await request.json().catch(() => ({}))
  if (typeof body.id !== 'string') return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const changes: Record<string, unknown> = {}
  if ('label' in body) {
    const label = typeof body.label === 'string' ? body.label.trim().slice(0, 60) : ''
    if (!label) return NextResponse.json({ error: 'give the code a label' }, { status: 400 })
    changes.label = label
  }
  if ('scopes' in body) changes.scopes = cleanScopes(body.scopes)
  if ('expiresAt' in body) {
    const expiresAt = cleanExpiry(body.expiresAt)
    if (expiresAt === 'bad') return NextResponse.json({ error: 'expiry must be a future date' }, { status: 400 })
    changes.expires_at = expiresAt
  }
  if (Object.keys(changes).length === 0) return NextResponse.json({ ok: true })

  const { error } = await adminClient().from('access_codes').update(changes).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Revoking removes the code for good (its logins go with it). To give the same person access again, make a new code.
export async function DELETE(request: NextRequest) {
  if (!(await isAdmin())) return NO()
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const admin = adminClient()
  await admin.from('access_sessions').delete().eq('code_id', id) // log everyone using it out now
  const { error } = await admin.from('access_codes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}