import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = await fetch(
    'https://store.steampowered.com/api/featuredcategories?cc=nz&l=en'
  )
  const data = await response.json()

  const specials = data.specials?.items?.slice(0, 10).map((game: any) => ({
    name: game.name,
    originalPrice: game.original_price,
    finalPrice: game.final_price,
    discountPercent: game.discount_percent,
    url: `https://store.steampowered.com/app/${game.id}`,
  }))

  return NextResponse.json({ deals: specials })
}