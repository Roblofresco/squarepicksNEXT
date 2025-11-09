# Environment Check API

## Endpoint
**GET** `/api/env-check`

## Authentication
None required (read-only diagnostic endpoint)

## Purpose
Returns environment configuration status without exposing sensitive credentials. Used for debugging deployment and configuration issues.

## Request
- **Method**: GET
- **Headers**: None required
- **Body**: None

## Response

### Success Response (200)
```json
{
  "runtime": {
    "nodeEnv": "production",
    "vercelEnv": "production",
    "region": "iad1"
  },
  "paypal": {
    "hasClientId": true,
    "hasClientSecret": true,
    "paypalEnv": "sandbox",
    "apiBase": "https://api-m.sandbox.paypal.com"
  },
  "public": {
    "hasPublicClientId": true,
    "nextPublicBaseUrl": "https://www.squarepicks.com",
    "nextPublicPaypalEnv": "sandbox"
  }
}
```

### Response Fields
- **runtime.nodeEnv**: Node environment (`development`, `production`)
- **runtime.vercelEnv**: Vercel-specific environment
- **runtime.region**: Deployment region
- **paypal.hasClientId**: Boolean indicating if PayPal client ID is configured
- **paypal.hasClientSecret**: Boolean indicating if PayPal client secret is configured
- **paypal.paypalEnv**: Active PayPal environment (`sandbox`, `live`)
- **paypal.apiBase**: PayPal API base URL
- **public.hasPublicClientId**: Boolean for public client ID presence
- **public.nextPublicBaseUrl**: Public base URL for the application
- **public.nextPublicPaypalEnv**: Public PayPal environment setting

## Error Responses
None - always returns 200 with configuration booleans

## Environment Variables Used
- `NODE_ENV`
- `VERCEL_ENV`
- `VERCEL_REGION`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV`
- `NEXT_PUBLIC_PAYPAL_ENV`
- `PAYPAL_API_BASE_URL`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `NEXT_PUBLIC_BASE_URL`

## Business Rules
- Automatically determines PayPal environment based on NODE_ENV if not explicitly set
- Never exposes actual credential values, only presence indicators
- Used by developers to diagnose configuration mismatches

## Used By
- DevOps team for deployment verification
- Development team for debugging environment configuration
- Monitoring systems to verify proper configuration

## Related Documentation
- [Data Models: User](../data-models/user.md) - Wallet configuration
- [Business Rules: Payment Processing](../business-rules/payment-processing.md)

