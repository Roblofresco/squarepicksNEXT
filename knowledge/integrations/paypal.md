# PayPal Integration

## Overview
Integration with PayPal REST API for processing deposits and payments in the SquarePicks application.

## API Details

### Base URLs
- **Sandbox**: `https://api-m.sandbox.paypal.com`
- **Production**: `https://api-m.paypal.com`

### Endpoints Used

#### Create Order
```
POST /v2/checkout/orders
```

#### Capture Order
```
POST /v2/checkout/orders/{order_id}/capture
```

#### Get Access Token
```
POST /v1/oauth2/token
```

## Implementation

### Location
- **Create Order**: `src/app/api/paypal/create-order/route.ts`
- **Capture Order**: `src/app/api/paypal/capture-order/route.ts`
- **Frontend Provider**: `src/components/providers/PayPalProvider.tsx`

### Environment Configuration

```bash
# Required Environment Variables
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_client_secret

# Optional (defaults to sandbox in dev, live in prod)
PAYPAL_ENV=sandbox|live
NEXT_PUBLIC_PAYPAL_ENV=sandbox|live
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com

# Vercel deployment
NODE_ENV=production|development
VERCEL_ENV=production|preview|development
```

### Environment Detection Logic
```typescript
const isProd = process.env.NODE_ENV === 'production' || 
               process.env.VERCEL_ENV === 'production';

const paypalEnv = (
  process.env.PAYPAL_ENV || 
  process.env.NEXT_PUBLIC_PAYPAL_ENV || 
  (isProd ? 'live' : 'sandbox')
).toLowerCase();

const baseUrl = process.env.PAYPAL_API_BASE_URL || 
  (paypalEnv === 'live' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com'
  );
```

## Authentication

### OAuth 2.0 Client Credentials Flow

```typescript
// Encode credentials
const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

// Get access token
const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'grant_type=client_credentials',
});

const { access_token } = await tokenResponse.json();
```

### Token Usage
```typescript
// Use token in API requests
headers: {
  'Authorization': `Bearer ${access_token}`,
  'Content-Type': 'application/json',
}
```

## Create Order Flow

### Request
```typescript
POST /api/paypal/create-order

{
  "amount": "25.00",
  "currency": "USD",
  "intent": "CAPTURE"
}
```

### Validation
```typescript
// Amount validation
if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
  return { error: 'Invalid amount provided' };
}

// Currency validation
if (currency !== 'USD') {
  return { error: 'Only USD currency is supported' };
}

// Intent validation
if (intent !== 'CAPTURE' && intent !== 'AUTHORIZE') {
  return { error: 'Invalid intent. Must be CAPTURE or AUTHORIZE' };
}
```

### Order Creation
```typescript
const orderData = {
  intent: intent, // 'CAPTURE' or 'AUTHORIZE'
  purchase_units: [
    {
      amount: {
        currency_code: currency,
        value: parseFloat(amount).toFixed(2),
      },
      description: `Deposit for SquarePicks Account - $${amount}`,
    },
  ],
};

const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData),
});
```

### Response
```typescript
{
  "id": "ORDER_ID",
  "status": "CREATED",
  "intent": "CAPTURE",
  "amount": "25.00",
  "currency": "USD"
}
```

## Capture Order Flow

### Request
```typescript
POST /api/paypal/capture-order

Headers:
  x-user-id: {userId} // Firebase UID

Body:
{
  "orderID": "ORDER_ID_FROM_CREATE"
}
```

### Capture Execution
```typescript
const captureResponse = await fetch(
  `${baseUrl}/v2/checkout/orders/${orderID}/capture`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  }
);

const captureData = await captureResponse.json();
```

### Capture Verification
```typescript
// Verify capture status
if (captureData.status !== 'COMPLETED') {
  throw new Error(`Payment capture failed. Status: ${captureData.status}`);
}

// Extract payment details
const purchaseUnit = captureData.purchase_units?.[0];
const capture = purchaseUnit?.payments?.captures?.[0];

if (!capture || capture.status !== 'COMPLETED') {
  throw new Error('No successful capture found');
}

const amountCaptured = parseFloat(capture.amount.value);
const currencyCaptured = capture.amount.currency_code;
```

### Wallet Update Integration
```typescript
// Update user wallet balance
const walletResponse = await fetch(
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/wallet/update-balance`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      amount: amountCaptured,
      orderId: orderID,
      currency: currencyCaptured,
    }),
  }
);
```

### Response
```typescript
{
  "success": true,
  "message": "PayPal order captured and wallet updated successfully.",
  "orderId": "ORDER_ID",
  "amountDeposited": 25.00,
  "currency": "USD",
  "newBalance": 50.00
}
```

## Frontend Integration

### PayPal Provider
```typescript
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

