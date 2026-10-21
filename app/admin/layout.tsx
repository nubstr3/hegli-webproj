import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AdminNav from './components/AdminNav'
import SiteFooter from '@/app/components/SiteFooter'
import { BG_GRADIENT, FONT_MONO, TEXT_PRIMARY, TEXT_DIM } from '@/app/components/theme'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div
      data-admin-root
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
      <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* one shared container: every admin page starts at the same spot */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 72px', boxSizing: 'border-box' }}>
          {children}
        </div>
      </main>
      <SiteFooter />

      {/* bottom-right, level with the (c) note on the left */}
      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 14,
          maxWidth: 'calc(100% - 170px)',
          textAlign: 'right',
          fontSize: 11,
          color: TEXT_DIM,
          zIndex: 1,
        }}
      >
        {"# remember to exit when you're finished. on a shared computer, use a private window."}
      </div>

    </div>
  )
}