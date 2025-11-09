# processPayPalPayout Function

## Overview
Executes PayPal Payouts API call to transfer funds from SquarePicks to a user's PayPal account. Called automatically for low-risk withdrawals or after admin approval for high-risk withdrawals. Updates transaction status based on payout result.

## Location
Expected: Firebase Cloud Function utility or shared library
Path: `functions/src/withdrawals/processPayPalPayout` or similar

## Function Type
Internal utility function (called by `requestWithdrawal` and `processWithdrawalReview`)

## Authentication
Uses PayPal OAuth2 (server credentials)

## Purpose
- Execute PayPal payout to user
- Transfer funds from SquarePicks to user PayPal account
- Handle payout success and failure
- Update transaction status
- Refund balance on failure
- Record PayPal batch and item IDs

## Function Signature

```typescript
interface PayoutResult {
  success: boolean;
  paypalBatchId?: string;
  paypalPayoutItemId?: string;
  paypalStatus?: string;
  error?: string;
  errorDetails?: any;
  isTemporaryError?: boolean;
}

async function processPayPalPayout(
  transactionId: string,
  paypalEmail: string,
  amount: number,
  userId: string
): Promise<PayoutResult>
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transactionId` | string | Yes | Transaction document ID |
| `paypalEmail` | string | Yes | Recipient PayPal email |
| `amount` | number | Yes | Payout amount in USD |
| `userId` | string | Yes | User ID for balance refund on failure |

## Return Value

### PayoutResult Object (Success)
```json
{
  "success": true,
  "paypalBatchId": "BATCH_5ABC123XYZ",
  "paypalPayoutItemId": "ITEM_7DEF456UVW",
  "paypalStatus": "SUCCESS"
}
```

### PayoutResult Object (Failure)
```json
{
  "success": false,
  "error": "RECEIVER_UNREGISTERED",
  "errorDetails": {
    "name": "RECEIVER_UNREGISTERED",
    "message": "Receiver account is not registered",
    "debug_id": "abc123"
  },
  "isTemporaryError": false
}
```

### Return Fields
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether payout succeeded |
| `paypalBatchId` | string | PayPal batch ID (if successful) |
| `paypalPayoutItemId` | string | PayPal payout item ID (if successful) |
| `paypalStatus` | string | PayPal status (SUCCESS, PENDING, etc.) |
| `error` | string | Error code or message (if failed) |
| `errorDetails` | object | Detailed error information (if failed) |
| `isTemporaryError` | boolean | Whether error is temporary/retryable |

## Process Flow

### Step 1: Get PayPal Access Token
- Retrieve PayPal credentials from environment
- Call PayPal OAuth2 endpoint
- Obtain access token for API calls

```javascript
const accessToken = await getPayPalAccessToken();
```

### Step 2: Construct Payout Request
- Create unique sender batch ID
- Build payout item with recipient and amount
- Include sender item ID (transaction ID)

```javascript
const senderBatchId = `batch_${Date.now()}_${transactionId}`;
const payoutRequest = {
  sender_batch_header: {
    sender_batch_id: senderBatchId,
    email_subject: "You have a payout from SquarePicks",
    email_message: "You have received a payout from SquarePicks. Thanks for playing!",
    recipient_type: "EMAIL"
  },
  items: [
    {
      recipient_type: "EMAIL",
      amount: {
        value: amount.toFixed(2),
        currency: "USD"
      },
      receiver: paypalEmail,
      sender_item_id: transactionId,
      note: `Withdrawal from SquarePicks - Transaction ${transactionId}`
    }
  ]
};
```

### Step 3: Call PayPal Payouts API
- POST to `/v1/payments/payouts`
- Include Bearer token authentication
- Send payout request body

```javascript
const response = await fetch(`${baseUrl}/v1/payments/payouts`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payoutRequest)
});
```

### Step 4: Handle API Response
- Check HTTP status code
- Parse response JSON
- Extract batch ID and status

### Step 5A: Success Path
If payout initiated successfully:

1. Extract batch header ID
2. Extract payout item ID
3. Extract payout status
4. Update transaction to `completed`
5. Record PayPal IDs in transaction
6. Send success notification to user
7. Return success result

### Step 5B: Failure Path
If payout fails:

1. Parse error response
2. Determine if error is temporary
3. Update transaction to `failed`
4. Record error details
5. Refund user balance
6. Send failure notification
7. Return failure result

### Step 6: Update Transaction Status

**Success:**
```javascript
await db.collection('transactions').doc(transactionId).update({
  status: 'completed',
  completedAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
  paypalBatchId: batchId,
  paypalPayoutItemId: itemId,
  paypalStatus: status
});
```

**Failure:**
```javascript
await db.collection('transactions').doc(transactionId).update({
  status: 'failed',
  updatedAt: FieldValue.serverTimestamp(),
  payoutError: errorCode,
  payoutErrorDetails: errorDetails,
  isTemporaryError: isTemp
});
```

