// File: visual-god-app/frontend/app/dashboard/history/page.tsx
// OPTIMIZED VERSION - Faster loading with minimal data

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { HistoryContent } from '@/components/dashboard/history-content'

export default async function HistoryPage() {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // OPTIMIZED: Fetch only successful sessions with minimal data
  const { data: sessions } = await supabase
    .from('generation_sessions')
    .select(`
      id,
      created_at,
      credits_used,
      metadata
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20) // Limit to recent 20 sessions for faster loading

  // OPTIMIZED: Fetch only essential image data
  const { data: images } = await supabase
    .from('generated_images')
    .select(`
      id,
      filename,
      created_at,
      platform,
      size,
      metadata
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100) // Limit to recent 100 images

  // Transform sessions data for better performance
  const optimizedSessions = (sessions || []).map(session => ({
    id: session.id,
    created_at: session.created_at,
    credits_used: session.credits_used,
    image_count: (images || []).filter(img => 
      img.created_at >= session.created_at && 
      img.created_at <= new Date(new Date(session.created_at).getTime() + 60000).toISOString()
    ).length,
    platform: session.metadata?.platform
  }))

  return (
    <HistoryContent 
      sessions={optimizedSessions}
      images={images || []}
      user={user}
    />
  )
}