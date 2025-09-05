import { NextResponse } from 'next/server'

// Read-only env diagnostics - returns only booleans and non-sensitive values
export async function GET() {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  const paypalEnv = (process.env.PAYPAL_ENV || process.env.NEXT_PUBLIC_PAYPAL_ENV || (isProd ? 'live' : 'sandbox')).toLowerCase()

  return NextResponse.json({
    runtime: {
      nodeEnv: process.env.NODE_ENV || null,
      vercelEnv: process.env.VERCEL_ENV || null,
      region: process.env.VERCEL_REGION || null,
    },
    paypal: {
      hasClientId: Boolean(process.env.PAYPAL_CLIENT_ID),
      hasClientSecret: Boolean(process.env.PAYPAL_CLIENT_SECRET),
      paypalEnv,
      apiBase: process.env.PAYPAL_API_BASE_URL || (paypalEnv === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com')
    },
    public: {
      hasPublicClientId: Boolean(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID),
      nextPublicBaseUrl: process.env.NEXT_PUBLIC_BASE_URL || null,
      nextPublicPaypalEnv: process.env.NEXT_PUBLIC_PAYPAL_ENV || null,
    }
  })
}




