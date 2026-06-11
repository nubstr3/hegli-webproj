import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import Sidebar from './components/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}