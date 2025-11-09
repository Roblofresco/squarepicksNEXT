# capturePayPalOrder Function

## Overview
Captures a PayPal order after user approval, verifies payment completion, and updates the user's wallet balance. This is the second and final step in the two-phase PayPal payment flow.

## Location
`src/app/api/paypal/capture-order/route.ts`

## Function Type
Next.js API Route (POST handler)

## Authentication
Requires user ID in request headers (`x-user-id`)

## Purpose
- Capture approved PayPal order
- Verify payment completion status
- Extract captured amount and details
- Update user wallet balance atomically
- Create transaction record
- Handle payment failures gracefully

## Request Parameters

### HTTP Method
POST

### Headers
| Header | Type | Required | Description |
|--------|------|----------|-------------|
| `Content-Type` | string | Yes | Must be "application/json" |
| `x-user-id` | string | Yes | Firebase Auth user ID |

### Body Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderID` | string | Yes | PayPal order ID from create order step |

### Example Request
```json
{
  "orderID": "7XY12345ABC67890"
}
```

## Response

### Success Response (200)
```json
{
  "success": true,
  "message": "PayPal order captured and wallet updated successfully.",
  "orderId": "7XY12345ABC67890",
  "amountDeposited": 50.00,
  "currency": "USD",
  "newBalance": 150.00,
  "previousBalance": 100.00,
  "transactionId": "paypal_7XY12345ABC67890",
  "notificationId": "notif_abc123"
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether operation succeeded |
| `message` | string | Human-readable success message |
| `orderId` | string | PayPal order ID |
| `amountDeposited` | number | Amount credited to wallet |
| `currency` | string | Currency code (USD) |
| `newBalance` | number | User balance after deposit |
| `previousBalance` | number | User balance before deposit |
| `transactionId` | string | Firestore transaction document ID |
| `notificationId` | string | Firestore notification document ID |
| `warning` | string | (Optional) Warning if wallet update failed |

### Error Responses

#### 400 Bad Request - Missing Order ID
```json
{
  "error": "Order ID is required"
}
```

#### 400 Bad Request - Unsupported Currency
```json
{
  "error": "Unsupported currency: EUR. Only USD is accepted."
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

#### 500 Internal Server Error - Capture Failed
```json
{
  "error": "Failed to capture PayPal order"
}
```

#### 500 Internal Server Error - Capture Not Completed
```json
{
  "error": "PayPal payment capture failed. Status: PENDING"
}
```

#### 500 Internal Server Error - No Capture Details
```json
{
  "error": "Failed to verify payment capture details with PayPal"
}
```

### Partial Success Response (200 with warning)
If PayPal capture succeeds but wallet update fails:
```json
{
  "success": true,
  "message": "PayPal order captured successfully, but wallet update failed. Please contact support.",
  "orderId": "7XY12345ABC67890",
  "amountDeposited": 50.00,
  "currency": "USD",
  "warning": "Wallet update failed - contact support"
}
```

## Process Flow

### Step 1: Input Validation
- Verify order ID is provided
- Extract user ID from request headers

### Step 2: Environment Detection
- Determine PayPal environment (sandbox/live)
- Set appropriate API base URL
- Log environment configuration

### Step 3: PayPal Authentication
- Retrieve PayPal credentials from environment
- Encode credentials as Base64
- Call `getPayPalAccessToken()` internally
- Obtain bearer token for API calls

### Step 4: Capture PayPal Order
- POST to `/v2/checkout/orders/{orderID}/capture`
- Use Bearer token authentication
- Receive capture response with payment details

### Step 5: Verify Capture Success
- Check overall order status is "COMPLETED"
- Extract first purchase unit and capture details
- Verify capture status is "COMPLETED"
- Extract captured amount and currency

### Step 6: Validate Currency
- Ensure currency is USD
- Reject if non-USD currency

### Step 7: Update Wallet Balance
- Call `/api/wallet/update-balance` endpoint
- Pass user ID, amount, order ID, currency
- Atomic update using Firestore transaction
- Creates transaction record and notification

### Step 8: Return Success Response
- Include order details
- Include new balance information
- Include transaction and notification IDs

## PayPal API Integration

### Capture Order Endpoint
```
POST https://api-m.sandbox.paypal.com/v2/checkout/orders/{orderID}/capture
POST https://api-m.paypal.com/v2/checkout/orders/{orderID}/capture (live)
```

**Headers:**
- `Authorization: Bearer {accessToken}`
- `Content-Type: application/json`

**Response:**
```json
{
  "id": "7XY12345ABC67890",
  "status": "COMPLETED",
  "purchase_units": [
    {
      "payments": {
        "captures": [
          {
            "id": "8AB12345XYZ67890",
            "status": "COMPLETED",
            "amount": {
              "currency_code": "USD",
              "value": "50.00"
            }
          }
        ]
      }
    }
  ]
}
```

### Response Validation
The function validates:
1. `captureData.status === "COMPLETED"`
2. `capture.status === "COMPLETED"` (first capture in first purchase unit)
3. Currency code is "USD"

## Balance Transaction Flow

### Atomic Operations
Balance updates use Firestore transactions to ensure:
- Balance never goes negative
- Transaction record always created
- Notification always sent
- All-or-nothing operation

### Transaction Record Fields
| Field | Value |
|-------|-------|
| `userID` | User ID from request |
| `type` | "deposit" |
| `amount` | Captured amount |
| `currency` | "USD" |
| `description` | "PayPal Deposit of $X.XX - Order ID: {orderID}" |
| `orderId` | PayPal order ID |
| `newBalance` | Balance after deposit |
| `previousBalance` | Balance before deposit |
| `timestamp` | Server timestamp |
| `status` | "completed" |

### Deterministic Transaction ID
```javascript
const txId = `paypal_${orderID}`;
```

This prevents duplicate credits if capture is called twice.

## Environment Configuration

### Required Environment Variables
| Variable | Description |
|----------|-------------|
| `PAYPAL_CLIENT_ID` | PayPal REST API client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal REST API secret |
| `NEXT_PUBLIC_BASE_URL` | Base URL for wallet API calls |

### Optional Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PAYPAL_ENV` | PayPal environment | Based on NODE_ENV |
| `NEXT_PUBLIC_PAYPAL_ENV` | Public PayPal environment | Based on NODE_ENV |
| `PAYPAL_API_BASE_URL` | Override PayPal API URL | Environment-based |

## Business Rules

### Currency Restrictions
- Only USD deposits accepted
- Non-USD currencies rejected with 400 error

### Idempotency
- Uses deterministic transaction ID: `paypal_{orderID}`
- Prevents duplicate wallet credits
- If transaction already exists, update fails gracefully

### Balance Updates
- Balance updated atomically with transaction creation
- Uses `FieldValue.increment()` for atomic increment
- Never allows negative balance

### Wallet Requirements
- User must have wallet initialized (`hasWallet = true`)
- Wallet created during account setup
- KYC completion required before deposits

## Error Handling

### PayPal Capture Failures
- If capture API call fails, return 500 error
- No wallet update attempted
- User can retry capture

### Wallet Update Failures
If PayPal capture succeeds but wallet update fails:
- Return success response with warning
- Include captured amount in response
- User must contact support for manual credit
- PayPal payment already captured (cannot be reversed)

### Missing User ID
If user ID not provided in headers:
- PayPal capture proceeds
- Wallet update fails
- Return success with warning
- User must contact support

## Security Considerations

### Credential Management
- PayPal credentials never exposed to client
- Server-side OAuth token generation
- Credentials in secure environment variables

### User Verification
- User ID required in request headers
- Should be verified against auth session
- Prevents unauthorized balance updates

### Payment Verification
- Verifies capture status is "COMPLETED"
- Verifies currency is USD
- Extracts amount from PayPal response (not client input)

### Idempotency
- Prevents duplicate credits using deterministic IDs
- Safe to retry capture calls

## Logging

### Logged Information
- Environment configuration
- PayPal capture success/failure
- Captured amount and order ID
- Wallet update success/failure

### Not Logged
- PayPal credentials
- Access tokens
- Full PayPal API responses

## Client-Side Flow

1. Client creates PayPal order via `createPayPalOrder`
2. Client displays PayPal buttons with order ID
3. User approves payment in PayPal modal
4. PayPal returns approved order ID to client
5. Client calls this endpoint to capture payment
6. Client receives updated balance
7. Client refreshes wallet UI

## Used By
- Wallet deposit page (after PayPal approval)
- PayPal button onApprove callback
- Mobile app deposit completion flow

## Related Functions
- `createPayPalOrder`: First step in payment flow
- `getPayPalAccessToken()`: Internal authentication helper
- `/api/wallet/update-balance`: Updates balance and creates transaction

## Related Documentation
- [API: PayPal Create Order](../../apis/paypal-create-order.md)
- [API: Wallet Update Balance](../../apis/wallet-update-balance.md)
- [Function: createPayPalOrder](./createPayPalOrder.md)
- [Function: getPayPalAccessToken](./getPayPalAccessToken.md)
- [Data Model: Transactions](../../data-models/transactions.md)
- [Data Model: Users](../../data-models/users.md)

## Implementation Notes

### Idempotency Check
The `/api/wallet/update-balance` endpoint performs idempotency check:
```javascript
const txRef = db.collection('transactions').doc(`paypal_${orderID}`);
const existingSnap = await transaction.get(txRef);
if (existingSnap.exists) {
  throw new Error('Order already credited');
}
```

### Atomic Balance Update
```javascript
await db.runTransaction(async (transaction) => {
  transaction.update(userRef, {
    balance: FieldValue.increment(amount)
  });
  transaction.set(txRef, {...});
});
```

### Error Recovery
- If capture succeeds but wallet update fails, support team manually credits balance
- Transaction ID format allows easy lookup: `paypal_{orderID}`
- PayPal order ID links to PayPal dashboard for verification

### Testing
- Use PayPal sandbox for testing
- Test error scenarios (capture failures, wallet failures)
- Verify idempotency with duplicate capture calls

