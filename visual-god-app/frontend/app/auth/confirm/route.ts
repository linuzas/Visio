// File: visual-god-app/frontend/app/auth/confirm/route.ts
// NEW FILE - Create this email confirmation handler

import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'
  const redirectTo = request.nextUrl.clone()

  console.log('🔄 Email confirmation handler triggered')
  console.log('Token hash:', token_hash ? 'present' : 'missing')
  console.log('Type:', type)
  console.log('Next:', next)

  if (token_hash && type) {
    const supabase = await createServerClient()

    try {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (!error) {
        console.log('✅ Email verification successful')
        
        // Successful verification - redirect to dashboard or specified page
        redirectTo.pathname = next.startsWith('/') ? next : '/dashboard'
        redirectTo.searchParams.delete('token_hash')
        redirectTo.searchParams.delete('type')
        redirectTo.searchParams.delete('next')
        
        return NextResponse.redirect(redirectTo)
      } else {
        console.error('❌ Email verification failed:', error)
        
        // Verification failed - redirect to error page
        redirectTo.pathname = '/auth/error'
        redirectTo.searchParams.delete('token_hash')
        redirectTo.searchParams.delete('type')
        redirectTo.searchParams.delete('next')
        redirectTo.searchParams.set('error', error.message)
        
        return NextResponse.redirect(redirectTo)
      }
    } catch (error) {
      console.error('❌ Unexpected error during verification:', error)
      
      // Unexpected error - redirect to error page
      redirectTo.pathname = '/auth/error'
      redirectTo.searchParams.delete('token_hash')
      redirectTo.searchParams.delete('type')
      redirectTo.searchParams.delete('next')
      redirectTo.searchParams.set('error', 'An unexpected error occurred')
      
      return NextResponse.redirect(redirectTo)
    }
  }

  console.log('❌ Invalid or missing verification parameters')
  
  // Missing or invalid parameters - redirect to error page
  redirectTo.pathname = '/auth/error'
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('next')
  redirectTo.searchParams.set('error', 'Invalid verification link')
  
  return NextResponse.redirect(redirectTo)
}