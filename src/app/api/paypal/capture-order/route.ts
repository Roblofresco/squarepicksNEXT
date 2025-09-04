import { NextRequest, NextResponse } from 'next/server'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { orderID } = await request.json()

    if (!orderID) {
      return NextResponse.json(
        { error: 'Order ID is required' },
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

    // Capture PayPal order
    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json()
      console.error('Failed to capture PayPal order:', errorData)
      return NextResponse.json(
        { error: 'Failed to capture PayPal order' },
        { status: 500 }
      )
    }

    const captureData = await captureResponse.json()
    console.log('PayPal order captured successfully:', captureData.id)

    // Verify capture success
    if (captureData.status !== 'COMPLETED') {
      console.error('PayPal capture not completed:', captureData.status)
      return NextResponse.json(
        { error: `PayPal payment capture failed. Status: ${captureData.status}` },
        { status: 500 }
      )
    }

    // Extract captured amount
    const purchaseUnit = captureData.purchase_units?.[0]
    const payments = purchaseUnit?.payments
    const captures = payments?.captures
    const capture = captures?.[0]

    if (!capture || capture.status !== 'COMPLETED') {
      console.error('No successful capture found in PayPal response')
      return NextResponse.json(
        { error: 'Failed to verify payment capture details with PayPal' },
        { status: 500 }
      )
    }

    const amountCaptured = parseFloat(capture.amount.value)
    const currencyCaptured = capture.amount.currency_code

    if (currencyCaptured !== 'USD') {
      return NextResponse.json(
        { error: `Unsupported currency: ${currencyCaptured}. Only USD is accepted.` },
        { status: 400 }
      )
    }

    console.log(`Successfully captured ${amountCaptured} ${currencyCaptured} for order ${orderID}`)

    // Update wallet balance using secure API route
    // This uses Firestore transactions for atomic operations
    try {
      // Get user ID from request headers or auth context
      // For now, we'll need to pass it from the client
      const userId = request.headers.get('x-user-id')
      
      if (!userId) {
        console.error('User ID not provided in request headers')
        return NextResponse.json({
          success: true,
          message: 'PayPal order captured successfully, but wallet update failed. Please contact support.',
          orderId: orderID,
          amountDeposited: amountCaptured,
          currency: currencyCaptured,
          warning: 'User ID not provided - contact support'
        })
      }

      const walletUpdateResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.squarepicks.com'}/api/wallet/update-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          amount: amountCaptured,
          orderId: orderID,
          currency: currencyCaptured,
        }),
      })

      if (!walletUpdateResponse.ok) {
        const errorData = await walletUpdateResponse.json()
        console.error('Wallet update failed:', errorData)
        return NextResponse.json({
          success: true,
          message: 'PayPal order captured successfully, but wallet update failed. Please contact support.',
          orderId: orderID,
          amountDeposited: amountCaptured,
          currency: currencyCaptured,
          warning: 'Wallet update failed - contact support'
        })
      }

      const walletResult = await walletUpdateResponse.json()
      
      return NextResponse.json({
        success: true,
        message: 'PayPal order captured and wallet updated successfully.',
        orderId: orderID,
        amountDeposited: amountCaptured,
        currency: currencyCaptured,
        ...walletResult
      })
    } catch (walletError: any) {
      console.error('Wallet update error:', walletError)
      // Even if wallet update fails, the PayPal capture was successful
      return NextResponse.json({
        success: true,
        message: 'PayPal order captured successfully, but wallet update failed. Please contact support.',
        orderId: orderID,
        amountDeposited: amountCaptured,
        currency: currencyCaptured,
        warning: 'Wallet update failed - contact support'
      })
    }

  } catch (error: any) {
    console.error('Error capturing PayPal order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture PayPal order' },
      { status: 500 }
    )
  }
}