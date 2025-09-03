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
    const baseUrl = process.env.PAYPAL_API_BASE_URL || 'https://api-m.sandbox.paypal.com'

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
      console.error('Failed to get PayPal access token:', await tokenResponse.text())
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

    // Now call Firebase function to update wallet balance
    // This leverages the existing secure wallet update logic
    try {
      const functions = getFunctions(app, 'us-east1')
      const capturePayPalOrderCallable = httpsCallable(functions, 'capturePayPalOrder')
      
      const result = await capturePayPalOrderCallable({ orderID })
      
      return NextResponse.json({
        success: true,
        message: 'PayPal order captured and wallet updated successfully.',
        orderId: orderID,
        amountDeposited: amountCaptured,
        currency: currencyCaptured,
        ...result.data
      })
    } catch (firebaseError: any) {
      console.error('Firebase function error:', firebaseError)
      // Even if Firebase function fails, the PayPal capture was successful
      // Return success but note the wallet update issue
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