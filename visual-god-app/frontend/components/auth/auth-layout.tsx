// visual-god-app/frontend/components/auth/auth-layout.tsx
import { Sparkles } from 'lucide-react'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-pink-500/20 rounded-full blur-2xl animate-pulse delay-300" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-700" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Visual God</h1>
            <p className="text-white/80">AI-Powered Multi-Platform Content Creator</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}