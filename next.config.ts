import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === 'development';

// Define base CSP directives
const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "https://*.paypal.com",       // Allow PayPal scripts
    "https://www.google.com",     // ReCAPTCHA if used
    "https://www.gstatic.com",    // ReCAPTCHA if used
    // Add other trusted script sources here
  ],
  "style-src": ["'self'", "'unsafe-inline'"], // Allow inline styles
  "img-src": ["'self'", "data:", "https://*.paypal.com", "https://storage.googleapis.com"], // Allow data URIs, PayPal, and Storage images
  "connect-src": [
    "'self'",
    "https://*.paypal.com",       // Allow connections to PayPal API
    "https://*.cloudfunctions.net",
    "https://*.run.app",
    "https://capturepaypalorder-kjetjvm2ja-uc.a.run.app", // Allow connection to your Cloud Function
    // Add other API endpoints here
  ],
  "frame-src": ["'self'", "https://*.paypal.com"], // Allow PayPal iframes
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"], // Disallow framing of your site
  "block-all-mixed-content": [],
  "upgrade-insecure-requests": [],
};

// Allow 'unsafe-eval' only in development for PayPal SDK compatibility
if (isDevelopment) {
  cspDirectives["script-src"].push("'unsafe-eval'");
  console.log("CSP: 'unsafe-eval' enabled for script-src in development.");
} else {
  console.log("CSP: 'unsafe-eval' NOT enabled for script-src in production.");
}

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    // Join directives with semicolons
    value: Object.entries(cspDirectives)
      .map(([key, value]) => `${key} ${value.join(' ')}`)
      .join('; '),
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()' // Adjust permissions as needed
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  // Add other Next.js config options if needed
  // reactStrictMode: true, // Example
};

export default nextConfig;
