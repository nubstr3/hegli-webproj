import { createBrowserClient } from '@supabase/ssr'

// change this number to change the session length (1 hour here)
const SESSION_MAX_AGE_SECONDS = 60 * 60

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookieOptions: { maxAge: SESSION_MAX_AGE_SECONDS },
  }
)