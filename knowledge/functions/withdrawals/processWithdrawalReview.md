# processWithdrawalReview Function

## Overview
Admin function to approve or reject high-risk withdrawal requests that were flagged during risk assessment. Updates transaction status and either processes the payout or refunds the balance.

## Location
Expected: Firebase Cloud Function or Next.js API Route
Path: `functions/src/withdrawals/processWithdrawalReview` or admin API route

## Function Type
Firebase Cloud Function (Callable) or Next.js API Route (Admin only)

## Authentication
Requires admin role/privileges

## Purpose
- Review flagged withdrawal requests
- Approve or reject based on manual review
- Process approved withdrawals via PayPal
- Refund balance for rejected withdrawals
- Update transaction status and notes
- Notify user of decision

## Request Parameters

### Input Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transactionId` | string | Yes | Transaction document ID to review |
| `action` | string | Yes | "approve" or "reject" |
| `adminNotes` | string | No | Admin notes/reason for decision |
| `adminId` | string | Yes | Admin user ID (from auth) |

### Example Request (Approve)
```json
{
  "transactionId": "tx_abc123xyz",
  "action": "approve",
  "adminNotes": "Verified user identity via support ticket. Account in good standing."
}
```

### Example Request (Reject)
```json
{
  "transactionId": "tx_abc123xyz",
  "action": "reject",
  "adminNotes": "Suspicious activity pattern. Potential fraud."
}
```

## Response

### Success Response (Approved)
```json
{
  "success": true,
  "action": "approved",
  "transactionId": "tx_abc123xyz",
  "status": "completed",
  "message": "Withdrawal approved and processed successfully",
  "paypalBatchId": "BATCH_123ABC",
  "paypalPayoutItemId": "ITEM_456DEF",
  "amount": 1500.00,
  "userId": "user123"
}
```

### Success Response (Rejected)
```json
{
  "success": true,
  "action": "rejected",
  "transactionId": "tx_abc123xyz",
  "status": "rejected",
  "message": "Withdrawal rejected. Balance refunded to user.",
  "amount": 1500.00,
  "userId": "user123",
  "refunded": true
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether operation succeeded |
| `action` | string | "approved" or "rejected" |
| `transactionId` | string | Transaction document ID |
| `status` | string | Updated transaction status |
| `message` | string | Human-readable result message |
| `amount` | number | Withdrawal amount |
| `userId` | string | User ID who requested withdrawal |
| `paypalBatchId` | string | PayPal batch ID (if approved) |
| `paypalPayoutItemId` | string | PayPal item ID (if approved) |
| `refunded` | boolean | Whether balance was refunded (if rejected) |

### Error Responses

#### 401 Unauthorized - Not Admin
```json
{
  "error": "Admin privileges required"
}
```

#### 404 Not Found - Transaction Not Found
```json
{
  "error": "Transaction not found"
}
```

#### 400 Bad Request - Invalid Status
```json
{
  "error": "Transaction is not in pending_review status. Current status: completed"
}
```

#### 400 Bad Request - Invalid Action
```json
{
  "error": "Invalid action. Must be 'approve' or 'reject'"
}
```

#### 500 Internal Server Error - Payout Failed
```json
{
  "error": "Failed to process PayPal payout",
  "details": "PayPal API error details"
}
```

#### 500 Internal Server Error - Refund Failed
```json
{
  "error": "Failed to refund balance",
  "details": "Firestore transaction error"
}
```

## Process Flow

### Step 1: Authentication & Authorization
- Verify user is authenticated
- Verify user has admin role
- Extract admin user ID

### Step 2: Input Validation
- Verify transaction ID provided
- Verify action is "approve" or "reject"
- Validate admin notes (if provided)

### Step 3: Fetch Transaction
- Retrieve transaction document from Firestore
- Verify transaction exists
- Verify transaction type is `withdrawal_request`
- Verify transaction status is `pending_review`

### Step 4: Extract Transaction Details
- Get user ID
- Get withdrawal amount
- Get PayPal email from `details.paypalEmail`
- Get risk assessment data

### Step 5A: Approve Flow
If action is "approve":

1. **Update Transaction Status**
   - Set status to `processing`
   - Add admin notes
   - Record admin ID and approval timestamp
   - Set `updatedAt` timestamp

2. **Process PayPal Payout**
   - Call `processPayPalPayout(transactionId, paypalEmail, amount)`
   - Wait for payout result

3. **Handle Payout Result**
   - **Success**: Update status to `completed`, record PayPal IDs
   - **Failure**: Update status to `failed`, refund balance

4. **Create Notification**
   - Notify user of approval and processing
   - Include estimated arrival time

### Step 5B: Reject Flow
If action is "reject":

1. **Refund Balance**
   - Use Firestore transaction to refund amount
   - Update user balance: `balance + amount`
   - Ensure atomic operation

2. **Update Transaction Status**
   - Set status to `rejected`
   - Add admin notes and reason
   - Record admin ID and rejection timestamp
   - Set `updatedAt` timestamp

3. **Create Notification**
   - Notify user of rejection
   - Include reason if appropriate
   - Confirm balance refund

### Step 6: Log Action
- Log admin action for audit trail
- Record transaction ID, action, admin ID
- Log timestamp and notes

### Step 7: Return Response
- Return action result and updated status

## Transaction Status Updates

### Approval Path
```
pending_review → processing → completed (success)
                            → failed (payout failed, balance refunded)
