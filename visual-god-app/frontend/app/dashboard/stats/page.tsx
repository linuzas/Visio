// File: visual-god-app/frontend/app/dashboard/stats/page.tsx
// REPLACE your existing stats/page.tsx with this

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { StatsContent } from '@/components/dashboard/stats-content'

export default async function StatsPage() {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user statistics
  const [statsResult, usageResult] = await Promise.all([
    supabase.from('user_statistics').select('*').eq('user_id', user.id).single(),
    supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
  ])

  // Handle case where stats view doesn't exist
  const stats = statsResult.data || {
    user_id: user.id,
    username: user.email?.split('@')[0],
    plan: 'free',
    credits_total: 10,
    credits_used: 0,
    credits_remaining: 10,
    total_sessions: 0,
    total_images_generated: 0,
    total_products_scanned: 0
  }

  return (
    <StatsContent 
      stats={stats} 
      usage={usageResult.data || []} 
      user={user} 
    />
  )
}