import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are available
    const envCheck = {
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
      PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'NOT SET',
      PAYPAL_API_BASE_URL: process.env.PAYPAL_API_BASE_URL || 'NOT SET',
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
    }

    return NextResponse.json({
      message: 'Environment variables check',
      environment: envCheck,
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
