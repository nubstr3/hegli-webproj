import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { COOKIE_TOUCH, COOKIE_VIEW, isTouchUserAgent } from '@/lib/deviceView'

/**
 * Two jobs, both before a page renders:
 *
 * 1. Sends phones and tablets to the separate mobile site (app/m/...).
 *    It is a REWRITE, not a redirect: the address bar keeps saying /about while the
 *    page served comes from app/m/about. So links inside mobile pages must point at
 *    the normal paths (/about, /projects ...), never at /m/...
 *
 * 2. Keeps the Supabase login fresh. Pages can't write cookies, so when the short
 *    session token expires the refresh has to happen here, where cookies can be set.
 *
 * Next.js 16 renamed middleware.ts to proxy.ts - same job, new name.
 */

// public path -> mobile page. Uncomment a line only once its page exists in app/m,
// otherwise touch devices get a 404 for that page.
const MOBILE_ROUTES: Record<string, string> = {
  '/': '/m',
  '/about': '/m/about',
  '/projects': '/m/projects',
  '/contact': '/m/contact',
  '/login': '/m/login',
  '/travel': '/m/travel',
  '/admin': '/m/admin/files',
  '/admin/files': '/m/admin/files',
  '/admin/journal': '/m/admin/journal',
  '/admin/settings': '/m/admin/settings',
}

const CANONICAL_FOR_MOBILE: Record<string, string> = Object.fromEntries(
  Object.entries(MOBILE_ROUTES).map(([pub, mob]) => [mob, pub]),
)

function wantsMobile(req: NextRequest): boolean {
  if (req.cookies.get(COOKIE_VIEW)?.value === 'desktop') return false // "view desktop site"
  if (req.headers.get('sec-ch-ua-mobile') === '?1') return true // Chromium phones/tablets
  if (isTouchUserAgent(req.headers.get('user-agent'))) return true // phones, Android tablets
  return req.cookies.get(COOKIE_TOUCH)?.value === '1' // iPads (they pose as Macs)
}

/** What to do with this request, ignoring the login session. */
function route(req: NextRequest): { redirect: string } | { rewrite: string } | null {
  if (process.env.MOBILE_SITE !== 'on') return null // kill switch
  if (req.method !== 'GET' && req.method !== 'HEAD') return null

  const path = req.nextUrl.pathname.replace(/(.)\/$/, '$1') // "/about/" -> "/about"

  // Someone typed /m/... directly: send them to the normal address.
  const canonical = CANONICAL_FOR_MOBILE[path]
  if (canonical) return { redirect: canonical }

  const target = MOBILE_ROUTES[path]
  if (target && wantsMobile(req)) return { rewrite: target }
  return null
}

export async function proxy(req: NextRequest) {
  const decision = route(req)

  const build = (request: NextRequest) => {
    // keep the query string (e.g. /travel?p=abc) across the redirect/rewrite
    const to = (path: string) => {
      const url = new URL(path, req.url)
      url.search = req.nextUrl.search
      return url
    }
    if (decision && 'redirect' in decision) return NextResponse.redirect(to(decision.redirect), 308)
    if (decision && 'rewrite' in decision) return NextResponse.rewrite(to(decision.rewrite), { request })
    return NextResponse.next({ request })
  }
  let response = build(req)

  // Only logged-in browsers carry Supabase cookies; everyone else skips this.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasSession = req.cookies.getAll().some((c) => c.name.startsWith('sb-'))
  if (url && key && hasSession) {
    try {
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll(cookiesToSet) {
            // pass the new tokens to the page being rendered AND back to the browser
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
            response = build(req)
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      })
      await supabase.auth.getUser() // refreshes an expired token and calls setAll
    } catch {
      // never let a Supabase hiccup stop a page from loading
    }
  }

  return response
}

export const config = {
  // Pages only: skip API routes, Next internals and anything with a file extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}