### Step 7: Refund Balance on Failure
```javascript
if (!success) {
  await db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(userId);
    tx.update(userRef, {
      balance: FieldValue.increment(amount),
      updated_time: FieldValue.serverTimestamp()
    });
  });
}
```

## PayPal Payouts API Integration

### Authentication
Uses same OAuth2 flow as payments:
```javascript
const accessToken = await getPayPalAccessToken();
```

### Payouts Endpoint
```
POST https://api-m.sandbox.paypal.com/v1/payments/payouts (sandbox)
POST https://api-m.paypal.com/v1/payments/payouts (live)
```

### Request Headers
```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Request Body
```json
{
  "sender_batch_header": {
    "sender_batch_id": "batch_1699999999_tx_abc123",
    "email_subject": "You have a payout from SquarePicks",
    "email_message": "You have received a payout from SquarePicks. Thanks for playing!",
    "recipient_type": "EMAIL"
  },
  "items": [
    {
      "recipient_type": "EMAIL",
      "amount": {
        "value": "150.00",
        "currency": "USD"
      },
      "receiver": "user@example.com",
      "sender_item_id": "tx_abc123",
      "note": "Withdrawal from SquarePicks - Transaction tx_abc123"
    }
  ]
}
```

### Response (Success)
```json
{
  "batch_header": {
    "sender_batch_header": {
      "sender_batch_id": "batch_1699999999_tx_abc123",
      "email_subject": "You have a payout from SquarePicks"
    },
    "payout_batch_id": "BATCH_5ABC123XYZ",
    "batch_status": "PENDING"
  },
  "links": [
    {
      "href": "https://api.paypal.com/v1/payments/payouts/BATCH_5ABC123XYZ",
      "rel": "self",
      "method": "GET"
    }
  ]
}
```

After initiation, query batch status:
```
GET https://api-m.paypal.com/v1/payments/payouts/{batch_id}
```

Response:
```json
{
  "batch_header": {
    "payout_batch_id": "BATCH_5ABC123XYZ",
    "batch_status": "SUCCESS"
  },
  "items": [
    {
      "payout_item_id": "ITEM_7DEF456UVW",
      "transaction_status": "SUCCESS",
      "payout_item_fee": {
        "currency": "USD",
        "value": "0.25"
      },
      "payout_batch_id": "BATCH_5ABC123XYZ",
      "sender_batch_id": "batch_1699999999_tx_abc123",
      "payout_item": {
        "recipient_type": "EMAIL",
        "amount": {
          "value": "150.00",
          "currency": "USD"
        },
        "receiver": "user@example.com",
        "sender_item_id": "tx_abc123"
      },
      "time_processed": "2025-11-08T14:48:00Z"
    }
  ]
}
```

### Response (Failure)
```json
{
  "name": "RECEIVER_UNREGISTERED",
  "message": "Receiver account is not registered or confirmed",
  "debug_id": "abc123xyz",
  "information_link": "https://developer.paypal.com/docs/api/payments.payouts-batch/#errors"
}
```

## PayPal Status Codes

### Success Statuses
| Status | Description |
|--------|-------------|
| `SUCCESS` | Payout completed successfully |
| `PENDING` | Payout initiated, processing |
| `UNCLAIMED` | Sent but not claimed by recipient |

### Failure Statuses
| Status | Description | Temporary? |
|--------|-------------|-----------|
| `FAILED` | Generic failure | Maybe |
| `DENIED` | Payout denied by PayPal | No |
| `BLOCKED` | Recipient blocked | No |
| `REFUNDED` | Payout was refunded | No |
| `RETURNED` | Funds returned to sender | No |

## Error Codes

### Common Errors
| Error Code | Description | Temporary? | Action |
|------------|-------------|-----------|---------|
| `RECEIVER_UNREGISTERED` | Email not registered with PayPal | No | Ask user to verify email |
| `INSUFFICIENT_FUNDS` | Sender account lacks funds | Yes | Retry later, check platform balance |
| `INVALID_ACCOUNT_STATUS` | Sender account issue | Maybe | Contact PayPal support |
| `RECEIVER_ACCOUNT_LOCKED` | Recipient account locked | No | User must contact PayPal |
| `PAYOUT_LIMIT_EXCEEDED` | Daily/monthly limit exceeded | Yes | Retry next day |
| `VALIDATION_ERROR` | Invalid request data | No | Fix request parameters |

## Balance Transaction Flow

### Deduction (already done in requestWithdrawal)
Balance deducted when withdrawal requested, not at payout time.

### Refund on Failure
```javascript
await db.runTransaction(async (tx) => {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await tx.get(userRef);
  
  tx.update(userRef, {
    balance: FieldValue.increment(amount),
    updated_time: FieldValue.serverTimestamp()
  });
  
  // Create refund notification
  const notifRef = db.collection('notifications').doc();
  tx.set(notifRef, {
    userID: userId,
    title: 'Withdrawal Failed - Balance Refunded',
    message: `Your withdrawal of $${amount.toFixed(2)} failed. Your balance has been refunded.`,
    type: 'withdrawal_failed',
    relatedID: transactionId,
    isRead: false,
    timestamp: FieldValue.serverTimestamp()
  });
});
```

## Business Rules

### Payout Timing
- Low-risk: Immediate automated processing
- High-risk: After admin approval
- PayPal processing: 1-2 business days actual transfer

### Minimum Amount
- Minimum payout: $10.00 (enforced at request stage)
- No maximum (subject to rate limits)

### Currency
- Only USD supported
- Amount fixed to 2 decimal places

### Fees
- PayPal charges payout fees to sender (SquarePicks)
- Typical fee: $0.25 per payout (US accounts)
- User receives full amount requested

### Error Handling
- All failures refund balance automatically
- User notified of failure reason
- User can retry with corrected information

## Security Considerations

### Credential Protection
- PayPal credentials never exposed
- OAuth tokens short-lived
- API calls server-side only

### Fraud Prevention
- Risk assessment before payout
- Rate limits enforced
- Admin review for high-risk
- Balance already deducted (can't double-spend)

### Data Validation
- PayPal email validated
- Amount validated (positive, proper format)
- Transaction exists and is valid status

### Idempotency
- Sender batch ID includes transaction ID
- Duplicate batch IDs rejected by PayPal
- Safe to retry failed payouts

## Error Handling

### Temporary Errors
For errors that may resolve (e.g., `INSUFFICIENT_FUNDS`):
- Mark as temporary
- User can retry later
- Balance refunded
- Transaction status: `failed`

### Permanent Errors
For errors that won't resolve (e.g., `RECEIVER_UNREGISTERED`):
- Mark as permanent
- User must update PayPal email
- Balance refunded
- Transaction status: `failed`

### Network Errors
- Timeout or connection failures
- Mark as temporary
- Safe to retry
- Balance refunded

## Logging

### Logged Information
- Transaction ID and amount
- PayPal email (partial or hashed)
- Payout success/failure
- PayPal batch and item IDs
- Error codes and messages

### Not Logged
- Full PayPal access tokens
- Complete PayPal email (for privacy)
- PayPal credentials

## Notifications

### Success Notification
```
Title: "Withdrawal Completed"
Message: "Your withdrawal of $150.00 has been sent to your PayPal account. Funds should arrive within 1-2 business days."
```

### Failure Notification
```
Title: "Withdrawal Failed - Balance Refunded"
Message: "Your withdrawal of $150.00 could not be processed. Reason: PayPal email not registered. Your balance has been refunded. Please verify your PayPal email and try again."
```

## Environment Configuration

### Required Environment Variables
Same as payment functions:
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV` or `NEXT_PUBLIC_PAYPAL_ENV`

