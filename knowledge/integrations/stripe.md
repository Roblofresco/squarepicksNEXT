# Stripe Integration

## Overview
Integration with Stripe payment platform for processing deposits and payments. Currently in development/placeholder state.

## API Details

### Base URL
```
https://api.stripe.com/v1/
```

### Endpoints Used

#### Payment Intents
```
POST /v1/payment_intents
```

#### Checkout Sessions (Planned)
```
POST /v1/checkout/sessions
```

## Implementation Status

### Current Implementation
The Stripe integration is currently in a **placeholder/development state**:

1. **Payment Intent Route**: Returns mock data
2. **Checkout Session Route**: Redirects to placeholder URL
3. **Frontend Integration**: Stripe React components installed but not fully configured

### Location
- **Payment Intent**: `src/app/api/stripe/create-payment-intent/route.ts`
- **Checkout Session**: `src/app/api/stripe/create-checkout-session/route.ts`
- **Provider**: `src/components/providers/StripeProvider.tsx`

## Environment Variables

```bash
# Required (not yet implemented)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Current Implementation

### Create Payment Intent (Mock)
```typescript
// src/app/api/stripe/create-payment-intent/route.ts
export async function POST(request: NextRequest) {
  const { amount, currency = 'usd' } = await request.json();

  if (!amount) {
    return NextResponse.json(
      { error: 'Amount is required' }, 
      { status: 400 }
    );
  }

  // Mock payment intent
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
}
```

### Create Checkout Session (Placeholder)
```typescript
// src/app/api/stripe/create-checkout-session/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get('amount');

  if (!amount) {
    return NextResponse.json(
      { error: 'Amount is required' }, 
      { status: 400 }
    );
  }

  const amountInCents = Math.round(parseFloat(amount) * 100);

  // Placeholder redirect
  const stripeCheckoutUrl = `https://checkout.stripe.com/pay/cs_test_placeholder?amount=${amountInCents}`;
  
  return NextResponse.redirect(stripeCheckoutUrl);
}
```

## Planned Implementation

### Authentication
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});
```

### Create Payment Intent (Production)
```typescript
export async function POST(request: NextRequest) {
  const { amount, currency = 'usd' } = await request.json();

  // Validate amount
  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: 'Invalid amount' },
      { status: 400 }
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: request.headers.get('x-user-id') || 'unknown',
        source: 'squarepicks-deposit',
      },
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Frontend Integration (Planned)
```typescript
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function DepositForm() {
  const [clientSecret, setClientSecret] = useState('');

  const handleDeposit = async (amount: number) => {
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });

    const { client_secret } = await response.json();
    setClientSecret(client_secret);
  };

  if (!clientSecret) {
    return <AmountSelector onSubmit={handleDeposit} />;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm />
    </Elements>
  );
}
```

## Webhook Integration (Planned)

### Webhook Endpoint
```typescript
// src/app/api/stripe/webhook/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, {
      status: 400,
    });
  }

  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handleSuccessfulPayment(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent;
      await handleFailedPayment(failedPayment);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
  });
}
```

### Handle Successful Payment
```typescript
async function handleSuccessfulPayment(
  paymentIntent: Stripe.PaymentIntent
) {
  const { amount, currency, metadata } = paymentIntent;
  const userId = metadata.userId;

  if (!userId) {
    console.error('No userId in payment intent metadata');
    return;
  }

  // Update wallet balance
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/wallet/update-balance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      amount: amount / 100, // Convert cents to dollars
      paymentIntentId: paymentIntent.id,
      currency,
    }),
  });

  // Send confirmation email
  // Create transaction record
  // Send notification
}
```

## Rate Limits

Stripe rate limits:
- **Test Mode**: 100 requests per second
- **Live Mode**: 100 requests per second per rolling window
- **Burst**: Up to 100 concurrent requests

## Error Handling (Planned)

### Common Stripe Errors
```typescript
try {
  const paymentIntent = await stripe.paymentIntents.create(params);
} catch (error: any) {
  switch (error.code) {
    case 'amount_too_small':
      return { error: 'Minimum deposit is $1.00' };
    
    case 'amount_too_large':
      return { error: 'Maximum deposit is $10,000' };
    
    case 'invalid_request_error':
      return { error: 'Invalid payment details' };
    
    case 'api_key_expired':
      console.error('Stripe API key expired!');
      return { error: 'Payment system error' };
    
    default:
      console.error('Stripe error:', error);
      return { error: 'Payment processing failed' };
  }
}
```

## Security Considerations (Planned)

1. **API Key Protection**: Never expose secret key to client
2. **Webhook Verification**: Always verify webhook signatures
3. **Amount Validation**: Validate amounts on server
4. **Idempotency Keys**: Prevent duplicate charges
5. **PCI Compliance**: Use Stripe Elements (no card data touches server)
6. **User Verification**: Validate user before wallet updates

### Idempotency
```typescript
const paymentIntent = await stripe.paymentIntents.create(
  params,
  {
    idempotencyKey: `deposit_${userId}_${Date.now()}`,
  }
);
```

## Testing (Planned)

### Test Cards
```
Success:
  4242 4242 4242 4242 (Visa)
  5555 5555 5555 4444 (Mastercard)