const initialOptions = {
  'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
  currency: 'USD',
  intent: 'capture',
};

<PayPalScriptProvider options={initialOptions}>
  {children}
</PayPalScriptProvider>
```

### Deposit Button Component
```typescript
import { PayPalButtons } from '@paypal/react-paypal-js';

<PayPalButtons
  style={{ layout: 'horizontal', tagline: false }}
  createOrder={async () => {
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: depositAmount,
        currency: 'USD',
        intent: 'CAPTURE',
      }),
    });
    const { id } = await response.json();
    return id;
  }}
  onApprove={async (data) => {
    const response = await fetch('/api/paypal/capture-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.uid,
      },
      body: JSON.stringify({ orderID: data.orderID }),
    });
    const result = await response.json();
    // Handle success
  }}
  onError={(err) => {
    console.error('PayPal error:', err);
    // Handle error
  }}
/>
```

## Rate Limits

PayPal enforces rate limits per app:
- **Sandbox**: 20 requests per second
- **Production**: Varies by account type

### Rate Limit Headers
```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
X-RateLimit-Reset: 1699564800
```

## Error Handling

### Common Errors

#### Authentication Failure
```typescript
{
  "error": "Failed to authenticate with PayPal",
  "status": 500
}
```

#### Invalid Order
```typescript
{
  "name": "UNPROCESSABLE_ENTITY",
  "message": "The requested action could not be performed",
  "details": [
    {
      "issue": "AMOUNT_MISMATCH",
      "description": "Amounts do not match"
    }
  ]
}
```

#### Capture Failed
```typescript
{
  "name": "ORDER_NOT_APPROVED",
  "message": "Payer has not yet approved the Order for payment"
}
```

### Error Handler
```typescript
try {
  // PayPal operation
} catch (error: any) {
  console.error('PayPal error:', error);
  
  if (error.response?.status === 401) {
    return { error: 'PayPal authentication failed' };
  } else if (error.response?.status === 422) {
    return { error: 'Invalid payment details' };
  } else {
    return { error: 'Payment processing failed' };
  }
}
```

## Security Considerations

1. **Server-Side Processing**: All PayPal API calls on server
2. **Credential Protection**: Never expose client secret to client
3. **User Validation**: Verify user ID before wallet updates
4. **Amount Verification**: Validate amounts on server
5. **Idempotency**: Handle duplicate capture attempts
6. **Audit Logging**: Log all payment transactions

### Security Best Practices
```typescript
// Verify user owns the order
const order = await getOrderFromDatabase(orderID);
if (order.userId !== request.headers.get('x-user-id')) {
  return { error: 'Unauthorized', status: 403 };
}

// Validate amount matches expected
if (capturedAmount !== order.expectedAmount) {
  // Log discrepancy
  await logAmountMismatch(orderID, capturedAmount, order.expectedAmount);
}
```

## Testing

### Sandbox Credentials
1. Create app at [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Get sandbox client ID and secret
3. Use sandbox test accounts for payments

### Test Cards
PayPal provides test accounts:
- **Email**: sb-buyer@personal.example.com
- **Password**: (generated by PayPal)

### Test Scenarios
```typescript
// Test successful payment
await testPayment({ amount: '10.00', expectedStatus: 'COMPLETED' });

// Test invalid amount
await testPayment({ amount: '-5.00', expectedError: 'Invalid amount' });

// Test currency mismatch
await testPayment({ currency: 'EUR', expectedError: 'Only USD supported' });
```

## Monitoring

### Logging
```typescript
console.log('[paypal:create-order] env presence', {
  hasClientId: Boolean(clientId),
  hasClientSecret: Boolean(clientSecret),
  paypalEnv,
  baseUrl,
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV
});
```

### Metrics to Track
- Order creation success rate
- Capture success rate
- Average processing time
- Failed payment reasons
- Wallet update success rate

## Dependencies

```json
{
  "@paypal/react-paypal-js": "^8.8.3"
}
```

## Related Documentation

- [PayPal REST API Reference](https://developer.paypal.com/api/rest/)
- [PayPal Orders API](https://developer.paypal.com/docs/api/orders/v2/)
- [PayPal JavaScript SDK](https://developer.paypal.com/sdk/js/)

## Troubleshooting

### Environment variables not loading
- Check `.env.local` file exists
- Verify variable names match exactly
- Restart Next.js dev server

### Sandbox vs Production issues
- Ensure correct environment is configured
- Verify credentials match environment
- Check `PAYPAL_ENV` setting

### Wallet not updating after payment
- Check `x-user-id` header is sent
- Verify wallet update API is working
- Check Firestore rules allow updates

## Future Enhancements

- Add PayPal subscription support
- Implement refund functionality
- Add dispute handling
- Support multiple currencies
- Add PayPal Checkout Advanced features
- Implement webhooks for payment notifications

