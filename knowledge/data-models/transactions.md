# Transactions Collection

## Overview
Immutable record of all financial transactions including deposits, withdrawals, entry fees, winnings, sweepstakes entries, and refunds.

## Collection Path
`transactions/{transactionId}`

## Document Structure

### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userID` | string | Yes | User ID this transaction belongs to |
| `userDocRef` | DocumentReference | No | Reference to user document |
| `type` | string | Yes | Transaction type (see types below) |
| `amount` | number | Yes | Transaction amount in USD |
| `currency` | string | Yes | Currency code (always "USD") |
| `status` | string | Yes | Transaction status (see statuses below) |
| `timestamp` | Timestamp | Yes | Transaction creation timestamp |
| `description` | string | No | Human-readable transaction description |

### Context Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `boardId` | string | Conditional | Board ID for board-related transactions |
| `gameId` | string | Conditional | Game ID for game-related transactions |
| `period` | string | Conditional | Quarter period (Q1, Q2, Q3, FINAL) for winnings |
| `squareIndexes` | array[number] | Conditional | Square indexes for entry transactions |

### Deposit Fields (type = 'deposit')
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `orderId` | string | Yes | PayPal order ID |
| `newBalance` | number | Yes | User balance after deposit |
| `previousBalance` | number | Yes | User balance before deposit |
| `paypalFee` | number | No | PayPal processing fee |
| `paypalGross` | number | No | Gross amount before fees |
| `paypalNet` | number | No | Net amount after fees |

### Withdrawal Fields (type = 'withdrawal_request')
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `method` | string | Yes | Withdrawal method ('paypal') |
| `details` | map | Yes | Withdrawal details object |
| `details.paypalEmail` | string | Yes | Recipient PayPal email |
| `requestedAt` | Timestamp | Yes | Withdrawal request timestamp |
| `updatedAt` | Timestamp | Yes | Last status update timestamp |
| `completedAt` | Timestamp | Conditional | Completion timestamp (if completed) |
| `notes` | string | No | Processing notes |
| `riskFactors` | array[string] | No | Risk assessment factors |
| `riskScore` | number | No | Risk score (0-1) |
| `accountAgeDays` | number | No | Account age at time of request |
| `hasDeposits` | boolean | No | Whether user has prior deposits |
| `paypalBatchId` | string | Conditional | PayPal payout batch ID (if processed) |
| `paypalPayoutItemId` | string | Conditional | PayPal payout item ID (if processed) |
| `paypalStatus` | string | Conditional | PayPal payout status (if processed) |
| `payoutError` | string | Conditional | Error message (if failed) |
| `payoutErrorDetails` | map | Conditional | Detailed error info (if failed) |
| `isTemporaryError` | boolean | Conditional | Whether error is temporary (if failed) |

## Transaction Types

| Type | Description | Amount Sign | Creates Transaction Record |
|------|-------------|-------------|---------------------------|
| `deposit` | PayPal deposit | Positive | After PayPal capture |
| `withdrawal_request` | Withdrawal to PayPal | Negative | Immediately (balance deducted) |
| `entry_fee` | Board square entry | Negative | On square selection |
| `sweepstakes_entry` | Free sweepstakes entry | 0 | On free square selection |
| `winnings` | Quarter/final winner payout | Positive | Immediately after winner assignment |
| `refund` | Entry refund (game cancelled, etc.) | Positive | On refund trigger |

## Transaction Statuses

| Status | Description | Applies To |
|--------|-------------|------------|
| `completed` | Transaction successful | All types |
| `pending` | Processing | Deposits, withdrawals |
| `pending_review` | Awaiting admin approval | High-risk withdrawals |
| `processing` | Automated processing | Low-risk withdrawals |
| `failed` | Transaction failed | Deposits, withdrawals |
| `rejected` | Manually rejected | Withdrawals in review |

## Status Lifecycle

### Deposit
```
(PayPal order created) → completed
```

### Withdrawal - Low Risk
```
processing → completed
          → failed (balance refunded)
```

### Withdrawal - High Risk
```
pending_review → processing (admin approves)
              → rejected (admin rejects, balance refunded)
              → completed (payout successful)
              → failed (payout failed, balance refunded)
```

### Entry Fee
```
completed (instant)
```

### Winnings
```
completed (instant)
```

