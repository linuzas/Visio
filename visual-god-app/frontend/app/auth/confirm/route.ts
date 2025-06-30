// File: visual-god-app/frontend/app/auth/confirm/route.ts
// FIXED VERSION - Removed URLSearchParams.clear() errors

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

  // Check if we have the required parameters
  if (!token_hash || !type) {
    console.log('❌ Missing required parameters')
    
    // Redirect to error page with specific error
    redirectTo.pathname = '/auth/error'
    // Remove all search params and set error
    redirectTo.search = ''
    redirectTo.searchParams.set('error', 'Missing verification parameters')
    
    return NextResponse.redirect(redirectTo)
  }

  const supabase = await createServerClient()

  try {
    console.log('🔄 Attempting to verify OTP...')
    
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (error) {
      console.error('❌ Email verification failed:', error.message)
      
      // Handle specific error types
      let errorMessage = error.message
      
      if (error.message.includes('expired')) {
        errorMessage = 'expired'
      } else if (error.message.includes('invalid')) {
        errorMessage = 'invalid'
      } else if (error.message.includes('already')) {
        errorMessage = 'already confirmed'
      }
      
      // Redirect to error page with specific error
      redirectTo.pathname = '/auth/error'
      redirectTo.search = ''
      redirectTo.searchParams.set('error', errorMessage)
      
      return NextResponse.redirect(redirectTo)
    }

    if (data?.user) {
      console.log('✅ Email verification successful for user:', data.user.email)
      
      // Check if user already has a profile, create one if needed
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (!existingProfile) {
          console.log('🔄 Creating profile for new user...')
          
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: data.user.email?.split('@')[0],
              full_name: data.user.user_metadata?.full_name || null,
              email: data.user.email,
              plan: 'free',
              credits_total: 10,
              credits_used: 0
            })

          if (profileError) {
            console.error('⚠️ Failed to create profile:', profileError.message)
            // Don't fail the whole process, just log the error
          } else {
            console.log('✅ Profile created successfully')
          }
        }
      } catch (profileError) {
        console.error('⚠️ Profile creation error:', profileError)
        // Don't fail the whole process
      }
      
      // Successful verification - redirect to success page or dashboard
      if (type === 'signup') {
        // For signup confirmations, show success message first
        redirectTo.pathname = '/auth/error'
        redirectTo.search = ''
        redirectTo.searchParams.set('success', 'true')
        redirectTo.searchParams.set('message', 'Email confirmed successfully')
      } else {
        // For other types, go directly to dashboard
        redirectTo.pathname = next.startsWith('/') ? next : '/dashboard'
        redirectTo.search = ''
      }
      
      return NextResponse.redirect(redirectTo)
    }

    // No user data but no error either - unusual case
    console.log('⚠️ Verification completed but no user data returned')
    
    redirectTo.pathname = '/auth/error'
    redirectTo.search = ''
    redirectTo.searchParams.set('error', 'Verification completed but no user session created')
    
    return NextResponse.redirect(redirectTo)

  } catch (error) {
    console.error('❌ Unexpected error during verification:', error)
    
    // Unexpected error - redirect to error page
    redirectTo.pathname = '/auth/error'
    redirectTo.search = ''
    redirectTo.searchParams.set('error', 'An unexpected error occurred during verification')
    
    return NextResponse.redirect(redirectTo)
  }
}