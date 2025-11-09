# assessWithdrawalRisk Function

## Overview
Evaluates withdrawal requests against risk criteria to determine if the withdrawal should be flagged for manual admin review or processed automatically. Calculates a risk score and identifies specific risk factors.

## Location
Expected: Firebase Cloud Function utility or shared library
Path: `functions/src/withdrawals/assessWithdrawalRisk` or similar

## Function Type
Internal utility function (called by `requestWithdrawal`)

## Authentication
Called internally (inherits auth from parent function)

## Purpose
- Calculate risk score for withdrawal request
- Identify specific risk factors
- Determine if manual review required
- Provide transparency on flagging reasons
- Support fraud prevention and AML compliance

## Function Signature

```typescript
interface RiskAssessment {
  riskScore: number;          // 0.0 - 1.0
  shouldFlag: boolean;        // True if manual review required
  riskFactors: string[];      // Array of risk factor descriptions
  accountAgeDays: number;     // Account age in days
  hasDeposits: boolean;       // Whether user has deposit history
  recentWinAmount?: number;   // Amount won recently (if applicable)
  wonRecently?: boolean;      // Whether user won recently
}

async function assessWithdrawalRisk(
  userId: string,
  amount: number,
  userDoc: FirebaseFirestore.DocumentSnapshot
): Promise<RiskAssessment>
```

## Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID requesting withdrawal |
| `amount` | number | Yes | Withdrawal amount in USD |
| `userDoc` | DocumentSnapshot | Yes | User document from Firestore |

## Return Value

### RiskAssessment Object
```json
{
  "riskScore": 0.7,
  "shouldFlag": true,
  "riskFactors": [
    "Account less than 7 days old",
    "Amount over $1,000",
    "No deposit history"
  ],
  "accountAgeDays": 5,
  "hasDeposits": false,
  "recentWinAmount": 1500.00,
  "wonRecently": true
}
```

### Return Fields
| Field | Type | Description |
|-------|------|-------------|
| `riskScore` | number | Calculated risk score (0.0 - 1.0) |
| `shouldFlag` | boolean | Whether withdrawal requires manual review |
| `riskFactors` | array[string] | List of identified risk factors |
| `accountAgeDays` | number | Account age in days |
| `hasDeposits` | boolean | Whether user has prior deposit history |
| `recentWinAmount` | number | Amount won in last 7 days (optional) |
| `wonRecently` | boolean | Whether user won in last 7 days (optional) |

## Risk Assessment Logic

### Step 1: Calculate Account Age
```javascript
const userData = userDoc.data();
const createdTime = userData.created_time.toDate();
const accountAgeDays = (Date.now() - createdTime.getTime()) / (1000 * 60 * 60 * 24);
```

### Step 2: Check Deposit History
```javascript
const depositsSnapshot = await db.collection('transactions')
  .where('userId', '==', userId)
  .where('type', '==', 'deposit')
  .where('status', '==', 'completed')
  .limit(1)
  .get();

const hasDeposits = !depositsSnapshot.empty;
```

### Step 3: Check Recent Wins
```javascript
const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);
const recentWinsSnapshot = await db.collection('transactions')
  .where('userId', '==', userId)
  .where('type', '==', 'winnings')
  .where('timestamp', '>=', sevenDaysAgo)
  .get();

const wonRecently = !recentWinsSnapshot.empty;
const recentWinAmount = recentWinsSnapshot.docs.reduce((sum, doc) => 
  sum + doc.data().amount, 0);
```

### Step 4: Calculate Risk Score
```javascript
let riskScore = 0;

// Account age factors
if (accountAgeDays < 7) riskScore += 0.3;
if (accountAgeDays < 1) riskScore += 0.2;

// Amount factors
if (amount > 1000) riskScore += 0.2;
if (amount > 5000) riskScore += 0.2;

// Deposit history factor
if (!hasDeposits) riskScore += 0.1;

// Recent win factor
if (wonRecently && accountAgeDays < 3) riskScore += 0.2;

// Cap at 1.0
riskScore = Math.min(riskScore, 1.0);
```

