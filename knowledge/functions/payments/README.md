# Payment Functions Documentation

## Overview
This directory contains documentation for PayPal payment integration functions used for user deposits into the SquarePicks wallet.

## Functions

### 1. createPayPalOrder
**File:** [createPayPalOrder.md](./createPayPalOrder.md)

Creates a PayPal order for user deposits. First step in the two-phase PayPal payment flow.

**Key Features:**
- PayPal OAuth2 authentication
- Order creation with amount and intent
- Environment-based sandbox/live switching
- Returns order ID for client-side approval

**Location:** `src/app/api/paypal/create-order/route.ts`

---

### 2. capturePayPalOrder
**File:** [capturePayPalOrder.md](./capturePayPalOrder.md)

Captures a PayPal order after user approval and updates wallet balance. Second step in payment flow.

**Key Features:**
- Captures approved PayPal order
- Verifies payment completion
- Updates wallet balance atomically
- Creates transaction record and notification
- Handles payment failures gracefully

**Location:** `src/app/api/paypal/capture-order/route.ts`

---

### 3. getPayPalAccessToken
**File:** [getPayPalAccessToken.md](./getPayPalAccessToken.md)

Internal helper function that authenticates with PayPal OAuth2 and returns an access token.

**Key Features:**
- PayPal OAuth2 client credentials flow
- Environment detection (sandbox/live)
- Access token generation
- Used by both create and capture functions

**Location:** Inline in create-order and capture-order routes

---

## Payment Flow

```
1. User initiates deposit
   ↓
2. createPayPalOrder
   - Authenticate with PayPal
   - Create order
   - Return order ID
   ↓
3. User approves in PayPal modal
   ↓
4. capturePayPalOrder
   - Capture payment
   - Update wallet balance
   - Create transaction record
   ↓
5. User balance updated
```

## PayPal API Integration

### Authentication
All functions use PayPal OAuth2 client credentials flow:
- Client ID and Secret from environment variables
- Base64 encoded for Basic auth
- Access token obtained for API calls
- Separate sandbox and live credentials

### API Endpoints
**Sandbox:**
- `https://api-m.sandbox.paypal.com`

**Live:**
- `https://api-m.paypal.com`

### Environment Variables Required
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV` or `NEXT_PUBLIC_PAYPAL_ENV` (optional)
- `PAYPAL_API_BASE_URL` (optional override)

## Related Documentation

### Data Models
- [Transactions](../../data-models/transactions.md)
- [Users](../../data-models/users.md)

### API Documentation
- [PayPal Create Order API](../../apis/paypal-create-order.md)
- [PayPal Capture Order API](../../apis/paypal-capture-order.md)
- [Wallet Update Balance API](../../apis/wallet-update-balance.md)

### External Resources
- [PayPal REST API Documentation](https://developer.paypal.com/docs/api/overview/)
- [PayPal Orders v2 API](https://developer.paypal.com/docs/api/orders/v2/)

## Security Considerations

### Credential Protection
- Credentials stored in secure environment variables
- Never exposed to client
- Server-side OAuth token generation

### Validation
- Amount validation (positive, USD only)
- Currency restriction (USD only)
- Order status verification before capture

### Idempotency
- Deterministic transaction IDs prevent duplicate credits
- Safe to retry failed operations

## Business Rules

### Currency
- Only USD supported
- All amounts fixed to 2 decimal places

### Payment Flow
- Two-step process (create → capture)
- Balance updated only after successful capture
- Failed captures don't affect balance

### Error Handling
- Clear error messages for each failure scenario
- Wallet update failures handled gracefully
- User can retry failed operations

## Testing

### Sandbox Testing
- Use PayPal sandbox credentials
- Test with various amounts
- Test error scenarios
- Verify balance updates

### Test Scenarios
- Successful deposit
- Failed authentication
- Failed order creation
- Failed capture
- Wallet update failure
- Duplicate capture attempts

