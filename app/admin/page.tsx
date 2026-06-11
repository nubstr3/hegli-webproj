'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div>
      <h1>Admin dashboard</h1>
      <p>Welcome back, Henry.</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  )
}