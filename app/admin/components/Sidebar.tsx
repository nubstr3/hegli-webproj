'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Sidebar() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{
      width: '190px',
      minWidth: '190px',
      height: '100vh',
      background: 'var(--background)',
      borderRight: '0.5px solid #e5e5e5',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
    }}>
      <div style={{ padding: '1.25rem', borderBottom: '0.5px solid #e5e5e5' }}>
        <p style={{ fontSize: '15px', fontWeight: '500', margin: '0' }}>hegli.dev</p>
        <p style={{ fontSize: '12px', color: '#888', margin: '3px 0 0' }}>Admin</p>
      </div>

      <nav style={{ flex: 1, padding: '0.75rem' }}>
        {[
          { label: 'Overview', icon: '⊞' },
          { label: 'Projects', icon: '📁' },
          { label: 'Sticky notes', icon: '📝' },
          { label: 'About me', icon: '👤' },
          { label: 'Settings', icon: '⚙️' },
        ].map((item) => (
          <div key={item.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '3px',
            color: '#888',
            fontSize: '13px',
          }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      <div style={{ padding: '0.75rem', borderTop: '0.5px solid #e5e5e5' }}>
        <div
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#888',
            fontSize: '13px',
          }}
        >
          <span>→</span>
          <span>Log out</span>
        </div>
      </div>
    </div>
  )
}