// visual-god-app/frontend/app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { DashboardContent } from '@/app/dashboard/dashboard-content'

export default async function DashboardPage() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('No user found, redirecting to login')
      redirect('/auth/login')
    }

    // Fetch user profile
    const profileResult = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Handle case where profile doesn't exist yet
    if (!profileResult.data) {
      // Create default profile
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.email?.split('@')[0],
          full_name: user.user_metadata?.full_name || null,
          plan: 'free',
          credits_total: 10,
          credits_used: 0
        })
        .select()
        .single()

      profileResult.data = newProfile
    }

    // Try to get stats
    let stats = null
    try {
      const statsResult = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single()
      
      stats = statsResult.data
    } catch (e) {
      // View might not exist yet, use default stats
      stats = {
        user_id: user.id,
        username: profileResult.data?.username,
        plan: profileResult.data?.plan || 'free',
        credits_total: profileResult.data?.credits_total || 10,
        credits_used: profileResult.data?.credits_used || 0,
        credits_remaining: (profileResult.data?.credits_total || 10) - (profileResult.data?.credits_used || 0),
        total_sessions: 0,
        total_images_generated: 0,
        total_products_scanned: 0
      }
    }

    return <DashboardContent profile={profileResult.data} stats={stats} />
  } catch (error) {
    console.error('Dashboard error:', error)
    redirect('/auth/login')
  }
}