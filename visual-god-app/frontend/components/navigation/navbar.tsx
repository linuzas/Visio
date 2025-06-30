// File: visual-god-app/frontend/components/navigation/navbar.tsx
// FIXED VERSION - Better auth state handling and cleaner navigation

'use client'

import { useState, useEffect } from 'react'
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
  const [isLoggedIn, setIsLoggedIn] = useState(!!user)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Check auth state on mount and updates
  useEffect(() => {
    setIsLoggedIn(!!user)
  }, [user])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu on window resize to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setMobileMenuOpen(false)
      setIsLoggedIn(false)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  // Filter nav items based on auth state
  const filteredNavItems = NAV_ITEMS.filter(item => 
    !item.requiresAuth || (item.requiresAuth && isLoggedIn)
  )

  const handleMobileNavClick = (href: string) => {
    setMobileMenuOpen(false)
    if (href.startsWith('http')) {
      window.open(href, '_blank')
    } else {
      router.push(href)
    }
  }

  return (
    <>
      <nav className="bg-white/10 backdrop-blur-md rounded-3xl p-4 md:p-6 mb-8 shadow-2xl border border-white/20 relative z-50">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Back Button or Title */}
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            <Link 
              href={isLoggedIn ? "/dashboard" : "/"} 
              className="flex items-center gap-2 hover:scale-105 transition-transform flex-shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
              <span className="text-lg md:text-2xl font-bold text-white hidden sm:block">Visual God</span>
              <span className="text-lg font-bold text-white sm:hidden">VG</span>
            </Link>
            
            {showBackButton && (
              <>
                <div className="w-px h-6 md:h-8 bg-white/20 hidden sm:block" />
                <Link
                  href={backTo}
                  className="flex items-center gap-1 md:gap-2 bg-white/20 hover:bg-white/30 text-white px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl transition-all duration-200 transform hover:scale-105 text-sm md:text-base"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden md:inline">{backLabel}</span>
                  <span className="md:hidden">Back</span>
                </Link>
              </>
            )}
            
            {title && (
              <div className="ml-2 md:ml-4 min-w-0 flex-1">
                <h1 className="text-base md:text-xl font-bold text-white truncate">{title}</h1>
                {subtitle && <p className="text-white/60 text-xs md:text-sm truncate">{subtitle}</p>}
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
            
            {/* Auth buttons */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
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
            className="md:hidden text-white p-2 hover:bg-white/20 rounded-lg transition flex-shrink-0"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 transform transition-transform duration-300 z-50 md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-white" />
              <span className="text-xl font-bold text-white">Visual God</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-white p-2 hover:bg-white/20 rounded-lg transition"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu Items */}
          <div className="space-y-2">
            {filteredNavItems.map((item) => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.href}
                  onClick={() => handleMobileNavClick(item.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                    isActive(item.href)
                      ? 'bg-white/30 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {item.label}
                </button>
              )
            })}
            
            {/* Mobile Auth Buttons */}
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 px-4 py-3 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            ) : (
              <div className="pt-4 border-t border-white/20 space-y-2">
                <button
                  onClick={() => handleMobileNavClick('/auth/login')}
                  className="w-full text-center text-white/80 hover:text-white px-4 py-2 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleMobileNavClick('/auth/register')}
                  className="w-full text-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Specialized navigation components for different pages
export function DashboardNavbar({ profile, stats }: { profile: any, stats: any }) {
  return (
    <Navbar
      user={profile}
      profile={profile}
      title={`Welcome back, ${profile?.full_name || profile?.username || 'Creator'}!`}
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