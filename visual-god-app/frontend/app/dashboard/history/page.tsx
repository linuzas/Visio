import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { HistoryContent } from '@/components/dashboard/history-content'

export default async function HistoryPage() {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's sessions with generated images
  const { data: sessions } = await supabase
    .from('generation_sessions')
    .select(`
      *,
      generated_images (
        id,
        filename,
        prompt_text,
        platform,
        size,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <HistoryContent sessions={sessions || []} />
}