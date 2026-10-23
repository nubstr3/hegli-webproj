import { createClient } from '@/lib/supabase-server'

/**
 * True when the request comes from the signed-in site owner (the Supabase admin login).
 * Server only. Checked against Supabase each time, not just read from the cookie.
 * Optional extra lock: set ADMIN_EMAIL in the environment to your login email.
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const only = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  return !only || user.email?.toLowerCase() === only
}