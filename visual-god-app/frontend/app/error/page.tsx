// File: visual-god-app/frontend/app/auth/error/page.tsx
// FIXED VERSION - No TypeScript errors

'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Mail, RefreshCw } from 'lucide-react'
import Link from 'next/link'

interface ErrorInfo {
  title: string
  description: string
  suggestion: string
  canRetry: boolean
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const getErrorInfo = (errorMessage: string | null): ErrorInfo => {
    if (!errorMessage) {
      return {
        title: 'Authentication Error',
        description: 'An unknown error occurred during authentication.',
        suggestion: 'Please try again or contact support if the problem persists.',
        canRetry: true
      }
    }

    const lowerError = errorMessage.toLowerCase()
    
    if (lowerError.includes('invalid') || lowerError.includes('expired')) {
      return {
        title: 'Invalid or Expired Link',
        description: 'The confirmation link is invalid or has expired.',
        suggestion: 'Please request a new confirmation email and try again.',
        canRetry: true
      }
    }
    
    if (lowerError.includes('already confirmed') || lowerError.includes('already verified')) {
      return {
        title: 'Already Confirmed',
        description: 'Your email has already been verified.',
        suggestion: 'You can now sign in to your account.',
        canRetry: false
      }
    }
    
    if (lowerError.includes('user not found')) {
      return {
        title: 'User Not Found',
        description: 'The user account associated with this link was not found.',
        suggestion: 'Please check if you signed up with the correct email address.',
        canRetry: true
      }
    }
    
    return {
      title: 'Verification Failed',
      description: errorMessage,
      suggestion: 'Please try again or contact support if the issue persists.',
      canRetry: true
    }
  }

  const errorInfo = getErrorInfo(error)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="text-center">
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-6">
            <AlertCircle className="w-8 h-8 text-red-300" />
          </div>
          
          {/* Error Title */}
          <h1 className="text-2xl font-bold text-white mb-4">
            {errorInfo.title}
          </h1>
          
          {/* Error Description */}
          <p className="text-white/80 mb-4">
            {errorInfo.description}
          </p>
          
          {/* Error Suggestion */}
          <p className="text-white/60 text-sm mb-8">
            {errorInfo.suggestion}
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {errorInfo.canRetry && (
              <Link
                href="/auth/register"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105"
              >
                <Mail className="w-4 h-4" />
                Request New Email
              </Link>
            )}
            
            <Link
              href="/auth/login"
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 transform hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
            
            <Link
              href="/"
              className="w-full text-white/60 hover:text-white transition-colors py-2 text-center text-sm block"
            >
              Go to Homepage
            </Link>
          </div>
          
          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="mt-6 p-4 bg-black/20 rounded-lg">
              <p className="text-white/40 text-xs font-mono break-all">
                Debug: {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorContent />
    </Suspense>
  )
}