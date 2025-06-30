// File: visual-god-app/frontend/app/dashboard/preferences/page.tsx
// Standalone preferences page that doesn't affect content helper

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PreferencesContent } from '../../../components/preferences/preferences-content'

export default async function PreferencesPage() {
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

  return <PreferencesContent profile={profile} user={user} />
}