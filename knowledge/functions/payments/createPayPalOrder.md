# createPayPalOrder Function

## Overview
Creates a PayPal order for user deposits. This is the first step in the two-phase PayPal payment flow. The function authenticates with PayPal, creates an order, and returns an order ID for client-side approval.

## Location
`src/app/api/paypal/create-order/route.ts`

## Function Type
Next.js API Route (POST handler)

## Authentication
None required (PayPal validation happens server-side)

## Purpose
- Authenticate with PayPal OAuth2
- Create a PayPal order with specified amount
- Return order ID for client-side PayPal button integration
- Handle environment-based sandbox/live switching

## Request Parameters

### HTTP Method
POST

### Headers
- `Content-Type: application/json`

### Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | string | Yes | Deposit amount (e.g., "50.00") |
| `currency` | string | Yes | Currency code (must be "USD") |
| `intent` | string | Yes | Payment intent ("CAPTURE" or "AUTHORIZE") |

### Example Request
```json
{
  "amount": "50.00",
  "currency": "USD",
  "intent": "CAPTURE"
}
```

## Response

### Success Response (200)
```json
{
  "id": "7XY12345ABC67890",
  "status": "CREATED",
  "intent": "CAPTURE",
  "amount": "50.00",
  "currency": "USD"
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | PayPal order ID (used for capture step) |
| `status` | string | Order status (typically "CREATED") |
| `intent` | string | Payment intent (CAPTURE or AUTHORIZE) |
| `amount` | string | Confirmed deposit amount |
| `currency` | string | Confirmed currency code |

### Error Responses

#### 400 Bad Request - Invalid Amount
```json
{
  "error": "Invalid amount provided"
}
```

#### 400 Bad Request - Invalid Currency
```json
{
  "error": "Only USD currency is supported"
}
```

#### 400 Bad Request - Invalid Intent
```json
{
  "error": "Invalid intent. Must be CAPTURE or AUTHORIZE"
}
```

#### 500 Internal Server Error - Missing Credentials
```json
{
  "error": "PayPal credentials not configured"
}
```

#### 500 Internal Server Error - Auth Failed
```json
{
  "error": "Failed to authenticate with PayPal"
}
```

#### 500 Internal Server Error - Order Creation Failed
```json
{
  "error": "Failed to create PayPal order"
}
```

## Process Flow

### Step 1: Input Validation
- Verify amount is a positive number
- Ensure currency is "USD"
- Validate intent is "CAPTURE" or "AUTHORIZE"

### Step 2: Environment Detection
- Check `PAYPAL_ENV` or `NEXT_PUBLIC_PAYPAL_ENV` environment variable
- Default to "sandbox" in development
- Default to "live" in production
- Override with `PAYPAL_API_BASE_URL` if provided

### Step 3: PayPal Authentication
- Retrieve `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` from environment
- Encode credentials as Base64 for Basic auth
- Call `getPayPalAccessToken()` internally
- POST to `/v1/oauth2/token` endpoint
- Receive access token for API calls

### Step 4: Create PayPal Order
- POST to `/v2/checkout/orders` endpoint
- Include purchase unit with:
  - Amount (currency code and value)
  - Description: "Deposit for SquarePicks Account - $X.XX"
- Use Bearer token authentication
- Receive order ID and status from PayPal

### Step 5: Return Order Details
- Extract order ID and status
- Return to client for PayPal button approval flow

## PayPal API Integration

### Authentication Endpoint
```
POST https://api-m.sandbox.paypal.com/v1/oauth2/token
POST https://api-m.paypal.com/v1/oauth2/token (live)
```

**Headers:**
- `Authorization: Basic {base64(clientId:clientSecret)}`
- `Content-Type: application/x-www-form-urlencoded`

**Body:**
```
grant_type=client_credentials
```

**Response:**
```json
{
  "access_token": "A21AAxxxxxxxx...",
  "token_type": "Bearer",
  "expires_in": 32400
}
```

### Create Order Endpoint
```
POST https://api-m.sandbox.paypal.com/v2/checkout/orders
POST https://api-m.paypal.com/v2/checkout/orders (live)
```

**Headers:**
- `Authorization: Bearer {accessToken}`
- `Content-Type: application/json`

**Body:**
```json
{
  "intent": "CAPTURE",
  "purchase_units": [
    {
      "amount": {
        "currency_code": "USD",
        "value": "50.00"
      },
      "description": "Deposit for SquarePicks Account - $50.00"
    }
  ]
}
```

**Response:**
```json
{
  "id": "7XY12345ABC67890",
  "status": "CREATED",
  "intent": "CAPTURE",
  "purchase_units": [...],
  "links": [...]
}
```

## Environment Configuration

### Required Environment Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `PAYPAL_CLIENT_ID` | PayPal REST API client ID | `ASxxxxxxxx...` |
| `PAYPAL_CLIENT_SECRET` | PayPal REST API secret | `ELxxxxxxxx...` |

### Optional Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PAYPAL_ENV` | PayPal environment ("sandbox" or "live") | Based on NODE_ENV |
| `NEXT_PUBLIC_PAYPAL_ENV` | Public PayPal environment | Based on NODE_ENV |
| `PAYPAL_API_BASE_URL` | Override PayPal API base URL | Environment-based |
| `NODE_ENV` | Node environment | - |
| `VERCEL_ENV` | Vercel deployment environment | - |

