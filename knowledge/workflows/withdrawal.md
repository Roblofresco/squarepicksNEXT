# Withdrawal Workflow

## User Journey

### 1. Check Balance
```
User navigates to /withdraw or /wallet
  ↓
View current balance
  ↓
Check minimum withdrawal ($5.00)
  ↓
Proceed if balance ≥ $5.00
```

### 2. Enter Withdrawal Details
```
User enters:
  - Withdrawal amount ($5 - $10,000)
  - PayPal email address
  ↓
Validate:
  - Amount within limits
  - Sufficient balance
  - Valid email format
  ↓
Display confirmation
```

### 3. Submit Request
```
User clicks "Request Withdrawal"
  ↓
Call requestWithdrawal function
  ↓
Function performs risk assessment
  ↓
Determines: Auto-process or manual review
  ↓
Balance deducted immediately
```

### 4A. Low-Risk (Automated)
```
Withdrawal request created (status: processing)
  ↓
PayPal payout initiated
  ↓
Success:
  - Status updated to completed
  - Notification sent
  - Funds sent to PayPal
  ↓
Failure:
  - Balance refunded
  - Status updated to failed
  - Error notification sent
```

### 4B. High-Risk (Manual Review)
```
Withdrawal request created (status: pending_review)
  ↓
Admin reviews request
  ↓
Approved:
  - Status → processing
  - PayPal payout initiated
  - Status → completed
  ↓
Rejected:
  - Balance refunded
  - Status → rejected
  - Rejection notification sent
```

### 5. Confirmation
```
Display appropriate message:
  - "Processing..." (automated)
  - "Pending review" (flagged)
  - "Completed" (success)
  - "Failed - Refunded" (failure)
```

## Risk Assessment

### Auto-Process Criteria
✅ Account age > 7 days
✅ Has deposit history
✅ Amount < $1,000
✅ No recent rapid wins
✅ Under rate limits

### Flagged for Review
🚩 Account < 7 days old AND amount > $1,000
🚩 Account < 7 days old AND amount > $500 AND no deposits
🚩 Account < 1 day old AND amount > $200
🚩 Account < 3 days old AND recent win + withdrawal
🚩 Amount > $1,000 AND account < 30 days old
🚩 No deposit history AND amount > $500

### Rate Limits
❌ Max 3 withdrawals per 24 hours
❌ Max $25,000 per 24 hours
❌ Max $50,000 per 7 days

## Technical Flow

### Client-Side
```javascript
async function handleWithdrawal(amount, paypalEmail) {
  try {
    const result = await requestWithdrawal({
      amount: parseFloat(amount),
      method: 'paypal',
      details: { paypalEmail }
    });
    
    if (result.status === 'processing') {
      showSuccess('Withdrawal is being processed. You will receive a confirmation shortly.');
    } else if (result.status === 'pending_review') {
      showInfo('Your withdrawal is pending review. We will notify you once it is processed.');
    } else if (result.status === 'completed') {
      showSuccess('Withdrawal completed! Funds sent to your PayPal account.');
    }
    
    navigate('/wallet');
  } catch (error) {
    if (error.code === 'failed-precondition') {
      showError(error.message); // Rate limit or insufficient balance
    } else {
      showError('Withdrawal request failed. Please try again.');
    }
  }
}
```

### Server-Side
```javascript
exports.requestWithdrawal = onCall(async (request) => {
  const { amount, method, details } = request.data;
  const userId = request.auth.uid;
  
  // Validate
  if (amount < 5 || amount > 10000) {
    throw new HttpsError('invalid-argument', 'Amount must be between $5 and $10,000');
  }
  
  // Check balance
  const userSnap = await db.doc(`users/${userId}`).get();
  const userBalance = userSnap.data().balance || 0;
  
  if (userBalance < amount) {
    throw new HttpsError('failed-precondition', 'Insufficient balance');
  }
  
  // Risk assessment
  const riskAssessment = await assessWithdrawalRisk(db, userId, amount, userSnap.data());
  
  if (riskAssessment.rateLimitExceeded) {
    throw new HttpsError('failed-precondition', riskAssessment.rateLimitReason);
  }
  
  // Determine status
  const initialStatus = riskAssessment.shouldFlag ? 'pending_review' : 'processing';
  
  // Deduct balance and create request (atomic)
  const txRef = db.collection('transactions').doc();
  
  await db.runTransaction(async (tx) => {
    tx.update(userRef, {
      balance: FieldValue.increment(-amount)
    });
    
    tx.set(txRef, {
      userId,
      type: 'withdrawal_request',
      status: initialStatus,
      amount,
      method: 'paypal',
      details: { paypalEmail: details.paypalEmail },
      requestedAt: FieldValue.serverTimestamp(),
      riskFactors: riskAssessment.riskFactors,
      riskScore: riskAssessment.riskScore
    });
    
    tx.set(notifRef, {...});
  });
  
  // Auto-process if low risk
  if (!riskAssessment.shouldFlag) {
    const payoutResult = await processPayPalPayout(txRef.id, details.paypalEmail, amount);
    
    if (payoutResult.success) {
      await txRef.update({
        status: 'completed',
        paypalBatchId: payoutResult.batchId,
        completedAt: FieldValue.serverTimestamp()
      });
    } else {
      // Refund on failure
      await db.runTransaction(async (tx) => {
        tx.update(userRef, { balance: FieldValue.increment(amount) });
      });
      
      await txRef.update({
        status: 'failed',
        payoutError: payoutResult.error
      });
    }
  }
  
  return { success: true, status: initialStatus };
});
```