## Deterministic IDs

### Deposit Transactions
Uses deterministic ID to prevent duplicate credits:
```javascript
const txId = `paypal_${orderID}`;
const txRef = db.collection('transactions').doc(txId);

// Idempotency check
const existingSnap = await txRef.get();
if (existingSnap.exists) {
  throw new HttpsError('already-exists', 'Order already credited');
}
```

### Other Transactions
Auto-generated IDs:
```javascript
const txRef = db.collection('transactions').doc();
// Firestore generates unique ID
```

## Balance Impact

### Positive Impact (Increase Balance)
- `deposit`: +amount
- `winnings`: +amount
- `refund`: +amount

### Negative Impact (Decrease Balance)
- `withdrawal_request`: -amount (immediate deduction)
- `entry_fee`: -amount

### No Impact
- `sweepstakes_entry`: amount = 0

## Transaction Creation

### Entry Fee Transaction
```javascript
await db.runTransaction(async (tx) => {
  const txRef = db.collection('transactions').doc();
  
  tx.set(txRef, {
    userID: userId,
    userDocRef: userRef,
    type: 'entry_fee',
    amount: entryFee,
    currency: 'USD',
    status: 'completed',
    timestamp: FieldValue.serverTimestamp(),
    description: `Entry fee for ${squareCount} square(s) on board ${boardId}`,
    boardId: boardId,
    gameId: gameId,
    squareIndexes: selectedSquareIndexes
  });
  
  tx.update(userRef, {
    balance: FieldValue.increment(-entryFee)
  });
  
  // Create squares, notification, etc.
});
```

### Winnings Transaction
```javascript
await db.runTransaction(async (tx) => {
  const txRef = db.collection('transactions').doc();
  
  tx.set(txRef, {
    userID: uid,
    userDocRef: userRef,
    type: 'winnings',
    amount: perWinner,
    currency: 'USD',
    status: 'completed',
    timestamp: FieldValue.serverTimestamp(),
    description: `${periodLabel} quarter winnings for board ${boardId}`,
    boardId: boardId,
    gameId: gameId,
    period: periodLabel.toUpperCase()
  });
  
  tx.update(userRef, {
    balance: FieldValue.increment(perWinner)
  });
  
  // Create notification
});
```

### Deposit Transaction
```javascript
await db.runTransaction(async (tx) => {
  const txRef = db.collection('transactions').doc(`paypal_${orderID}`);
  
  // Idempotency check
  const existingSnap = await tx.get(txRef);
  if (existingSnap.exists) {
    throw new HttpsError('already-exists', 'Already credited');
  }
  
  tx.set(txRef, {
    userID: userId,
    type: 'deposit',
    amount: amountCaptured,
    currency: 'USD',
    description: `PayPal Deposit of $${amountCaptured} - Order ID: ${orderID}`,
    orderId: orderID,
    newBalance: currentBalance + amountCaptured,
    previousBalance: currentBalance,
    timestamp: FieldValue.serverTimestamp(),
    status: 'completed',
    paypalFee: paypalFee,
    paypalGross: grossAmount,
    paypalNet: netAmount
  });
  
  tx.update(userRef, {
    balance: FieldValue.increment(amountCaptured)
  });
});
```

### Withdrawal Transaction
```javascript
await db.runTransaction(async (tx) => {
  const txRef = db.collection('transactions').doc();
  
  // Immediate balance deduction
  tx.update(userRef, {
    balance: FieldValue.increment(-amount)
  });
  
  tx.set(txRef, {
    userId: userId,
    userDocRef: userRef,
    type: 'withdrawal_request',
    status: initialStatus,  // 'processing' or 'pending_review'
    amount: amount,
    currency: 'USD',
    method: 'paypal',
    details: { paypalEmail: paypalEmail },
    requestedAt: now,
    updatedAt: now,
    description: `Withdrawal request of $${amount} to PayPal: ${paypalEmail}`,
    notes: riskAssessment.shouldFlag 
      ? 'Pending administrator review and payout' 
      : 'Processing automatically',
    riskFactors: riskAssessment.riskFactors,
    riskScore: riskAssessment.riskScore,
    accountAgeDays: riskAssessment.accountAgeDays,
    hasDeposits: riskAssessment.hasDeposits
  });
});
```

## Risk Assessment (Withdrawals)

