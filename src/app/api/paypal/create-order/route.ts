import { NextRequest, NextResponse } from 'next/server'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '@/lib/firebase'

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

    // Call Firebase function to create PayPal order
    const functions = getFunctions(app, 'us-east1')
    const createPayPalOrderCallable = httpsCallable(functions, 'createPayPalOrder')
    
    const result = await createPayPalOrderCallable({ 
      amount: amount.toString(), 
      currency, 
      intent 
    })
    
    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error('Error creating PayPal order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create PayPal order' },
      { status: 500 }
    )
  }
}