### PayPal Account Requirements
- Business account required for Payouts API
- Payouts API must be enabled
- Sufficient balance in PayPal account
- Payout limits configured appropriately

## Used By
- `requestWithdrawal`: Calls for low-risk withdrawals
- `processWithdrawalReview`: Calls after admin approval

## Related Functions
- `requestWithdrawal`: Initiates withdrawal and calls this for low-risk
- `processWithdrawalReview`: Calls this after approval
- `getPayPalAccessToken`: Provides authentication token

## Related Documentation
- [Function: requestWithdrawal](./requestWithdrawal.md)
- [Function: processWithdrawalReview](./processWithdrawalReview.md)
- [Function: getPayPalAccessToken](../payments/getPayPalAccessToken.md)
- [Data Model: Transactions](../../data-models/transactions.md)
- [PayPal Payouts API](https://developer.paypal.com/docs/api/payments.payouts-batch/)

## Implementation Notes

### Batch Processing
Current implementation processes one payout at a time. Could be optimized:
- Batch multiple payouts in single API call
- Reduce PayPal fees
- Improve processing speed

### Status Polling
PayPal batch status may be `PENDING` initially:
- Poll batch status endpoint
- Update transaction when `SUCCESS` or `FAILED`
- Webhook integration for real-time updates

### Webhook Integration
Consider PayPal webhooks for status updates:
- Subscribe to `PAYMENT.PAYOUTS-ITEM.SUCCEEDED`
- Subscribe to `PAYMENT.PAYOUTS-ITEM.FAILED`
- Real-time status updates
- More reliable than polling

### Testing
- Use PayPal sandbox for testing
- Test with various error scenarios
- Verify balance refund on failure
- Test with unregistered PayPal emails
- Verify transaction status updates

### Future Enhancements
- Batch processing for multiple payouts
- Webhook integration for status updates
- Retry logic for temporary failures
- Currency conversion support
- Alternative payout methods (Venmo, bank transfer)

