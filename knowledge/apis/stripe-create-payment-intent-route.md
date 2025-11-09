# API: Stripe - Create Payment Intent

## Endpoint

`POST /api/stripe/create-payment-intent`

## Purpose

Creates a Stripe PaymentIntent for user deposits (MOCK IMPLEMENTATION - not production ready).

## Authentication

**None** - Mock endpoint

## Input

- **Body**:

```json
{
  "amount": "number (required)",
  "currency": "string (default: usd)"
}
```

## Output

**Success (Mock):**

```json
{
  "client_secret": "string (mock secret)",
  "payment_intent": {
    "id": "string (mock ID)",
    "client_secret": "string (mock secret)",
    "amount": "number",
    "currency": "string",
    "status": "requires_payment_method"
  }
}
```

**Error:**

```json
{
  "error": "string"
}
```

## Error Codes

- **400**: Amount is required
- **500**: Failed to create payment intent (generic error)

## Implementation Details

### Mock Response

Currently returns hardcoded mock data:
- Payment Intent ID: `pi_mock_{timestamp}`
- Client Secret: `pi_mock_{timestamp}_secret_mock`
- Status: `requires_payment_method`
- Amount: Echoed from request
- Currency: Echoed from request (default: `usd`)

### Production Implementation TODO

To make production-ready:

1. Install Stripe SDK: `npm install stripe`
2. Add environment variable: `STRIPE_SECRET_KEY`
3. Initialize Stripe client:
   ```typescript
   import Stripe from 'stripe';
   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
     apiVersion: '2023-10-16'
   });
   ```
4. Create real PaymentIntent:
   ```typescript
   const paymentIntent = await stripe.paymentIntents.create({
     amount: Math.round(amount * 100), // Convert to cents
     currency: currency.toLowerCase(),
     automatic_payment_methods: {
       enabled: true,
     },
     metadata: {
       userId: userId, // Add after auth
     },
   });
   ```
5. Add authentication (Firebase Auth)
6. Add webhook handler for payment confirmation
7. Integrate with `/api/wallet/update-balance`

## Used By

- Stripe integration components (when implemented)
- `src/app/wallet/page.tsx` - Wallet page (future)

## Related Functions

None currently - standalone mock

### Future Dependencies

- `stripe` - Stripe Node.js SDK
- `POST /api/wallet/update-balance` - For balance updates after successful payment

## Environment Variables

**Not yet required** (mock implementation)

**Future:**
- `STRIPE_SECRET_KEY` - Stripe API Secret Key
- `STRIPE_PUBLISHABLE_KEY` - Stripe Publishable Key (for client)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

## Security Considerations

⚠️ **CRITICAL**: This is a MOCK implementation
1. Do NOT use in production
2. Add Firebase Auth before deploying
3. Validate amount limits (min/max)
4. Add rate limiting
5. Implement webhook handler for payment confirmation
6. Never trust client-side amount validation

## Notes

- Mock implementation for UI development
- Requires full Stripe integration before production use
- Should match PayPal flow structure when implemented
- Consider using Stripe Checkout (simpler) vs PaymentIntents (more control)

