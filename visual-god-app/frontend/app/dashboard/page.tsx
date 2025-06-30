// File: visual-god-app/frontend/app/dashboard/page.tsx
// FIXED VERSION - Proper dashboard routing

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Create profile if it doesn't exist
  if (!profile) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: user.email?.split('@')[0],
        full_name: user.user_metadata?.full_name || null,
        email: user.email,
        plan: 'free',
        credits_total: 10,
        credits_used: 0
      })
      .select()
      .single()

    if (newProfile) {
      return <DashboardContent profile={newProfile} stats={{
        credits_remaining: 10,
        total_images_generated: 0,
        total_sessions: 0
      }} />
    }
  }

  // Fetch user statistics
  const { data: stats } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Default stats if view doesn't exist
  const userStats = stats || {
    credits_remaining: (profile?.credits_total || 10) - (profile?.credits_used || 0),
    total_images_generated: 0,
    total_sessions: 0
  }

  return <DashboardContent profile={profile} stats={userStats} />
}