# PayPal Capture Order API

## Endpoint
**POST** `/api/paypal/capture-order`

## Authentication
Requires user ID in `X-User-ID` header

## Purpose
Captures a PayPal order after user approval, verifies the payment, and updates the user's wallet balance atomically.

## Request
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
  - `X-User-ID: {userId}` (required)
- **Body**:
```json
{
  "orderID": "7XY12345ABC67890"
}
```

### Request Fields
- **orderID** (required): PayPal order ID from create-order response

## Response

### Success Response (200) - Wallet Updated
```json
{
  "success": true,
  "message": "PayPal order captured and wallet updated successfully.",
  "orderId": "7XY12345ABC67890",
  "amountDeposited": 50.00,
  "currency": "USD",
  "newBalance": 150.00,
  "previousBalance": 100.00,
  "transactionId": "tx_abc123",
  "notificationId": "notif_xyz789"
}
```

### Success Response (200) - Wallet Update Failed (Partial Success)
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

### Response Fields
- **success**: Boolean operation status
- **message**: Human-readable result message
- **orderId**: PayPal order ID
- **amountDeposited**: Amount successfully captured
- **currency**: Currency code (USD)
- **newBalance**: User's new wallet balance (if wallet updated)
- **previousBalance**: User's previous wallet balance (if wallet updated)
- **transactionId**: Firestore transaction document ID
- **notificationId**: Notification document ID
- **warning**: Warning message if partial failure

## Error Responses

### 400 Bad Request - Missing Order ID
```json
{
  "error": "Order ID is required"
}
```

### 400 Bad Request - Unsupported Currency
```json
{
  "error": "Unsupported currency: EUR. Only USD is accepted."
}
```

### 500 Internal Server Error - Credentials Not Configured
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

### 500 Internal Server Error - Capture Failed
```json
{
  "error": "Failed to capture PayPal order"
}
```

### 500 Internal Server Error - Payment Not Completed
```json
{
  "error": "PayPal payment capture failed. Status: PENDING"
}
```

### 500 Internal Server Error - Verification Failed
```json
{
  "error": "Failed to verify payment capture details with PayPal"
}
```

## Process Flow

### Step 1: Validate Input
- Verify orderID provided
- Verify X-User-ID header present

### Step 2: Authenticate with PayPal
- Get client ID and secret from environment
- Generate OAuth access token
- Same process as create-order endpoint

### Step 3: Capture PayPal Order
- POST to `/v2/checkout/orders/{orderID}/capture`
- Include idempotency header: `PayPal-Request-Id: capture-{orderID}`
- Receive capture confirmation

### Step 4: Verify Capture
- Check order status is "COMPLETED"
- Extract capture details from purchase units
- Verify capture status is "COMPLETED"
- Extract amount and currency

### Step 5: Validate Currency
- Verify currency is USD
- Reject if not USD

### Step 6: Update Wallet Balance
- Call internal `/api/wallet/update-balance` endpoint
- Pass userId, amount, orderId, currency
- Handle wallet update success/failure

### Step 7: Return Result
- Return success with balance update
- Or return partial success if wallet update failed

## PayPal API Call

### Capture Order Request
```http
POST https://api-m.sandbox.paypal.com/v2/checkout/orders/7XY12345ABC67890/capture
Authorization: Bearer {accessToken}
Content-Type: application/json
PayPal-Request-Id: capture-7XY12345ABC67890
```

### Response Structure
```json
{
  "id": "7XY12345ABC67890",
  "status": "COMPLETED",
  "purchase_units": [
    {
      "payments": {
        "captures": [
          {
            "id": "8AB123XYZ789",
            "status": "COMPLETED",
            "amount": {
              "value": "50.00",
              "currency_code": "USD"
            }
          }
        ]
      }
    }
  ]
}
```

## Wallet Update Integration

### Internal API Call
```http
POST /api/wallet/update-balance
Content-Type: application/json

{
  "userId": "user123",
  "amount": 50.00,
  "orderId": "7XY12345ABC67890",
  "currency": "USD"
}
```

### Idempotency
- Wallet update uses Firestore transactions
- Transaction document ID: `paypal_{orderID}`
- Prevents duplicate credits on retry

## Database Operations

### Collections Written
1. `users/{userId}` - Balance increment
2. `transactions/paypal_{orderID}` - Deposit record
3. `notifications/{notificationId}` - Deposit notification

### Transaction Structure
```json
{
  "userID": "user123",
  "type": "deposit",
  "amount": 50.00,
  "currency": "USD",
  "description": "PayPal Deposit of $50.00 - Order ID: 7XY12345ABC67890",
  "orderId": "7XY12345ABC67890",
  "newBalance": 150.00,
  "previousBalance": 100.00,
  "timestamp": "2024-12-15T18:30:00.000Z",
  "status": "completed"
}
```

## Business Rules
- Only USD currency accepted
- Atomic wallet update using Firestore transactions
- Idempotent: duplicate captures prevented by transaction ID
- PayPal verification happens before wallet update
- Partial failure returns success but alerts user to contact support
- Notification created for successful deposits

## Error Handling

### Graceful Degradation
If wallet update fails after successful PayPal capture:
1. Return partial success response
2. Include warning message
3. User instructed to contact support
4. PayPal payment is confirmed, not reversed

This ensures money isn't lost even if wallet update fails.

## Security Considerations
- Requires user ID header (authenticated requests)
- PayPal credentials server-side only
- Idempotency prevents duplicate credits
- Transaction records maintain audit trail

## Logging
Logs include:
- Environment configuration
- PayPal authentication status
- Capture attempt and result
- Amount captured and currency
- Wallet update success/failure
- No credential values logged

## Used By
- PayPal payment flow completion
- Wallet deposit screens
- Mobile app payment processing

## Related Documentation
- [API: PayPal Create Order](./paypal-create-order.md)
- [API: Wallet Update Balance](./wallet-update-balance.md)
- [Business Rules: Payment Processing](../business-rules/payment-processing.md)
- [Data Models: Transaction](../data-models/transaction.md)
- [Data Models: User](../data-models/user.md)

