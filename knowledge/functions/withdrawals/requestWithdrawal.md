# requestWithdrawal Function

## Overview
Initiates a withdrawal request from a user's wallet to their PayPal account. Performs risk assessment, rate limit checks, deducts balance immediately, and creates a withdrawal transaction record. Based on risk level, withdrawals are either processed automatically or flagged for admin review.

## Location
Expected: Firebase Cloud Function or Next.js API Route
Path: `functions/src/withdrawals/requestWithdrawal` or similar

## Function Type
Firebase Cloud Function (Callable) or Next.js API Route

## Authentication
Requires authenticated user (Firebase Auth)

## Purpose
- Validate withdrawal request
- Check rate limits and business rules
- Perform risk assessment
- Deduct balance immediately
- Create withdrawal transaction record
- Route to automatic processing or admin review based on risk

## Request Parameters

### Input Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | number | Yes | Withdrawal amount in USD |
| `paypalEmail` | string | Yes | Recipient PayPal email address |
| `userId` | string | Yes | User ID (from auth context) |

### Example Request
```json
{
  "amount": 150.00,
  "paypalEmail": "user@example.com"
}
```

## Response

### Success Response
```json
{
  "success": true,
  "transactionId": "tx_abc123xyz",
  "status": "processing",
  "message": "Withdrawal request submitted successfully. Processing automatically.",
  "amount": 150.00,
  "paypalEmail": "user@example.com",
  "estimatedProcessingTime": "1-2 business days",
  "riskScore": 0.2,
  "requiresReview": false
}
```

