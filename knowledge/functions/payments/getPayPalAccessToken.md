# getPayPalAccessToken Function

## Overview
Internal helper function that authenticates with PayPal OAuth2 and returns an access token for making PayPal API calls. Used by both order creation and capture operations.

## Location
Inline implementation in:
- `src/app/api/paypal/create-order/route.ts` (lines 54-80)
- `src/app/api/paypal/capture-order/route.ts` (lines 42-68)

## Function Type
Inline OAuth2 authentication logic (not exported as separate function)

## Purpose
- Authenticate with PayPal OAuth2 API
- Generate access token for PayPal REST API calls
- Handle authentication failures
- Support environment-based endpoint selection

## Implementation

### Code Pattern
```typescript
// Get PayPal credentials from environment variables
const clientId = process.env.PAYPAL_CLIENT_ID
const clientSecret = process.env.PAYPAL_CLIENT_SECRET

// Determine API base URL based on environment
const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
const paypalEnv = (process.env.PAYPAL_ENV || process.env.NEXT_PUBLIC_PAYPAL_ENV || (isProd ? 'live' : 'sandbox')).toLowerCase()
const baseUrl = process.env.PAYPAL_API_BASE_URL || (paypalEnv === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com')

// Validate credentials
if (!clientId || !clientSecret) {
  throw new Error('PayPal credentials not configured')
}

// Create Base64 auth token
const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

// Request access token
const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'grant_type=client_credentials',
})

// Handle authentication failure
if (!tokenResponse.ok) {
  const errText = await tokenResponse.text()
  console.error('Failed to get PayPal access token', {
    status: tokenResponse.status,
    baseUrl,
    paypalEnv,
    isProd,
    body: errText
  })
  throw new Error('Failed to authenticate with PayPal')
}

// Extract access token
const tokenData = await tokenResponse.json()
const accessToken = tokenData.access_token
```

## Parameters

### Environment Variables (Input)
| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `PAYPAL_CLIENT_ID` | string | Yes | PayPal REST API client ID |
| `PAYPAL_CLIENT_SECRET` | string | Yes | PayPal REST API secret |
| `PAYPAL_ENV` | string | No | "sandbox" or "live" |
| `NEXT_PUBLIC_PAYPAL_ENV` | string | No | Public env override |
| `PAYPAL_API_BASE_URL` | string | No | Custom PayPal API URL |
| `NODE_ENV` | string | No | Node environment |
| `VERCEL_ENV` | string | No | Vercel environment |

## Return Value

### Success
Returns access token string:
```typescript
const accessToken: string = "A21AAxxxxxxxx..."
```

### Failure
Throws error or returns error status code

## PayPal OAuth2 API

### Endpoint
```
POST https://api-m.sandbox.paypal.com/v1/oauth2/token (sandbox)
POST https://api-m.paypal.com/v1/oauth2/token (live)
```

### Request Headers
```http
Authorization: Basic {base64(clientId:clientSecret)}
Content-Type: application/x-www-form-urlencoded
```

### Request Body
```
grant_type=client_credentials
```

### Response (Success)
```json
{
  "scope": "...",
  "access_token": "A21AAxxxxxxxx...",
  "token_type": "Bearer",
  "app_id": "APP-xxxxx",
  "expires_in": 32400,
  "nonce": "..."
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | Bearer token for API calls |
| `token_type` | string | Always "Bearer" |
| `expires_in` | number | Token lifetime in seconds (typically 9 hours) |
| `scope` | string | Granted scopes |
| `app_id` | string | Application ID |

### Response (Failure)
```json
{
  "error": "invalid_client",
  "error_description": "Client Authentication failed"
}
```

## Process Flow

### Step 1: Load Credentials
- Retrieve `PAYPAL_CLIENT_ID` from environment
- Retrieve `PAYPAL_CLIENT_SECRET` from environment
- Validate both are present

### Step 2: Determine Environment
- Check explicit overrides (`PAYPAL_API_BASE_URL`)
- Check environment variables (`PAYPAL_ENV`, `NEXT_PUBLIC_PAYPAL_ENV`)
- Fall back to deployment environment (`NODE_ENV`, `VERCEL_ENV`)
- Default sandbox for development, live for production

### Step 3: Construct Base URL
- Sandbox: `https://api-m.sandbox.paypal.com`
- Live: `https://api-m.paypal.com`
- Or use `PAYPAL_API_BASE_URL` override

### Step 4: Encode Credentials
- Concatenate `clientId:clientSecret`
- Encode as Base64
- Create Basic auth header

### Step 5: Request Token
- POST to `/v1/oauth2/token`
- Include Basic auth header
- Send `grant_type=client_credentials` in body
- Set `Content-Type: application/x-www-form-urlencoded`

### Step 6: Handle Response
- Check HTTP status code
- Parse JSON response
- Extract `access_token` field
- Return token for use in subsequent API calls

### Step 7: Error Handling
- Log failure with status code and environment details
- Do not log credentials or full error response
- Throw error for calling function to handle