### Step 5: Identify Risk Factors
```javascript
const riskFactors = [];

if (accountAgeDays < 1) {
  riskFactors.push('Account less than 1 day old');
}
if (accountAgeDays < 7) {
  riskFactors.push('Account less than 7 days old');
}
if (accountAgeDays < 30 && amount > 1000) {
  riskFactors.push('Account less than 30 days old with large withdrawal');
}
if (amount > 1000) {
  riskFactors.push('Amount over $1,000');
}
if (amount > 5000) {
  riskFactors.push('Amount over $5,000');
}
if (!hasDeposits) {
  riskFactors.push('No deposit history');
}
if (!hasDeposits && amount > 500) {
  riskFactors.push('No deposits with withdrawal over $500');
}
if (wonRecently && accountAgeDays < 3) {
  riskFactors.push('Recent win followed by withdrawal (account < 3 days)');
}
```

### Step 6: Determine Flagging
```javascript
let shouldFlag = false;

// Hard flagging conditions
if (accountAgeDays < 7 && amount > 1000) shouldFlag = true;
if (accountAgeDays < 7 && amount > 500 && !hasDeposits) shouldFlag = true;
if (accountAgeDays < 1 && amount > 200) shouldFlag = true;
if (accountAgeDays < 3 && wonRecently) shouldFlag = true;
if (amount > 1000 && accountAgeDays < 30) shouldFlag = true;
if (!hasDeposits && amount > 500) shouldFlag = true;

// Risk score threshold
if (riskScore >= 0.5) shouldFlag = true;
```

## Risk Criteria

### Account Age Thresholds
| Age | Risk Multiplier | Description |
|-----|----------------|-------------|
| < 1 day | +0.2 | Very new account, highest risk |
| < 7 days | +0.3 | New account, high risk |
| < 30 days | Conditional | Risk if large amount |
| > 30 days | No penalty | Established account |

### Amount Thresholds
| Amount | Risk Multiplier | Description |
|--------|----------------|-------------|
| > $1,000 | +0.2 | Large withdrawal |
| > $5,000 | +0.2 (additional) | Very large withdrawal |
| > $500 (no deposits) | Flag | No deposit history |

### Deposit History
| Condition | Risk Impact | Description |
|-----------|------------|-------------|
| Has deposits | None | Normal user behavior |
| No deposits | +0.1 | Potential fraud pattern |
| No deposits + > $500 | Flag | High risk pattern |

### Recent Win Pattern
| Condition | Risk Impact | Description |
|-----------|------------|-------------|
| Win + withdrawal + new account (< 3 days) | +0.2 + Flag | Possible exploitation |
| Win + withdrawal + older account | None | Normal behavior |

## Flagging Conditions (Manual Review Required)

Auto-flag if **any** condition met:

1. **Account age + amount:**
   - Account < 7 days AND amount > $1,000

2. **Account age + amount + no deposits:**
   - Account < 7 days AND amount > $500 AND no deposits

3. **Very new account:**
   - Account < 1 day AND amount > $200

4. **Win and run pattern:**
   - Account < 3 days AND won recently AND withdrawal request

5. **Large amount + new account:**
   - Amount > $1,000 AND account < 30 days

6. **No deposit history:**
   - No deposits AND amount > $500

7. **High risk score:**
   - Calculated risk score ≥ 0.5

## Business Rules

### Risk Score Range
- **0.0 - 0.3**: Low risk, process automatically
- **0.3 - 0.5**: Medium risk, process automatically with monitoring
- **0.5 - 0.7**: High risk, flag for review
- **0.7 - 1.0**: Very high risk, flag for review

### Flagging Decision
- Any specific condition met → Flag
- Risk score ≥ 0.5 → Flag
- Otherwise → Process automatically

### Account Age Calculation
- Based on `created_time` field in user document
- Measured in days (fractional)
- Converted to full days for display

## Security Considerations

### False Positives
- Legitimate large deposits may trigger flags
- Established users may be flagged for large first withdrawal
- Admin review resolves false positives