### Rate Limits (Hard Rejections)
- **Max 3 withdrawals** per 24 hours
- **Max $25,000** per 24 hours
- **Max $50,000** per 7 days

Exceeding these limits results in immediate rejection with specific error message.

### Risk Factors (Flagging for Review)
Auto-flag for admin review if:
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
// Score capped at 1.0
```

## Indexes Required
- `userID` + `timestamp` (composite) - User transaction history
- `userID` + `type` + `timestamp` (composite) - Type-filtered history
- `userID` + `type` + `requestedAt` (composite) - Withdrawal rate limiting
- `status` + `type` (composite) - Admin review queries
- `boardId` + `type` (composite) - Board transaction queries

## Related Collections
- **users**: Owner of transaction
- **boards**: Board associated with transaction (if applicable)
- **games**: Game associated with transaction (if applicable)
- **notifications**: Corresponding notification for transaction

## Business Rules

### Immutability
- Transaction records are never deleted
- Status can be updated (withdrawal processing)
- Amount and type never change after creation

### Balance Consistency
- Every balance change must have transaction record
- Transactions created atomically with balance changes
- Failed transactions must refund balance

### Withdrawal Processing
```javascript
// Low risk: Immediate automated processing
if (!riskAssessment.shouldFlag) {
  const payoutResult = await processPayPalPayout(txId, email, amount);
  
  if (payoutResult.success) {
    // Update status to 'completed'
    // Send success notification
  } else {
    // Update status to 'failed'
    // Refund balance
    // Send failure notification
  }
}

// High risk: Admin review required
if (riskAssessment.shouldFlag) {
  // Status set to 'pending_review'
  // Admin manually approves/rejects via admin panel
  // On approval: Process payout, update status
  // On rejection: Refund balance, update status
}
```

## Query Examples

### User Transaction History
```javascript
const txSnap = await db.collection('transactions')
  .where('userID', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get();
```

### Recent Withdrawals (Rate Limiting)
```javascript
const twentyFourHoursAgo = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);

const recentWithdrawals = await db.collection('transactions')
  .where('userId', '==', userId)
  .where('type', '==', 'withdrawal_request')
  .where('requestedAt', '>=', twentyFourHoursAgo)
  .get();
```

### Pending Review (Admin)
```javascript
const pendingReview = await db.collection('transactions')
  .where('status', '==', 'pending_review')
  .where('type', '==', 'withdrawal_request')
  .orderBy('requestedAt', 'asc')
  .get();
```

### Board Transactions
```javascript
const boardTxs = await db.collection('transactions')
  .where('boardId', '==', boardId)
  .where('type', 'in', ['entry_fee', 'winnings'])
  .get();
```

## Implementation Notes

### Atomic Operations
All transactions use Firestore transactions to ensure atomicity:
```javascript
await db.runTransaction(async (tx) => {
  // Read balance
  const userSnap = await tx.get(userRef);
  const balance = userSnap.data().balance || 0;
  
  // Validate
  if (balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // Write transaction record
  tx.set(txRef, {...});
  
  // Update balance
  tx.update(userRef, {
    balance: FieldValue.increment(-amount)
  });
});
```

### Error Handling
- PayPal capture failures logged, transaction not created
- Insufficient balance throws error, no transaction created
- Withdrawal payout failures refund balance automatically
- Duplicate deposit attempts detected via deterministic IDs

### Notification Pairing
Every transaction creates corresponding notification:
```javascript
// After transaction created
const notifRef = db.collection('notifications').doc();
tx.set(notifRef, {
  userID: userId,
  tag: transactionType,
  title: `...`,
  message: `...`,
  type: transactionType,
  relatedID: txRef.id,  // Link to transaction
  timestamp: FieldValue.serverTimestamp(),
  isRead: false
});
```

## Performance Considerations

### Query Optimization
- Most queries filter by userID first (high selectivity)
- Timestamp ordering for chronological display
- Type filtering uses indexes for rate limiting
- Status + type composite for admin queries

### Data Volume
- Grows continuously with platform usage
- Old transactions retained for audit trail
- Archive strategy needed for scale (e.g., move >1 year old to cold storage)

### Caching
- User transaction history cached client-side
- Recent transactions fetched on wallet/transaction page load
- Real-time listeners for new transactions (optional)

