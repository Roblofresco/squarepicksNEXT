# Stripe Create Checkout Session API

## Endpoint
**GET** `/api/stripe/create-checkout-session`

## Authentication
None required

## Purpose
**[PLACEHOLDER - NOT IMPLEMENTED]**  
Placeholder endpoint for future Stripe integration. Currently redirects to mock Stripe checkout URL.

## Request
- **Method**: GET
- **Query Parameters**:
  - `amount` (required): Deposit amount in dollars (e.g., "50.00")

## Response

### Success Response (302 Redirect)
Redirects to:
```
https://checkout.stripe.com/pay/cs_test_placeholder?amount={amountInCents}
```

## Error Responses

### 400 Bad Request - Missing Amount
```json
{
  "error": "Amount is required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create checkout session"
}
```

## Implementation Status
**NOT IMPLEMENTED** - This is a placeholder endpoint.

### Current Behavior
- Converts dollar amount to cents
- Redirects to placeholder Stripe URL
- No actual Stripe API integration

### Future Implementation
Would include:
1. Stripe SDK initialization
2. Customer creation/lookup
3. Checkout session creation
4. Webhook handling for payment confirmation
5. Wallet balance update on successful payment

## Business Rules
- PayPal is the primary payment provider
- Stripe integration planned for future release
- USD only (when implemented)

## Related Documentation
- [API: PayPal Create Order](./paypal-create-order.md) - Active payment provider
- [Business Rules: Payment Processing](../business-rules/payment-processing.md)

