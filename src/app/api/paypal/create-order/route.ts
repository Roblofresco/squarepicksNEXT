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

    // Get PayPal credentials from environment
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    const baseUrl = process.env.PAYPAL_API_BASE_URL || 'https://api-m.sandbox.paypal.com'

    // Debug: Log what we're getting from environment
    console.log('Environment check:', {
      clientId: clientId ? 'SET' : 'NOT SET',
      clientSecret: clientSecret ? 'SET' : 'NOT SET',
      baseUrl: baseUrl
    })

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { 
          error: 'PayPal credentials not configured',
          debug: {
            clientId: clientId ? 'SET' : 'NOT SET',
            clientSecret: clientSecret ? 'SET' : 'NOT SET',
            baseUrl: baseUrl
          }
        },
        { status: 500 }
      )
    }

    // Get PayPal access token
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token')
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
          description: `Deposit for SquarePicks Account`,
        },
      ],
    }

    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `order-${Date.now()}`,
      },
      body: JSON.stringify(orderData),
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json()
      throw new Error(errorData.message || 'Failed to create PayPal order')
    }

    const order = await orderResponse.json()
    
    return NextResponse.json({
      id: order.id,
      status: order.status,
      links: order.links
    })
  } catch (error: any) {
    console.error('Error creating PayPal order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
