import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AdminNav from './components/AdminNav'
import SiteFooter from '@/app/components/SiteFooter'
import { BG_GRADIENT, FONT_MONO, TEXT_PRIMARY } from '@/app/components/theme'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: BG_GRADIENT,
        color: TEXT_PRIMARY,
        fontFamily: FONT_MONO,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          pointerEvents: 'none',
        }}
      />
      <AdminNav />
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>{children}</main>
      <SiteFooter />
    </div>
  )
}