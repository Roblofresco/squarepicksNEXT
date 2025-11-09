# Withdrawal Business Rules

## Overview
Users can withdraw funds from their wallet to PayPal. Withdrawals undergo risk assessment and may require admin review.

## Withdrawal Limits

### Rate Limits (Hard Rejections)
- **Max 3 withdrawals** per 24 hours
- **Max $25,000** per 24 hours
- **Max $50,000** per 7 days

### Amount Limits
- **Minimum**: $5.00
- **Maximum**: $10,000.00 per request
- **Precision**: 2 decimal places max

## Risk Assessment

### Auto-Flag Criteria
Withdrawal flagged for admin review if:
- Account < 7 days old AND amount > $1,000
- Account < 7 days old AND amount > $500 AND no deposits
- Account < 1 day old AND amount > $200
- Account < 3 days old AND recent win followed by withdrawal
- Amount > $1,000 AND account < 30 days old
- No deposit history AND amount > $500

### Risk Score
```javascript
let riskScore = 0;
if (accountAgeDays < 7) riskScore += 0.3;
if (accountAgeDays < 1) riskScore += 0.2;
if (amount > 1000) riskScore += 0.2;
if (amount > 5000) riskScore += 0.2;
if (!hasDeposits) riskScore += 0.1;
if (wonRecently && accountAgeDays < 3) riskScore += 0.2;
// Max: 1.0
```

## Withdrawal Process

### Request Submission
```javascript
exports.requestWithdrawal = onCall(async (request) => {
  const { amount, method, details } = request.data;
  
  // Validate amount
  if (amount < 5 || amount > 10000) {
    throw new HttpsError('invalid-argument', 'Amount out of range');
  }
  
  // Check balance
  if (userBalance < amount) {
    throw new HttpsError('failed-precondition', 'Insufficient balance');
  }
  
  // Risk assessment
  const riskAssessment = await assessWithdrawalRisk(db, userId, amount, userData);
  
  // Check rate limits
  if (riskAssessment.rateLimitExceeded) {
    throw new HttpsError('failed-precondition', riskAssessment.rateLimitReason);
  }
  
  // Determine status
  const initialStatus = riskAssessment.shouldFlag ? 'pending_review' : 'processing';
  
  // Create transaction and deduct balance (atomic)
  await db.runTransaction(async (tx) => {
    tx.update(userRef, {
      balance: FieldValue.increment(-amount)
    });
    
    tx.set(txRef, {
      type: 'withdrawal_request',
      status: initialStatus,
      amount: amount,
      method: 'paypal',
      details: { paypalEmail: email },
      riskFactors: riskAssessment.riskFactors,
      riskScore: riskAssessment.riskScore
    });
    
    tx.set(notifRef, {...});
  });
  
  // Low risk: Process immediately
  if (!riskAssessment.shouldFlag) {
    await processPayPalPayout(txId, email, amount);
  }
});
```

## Processing Flows

### Low-Risk (Automated)
```
Request → Balance deducted → PayPal payout → Completed
                          → Payout fails → Refund → Failed
```

### High-Risk (Manual Review)
```
Request → Balance deducted → Pending review → Admin approves → PayPal payout → Completed
                                           → Admin rejects → Refund → Rejected
```

## PayPal Integration

### Payout API
```javascript
async function processPayPalPayout(transactionId, paypalEmail, amount) {
  const payoutData = {
    sender_batch_header: {
      sender_batch_id: `SP-${transactionId}-${Date.now()}`,
      email_subject: "SquarePicks Withdrawal"
    },
    items: [{
      recipient_type: "EMAIL",
      amount: { value: amount.toFixed(2), currency: "USD" },
      receiver: paypalEmail,
      note: "Withdrawal from SquarePicks"
    }]
  };
  
  const response = await axios.post(
    `${payPalApiUrl}/v1/payments/payouts`,
    payoutData,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  return {
    success: true,
    batchId: response.data.batch_header.payout_batch_id,
    payoutItemId: response.data.batch_header.payout_items[0].payout_item_id
  };
}
```

### Error Handling
```javascript
if (payoutResult.success) {
  // Update status to completed
  await txRef.update({
    status: 'completed',
    paypalBatchId: payoutResult.batchId,
    completedAt: FieldValue.serverTimestamp()
  });
} else {
  // Refund balance
  await db.runTransaction(async (tx) => {
    tx.update(userRef, {
      balance: FieldValue.increment(amount)
    });
  });
  
  // Update status to failed
  await txRef.update({
    status: 'failed',
    payoutError: payoutResult.error
  });
}
```

## Status Lifecycle

```
processing → completed (PayPal success)
          → failed (PayPal error, balance refunded)

pending_review → processing (admin approval) → completed
              → rejected (admin rejection, balance refunded)
```

## Notifications

### Request Submitted
```javascript
title: "Withdrawal Request: $100.00"
message: "Your withdrawal request for $100.00 is being processed."
// or: "...is pending review."
```

### Completed
```javascript
title: "Withdrawal Processed: $100.00"
message: "Your withdrawal of $100.00 has been processed and sent to your PayPal account (email@example.com)."
```

### Failed
```javascript
title: "Withdrawal Failed: $100.00"
message: "Your withdrawal of $100.00 could not be processed. Your funds have been returned to your wallet."
```

## Admin Review

### Pending Queue
```javascript
const pending = await db.collection('transactions')
  .where('status', '==', 'pending_review')
  .where('type', '==', 'withdrawal_request')
  .orderBy('requestedAt', 'asc')
  .get();
```

### Approve Withdrawal
```javascript
// Update status to processing
await txRef.update({ status: 'processing' });

// Process PayPal payout
const result = await processPayPalPayout(txId, email, amount);

// Update with result
if (result.success) {
  await txRef.update({ status: 'completed', paypalBatchId: result.batchId });
} else {
  await txRef.update({ status: 'failed' });
  // Refund balance
}
```

### Reject Withdrawal
```javascript
// Refund balance
await db.runTransaction(async (tx) => {
  tx.update(userRef, {
    balance: FieldValue.increment(amount)
  });
});

// Update status
await txRef.update({
  status: 'rejected',
  notes: 'Rejected by admin: [reason]'
});

// Notify user
await notifRef.set({
  title: "Withdrawal Rejected: $100.00",
  message: "Your withdrawal request has been reviewed and rejected. Funds returned to wallet."
});
```

## Fraud Prevention

### Red Flags
- New account with large withdrawal
- No deposit history but attempting withdrawal
- Recent win immediately followed by withdrawal
- Multiple failed payout attempts
- Rapid succession of withdrawals

### Mitigation
- Rate limiting (3 per day max)
- Risk-based review
- Manual admin approval for high-risk
- PayPal email verification
- Account age checks

## Compliance

### AML/KYC
- Withdrawals over $1,000 may trigger enhanced verification
- Identity verification required for large amounts
- Transaction monitoring for suspicious patterns

### Tax Reporting
- Winnings over $600 per year require W-9/1099
- Withdrawal records retained for 7 years
- Report generation for tax authorities