### Environment Base URLs
- **Sandbox**: `https://api-m.sandbox.paypal.com`
- **Live**: `https://api-m.paypal.com`

## Business Rules

### Currency Restrictions
- Only USD currency is accepted
- All amounts must be positive
- Amounts are formatted to 2 decimal places

### Payment Flow
- Two-step process: create order → capture order (separate endpoint)
- Order ID returned here is passed to PayPal client-side buttons
- No wallet update occurs at this stage
- Balance update happens after capture in `capturePayPalOrder`

### Environment Handling
- Sandbox mode for development/testing
- Live mode for production
- Automatic environment detection based on deployment context
- Manual override available via environment variables

## Security Considerations

### Credential Management
- PayPal credentials never exposed to client
- Server-side OAuth token generation
- Credentials stored in secure environment variables
- No credential values logged

### Validation
- Amount validation prevents negative or zero deposits
- Currency restriction to USD only
- Intent validation ensures proper payment type

### Error Handling
- Specific error messages for different failure scenarios
- PayPal API errors logged with status codes
- No sensitive data in client-facing error messages

## Logging

### Logged Information
- Environment configuration status (hasClientId, hasClientSecret, paypalEnv, baseUrl)
- Node environment and Vercel environment
- PayPal authentication attempts and failures
- Order creation success with order ID
- PayPal API errors with status codes

### Not Logged
- Actual client ID or secret values
- Access tokens
- Full PayPal API responses (only IDs and statuses)

## Client-Side Flow

1. Client calls this endpoint to create order
2. Client receives order ID in response
3. Client initializes PayPal buttons with order ID
4. User approves payment in PayPal modal
5. Client calls `/api/paypal/capture-order` to complete transaction
6. Wallet balance updated after successful capture

## Used By
- Wallet deposit page (`src/app/wallet/page.tsx` or deposit flow)
- PayPal payment button initialization
- Mobile app deposit screens

## Related Functions
- `getPayPalAccessToken()`: Internal authentication helper
- `capturePayPalOrder`: Second step in payment flow
- `/api/wallet/update-balance`: Updates balance after capture

## Related Documentation
- [API: PayPal Capture Order](../../apis/paypal-capture-order.md)
- [Function: capturePayPalOrder](./capturePayPalOrder.md)
- [Function: getPayPalAccessToken](./getPayPalAccessToken.md)
- [Data Model: Transactions](../../data-models/transactions.md)
- [Data Model: Users](../../data-models/users.md)

## Implementation Notes

### Idempotency
- Order creation is not idempotent at this stage
- Multiple calls create multiple orders
- Idempotency enforced at capture stage using deterministic transaction IDs

### Error Recovery
- Failed authentication requires credential verification
- Failed order creation may indicate PayPal service issues
- Client should handle errors gracefully and allow retry

### Testing
- Use PayPal sandbox environment for development
- Sandbox credentials separate from live credentials
- Test with various amounts and scenarios

