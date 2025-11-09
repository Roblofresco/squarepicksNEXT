# Stripe Create Payment Intent API

## Endpoint
**POST** `/api/stripe/create-payment-intent`

## Authentication
None required

## Purpose
**[PLACEHOLDER - NOT IMPLEMENTED]**  
Placeholder endpoint for future Stripe Elements integration. Currently returns mock payment intent for development.

## Request
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
- **Body**:
```json
{
  "amount": 5000,
  "currency": "usd"
}
```

### Request Fields
- **amount** (required): Amount in cents (5000 = $50.00)
- **currency** (optional): Currency code (default: "usd")

## Response

### Success Response (200) - Mock Data
```json
{
  "client_secret": "pi_mock_1702656000000_secret_mock",
  "payment_intent": {
    "id": "pi_mock_1702656000000",
    "client_secret": "pi_mock_1702656000000_secret_mock",
    "amount": 5000,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
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
  "error": "Failed to create payment intent"
}
```

## Implementation Status
**NOT IMPLEMENTED** - This is a mock endpoint.

### Current Behavior
- Generates mock payment intent ID using timestamp
- Returns fake client secret
- No actual Stripe API integration
- Used for frontend development only

### Future Implementation
Would include:
1. Stripe SDK initialization with secret key
2. Customer creation/retrieval
3. Payment intent creation via Stripe API
4. Metadata attachment (user ID, order details)
5. Webhook handler for payment confirmation
6. Wallet balance update on successful charge

## Stripe Payment Intent Flow (When Implemented)

### Step 1: Create Payment Intent
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd',
  customer: customerId,
  metadata: {
    userId: 'user123',
    type: 'wallet_deposit'
  }
});
```

### Step 2: Return Client Secret
Frontend uses client secret with Stripe Elements

### Step 3: Webhook Confirmation
Stripe sends webhook on successful charge:
```javascript
// POST /api/webhooks/stripe
// Event type: payment_intent.succeeded
```

### Step 4: Update Wallet
Update user balance in Firestore transaction

## Business Rules
- PayPal is current payment provider
- Stripe integration planned for alternative payment method
- Would support card payments, Apple Pay, Google Pay
- USD only initially

## Mock Payment Intent Structure
```json
{
  "id": "pi_mock_{timestamp}",
  "client_secret": "pi_mock_{timestamp}_secret_mock",
  "amount": 5000,
  "currency": "usd",
  "status": "requires_payment_method"
}
```

## Used By
- **NOT USED IN PRODUCTION**
- Frontend development and testing only
- Mock data for Stripe Elements integration testing

## Related Documentation
- [API: Stripe Create Checkout Session](./stripe-create-checkout-session.md)
- [API: PayPal Create Order](./paypal-create-order.md) - Active payment provider
- [Business Rules: Payment Processing](../business-rules/payment-processing.md)

