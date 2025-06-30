// File: visual-god-app/frontend/middleware.ts
// FIXED VERSION - Faster, cleaner middleware with better routing

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Get the pathname
  const pathname = request.nextUrl.pathname

  // Define route types
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register', 
    '/auth/callback',
    '/auth/forgot-password',
    '/pricing',
    '/terms',
    '/privacy',
    '/contact'
  ]

  const authRoutes = ['/auth/login', '/auth/register']
  const protectedRoutes = ['/dashboard', '/profile']

  // Skip auth check for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return supabaseResponse
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.includes(pathname)
  const isAuthRoute = authRoutes.includes(pathname)
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Only check auth for protected routes to improve performance
  let user = null
  if (isProtectedRoute || isAuthRoute) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    user = authUser
  }

  // Redirect logic
  if (isProtectedRoute && !user) {
    // Redirect to login if trying to access protected route without auth
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthRoute && user) {
    // Redirect authenticated users away from auth pages
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Allow all other routes (including homepage for both auth and non-auth users)
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}