## UI Components

### Withdrawal Form
```
Withdraw Funds

Available Balance: $250.00

Amount to Withdraw
[Input: $____.__]
Min: $5.00, Max: $10,000.00

PayPal Email
[Input: email@example.com]

[Request Withdrawal Button]
```

### Status Display

**Processing**:
```
⏳ Processing Withdrawal
Amount: $100.00
To: user@paypal.com
Estimated: 1-2 business days
```

**Pending Review**:
```
🔍 Pending Review
Amount: $1,500.00
Your withdrawal is being reviewed.
You will be notified once processed.
```

**Completed**:
```
✅ Withdrawal Completed
Amount: $100.00
Sent to: user@paypal.com
Date: Jan 15, 2025 10:30 AM
```

**Failed**:
```
❌ Withdrawal Failed
Amount: $100.00 (Refunded)
Reason: Invalid PayPal email
Please try again with a valid email.
```

## Error Handling

### Insufficient Balance
```
Error: Insufficient balance for withdrawal
Current: $50.00
Requested: $100.00
Action: Update amount or win more games!
```

### Rate Limit Exceeded
```
Error: Maximum 3 withdrawals per 24 hours exceeded
Action: Please try again tomorrow
```

### Invalid PayPal Email
```
Error: Payout failed - Invalid PayPal email
Action: Funds refunded. Please update your PayPal email.
```

### PayPal API Error
```
Error: Temporary issue with payment provider
Action: Funds refunded. Please try again later.
```

## Admin Review Flow

### Pending Queue
```
Admin Dashboard → Pending Withdrawals
  ├─ User: johndoe
  │   Amount: $1,500.00
  │   Risk Score: 0.6
  │   Factors: New account, large amount
  │   Actions: [Approve] [Reject]
```

### Approve
```
Admin clicks Approve
  ↓
Status → processing
  ↓
PayPal payout initiated
  ↓
Status → completed
  ↓
User notified
```

### Reject
```
Admin clicks Reject
  ↓
Balance refunded
  ↓
Status → rejected
  ↓
User notified with reason
```

## Security Measures

### Fraud Prevention
- Account age checks
- Deposit history verification
- Win pattern analysis
- Rate limiting
- Manual review for high-risk

### Data Protection
- PayPal email validated
- No sensitive data stored
- Audit trail maintained
- PCI compliance (PayPal handles)

## Notifications

### Request Submitted
```
Title: "Withdrawal Request: $100.00"
Message: "Your withdrawal request is being processed."
```

### Completed
```
Title: "Withdrawal Processed: $100.00"
Message: "Your withdrawal has been sent to your PayPal account (user@paypal.com)."
```

### Failed
```
Title: "Withdrawal Failed: $100.00"
Message: "Your withdrawal encountered an issue. Funds have been returned to your wallet."
```

### Rejected
```
Title: "Withdrawal Rejected: $1,500.00"
Message: "Your withdrawal request was reviewed and rejected. Funds returned to wallet."
```

## Best Practices

### User Communication
- Clear status updates
- Transparent processing times
- Helpful error messages
- Refund confirmations

### Processing Times
- Automated: 1-2 business days (PayPal standard)
- Manual review: 1-3 business days
- Weekends/holidays: Additional delay

### User Guidance
```
💡 Tips for Faster Withdrawals:
- Verify your PayPal email is correct
- Withdraw smaller amounts (<$1,000)
- Build withdrawal history over time
- Maintain a positive account standing
```

