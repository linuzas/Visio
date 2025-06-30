// File: visual-god-app/frontend/app/profile/page.tsx
// FIXED VERSION - Clean profile page without navigation conflicts

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ProfileContent } from '@/components/profile/profile-content'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile and stats in parallel for better performance
  const [profileResult, statsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_statistics').select('*').eq('user_id', user.id).single()
  ])

  // Handle case where profile doesn't exist - create it
  let profile = profileResult.data
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

    profile = newProfile
  }

  // Handle case where stats view doesn't exist or returns null
  const stats = statsResult.data || {
    user_id: user.id,
    username: profile?.username,
    plan: profile?.plan || 'free',
    credits_total: profile?.credits_total || 10,
    credits_used: profile?.credits_used || 0,
    credits_remaining: (profile?.credits_total || 10) - (profile?.credits_used || 0),
    total_sessions: 0,
    total_images_generated: 0,
    total_products_scanned: 0
  }

  return (
    <ProfileContent 
      profile={profile} 
      stats={stats} 
      user={user} 
    />
  )
}