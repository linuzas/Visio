// File: visual-god-app/frontend/app/loading.tsx
// OPTIMIZED VERSION - Faster loading with skeleton

import { Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Navigation Skeleton */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 md:p-6 mb-8 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
              <div className="w-32 h-6 bg-white/20 rounded"></div>
            </div>
            <div className="hidden md:flex gap-2">
              <div className="w-20 h-8 bg-white/20 rounded-xl"></div>
              <div className="w-20 h-8 bg-white/20 rounded-xl"></div>
              <div className="w-20 h-8 bg-white/20 rounded-xl"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white animate-pulse" />
            </div>
            
            <div className="w-48 h-6 bg-white/20 rounded mx-auto mb-2 animate-pulse"></div>
            <div className="w-32 h-4 bg-white/20 rounded mx-auto animate-pulse"></div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-4 animate-pulse">
                <div className="w-8 h-8 bg-white/20 rounded mb-2"></div>
                <div className="w-16 h-6 bg-white/20 rounded mb-1"></div>
                <div className="w-12 h-3 bg-white/20 rounded"></div>
              </div>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="space-y-4">
            <div className="w-full h-32 bg-white/20 rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full h-24 bg-white/20 rounded-xl animate-pulse"></div>
              <div className="w-full h-24 bg-white/20 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}