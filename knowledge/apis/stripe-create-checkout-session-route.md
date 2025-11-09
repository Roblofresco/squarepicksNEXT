# API: Stripe - Create Checkout Session

## Endpoint

`GET /api/stripe/create-checkout-session?amount={amount}`

## Purpose

Creates a Stripe Checkout session and redirects user to Stripe payment page (MOCK IMPLEMENTATION - not production ready).

## Authentication

**None** - Mock endpoint

## Input

- **Query Params**:
  - `amount` (required): Deposit amount in dollars

## Output

**Success:**
- HTTP 302 Redirect to Stripe Checkout URL (mock: `https://checkout.stripe.com/pay/cs_test_placeholder?amount={amountInCents}`)

**Error:**

```json
{
  "error": "string"
}
```

## Error Codes

- **400**: Amount is required
- **500**: Failed to create checkout session

## Implementation Details

### Mock Redirect

Currently redirects to placeholder Stripe Checkout URL:
- Converts amount to cents: `Math.round(parseFloat(amount) * 100)`
- Redirects to: `https://checkout.stripe.com/pay/cs_test_placeholder?amount={cents}`

### Production Implementation TODO

To make production-ready:

1. Install Stripe SDK: `npm install stripe`
2. Add environment variables:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_BASE_URL`
3. Initialize Stripe client
4. Create real Checkout Session:
   ```typescript
   const session = await stripe.checkout.sessions.create({
     payment_method_types: ['card'],
     line_items: [
       {
         price_data: {
           currency: 'usd',
           product_data: {
             name: 'SquarePicks Wallet Deposit',
             description: `Deposit $${amount} to your wallet`,
           },
           unit_amount: Math.round(amount * 100), // cents
         },
         quantity: 1,
       },
     ],
     mode: 'payment',
     success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/wallet?success=true&session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/wallet?canceled=true`,
     metadata: {
       userId: userId, // Add after auth
     },
   });
   ```
5. Redirect to: `session.url`
6. Add authentication (Firebase Auth)
7. Add webhook handler at `/api/stripe/webhook` for `checkout.session.completed` event
8. Integrate with `/api/wallet/update-balance` in webhook

## Used By

- Direct link from wallet page (when implemented)
- Quick deposit flows (future)

## Related Functions

None currently - standalone mock

### Future Dependencies

- `stripe` - Stripe Node.js SDK
- `POST /api/wallet/update-balance` - For balance updates after webhook
- `POST /api/stripe/webhook` - Webhook handler (to be created)

## Environment Variables

**Not yet required** (mock implementation)

**Future:**
- `STRIPE_SECRET_KEY` - Stripe API Secret Key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `NEXT_PUBLIC_BASE_URL` - Base URL for success/cancel redirects

## Security Considerations

⚠️ **CRITICAL**: This is a MOCK implementation
1. Do NOT use in production
2. Add Firebase Auth before deploying
3. Validate amount limits (min/max)
4. Add rate limiting
5. **MUST implement webhook handler** - never update wallet from client callback
6. Verify webhook signatures
7. Make checkout session creation idempotent

## Webhook Implementation Required

Stripe Checkout requires webhook to confirm payment:

```typescript
// POST /api/stripe/webhook
export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Update wallet balance
    await fetch('/api/wallet/update-balance', {
      method: 'POST',
      body: JSON.stringify({
        userId: session.metadata.userId,
        amount: session.amount_total / 100, // Convert from cents
        orderId: session.id,
        currency: session.currency.toUpperCase(),
      }),
    });
  }
  
  return NextResponse.json({ received: true });
}
```

## Notes

- Mock implementation for UI development
- Stripe Checkout is simpler than PaymentIntents
- Handles full payment UI (no custom form needed)
- Supports multiple payment methods automatically
- Requires webhook for security (never trust client redirects)

