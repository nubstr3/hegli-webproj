import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, adminClient, hashToken } from '@/lib/accessCore.mjs'

// "exit" on the private pages: forget this login on the server, then clear the cookie.
export async function POST() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    try {
      await adminClient().from('access_sessions').delete().eq('token_hash', hashToken(token))
    } catch {
      // the cookie is cleared below either way
    }
  }
  store.delete(SESSION_COOKIE)
  return NextResponse.json({ ok: true })
}