# processWithdrawalReview

## Overview
Admin-only callable function that allows administrators to review and process withdrawal requests. Supports approval (with PayPal payout) or rejection (with balance refund).

## Trigger
- **Type**: `onCall` (Callable)
- **Region**: `us-east1`
- **Authentication**: Required (admin only)

## Authentication & Authorization
1. **Authentication Check**: User must be authenticated
2. **Admin Verification**: Calls `verifyAdminRole()` to verify admin privileges
3. **Error**: Throws `permission-denied` if not admin

## Request Parameters
```typescript
{
  transactionId: string,     // Required: Transaction document ID
  action: "approve" | "reject",  // Required: Action to take
  reason?: string           // Optional: Reason for approval/rejection
}
```

## Flow: Approval

### 1. Validation
- Validates transaction exists
- Validates transaction type is `"withdrawal_request"`
- Validates transaction status is `"pending_review"`
- Validates PayPal email exists in transaction details

### 2. PayPal Payout
- Calls `processPayPalPayout()` helper function
- Processes payout to user's PayPal email
- Amount: Transaction amount

### 3. Success Path
- Updates transaction:
  - `status`: `"completed"`
  - `paypalBatchId`: PayPal batch ID
  - `paypalPayoutItemId`: PayPal payout item ID
  - `paypalStatus`: PayPal status
  - `completedAt`: Server timestamp
  - `reviewedBy`: Admin user ID
  - `reviewedAt`: Server timestamp
  - `notes`: Approval notes with reason
- Creates notification:
  - Tag: `"withdrawal"`
  - Title: `"Withdrawal Approved: ${amount}"`
  - Message: Approval confirmation with PayPal email
  - Type: `"withdrawal_completed"`

### 4. Failure Path (PayPal Error)
- Updates transaction:
  - `status`: `"processing"` (allows retry)
  - `payoutError`: Error message
  - `payoutErrorDetails`: Error details
  - `isTemporaryError`: Boolean flag
  - `reviewedBy`: Admin user ID
  - `reviewedAt`: Server timestamp
  - `notes`: Error notes
- Throws `HttpsError` with error details (admin can retry)

## Flow: Rejection

### 1. Validation
- Same validation as approval

### 2. Balance Refund
- Runs Firestore transaction:
  - Reads user document
  - Increments user balance by withdrawal amount
  - Updates `updated_time` timestamp

### 3. Transaction Update
- Updates transaction:
  - `status`: `"rejected"`
  - `reviewedBy`: Admin user ID
  - `reviewedAt`: Server timestamp
  - `rejectionReason`: Reason (or "No reason provided")
  - `notes`: Rejection notes with reason

### 4. Notification
- Creates notification:
  - Tag: `"withdrawal"`
  - Title: `"Withdrawal Rejected: ${amount}"`
  - Message: Rejection notice with refund confirmation
  - Type: `"withdrawal_rejected"`

## Response

### Success (Approval)
```typescript
{
  success: true,
  message: "Withdrawal approved and processed successfully.",
  payoutBatchId: string
}
```

### Success (Rejection)
```typescript
{
  success: true,
  message: "Withdrawal rejected and funds refunded."
}
```

## Error Handling
- **unauthenticated**: User not authenticated
- **permission-denied**: User not admin
- **invalid-argument**: Invalid transactionId or action
- **not-found**: Transaction or user not found
- **failed-precondition**: Transaction not pending review or missing PayPal email
- **internal**: PayPal payout failure or unexpected error

## Notification Structure

### Approval Notification
```typescript
{
  userID: string,
  tag: "withdrawal",
  title: string,              // "Withdrawal Approved: ${amount}"
  message: string,            // Approval confirmation with PayPal email
  type: "withdrawal_completed",
  relatedID: string,          // transactionId
  isRead: false,
  timestamp: Timestamp
}
```

### Rejection Notification
```typescript
{
  userID: string,
  tag: "withdrawal",
  title: string,              // "Withdrawal Rejected: ${amount}"
  message: string,            // Rejection notice with refund confirmation
  type: "withdrawal_rejected",
  relatedID: string,         // transactionId
  isRead: false,
  timestamp: Timestamp
}
```

## Related Functions
- `sendNotifications`: Sends created notifications via email/SMS/push
- `processPayPalPayout()`: Helper function for PayPal payout processing
- `verifyAdminRole()`: Helper function for admin verification

## Security Notes
- Admin-only access enforced
- All operations logged with admin user ID
- PayPal payouts are processed server-side
- Balance refunds use Firestore transactions for atomicity

