import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, intent } = await request.json()

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount provided' },
        { status: 400 }
      )
    }

    if (currency !== 'USD') {
      return NextResponse.json(
        { error: 'Only USD currency is supported' },
        { status: 400 }
      )
    }

    if (intent !== 'CAPTURE' && intent !== 'AUTHORIZE') {
      return NextResponse.json(
        { error: 'Invalid intent. Must be CAPTURE or AUTHORIZE' },
        { status: 400 }
      )
    }

    // Get PayPal credentials from environment variables
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    // Decide API base URL: explicit override -> PAYPAL_ENV/NEXT_PUBLIC_PAYPAL_ENV -> NODE_ENV
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
    const paypalEnv = (process.env.PAYPAL_ENV || process.env.NEXT_PUBLIC_PAYPAL_ENV || (isProd ? 'live' : 'sandbox')).toLowerCase()
    const baseUrl = process.env.PAYPAL_API_BASE_URL || (paypalEnv === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com')

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials not configured')
      return NextResponse.json(
        { error: 'PayPal credentials not configured' },
        { status: 500 }
      )
    }

    // Get PayPal access token
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error('Failed to get PayPal access token', {
        status: tokenResponse.status,
        baseUrl,
        paypalEnv,
        isProd,
        body: errText
      })
      return NextResponse.json(
        { error: 'Failed to authenticate with PayPal' },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Create PayPal order
    const orderData = {
      intent: intent,
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: parseFloat(amount).toFixed(2),
          },
          description: `Deposit for SquarePicks Account - $${amount}`,
        },
      ],
    }

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json()
      console.error('Failed to create PayPal order:', errorData)
      return NextResponse.json(
        { error: 'Failed to create PayPal order' },
        { status: 500 }
      )
    }

    const order = await orderResponse.json()
    console.log('PayPal order created successfully:', order.id)

    return NextResponse.json({
      id: order.id,
      status: order.status,
      intent: order.intent,
      amount: amount,
      currency: currency,
    })
  } catch (error: any) {
    console.error('Error creating PayPal order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
