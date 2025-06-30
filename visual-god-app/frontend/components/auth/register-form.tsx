// File: visual-god-app/frontend/components/auth/register-form.tsx
// IMPROVED VERSION - Better email confirmation handling and user experience

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullName: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const getRedirectURL = () => {
    // Get the base URL for the current environment
    let url = process.env.NEXT_PUBLIC_VERCEL_URL ?? 'http://localhost:3000'
    
    // Make sure to include `https://` when not localhost
    url = url.startsWith('http') ? url : `https://${url}`
    
    // Make sure to include a trailing `/`
    url = url.endsWith('/') ? url : `${url}/`
    
    // Add the confirmation route
    return `${url}auth/confirm`
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Attempting to register user...')
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            full_name: formData.fullName,
          },
          emailRedirectTo: getRedirectURL(),
        },
      })

      if (error) {
        console.error('❌ Registration error:', error)
        throw error
      }

      console.log('✅ Registration successful:', data)
      
      // Check if email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        setEmailSent(true)
        setSuccess(true)
        console.log('📧 Confirmation email sent to:', formData.email)
      } else if (data.user && data.user.email_confirmed_at) {
        // User is immediately confirmed (rare case)
        console.log('✅ User immediately confirmed, redirecting...')
        router.push('/dashboard')
      }

    } catch (error: any) {
      console.error('❌ Registration failed:', error)
      
      // Handle specific error types
      if (error.message.includes('already registered')) {
        setError('An account with this email already exists. Please sign in instead.')
      } else if (error.message.includes('invalid email')) {
        setError('Please enter a valid email address.')
      } else if (error.message.includes('weak password')) {
        setError('Password is too weak. Please choose a stronger password.')
      } else {
        setError(error.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setResendingEmail(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: getRedirectURL(),
        }
      })

      if (error) throw error

      setError(null)
      // Show temporary success message
      setTimeout(() => {
        setError('✅ Confirmation email resent successfully!')
        setTimeout(() => setError(null), 5000)
      }, 100)

    } catch (error: any) {
      console.error('❌ Resend email failed:', error)
      setError('Failed to resend email. Please try again.')
    } finally {
      setResendingEmail(false)
    }
  }

  if (success && emailSent) {
    return (
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Check your email!</h3>
          <div className="text-white/80 space-y-3">
            <p>
              We've sent a confirmation link to <strong className="text-white">{formData.email}</strong>
            </p>
            <p>
              Please check your email and click the confirmation link to verify your account.
            </p>
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 text-sm">
              <p className="text-blue-200 mb-2">
                <strong>Important:</strong> You must confirm your email before you can sign in.
              </p>
              <p className="text-blue-300/80">
                If you don't see the email, check your spam folder or click resend below.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResendEmail}
            disabled={resendingEmail}
            className="flex items-center justify-center gap-2 w-full bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendingEmail ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend Email
              </>
            )}
          </button>

          <Link
            href="/auth/login"
            className="inline-block text-white font-semibold hover:text-pink-200 underline underline-offset-2 transition-colors"
          >
            Back to login
          </Link>
        </div>

        <div className="text-white/60 text-xs space-y-1">
          <p>Having trouble? Contact support</p>
          <p>Confirmation link expires in 24 hours</p>
        </div>
      </div>
    )
  }

  const inputClass = "w-full bg-black/30 border border-white/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder-white/50 focus:outline-none focus:border-white/60 focus:bg-black/40 transition-all backdrop-blur-sm"

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      {error && (
        <div className={`border rounded-lg p-4 flex items-start gap-3 ${
          error.startsWith('✅') 
            ? 'bg-green-500/20 border-green-400' 
            : 'bg-red-500/20 border-red-400'
        }`}>
          {error.startsWith('✅') ? (
            <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm font-medium ${
            error.startsWith('✅') ? 'text-green-200' : 'text-red-200'
          }`}>
            {error.replace('✅ ', '')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className={inputClass}
              placeholder="cooluser123"
            />
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-white mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              className={inputClass}
              placeholder="John Doe"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className={inputClass}
            placeholder="Min 6 characters"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={inputClass}
            placeholder="Repeat password"
            required
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="terms"
          className="w-4 h-4 bg-black/30 border-white/30 rounded focus:ring-2 focus:ring-purple-500"
          required
        />
        <label htmlFor="terms" className="ml-2 text-sm text-white/80">
          I agree to the{' '}
          <Link href="/terms" className="text-white font-semibold hover:text-pink-200 underline underline-offset-2">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-white font-semibold hover:text-pink-200 underline underline-offset-2">
            Privacy Policy
          </Link>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 disabled:hover:scale-100"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>

      <p className="text-center text-white/80">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-white font-semibold hover:text-pink-200 underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </form>
  )
}