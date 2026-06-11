'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import DateTimeBar from './components/DateTimeBar'
import WidgetGrid from './components/WidgetGrid'

export default function AdminPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <DateTimeBar />
      <WidgetGrid />
    </div>
  )
}