## Environment Configuration

### Credential Setup
**Sandbox Credentials:**
1. Log in to PayPal Developer Dashboard
2. Create sandbox app
3. Get client ID and secret
4. Set in environment:
   - `PAYPAL_CLIENT_ID=ASxxxxxxxx...`
   - `PAYPAL_CLIENT_SECRET=ELxxxxxxxx...`
   - `PAYPAL_ENV=sandbox`

**Live Credentials:**
1. Log in to PayPal Developer Dashboard
2. Create live app (requires business account)
3. Get live client ID and secret
4. Set in production environment:
   - `PAYPAL_CLIENT_ID=AYxxxxxxxx...`
   - `PAYPAL_CLIENT_SECRET=EMxxxxxxxx...`
   - `PAYPAL_ENV=live`

### Environment Detection Logic
```typescript
const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
const paypalEnv = (
  process.env.PAYPAL_ENV || 
  process.env.NEXT_PUBLIC_PAYPAL_ENV || 
  (isProd ? 'live' : 'sandbox')
).toLowerCase()
```

Priority order:
1. `PAYPAL_API_BASE_URL` (explicit override)
2. `PAYPAL_ENV` or `NEXT_PUBLIC_PAYPAL_ENV` (environment setting)
3. `NODE_ENV` / `VERCEL_ENV` (deployment context)

## Security Considerations

### Credential Protection
- Credentials stored in secure environment variables
- Never exposed to client code
- Never logged in plain text

### Basic Authentication
- Uses standard OAuth2 client credentials flow
- Base64 encoding is standard for HTTP Basic auth
- Transmitted over HTTPS only

### Token Handling
- Access token used as Bearer token in subsequent calls
- Token has limited lifetime (9 hours typical)
- Token regenerated for each operation (not cached)

### Error Messages
- Generic error messages returned to client
- Detailed errors logged server-side only
- No credential information in error responses

## Business Rules

### Token Lifecycle
- New token generated for each payment operation
- Tokens not cached or reused
- Each create/capture flow gets fresh token

### Environment Switching
- Development uses sandbox credentials
- Production uses live credentials
- Credentials must match environment

### Failure Handling
- Authentication failure prevents payment operation
- Clear error message for missing credentials
- Logged errors include environment context for debugging

## Logging

### Logged Information
```javascript
console.log('[paypal:create-order] env presence', {
  hasClientId: Boolean(clientId),
  hasClientSecret: Boolean(clientSecret),
  paypalEnv,
  baseUrl,
  nodeEnv: process.env.NODE_ENV,
  vercelEnv: process.env.VERCEL_ENV
})
```

### Failure Logging
```javascript
console.error('Failed to get PayPal access token', {
  status: tokenResponse.status,
  baseUrl,
  paypalEnv,
  isProd,
  body: errText  // PayPal error message
})
```

### Not Logged
- Client ID value
- Client secret value
- Access token value
- Base64 auth string

## Used By
- `createPayPalOrder`: Authenticates before creating order
- `capturePayPalOrder`: Authenticates before capturing payment

## Integration Pattern

### Typical Usage
```typescript
// 1. Get access token
const accessToken = await getPayPalAccessToken()

// 2. Use token in subsequent API call
const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData)
})
```

## Error Scenarios

### Missing Credentials
```
Error: PayPal credentials not configured
```
**Cause:** `PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_SECRET` not set
**Resolution:** Set required environment variables

### Invalid Credentials
```
Error: Failed to authenticate with PayPal
```
**Cause:** Credentials incorrect or mismatched with environment
**Resolution:** Verify credentials match selected environment (sandbox/live)

### Network Failure
```
Error: Failed to authenticate with PayPal
```
**Cause:** Cannot reach PayPal API endpoint
**Resolution:** Check network connectivity, verify baseUrl

### Wrong Environment
```
Error: Failed to authenticate with PayPal
```
**Cause:** Using sandbox credentials with live endpoint (or vice versa)
**Resolution:** Align credentials with environment setting

## Related Functions
- `createPayPalOrder`: Consumer of access token
- `capturePayPalOrder`: Consumer of access token

## Related Documentation
- [Function: createPayPalOrder](./createPayPalOrder.md)
- [Function: capturePayPalOrder](./capturePayPalOrder.md)
- [PayPal OAuth2 Documentation](https://developer.paypal.com/api/rest/authentication/)

## Implementation Notes

### No Token Caching
Currently, each operation generates a new token. For optimization:
- Could cache token with expiration
- Would reduce API calls
- Requires thread-safe caching mechanism

### Refactoring Opportunity
This logic is duplicated in both create and capture routes. Consider:
- Extract to shared utility function
- Centralize environment detection
- Reuse across all PayPal operations

### Token Expiration
PayPal tokens typically expire after 9 hours. Current implementation:
- Generates fresh token for each operation
- No need to handle expiration
- Slightly less efficient but simpler

### Error Handling Improvements
Could enhance error handling:
- Retry logic for transient failures
- More specific error types
- Distinguish between credential vs network errors