Decline:
  4000 0000 0000 0002 (Generic decline)
  4000 0000 0000 9995 (Insufficient funds)

Authentication Required:
  4000 0025 0000 3155 (3D Secure)
```

### Test Scenarios
```typescript
// Test successful payment
await testPayment({
  card: '4242424242424242',
  amount: 25.00,
  expectedStatus: 'succeeded',
});

// Test declined card
await testPayment({
  card: '4000000000000002',
  amount: 25.00,
  expectedError: 'card_declined',
});
```

## Dependencies

```json
{
  "@stripe/react-stripe-js": "^4.0.0",
  "@stripe/stripe-js": "^7.9.0"
}
```

**Note**: Stripe server SDK not yet installed:
```bash
npm install stripe
```

## Migration from Mock to Production

### Steps Required

1. **Install Stripe SDK**
```bash
npm install stripe
```

2. **Configure Environment Variables**
```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

3. **Update API Routes**
- Replace mock implementation with real Stripe API calls
- Add proper error handling
- Implement webhook verification

4. **Setup Webhooks**
- Configure webhook endpoint in Stripe Dashboard
- Test webhook delivery
- Handle all relevant events

5. **Update Frontend**
- Configure StripeProvider with real publishable key
- Implement Stripe Elements for card input
- Add payment confirmation flow

6. **Testing**
- Test with Stripe test cards
- Verify webhook events
- Test error scenarios
- Validate wallet updates

## Monitoring (Planned)

### Metrics to Track
- Payment success rate
- Average processing time
- Failed payment reasons
- Webhook delivery success
- Dispute rate

### Logging
```typescript
console.log('[stripe:payment-intent]', {
  userId,
  amount,
  currency,
  paymentIntentId: paymentIntent.id,
  status: paymentIntent.status,
});
```

## Related Documentation

- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe React Integration](https://stripe.com/docs/stripe-js/react)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Payment Intents](https://stripe.com/docs/payments/payment-intents)

## Troubleshooting (Planned)

### Common Issues

**Webhook signature verification fails**
- Verify webhook secret is correct
- Check raw body is being used (not parsed JSON)
- Ensure signature header is present

**Payment Intent creation fails**
- Validate API key is correct environment (test vs live)
- Check amount is valid (>= 50 cents for USD)
- Verify currency code is supported

**Frontend Elements not loading**
- Check publishable key is correct
- Verify Stripe.js script loaded
- Check browser console for errors

## Future Enhancements

- Implement full Payment Intents flow
- Add Stripe Checkout for hosted payment pages
- Support subscription/recurring payments
- Add refund functionality
- Implement dispute handling
- Add multi-currency support
- Integrate Stripe Radar for fraud prevention
- Add saved payment methods
- Implement automatic payouts for winnings

