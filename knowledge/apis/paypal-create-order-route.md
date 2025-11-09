# API: PayPal - Create Order

## Endpoint

`POST /api/paypal/create-order`

## Purpose

Creates a PayPal order for user deposits using PayPal Orders API v2.

## Authentication

**None at API level** - Assumes client-side validation (should add auth in production)

## Input

- **Body**:

```json
{
  "amount": "string | number (required)",
  "currency": "string (default: USD)",
  "intent": "string (required: CAPTURE | AUTHORIZE)"
}
```

## Output

**Success:**

```json
{
  "id": "string (PayPal order ID)",
  "status": "string",
  "intent": "string",
  "amount": "string",
  "currency": "string"
}
```

**Error:**

```json
{
  "error": "string"
}
```

## Error Codes

- **400**: Invalid input
  - Invalid amount provided (must be > 0)
  - Only USD currency is supported
  - Invalid intent (must be CAPTURE or AUTHORIZE)
- **500**: PayPal API errors
  - PayPal credentials not configured
  - Failed to authenticate with PayPal
  - Failed to create PayPal order

## Implementation Details

### Environment Configuration

**PayPal Environment Detection:**
1. `PAYPAL_ENV` → explicit override
2. `NEXT_PUBLIC_PAYPAL_ENV` → public config
3. `NODE_ENV === 'production'` OR `VERCEL_ENV === 'production'` → `'live'`
4. Default → `'sandbox'`

**API Base URL Priority:**
1. `PAYPAL_API_BASE_URL` (explicit override)
2. `paypalEnv === 'live'` → `https://api-m.paypal.com`
3. Else → `https://api-m.sandbox.paypal.com`

### PayPal API Flow

1. **Authenticate**: Get access token via OAuth 2.0
   - Endpoint: `POST /v1/oauth2/token`
   - Auth: Basic (base64 of `clientId:clientSecret`)
   - Grant type: `client_credentials`

2. **Create Order**: Create PayPal order
   - Endpoint: `POST /v2/checkout/orders`
   - Auth: Bearer token from step 1
   - Body:
     ```json
     {
       "intent": "CAPTURE",
       "purchase_units": [{
         "amount": {
           "currency_code": "USD",
           "value": "10.00"
         },
         "description": "Deposit for SquarePicks Account - $10.00"
       }]
     }
     ```

### Logging

Logs environment diagnostics (safe, no secrets):
- `hasClientId`: boolean
- `hasClientSecret`: boolean
- `paypalEnv`: live | sandbox
- `baseUrl`: API URL
- `nodeEnv`: runtime environment
- `vercelEnv`: deployment environment

## Used By

- `src/app/wallet/page.tsx` - Wallet/deposit page
- PayPal button integration components

## Related Functions

### External APIs

- PayPal OAuth 2.0: `/v1/oauth2/token`
- PayPal Orders API v2: `/v2/checkout/orders`

### Dependencies

None - Uses native `fetch` API

## Environment Variables

**Required:**
- `PAYPAL_CLIENT_ID` - PayPal REST API Client ID
- `PAYPAL_CLIENT_SECRET` - PayPal REST API Secret

**Optional:**
- `PAYPAL_ENV` - Override environment (live | sandbox)
- `NEXT_PUBLIC_PAYPAL_ENV` - Public env config
- `PAYPAL_API_BASE_URL` - Override API base URL
- `NODE_ENV` - Runtime environment
- `VERCEL_ENV` - Deployment environment

## Security Considerations

⚠️ **TODO**: Add authentication to prevent abuse
- Require Firebase Auth token
- Verify user identity
- Rate limit order creation

## Notes

- Only supports USD currency
- Amount is converted to fixed 2 decimal places
- Returns PayPal order ID for client-side approval flow
- Client must complete order via PayPal Checkout