```

### Rejection Path
```
pending_review → rejected (balance refunded immediately)
```

## Transaction Record Updates

### Approved (Processing)
```javascript
{
  status: 'processing',
  notes: adminNotes || 'Approved by administrator',
  reviewedBy: adminId,
  reviewedAt: now,
  updatedAt: now
}
```

### Approved (Completed)
```javascript
{
  status: 'completed',
  completedAt: now,
  paypalBatchId: batchId,
  paypalPayoutItemId: itemId,
  paypalStatus: 'SUCCESS',
  updatedAt: now
}
```

### Approved (Failed Payout)
```javascript
{
  status: 'failed',
  payoutError: errorMessage,
  payoutErrorDetails: errorDetails,
  isTemporaryError: false,
  updatedAt: now
}
```

### Rejected
```javascript
{
  status: 'rejected',
  notes: adminNotes || 'Rejected by administrator',
  reviewedBy: adminId,
  reviewedAt: now,
  rejectionReason: adminNotes,
  updatedAt: now
}
```

## Balance Refund Logic

### Refund on Rejection
```javascript
await db.runTransaction(async (tx) => {
  const userRef = db.collection('users').doc(userId);
  const txRef = db.collection('transactions').doc(transactionId);
  
  // Refund balance
  tx.update(userRef, {
    balance: FieldValue.increment(amount),
    updated_time: FieldValue.serverTimestamp()
  });
  
  // Update transaction
  tx.update(txRef, {
    status: 'rejected',
    notes: adminNotes,
    reviewedBy: adminId,
    reviewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
});
```

### Refund on Payout Failure
Automatically handled by `processPayPalPayout` function when payout fails.

## Business Rules

### Admin Requirements
- Only users with `isAdmin: true` or `role: 'admin'` can review
- Admin must provide notes for transparency
- All actions logged for audit trail

### Status Validation
- Only `pending_review` transactions can be reviewed
- Cannot re-review completed/rejected transactions
- Must validate transaction exists and is correct type

### Balance Integrity
- Rejection refunds balance atomically
- Payout failure refunds balance automatically
- User cannot access funds during `pending_review` (already deducted)

### Notification Requirements
- User must be notified of approval/rejection
- Include clear explanation of decision
- Provide next steps or expected timeline

## Security Considerations

### Admin Authorization
- Verify admin role before processing
- Log admin ID for all actions
- Prevent non-admin access

### Audit Trail
- All review actions logged
- Admin notes recorded
- Timestamps for all state changes

### Balance Protection
- Atomic refund operations
- Prevent double refunds
- Validate transaction status before refunding

### Fraud Prevention
- Manual review catches automated checks miss
- Admin can investigate user history
- Can reject suspicious patterns

## Error Handling

### Transaction Not Found
- Return 404 error
- Log attempt for security monitoring

### Invalid Status
- Return 400 error
- Include current status in error message
- Prevents processing already-reviewed transactions

### Payout Failure
If `processPayPalPayout` fails:
- Update transaction to `failed` status
- Trigger automatic balance refund
- Notify user of failure
- Log error for investigation

### Refund Failure
If refund transaction fails:
- Rollback transaction
- Return 500 error
- Retry mechanism or manual intervention needed
- Alert admin of failure

## Logging

### Logged Information
- Admin action (approve/reject)
- Admin ID and timestamp
- Transaction ID and user ID
- Amount and PayPal email
- Admin notes
- Payout result (if approved)

### Audit Log Entry
```javascript
{
  timestamp: now,
  action: 'withdrawal_review',
  decision: 'approved' | 'rejected',
  adminId: adminId,
  adminEmail: adminEmail,
  transactionId: transactionId,
  userId: userId,
  amount: amount,
  notes: adminNotes
}
```

## Notifications

### User Notification (Approved)
```
Title: "Withdrawal Approved"
Message: "Your withdrawal of $1,500.00 has been approved and is being processed. Funds will arrive at your PayPal account within 1-2 business days."
```

### User Notification (Rejected)
```
Title: "Withdrawal Request Rejected"
Message: "Your withdrawal request of $1,500.00 has been rejected. Your balance has been refunded. Please contact support for more information."
```

### User Notification (Payout Failed)
```
Title: "Withdrawal Processing Failed"
Message: "We were unable to process your withdrawal of $1,500.00. Your balance has been refunded. Please verify your PayPal email or contact support."
```

## Admin Dashboard Integration

### Review Queue Display
Show pending withdrawals with:
- User information
- Amount and PayPal email
- Risk score and factors
- Account age
- Deposit history
- Recent activity

### Action Buttons
- "Approve" button
- "Reject" button
- Text area for admin notes
- User history link
- Transaction history link

### Filtering Options
- Sort by amount (high to low)
- Sort by risk score (high to low)
- Sort by request date (oldest first)
- Filter by risk factors

## Used By
- Admin dashboard withdrawal review panel
- Admin mobile app
- Manual review workflow

## Related Functions
- `requestWithdrawal`: Creates pending review transactions
- `processPayPalPayout`: Executes PayPal payout for approved withdrawals
- `assessWithdrawalRisk`: Determines which withdrawals need review

## Related Documentation
- [Function: requestWithdrawal](./requestWithdrawal.md)
- [Function: processPayPalPayout](./processPayPalPayout.md)
- [Function: assessWithdrawalRisk](./assessWithdrawalRisk.md)
- [Data Model: Transactions](../../data-models/transactions.md)

## Implementation Notes

### Admin Role Check
```javascript
const adminDoc = await db.collection('users').doc(adminId).get();
const isAdmin = adminDoc.data()?.isAdmin === true || adminDoc.data()?.role === 'admin';

if (!isAdmin) {
  throw new HttpsError('permission-denied', 'Admin privileges required');
}
```

### Status Validation
```javascript
if (txData.status !== 'pending_review') {
  throw new HttpsError('failed-precondition', 
    `Transaction is not in pending_review status. Current status: ${txData.status}`);
}
```

### Testing
- Test approval flow with successful payout
- Test approval flow with failed payout
- Test rejection flow with balance refund
- Verify only admins can access
- Test with invalid transaction statuses

