import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd' } = await request.json();

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // For now, return a mock payment intent
    // In production, you would use the Stripe SDK here
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_mock`,
      amount: amount,
      currency: currency,
      status: 'requires_payment_method'
    };

    return NextResponse.json({
      client_secret: mockPaymentIntent.client_secret,
      payment_intent: mockPaymentIntent
    });
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 });
  }
}
