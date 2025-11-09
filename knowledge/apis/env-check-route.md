# API: Environment Check

## Endpoint

`GET /api/env-check`

## Purpose

Returns read-only diagnostics of environment configuration for PayPal and runtime settings (no sensitive values exposed).

## Authentication

**None** - Public diagnostic endpoint

## Input

- **Query Params**: None

## Output

```json
{
  "runtime": {
    "nodeEnv": "string | null",
    "vercelEnv": "string | null",
    "region": "string | null"
  },
  "paypal": {
    "hasClientId": "boolean",
    "hasClientSecret": "boolean",
    "paypalEnv": "string (live | sandbox)",
    "apiBase": "string"
  },
  "public": {
    "hasPublicClientId": "boolean",
    "nextPublicBaseUrl": "string | null",
    "nextPublicPaypalEnv": "string | null"
  }
}
```

## Error Codes

None - Always returns 200 with configuration status

## Implementation Details

### Environment Detection

**PayPal Environment Priority:**
1. `PAYPAL_ENV` (explicit override)
2. `NEXT_PUBLIC_PAYPAL_ENV` (public env var)
3. `NODE_ENV === 'production'` → `'live'`
4. Default → `'sandbox'`

**API Base URL:**
- Live: `https://api-m.paypal.com`
- Sandbox: `https://api-m.sandbox.paypal.com`
- Can be overridden with `PAYPAL_API_BASE_URL`

### Checked Environment Variables

**Private:**
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_API_BASE_URL`
- `PAYPAL_ENV`

**Public:**
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_PAYPAL_ENV`

**Runtime:**
- `NODE_ENV`
- `VERCEL_ENV`
- `VERCEL_REGION`

### Security

- Returns ONLY boolean presence checks (not actual values)
- Safe to expose publicly for debugging
- No credentials or secrets revealed

## Used By

- Admin/debug pages
- Setup verification during deployment
- Troubleshooting payment configuration issues

## Related Functions

None - Standalone diagnostic endpoint

## Notes

- Use during initial setup to verify environment variables are loaded
- Check before payment operations to ensure configuration is complete
- Helpful for debugging production vs sandbox environment issues

