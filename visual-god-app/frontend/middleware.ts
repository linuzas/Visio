// File: visual-god-app/frontend/middleware.ts
// OPTIMIZED VERSION - Better performance, cleaner auth flow, proper error handling

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

  // Get the pathname and search params
  const pathname = request.nextUrl.pathname
  const searchParams = request.nextUrl.searchParams

  // Skip middleware for static files, API routes (except auth), and assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') ||
    pathname.includes('.') && !pathname.endsWith('.html') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/public/')
  ) {
    return supabaseResponse
  }

  // Define route categories for better organization
  const publicRoutes = new Set([
    '/',
    '/auth/login',
    '/auth/register', 
    '/auth/callback',
    '/auth/confirm',
    '/auth/error',
    '/auth/forgot-password',
    '/pricing',
    '/terms',
    '/privacy',
    '/contact'
  ])

  const authOnlyRoutes = new Set([
    '/auth/login', 
    '/auth/register',
    '/auth/forgot-password'
  ])

  const protectedRoutes = [
    '/dashboard',
    '/profile'
  ]

  // Check if current path is public
  const isPublicRoute = publicRoutes.has(pathname)
  const isAuthOnlyRoute = authOnlyRoutes.has(pathname)
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthConfirmRoute = pathname === '/auth/confirm'

  // Special handling for auth confirmation route
  if (isAuthConfirmRoute) {
    // Let the confirmation route handle its own logic
    return supabaseResponse
  }

  // Only check auth for protected routes or auth-only routes to improve performance
  let user = null
  if (isProtectedRoute || isAuthOnlyRoute) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      user = authUser
    } catch (error) {
      console.error('Auth check failed:', error)
      // If auth check fails, treat as unauthenticated
      user = null
    }
  }

  // Redirect logic
  if (isProtectedRoute && !user) {
    // Redirect to login if trying to access protected route without auth
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthOnlyRoute && user) {
    // Redirect authenticated users away from auth pages
    // Check if there's a redirectedFrom parameter
    const redirectedFrom = searchParams.get('redirectedFrom')
    const destination = redirectedFrom && protectedRoutes.some(route => redirectedFrom.startsWith(route)) 
      ? redirectedFrom 
      : '/dashboard'
    
    return NextResponse.redirect(new URL(destination, request.url))
  }

  // Handle auth errors in URL - redirect to proper error page
  if (pathname === '/' && searchParams.has('error')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/error'
    // Preserve the error parameter
    redirectUrl.searchParams.set('error', searchParams.get('error') || 'Unknown error')
    return NextResponse.redirect(redirectUrl)
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
     * - favicon.ico, robots.txt, sitemap.xml, etc.
     * - public files with extensions (images, etc.)
     * But include:
     * - All pages and API routes (excluding most /api/ routes for performance)
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(png|jpg|jpeg|gif|webp|svg|ico)$).*)',
  ],
}