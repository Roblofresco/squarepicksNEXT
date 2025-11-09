# API: PayPal - Capture Order

## Endpoint

`POST /api/paypal/capture-order`

## Purpose

Captures a PayPal order after user approval and updates user wallet balance.

## Authentication

**Partial** - Requires `x-user-id` header (should use Firebase Auth in production)

## Input

- **Body**:

```json
{
  "orderID": "string (required)"
}
```

- **Headers**:
  - `x-user-id`: User ID (required for wallet update)

## Output

**Success:**

```json
{
  "success": true,
  "message": "PayPal order captured and wallet updated successfully.",
  "orderId": "string",
  "amountDeposited": "number",
  "currency": "string",
  "newBalance": "number",
  "previousBalance": "number",
  "transactionId": "string",
  "notificationId": "string"
}
```

**Partial Success (PayPal OK, wallet failed):**

```json
{
  "success": true,
  "message": "PayPal order captured successfully, but wallet update failed. Please contact support.",
  "orderId": "string",
  "amountDeposited": "number",
  "currency": "string",
  "warning": "string"
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
  - Order ID is required
  - Unsupported currency (only USD accepted)
- **500**: PayPal or wallet errors
  - PayPal credentials not configured
  - Failed to authenticate with PayPal
  - Failed to capture PayPal order
  - PayPal payment capture failed (status not COMPLETED)
  - Failed to verify payment capture details

## Implementation Details

### PayPal Capture Flow

1. **Authenticate**: Get PayPal access token
   - Endpoint: `POST /v1/oauth2/token`
   - Auth: Basic (base64 of `clientId:clientSecret`)

2. **Capture Order**: Finalize payment
   - Endpoint: `POST /v2/checkout/orders/{orderID}/capture`
   - Auth: Bearer token
   - Validates capture status is `COMPLETED`

3. **Extract Payment Details**:
   - Amount: `purchase_units[0].payments.captures[0].amount.value`
   - Currency: `purchase_units[0].payments.captures[0].amount.currency_code`
   - Capture Status: `purchase_units[0].payments.captures[0].status`

4. **Update Wallet**: Call internal API
   - Endpoint: `POST /api/wallet/update-balance`
   - Body: `{ userId, amount, orderId, currency }`

### Environment Configuration

Same as `create-order` route:
- PayPal environment detection
- API base URL resolution
- Safe diagnostic logging

### Error Handling

**Graceful Degradation:**
- If wallet update fails, PayPal capture is still complete
- Returns success response with warning
- User should contact support to reconcile balance
- Money is captured, just not reflected in app wallet

### Currency Validation

Only USD is accepted. If PayPal captures in another currency, returns 400 error.

## Used By

- PayPal checkout flow completion
- `src/app/wallet/page.tsx` - Wallet page callback

## Related Functions

### Internal APIs

- `POST /api/wallet/update-balance` - Updates user balance atomically

### External APIs

- PayPal OAuth 2.0: `/v1/oauth2/token`
- PayPal Orders API v2: `/v2/checkout/orders/{id}/capture`

### Dependencies

- `@/lib/firebase` - Firebase client (unused import, should be removed)
- `firebase/functions` - Firebase Functions SDK (unused import, should be removed)

## Environment Variables

**Required:**
- `PAYPAL_CLIENT_ID` - PayPal REST API Client ID
- `PAYPAL_CLIENT_SECRET` - PayPal REST API Secret
- `NEXT_PUBLIC_BASE_URL` - Base URL for internal API calls (defaults to https://www.squarepicks.com)

**Optional:**
- `PAYPAL_ENV` - Override environment (live | sandbox)
- `NEXT_PUBLIC_PAYPAL_ENV` - Public env config
- `PAYPAL_API_BASE_URL` - Override API base URL
- `NODE_ENV` - Runtime environment
- `VERCEL_ENV` - Deployment environment

## Security Considerations

⚠️ **TODO**: Improve authentication
1. Replace `x-user-id` header with Firebase Auth token
2. Verify user owns the PayPal order
3. Add idempotency to prevent double-capture
4. Rate limit capture attempts

## Notes

- Captures are final and cannot be undone
- If capture succeeds but wallet fails, manual reconciliation needed
- Logs all captures with order ID and amount
- Returns partial success to inform user of manual intervention needs