### Success Response (High Risk)
```json
{
  "success": true,
  "transactionId": "tx_abc123xyz",
  "status": "pending_review",
  "message": "Withdrawal request submitted. Pending administrator review due to account age.",
  "amount": 1500.00,
  "paypalEmail": "user@example.com",
  "estimatedProcessingTime": "1-3 business days",
  "riskScore": 0.7,
  "requiresReview": true,
  "riskFactors": [
    "Account less than 7 days old",
    "Amount over $1,000"
  ]
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether request succeeded |
| `transactionId` | string | Transaction document ID |
| `status` | string | "processing" or "pending_review" |
| `message` | string | User-friendly status message |
| `amount` | number | Withdrawal amount |
| `paypalEmail` | string | Recipient PayPal email |
| `estimatedProcessingTime` | string | Processing time estimate |
| `riskScore` | number | Risk score (0-1) |
| `requiresReview` | boolean | Whether admin review required |
| `riskFactors` | array[string] | List of flagged risk factors |

### Error Responses

#### 400 Bad Request - Invalid Amount
```json
{
  "error": "Amount must be at least $10.00"
}
```

#### 400 Bad Request - Insufficient Balance
```json
{
  "error": "Insufficient balance. Current balance: $50.00"
}
```

#### 400 Bad Request - Invalid PayPal Email
```json
{
  "error": "Valid PayPal email address is required"
}
```

#### 403 Forbidden - Rate Limit Exceeded
```json
{
  "error": "Withdrawal limit exceeded: Maximum 3 withdrawals per 24 hours"
}
```

#### 403 Forbidden - Amount Limit Exceeded
```json
{
  "error": "Daily withdrawal limit exceeded: Maximum $25,000 per 24 hours"
}
```

#### 403 Forbidden - Weekly Limit Exceeded
```json
{
  "error": "Weekly withdrawal limit exceeded: Maximum $50,000 per 7 days"
}
```

#### 400 Bad Request - No Wallet
```json
{
  "error": "Wallet not initialized"
}
```

#### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

## Process Flow

### Step 1: Authentication
- Verify user is authenticated
- Extract user ID from auth context

### Step 2: Input Validation
- Verify amount is positive
- Verify amount meets minimum ($10)
- Validate PayPal email format
- Check PayPal email is provided

### Step 3: User Verification
- Fetch user document from Firestore
- Verify wallet is initialized (`hasWallet = true`)
- Verify user has PayPal email configured
- Get current balance

### Step 4: Balance Check
- Verify user has sufficient balance
- Amount must not exceed available balance

### Step 5: Rate Limit Checks
Check recent withdrawals in last 24 hours:
- **Count limit**: Maximum 3 withdrawals per 24 hours
- **Amount limit**: Maximum $25,000 per 24 hours

Check recent withdrawals in last 7 days:
- **Weekly limit**: Maximum $50,000 per 7 days

If any limit exceeded, reject immediately with specific error.

### Step 6: Risk Assessment
Call `assessWithdrawalRisk()` with:
- User ID
- Amount
- Account age
- Deposit history
- Recent wins

Returns:
- `riskScore` (0-1)
- `shouldFlag` (boolean)
- `riskFactors` (array of strings)

### Step 7: Create Transaction
Use Firestore transaction to:
- Deduct balance immediately: `balance - amount`
- Create transaction document with type `withdrawal_request`
- Set status to `processing` (low risk) or `pending_review` (high risk)
- Record risk assessment data

### Step 8: Route Processing
**Low Risk (automated):**
- Status: `processing`
- Call `processPayPalPayout()` automatically
- Update status based on payout result
- Send notification

**High Risk (manual review):**
- Status: `pending_review`
- Send notification to user
- Alert admin for review
- Admin manually approves/rejects via admin panel

### Step 9: Create Notification
Create notification document:
- Title: "Withdrawal Request Submitted"
- Message: Processing details
- Link to transaction

### Step 10: Return Response
Return transaction details and status

## Risk Assessment Logic

### Rate Limits (Hard Rejections)
Immediate rejection if exceeded:
- **Max 3 withdrawals** per 24 hours
- **Max $25,000** per 24 hours
- **Max $50,000** per 7 days

### Risk Factors (Flagging for Review)
Auto-flag for admin review if any:
- Account < 7 days old AND amount > $1,000
- Account < 7 days old AND amount > $500 AND no deposit history
- Account < 1 day old AND amount > $200
- Account < 3 days old AND recent win followed by withdrawal
- Amount > $1,000 AND account < 30 days old
- No deposit history AND amount > $500

### Risk Score Calculation
```javascript
let riskScore = 0;
if (accountAgeDays < 7) riskScore += 0.3;
if (accountAgeDays < 1) riskScore += 0.2;
if (amount > 1000) riskScore += 0.2;
if (amount > 5000) riskScore += 0.2;
if (!hasDeposits) riskScore += 0.1;
if (wonRecently && accountAgeDays < 3) riskScore += 0.2;
// Cap at 1.0
riskScore = Math.min(riskScore, 1.0);
```

### Flagging Decision
```javascript
const shouldFlag = riskScore >= 0.5 || (specific risk conditions met)
```

## Transaction Record Structure

### Fields Created
```javascript
{
  userId: userId,
  userDocRef: userRef,
  type: 'withdrawal_request',
  status: 'processing' | 'pending_review',
  amount: amount,
  currency: 'USD',
  method: 'paypal',
  details: {
    paypalEmail: paypalEmail
  },
  requestedAt: now,
  updatedAt: now,
  description: `Withdrawal request of $${amount} to PayPal: ${paypalEmail}`,
  notes: 'Processing automatically' | 'Pending administrator review and payout',
  riskFactors: ['Account less than 7 days old', ...],
  riskScore: 0.7,
  accountAgeDays: 5,
  hasDeposits: false
}
```

## Balance Transaction

### Atomic Operation
```javascript
await db.runTransaction(async (tx) => {
  // Read current balance
  const userDoc = await tx.get(userRef);
  const currentBalance = userDoc.data().balance || 0;
  
  // Validate sufficient balance
  if (currentBalance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // Deduct balance immediately
  tx.update(userRef, {
    balance: FieldValue.increment(-amount),
    updated_time: FieldValue.serverTimestamp()
  });
  
  // Create transaction record
  tx.set(txRef, {
    userId,
    type: 'withdrawal_request',
    status: initialStatus,
    amount,
    // ... other fields
  });
  
  // Create notification
  tx.set(notifRef, { /* ... */ });
});
```

### Balance Deduction
- Balance deducted **immediately** when request submitted
- Prevents user from using funds during processing
- If withdrawal fails, balance refunded automatically

## Business Rules

### Minimum Withdrawal
- Minimum amount: $10.00

### Maximum Withdrawals
- 3 withdrawals per 24-hour period
- $25,000 per 24-hour period
- $50,000 per 7-day period

### PayPal Requirements
- Valid PayPal email required
- PayPal email validated for format
- User can update PayPal email in profile

### Wallet Requirements
- Wallet must be initialized
- KYC verification required
- Location verification required for some states

### Processing Time
- **Low risk**: 1-2 business days (automated)
- **High risk**: 1-3 business days (manual review + processing)

## Security Considerations

### Authentication
- User must be authenticated via Firebase Auth
- User can only request withdrawal for their own account
- Admin privileges required to process high-risk withdrawals

### Balance Protection
- Immediate balance deduction prevents double-spending
- Atomic transaction ensures consistency
- Failed payouts refund balance automatically

### Fraud Prevention
- Risk assessment flags suspicious patterns
- Rate limits prevent rapid fund extraction
- Account age requirements protect against account takeover

### Data Validation
- Amount validated as positive number
- PayPal email format validated
- User ID verified against auth context

## Error Handling

### Insufficient Balance
- Check balance before deduction
- Return clear error message
- No transaction created

### Rate Limit Exceeded
- Check limits before processing
- Return specific limit type exceeded
- No transaction created

### Transaction Failures
If Firestore transaction fails:
- Balance not deducted
- No transaction record created
- User can retry

### Payout Failures (Automated)
If `processPayPalPayout()` fails:
- Transaction status updated to "failed"
- Balance refunded automatically
- Notification sent to user
- User can retry withdrawal

## Logging

### Logged Information
- Withdrawal request details (user ID, amount)
- Risk assessment results
- Rate limit checks
- Processing route (automated vs review)
- Transaction creation success/failure

### Not Logged
- Full PayPal email (may log partial or hash)
- Full user balance

## Notifications

### User Notification (Low Risk)
```
Title: "Withdrawal Request Submitted"
Message: "Your withdrawal of $150.00 is being processed. Funds will arrive at user@example.com within 1-2 business days."
```

### User Notification (High Risk)
```
Title: "Withdrawal Request Under Review"
Message: "Your withdrawal of $1,500.00 is pending administrator review. You'll be notified once approved."
```

### Admin Notification (High Risk)
Sent to admin dashboard or admin email:
```
Title: "Withdrawal Review Required"
Message: "User {username} requested withdrawal of $1,500.00. Risk score: 0.7. Review required."
```

## Used By
- Wallet withdrawal page (`src/app/withdraw/page.tsx`)
- Mobile app withdrawal flow
- User profile wallet section

## Related Functions
- `assessWithdrawalRisk`: Evaluates risk factors
- `processPayPalPayout`: Executes PayPal payout
- `processWithdrawalReview`: Admin approval handler

## Related Documentation
- [Function: assessWithdrawalRisk](./assessWithdrawalRisk.md)
- [Function: processPayPalPayout](./processPayPalPayout.md)
- [Function: processWithdrawalReview](./processWithdrawalReview.md)
- [Data Model: Transactions](../../data-models/transactions.md)
- [Data Model: Users](../../data-models/users.md)

## Implementation Notes

### Rate Limit Queries
```javascript
const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
const recentWithdrawals = await db.collection('transactions')
  .where('userId', '==', userId)
  .where('type', '==', 'withdrawal_request')
  .where('requestedAt', '>=', twentyFourHoursAgo)
  .get();

const count = recentWithdrawals.size;
const totalAmount = recentWithdrawals.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
```

### Idempotency
- No explicit idempotency mechanism
- Client should prevent duplicate submissions
- Balance deduction prevents successful duplicate requests

### Testing
- Test with various amounts and account ages
- Verify rate limit enforcement
- Test risk assessment flagging
- Verify balance deduction and refund on failure

