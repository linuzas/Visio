// File: visual-god-app/frontend/components/navigation/navbar.tsx

'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Sparkles, Home, User, BarChart3, History, CreditCard, 
  LogOut, Menu, X, ArrowLeft 
} from 'lucide-react'
import Link from 'next/link'

interface NavItem {
  href: string
  label: string
  icon: any
  requiresAuth?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: Sparkles, requiresAuth: true },
  { href: '/dashboard/history', label: 'History', icon: History, requiresAuth: true },
  { href: '/dashboard/stats', label: 'Stats', icon: BarChart3, requiresAuth: true },
  { href: '/profile', label: 'Profile', icon: User, requiresAuth: true },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
]

interface NavbarProps {
  user?: any
  profile?: any
  showBackButton?: boolean
  backTo?: string
  backLabel?: string
  title?: string
  subtitle?: string
}

export function Navbar({ 
  user, 
  profile, 
  showBackButton = false, 
  backTo = '/dashboard',
  backLabel = 'Back to Dashboard',
  title,
  subtitle 
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const filteredNavItems = NAV_ITEMS.filter(item => 
    !item.requiresAuth || (item.requiresAuth && user)
  )

  return (
    <nav className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mb-8 shadow-2xl border border-white/20">
      <div className="flex items-center justify-between">
        {/* Left: Logo + Back Button or Title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
            <Sparkles className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold text-white">Visual God</span>
          </Link>
          
          {showBackButton && (
            <>
              <div className="w-px h-8 bg-white/20" />
              <Link
                href={backTo}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel}
              </Link>
            </>
          )}
          
          {title && (
            <div className="ml-4">
              <h1 className="text-xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-white/60 text-sm">{subtitle}</p>}
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          {filteredNavItems.map((item) => {
            const IconComponent = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                  isActive(item.href)
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
          
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
          
          {!user && (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-white/80 hover:text-white px-4 py-2 transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2 hover:bg-white/20 rounded-lg transition"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-6 pt-6 border-t border-white/20">
          <div className="space-y-2">
            {filteredNavItems.map((item) => {
              const IconComponent = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-white/30 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
            
            {user && (
              <button
                onClick={() => {
                  handleLogout()
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center gap-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-3 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            )}
            
            {!user && (
              <div className="space-y-2 pt-4 border-t border-white/20">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center text-white/80 hover:text-white px-4 py-2 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

// Specialized navigation components
export function DashboardNavbar({ profile, stats }: { profile: any, stats: any }) {
  return (
    <Navbar
      user={profile}
      profile={profile}
      title={`Welcome back, ${profile.full_name || profile.username || 'Creator'}!`}
      subtitle="Create amazing content with AI"
    />
  )
}

export function PageNavbar({ 
  user, 
  title, 
  subtitle,
  showBackButton = true,
  backTo = '/dashboard',
  backLabel = 'Back to Dashboard'
}: {
  user?: any
  title: string
  subtitle?: string
  showBackButton?: boolean
  backTo?: string
  backLabel?: string
}) {
  return (
    <Navbar
      user={user}
      title={title}
      subtitle={subtitle}
      showBackButton={showBackButton}
      backTo={backTo}
      backLabel={backLabel}
    />
  )
}