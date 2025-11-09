# Withdrawal Functions Documentation

## Overview
This directory contains documentation for withdrawal functions that handle user fund withdrawals from SquarePicks wallet to PayPal accounts, including risk assessment and admin review processes.

## Functions

### 1. requestWithdrawal
**File:** [requestWithdrawal.md](./requestWithdrawal.md)

Initiates a withdrawal request with risk assessment, rate limiting, and immediate balance deduction.

**Key Features:**
- Validates withdrawal amount and PayPal email
- Checks rate limits (3 per day, $25k per day, $50k per week)
- Performs risk assessment
- Deducts balance immediately
- Routes to automatic processing or admin review

**Status:** Expected implementation (Cloud Function or API Route)

---

### 2. processWithdrawalReview
**File:** [processWithdrawalReview.md](./processWithdrawalReview.md)

Admin function to approve or reject high-risk withdrawal requests.

**Key Features:**
- Admin-only access
- Approve or reject flagged withdrawals
- Process approved payouts
- Refund rejected withdrawals
- Audit trail of admin actions

**Status:** Expected implementation (Admin API Route or Cloud Function)

---

### 3. assessWithdrawalRisk
**File:** [assessWithdrawalRisk.md](./assessWithdrawalRisk.md)

Evaluates withdrawal requests against risk criteria to determine if manual review is required.

**Key Features:**
- Calculates risk score (0.0 - 1.0)
- Identifies specific risk factors
- Checks account age, deposit history, recent wins
- Determines flagging decision
- Supports fraud prevention

**Status:** Expected implementation (Utility function)

---

### 4. processPayPalPayout
**File:** [processPayPalPayout.md](./processPayPalPayout.md)

Executes PayPal payout to user's PayPal account.

**Key Features:**
- PayPal Payouts API integration
- Transfers funds to user PayPal
- Handles success and failure
- Updates transaction status
- Refunds balance on failure

**Status:** Expected implementation (Utility function)

---

## Withdrawal Flow

### Low-Risk Withdrawal (Automated)
```
1. User requests withdrawal
   ↓
2. requestWithdrawal
   - Validate input
   - Check rate limits
   - Assess risk (low risk)
   - Deduct balance
   ↓
3. processPayPalPayout (automatic)
   - Execute PayPal payout
   - Update status to completed
   ↓
4. Funds arrive in user PayPal (1-2 business days)
```

### High-Risk Withdrawal (Manual Review)
```
1. User requests withdrawal
   ↓
2. requestWithdrawal
   - Validate input
   - Check rate limits
   - Assess risk (high risk)
   - Deduct balance
   - Set status: pending_review
   ↓
3. Admin reviews in dashboard
   ↓
4. processWithdrawalReview
   - Admin approves or rejects
   ↓
   If Approved:
   5. processPayPalPayout
      - Execute payout
      - Update status
   ↓
   If Rejected:
   5. Refund balance
      - Return funds to user
```

## Risk Assessment

### Rate Limits (Hard Rejections)
- **Max 3 withdrawals** per 24 hours
- **Max $25,000** per 24 hours  
- **Max $50,000** per 7 days

### Risk Factors (Flagging)
Auto-flag for manual review if:
- Account < 7 days old AND amount > $1,000
- Account < 7 days old AND amount > $500 AND no deposits
- Account < 1 day old AND amount > $200
- Account < 3 days old AND recent win
- Amount > $1,000 AND account < 30 days old
- No deposit history AND amount > $500
- Risk score ≥ 0.5

### Risk Score Calculation
```javascript
let riskScore = 0;
if (accountAgeDays < 7) riskScore += 0.3;
if (accountAgeDays < 1) riskScore += 0.2;
if (amount > 1000) riskScore += 0.2;
if (amount > 5000) riskScore += 0.2;
if (!hasDeposits) riskScore += 0.1;
if (wonRecently && accountAgeDays < 3) riskScore += 0.2;
riskScore = Math.min(riskScore, 1.0);
```

## PayPal Payouts API Integration

### Authentication
Uses PayPal OAuth2 (same as payments):
- Client credentials flow
- Access token for API calls

### Payouts Endpoint
```
POST https://api-m.sandbox.paypal.com/v1/payments/payouts (sandbox)
POST https://api-m.paypal.com/v1/payments/payouts (live)
```

### Payout Request
```json
{
  "sender_batch_header": {
    "sender_batch_id": "batch_1699999999_tx_abc123",
    "email_subject": "You have a payout from SquarePicks",
    "recipient_type": "EMAIL"
  },
  "items": [
    {
      "recipient_type": "EMAIL",
      "amount": { "value": "150.00", "currency": "USD" },
      "receiver": "user@example.com",
      "sender_item_id": "tx_abc123"
    }
  ]
}
```

## Transaction Status Flow

### Automated Processing (Low Risk)
```
withdrawal_request → processing → completed
                                → failed (refunded)
```

### Manual Review (High Risk)
```
withdrawal_request → pending_review → processing → completed
                                                 → failed (refunded)
                                   → rejected (refunded)
```

## Balance Management

### Immediate Deduction
- Balance deducted when withdrawal requested
- Prevents double-spending during processing
- User cannot use funds while pending

### Refund on Failure
- Automatic refund if payout fails
- Automatic refund if admin rejects
- Atomic balance update operations

## Related Documentation

### Data Models
- [Transactions](../../data-models/transactions.md) - Withdrawal transaction structure
- [Users](../../data-models/users.md) - User wallet and balance

### Payment Functions
- [getPayPalAccessToken](../payments/getPayPalAccessToken.md) - PayPal authentication

### External Resources
- [PayPal Payouts API](https://developer.paypal.com/docs/api/payments.payouts-batch/)

## Security Considerations

### Fraud Prevention
- Risk assessment flags suspicious patterns
- Rate limits prevent rapid fund extraction
- Account age requirements
- Manual review for high-risk withdrawals

### Balance Protection
- Immediate deduction prevents double-spending
- Atomic transactions ensure consistency
- Automatic refunds on failure

### Admin Authorization
- Review functions require admin role
- All actions logged for audit trail
- Admin notes recorded

## Business Rules

### Minimum Withdrawal
- $10.00 minimum

### Maximum Withdrawals
- 3 per 24-hour period
- $25,000 per 24-hour period
- $50,000 per 7-day period

### Processing Time
- Low risk: 1-2 business days
- High risk: 1-3 business days (includes review)

### PayPal Requirements
- Valid PayPal email required
- PayPal account must be registered
- Business account for SquarePicks (sender)

## Testing

### Test Scenarios
- Low-risk withdrawal (automated)
- High-risk withdrawal (review required)
- Rate limit enforcement
- Risk assessment accuracy
- PayPal payout success
- PayPal payout failure
- Balance refund on failure
- Admin approval process
- Admin rejection process

### Sandbox Testing
- Use PayPal sandbox
- Test various risk scenarios
- Verify balance transactions
- Test error handling

