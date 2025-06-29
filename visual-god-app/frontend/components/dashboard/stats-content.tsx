// File: visual-god-app/frontend/components/dashboard/stats-content.tsx

'use client'

import { TrendingUp, Clock, CreditCard } from 'lucide-react'
import { PageNavbar } from '@/components/navigation/navbar'
import Link from 'next/link'

interface UsageLog {
  id: string
  created_at: string
  credits_used: number
  action: string
  metadata?: {
    platform?: string
  }
}

interface Stats {
  total_sessions: number
  total_images_generated: number
  total_products_scanned: number
  credits_used: number
  plan: string
}

interface StatsContentProps {
  stats: Stats
  usage: UsageLog[]
  user: any
}

export function StatsContent({ stats, usage, user }: StatsContentProps) {
  // ✅ Fix: Properly typed Record
  const usageByDay: Record<string, number> = usage.reduce<Record<string, number>>((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString()
    acc[date] = (acc[date] || 0) + log.credits_used
    return acc
  }, {})

  const dailyUsage = Object.entries(usageByDay).slice(0, 7).reverse()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
      <div className="max-w-6xl mx-auto">
        <PageNavbar 
          user={user}
          title="Your Statistics"
          subtitle="Track your usage and performance"
        />
        
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 rounded-xl p-6 hover:bg-white/15 transition">
              <h3 className="text-white/60 text-sm mb-2">Total Sessions</h3>
              <p className="text-3xl font-bold text-white">{stats?.total_sessions || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 hover:bg-white/15 transition">
              <h3 className="text-white/60 text-sm mb-2">Images Generated</h3>
              <p className="text-3xl font-bold text-white">{stats?.total_images_generated || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 hover:bg-white/15 transition">
              <h3 className="text-white/60 text-sm mb-2">Products Scanned</h3>
              <p className="text-3xl font-bold text-white">{stats?.total_products_scanned || 0}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-6 hover:bg-white/15 transition">
              <h3 className="text-white/60 text-sm mb-2">Credits Used</h3>
              <p className="text-3xl font-bold text-white">{stats?.credits_used || 0}</p>
            </div>
          </div>

          {/* Usage Chart */}
          <div className="bg-white/10 rounded-xl p-6 mb-8 hover:bg-white/15 transition">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Credit Usage (Last 7 Days)
            </h3>
            <div className="space-y-3">
              {dailyUsage.length > 0 ? (
                dailyUsage.map(([date, credits]) => (
                  <div key={date} className="flex items-center gap-4">
                    <span className="text-white/60 text-sm w-24">{date}</span>
                    <div className="flex-1 bg-white/10 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-sm">
                        {credits} credits
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/60 text-center py-8">No usage data yet</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/10 rounded-xl p-6 mb-8 hover:bg-white/15 transition">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {usage.slice(0, 10).length > 0 ? (
                usage.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-3 hover:bg-white/10 transition">
                    <div className="text-white/80">
                      <span className="capitalize">{log.action.replace('_', ' ')}</span>
                      {log.metadata?.platform && (
                        <span className="text-white/60 ml-2">• {log.metadata.platform}</span>
                      )}
                    </div>
                    <div className="text-white/60">
                      {log.credits_used} credit{log.credits_used !== 1 ? 's' : ''} •{' '}
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-white/60 text-center py-8">No activity yet</p>
              )}
            </div>
          </div>

          {/* Upgrade CTA */}
          {stats?.plan === 'free' && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-white/20 hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-pink-500/30 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">Need More Credits?</h3>
                  <p className="text-white/80">
                    Upgrade to a paid plan for more monthly credits and features
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 transform hover:scale-105"
                >
                  <CreditCard className="w-5 h-5" />
                  View Plans
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}