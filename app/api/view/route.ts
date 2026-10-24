import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_VIEW } from '@/lib/deviceView'

/**
 * The "view desktop site" / "view mobile site" switch.
 *   /api/view?mode=desktop&next=/about   -> stay on the desktop site (30 days)
 *   /api/view?mode=auto&next=/about      -> back to automatic
 */
export function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('mode')
  const next = req.nextUrl.searchParams.get('next') ?? '/'
  // Only same-site paths, so this can't be used as an open redirect.
  const safeNext = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/'

  const res = NextResponse.redirect(new URL(safeNext, req.url), 303)
  if (mode === 'desktop') {
    res.cookies.set({
      name: COOKIE_VIEW,
      value: 'desktop',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  } else {
    res.cookies.delete(COOKIE_VIEW)
  }
  return res
}