### False Negatives
- Multiple small withdrawals may bypass detection
- Sophisticated fraud may evade automatic detection
- Additional monitoring and pattern analysis needed

### Data Privacy
- Risk factors don't expose sensitive user data
- Generic descriptions provided to user
- Detailed analysis available to admin only

## Performance Considerations

### Query Optimization
- Limit deposit check to 1 result (existence check)
- Recent wins limited to 7-day window
- Indexed queries on userId + type + timestamp

### Caching Opportunities
- Account age calculated once
- Deposit history could be cached in user document
- Recent win data could be cached

## Example Scenarios

### Scenario 1: New User, Large Withdrawal
```javascript
// Input
userId: 'user123'
amount: 1500
accountAgeDays: 5
hasDeposits: false

// Output
{
  riskScore: 0.8,  // 0.3 (age) + 0.2 (amount) + 0.2 (>5000) + 0.1 (no deposits)
  shouldFlag: true,  // account < 7 days AND amount > 1000
  riskFactors: [
    'Account less than 7 days old',
    'Account less than 30 days old with large withdrawal',
    'Amount over $1,000',
    'No deposit history',
    'No deposits with withdrawal over $500'
  ],
  accountAgeDays: 5,
  hasDeposits: false
}
```

### Scenario 2: Established User, Moderate Withdrawal
```javascript
// Input
userId: 'user456'
amount: 300
accountAgeDays: 45
hasDeposits: true

// Output
{
  riskScore: 0.0,  // No risk factors
  shouldFlag: false,
  riskFactors: [],
  accountAgeDays: 45,
  hasDeposits: true
}
```

### Scenario 3: New User, Small Withdrawal, No Deposits
```javascript
// Input
userId: 'user789'
amount: 400
accountAgeDays: 10
hasDeposits: false

// Output
{
  riskScore: 0.4,  // 0.3 (age < 7) + 0.1 (no deposits)
  shouldFlag: false,  // No specific condition met
  riskFactors: [
    'Account less than 7 days old',
    'No deposit history'
  ],
  accountAgeDays: 10,
  hasDeposits: false
}
```

### Scenario 4: Win and Run Pattern
```javascript
// Input
userId: 'user999'
amount: 800
accountAgeDays: 2
hasDeposits: false
wonRecently: true

// Output
{
  riskScore: 0.8,  // 0.3 + 0.2 + 0.1 + 0.2
  shouldFlag: true,  // account < 3 days AND wonRecently
  riskFactors: [
    'Account less than 1 day old',
    'Account less than 7 days old',
    'No deposit history',
    'No deposits with withdrawal over $500',
    'Recent win followed by withdrawal (account < 3 days)'
  ],
  accountAgeDays: 2,
  hasDeposits: false,
  wonRecently: true,
  recentWinAmount: 800
}
```

## Logging

### Logged Information
- User ID and amount
- Calculated risk score
- Identified risk factors
- Flagging decision
- Account age and deposit history

### Not Logged
- Full transaction history
- User personal information

## Used By
- `requestWithdrawal`: Calls this function to assess every withdrawal

## Related Functions
- `requestWithdrawal`: Primary consumer
- `processWithdrawalReview`: Uses risk data for admin review

## Related Documentation
- [Function: requestWithdrawal](./requestWithdrawal.md)
- [Function: processWithdrawalReview](./processWithdrawalReview.md)
- [Data Model: Transactions](../../data-models/transactions.md)
- [Data Model: Users](../../data-models/users.md)

## Implementation Notes

### Firestore Indexes Required
- `transactions`: userId + type + status
- `transactions`: userId + type + timestamp
- `users`: created_time

### Testing
- Test with various account ages
- Test with different amounts
- Verify deposit history detection
- Test recent win detection
- Validate risk score calculation
- Verify flagging logic for edge cases

### Future Enhancements
- Machine learning risk model
- Pattern analysis across multiple users
- Velocity checks (multiple withdrawals)
- Geographic risk factors
- Device fingerprinting integration

