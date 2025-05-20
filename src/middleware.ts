import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define security headers
const securityHeaders = [
  // Prevents MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Prevents clickjacking attacks
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN', // Or 'DENY' if you never want to be iframed
  },
  // Controls referrer information sent to other sites
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin', // A common default
  },
  // Enforces HTTPS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload', // 2 years; adjust max-age if needed
  },
  // Content Security Policy (CSP): Helps prevent XSS and data injection attacks.
  // *** IMPORTANT: This is a relatively basic policy. You may need to customize it ***
  // based on external scripts, styles, fonts, images, or inline resources your app uses.
  {
    key: 'Content-Security-Policy',
    value: `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'self';`,
  },
   // Permissions Policy: Controls which browser features (camera, microphone, etc.) can be used.
   {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=()', // Deny common sensitive permissions by default.
  }
];

// Define paths that require authentication
const protectedPaths = ['/profile', '/my-boards', '/game', '/wallet', '/deposit'];

// Placeholder for the actual cookie name Firebase uses for auth persistence
// You might need to inspect your browser's cookies after logging in to find the correct name.
// Common patterns involve 'firebase', 'auth', 'session', or project-specific names.
const FIREBASE_AUTH_COOKIE_NAME = 'firebaseAuthCookie'; // Adjust this name as needed

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // Check if the current path requires authentication
  const requiresAuth = protectedPaths.some((path) => pathname.startsWith(path));

  if (requiresAuth) {
    // Check if the authentication cookie exists
    const authCookie = request.cookies.get(FIREBASE_AUTH_COOKIE_NAME); // Use the correct name here

    if (!authCookie) {
      // If no auth cookie, redirect to the login page
      const loginUrl = new URL('/login', request.url);
      // Optional: Add a 'redirectedFrom' query param if needed for UX
      // loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }
    // If the cookie exists, proceed (basic check assumes cookie presence = logged in)
    // Note: For better security, verify the cookie/token server-side (e.g., using Firebase Admin SDK / Session Cookies).
  }

  // Create the response object, potentially modifying request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Apply all security headers to the response
  securityHeaders.forEach((header) => {
    response.headers.set(header.key, header.value);
  });

  return response;
}

// Define which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (your public images)
     * - brandkit/ (your public brandkit assets)
     * Anything else in /public should be added here if necessary
     *
     * We also exclude /login and /signup from the middleware's auth check logic,
     * but the security headers will still apply to them if they match the general pattern.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|brandkit|login|signup).*)|/login|/signup', // Ensure middleware runs on login/signup for headers, but auth logic bypasses them.
     // Added /login and /signup explicitly to ensure headers apply,
     // but the requiresAuth check prevents redirection loops.
     // The complex negative lookahead applies to the first part.
  ],
};