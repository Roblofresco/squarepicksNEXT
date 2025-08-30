import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /profile/settings)
  const path = request.nextUrl.pathname

  // Define protected routes that require authentication
  const protectedRoutes = [
    '/profile',
    '/profile/settings',
    '/profile/notifications',
    '/profile/settings/change-password',
    '/profile/settings/personal-details',
    '/wallet',
    '/wallet-setup'
  ]

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    path.startsWith(route)
  )

  // If it's a protected route, we'll let the client-side AuthGuard handle it
  // This middleware is mainly for future server-side auth checks if needed
  if (isProtectedRoute) {
    // For now, just continue - AuthGuard will handle authentication
    // In the future, you could add server-side token validation here
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}