// visual-god-app/frontend/app/dashboard/stats/page.tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { StatsContent } from '@/components/dashboard/stats-content'

export default async function StatsPage() {
  const supabase = await createServerClient()
  
  // Get the current user
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

  return <StatsContent stats={statsResult.data} usage={usageResult.data || []} />
}
