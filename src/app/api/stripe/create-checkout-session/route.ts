import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get('amount');

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const amountInCents = Math.round(parseFloat(amount) * 100);

    // For now, redirect to a placeholder Stripe checkout
    // In production, you would create a Stripe checkout session here
    const stripeCheckoutUrl = `https://checkout.stripe.com/pay/cs_test_placeholder?amount=${amountInCents}`;
    
    return NextResponse.redirect(stripeCheckoutUrl);
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
