import { NextRequest, NextResponse } from 'next/server'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Call Firebase function
    const functions = getFunctions(app, 'us-east1')
    const capturePayPalOrderCallable = httpsCallable(functions, 'capturePayPalOrder')
    
    const result = await capturePayPalOrderCallable({ 
      orderId 
    })
    
    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error('Error capturing PayPal order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to capture PayPal order' },
      { status: 500 }
    )
  }
}