# PayPal Create Order API

## Endpoint
**POST** `/api/paypal/create-order`

## Authentication
None required (PayPal validation happens server-side)

## Purpose
Creates a PayPal order for user deposits. Handles PayPal OAuth, creates order on PayPal's servers, and returns order ID for client-side approval flow.

## Request
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
- **Body**:
```json
{
  "amount": "50.00",
  "currency": "USD",
  "intent": "CAPTURE"
}
```

### Request Fields
- **amount** (required): Deposit amount as string (e.g., "50.00")
- **currency** (required): Must be "USD"
- **intent** (required): Must be "CAPTURE" or "AUTHORIZE"

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
- **id**: PayPal order ID (used for capture)
- **status**: Order status (typically "CREATED")
- **intent**: Payment intent (CAPTURE or AUTHORIZE)
- **amount**: Confirmed amount
- **currency**: Confirmed currency

## Error Responses

### 400 Bad Request - Invalid Amount
```json
{
  "error": "Invalid amount provided"
}
```

### 400 Bad Request - Invalid Currency
```json
{
  "error": "Only USD currency is supported"
}
```

### 400 Bad Request - Invalid Intent
```json
{
  "error": "Invalid intent. Must be CAPTURE or AUTHORIZE"
}
```

### 500 Internal Server Error - Missing Credentials
```json
{
  "error": "PayPal credentials not configured"
}
```

### 500 Internal Server Error - Auth Failed
```json
{
  "error": "Failed to authenticate with PayPal"
}
```

### 500 Internal Server Error - Order Creation Failed
```json
{
  "error": "Failed to create PayPal order"
}
```

## Process Flow

### Step 1: Validate Input
- Verify amount is positive number
- Verify currency is USD
- Verify intent is CAPTURE or AUTHORIZE

### Step 2: Determine Environment
- Check `PAYPAL_ENV` / `NEXT_PUBLIC_PAYPAL_ENV`
- Default to "sandbox" in development, "live" in production
- Set API base URL accordingly

### Step 3: Authenticate with PayPal
- Retrieve client ID and secret from environment
- Create Base64 auth token
- POST to `/v1/oauth2/token` for access token

### Step 4: Create PayPal Order
- POST to `/v2/checkout/orders`
- Include purchase unit with amount and description
- Receive order ID and status

### Step 5: Return Order Details
- Return order ID to client for approval flow

## Environment Configuration

### Environment Variables
- `PAYPAL_CLIENT_ID` (required): PayPal REST API client ID
- `PAYPAL_CLIENT_SECRET` (required): PayPal REST API secret
- `PAYPAL_ENV` or `NEXT_PUBLIC_PAYPAL_ENV`: "sandbox" or "live"
- `PAYPAL_API_BASE_URL`: Override for custom PayPal endpoints
- `NODE_ENV`: Node environment
- `VERCEL_ENV`: Vercel deployment environment

### Sandbox vs. Live
- **Sandbox**: `https://api-m.sandbox.paypal.com`
- **Live**: `https://api-m.paypal.com`

## PayPal API Calls

### OAuth Token Request
```http
POST https://api-m.sandbox.paypal.com/v1/oauth2/token
Authorization: Basic {base64(clientId:clientSecret)}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

### Create Order Request
```http
POST https://api-m.sandbox.paypal.com/v2/checkout/orders
Authorization: Bearer {accessToken}
Content-Type: application/json

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

## Business Rules
- Only USD currency accepted
- Amount must be positive
- Two-step flow: create order → capture order (separate endpoint)
- Order ID returned here is used in client-side PayPal buttons
- No wallet update happens here (only after capture)

## Client-Side Flow
1. Client calls this endpoint to create order
2. Client displays PayPal buttons with order ID
3. User approves payment in PayPal modal
4. Client calls `/api/paypal/capture-order` to complete payment

## Security Considerations
- PayPal credentials never exposed to client
- Server-side OAuth token generation
- Environment-based sandbox/live switching
- No authentication required (payment validated by PayPal)

## Logging
Logs include:
- Environment configuration status
- PayPal authentication attempts
- Order creation success/failure
- No sensitive credential values logged

## Used By
- Wallet deposit flow
- PayPal payment button initialization
- Mobile app deposit screens

## Related Documentation
- [API: PayPal Capture Order](./paypal-capture-order.md)
- [Business Rules: Payment Processing](../business-rules/payment-processing.md)
- [Data Models: Transaction](../data-models/transaction.md)

