// File: visual-god-app/frontend/app/loading.tsx
// ADD this loading component for better UX

import { Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          {/* Inner icon */}
          <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-white animate-pulse" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Loading Visual God</h2>
        <p className="text-white/80">Preparing your creative workspace...</p>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-75"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  )
}