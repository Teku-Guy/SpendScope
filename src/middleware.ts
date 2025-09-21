// middleware.ts - Handle 2FA and device trust checks
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { checkDeviceTrust, extractDeviceInfo } from '@/lib/device-trust'
import { getUserTwoFactorStatus } from '@/lib/two-factor'

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/api/transactions',
  '/api/budgets',
  '/api/analytics',
  '/api/plaid',
  '/api/budget-alerts',
  '/api/budget-categories'
]

// Routes that should be accessible during 2FA verification
const twoFactorRoutes = ['/auth/verify-2fa', '/setup-2fa', '/api/auth/2fa']

// Public routes that don't require authentication
const publicRoutes = ['/auth/signin', '/auth/signup', '/', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API auth routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/callback') ||
    pathname.startsWith('/api/auth/session') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // Check if route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname.startsWith(route)
    )

    const isPublicRoute = publicRoutes.some(route =>
      pathname.startsWith(route) || pathname === '/'
    )

    const isTwoFactorRoute = twoFactorRoutes.some(route =>
      pathname.startsWith(route)
    )

    // Redirect to sign in if accessing protected route without token
    if (isProtectedRoute && !token) {
      const signInUrl = new URL('/auth/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signInUrl)
    }

    // If user is signed in but accessing protected route, check if 2FA is needed
    if (token && isProtectedRoute && !isTwoFactorRoute) {
      try {
        // Always check current 2FA status from database for accuracy
        const twoFactorStatus = await getUserTwoFactorStatus(token.id as string)

        // If user has 2FA enabled, check device trust and token verification status
        if (twoFactorStatus.enabled) {
          const deviceTrust = await checkDeviceTrust(token.id as string, request)

          // Require 2FA if:
          // 1. Device is not trusted, OR
          // 2. JWT token doesn't have twoFactorVerified flag (fresh login or expired session)
          const needs2FA = !deviceTrust.trusted || !token.twoFactorVerified

          if (needs2FA) {
            // Check if user has no 2FA methods configured - redirect to setup
            if (twoFactorStatus.methods.length === 0) {
              const setupUrl = new URL('/setup-2fa', request.url)
              setupUrl.searchParams.set('callbackUrl', request.url)
              return NextResponse.redirect(setupUrl)
            }

            // Otherwise redirect to verification
            const twoFactorUrl = new URL('/auth/verify-2fa', request.url)
            twoFactorUrl.searchParams.set('callbackUrl', request.url)
            return NextResponse.redirect(twoFactorUrl)
          }
        }
      } catch (error) {
        console.error('Error in 2FA middleware check:', error)

        // On error, still allow access to prevent breaking the site
        // but log the error for investigation
        console.error('2FA middleware error details:', {
          userId: token.id,
          pathname,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Continue to the requested page
    return NextResponse.next()
  } catch (error) {
    console.error('Middleware error:', error)

    // On error, allow access to prevent breaking the site
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
  // Use Node.js runtime to support crypto operations
  runtime: 'nodejs'
}