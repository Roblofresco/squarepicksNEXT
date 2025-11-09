# Payout Rules Business Rules

## Overview
Payouts occur immediately upon quarter completion. All winners for a given quarter are paid simultaneously within a single atomic transaction.

## Payout Structure

### Per-Quarter Payouts
Every quarter pays out equally:
- **Q1**: 25% of pot
- **Q2**: 25% of pot
- **Q3**: 25% of pot
- **Final**: 25% of pot

### Financial Formulas

**Standard Boards** (amount > 0):
```javascript
pot = amount × 80            // Total prize pool
payout = pot ÷ 4             // Per quarter
                             // (also = amount × 20)

// Example: $5 board
pot = 5 × 80 = 400          // $400 total
payout = 400 ÷ 4 = 100      // $100 per quarter
```

**Sweepstakes Boards** (amount = 0):
```javascript
pot = 100                    // Fixed $100 total
payout = 100 ÷ 4 = 25       // $25 per quarter
```

## Payout Calculation

### Single Winner
```javascript
perWinner = payout
```

**Example**: $5 board, 1 winner for Q1
```javascript
payout = 100
winners = 1
perWinner = 100.00
// Winner receives $100.00
```

### Multiple Winners
```javascript
perWinner = Math.round((payout / winnerCount) * 100) / 100
```

**Example**: $5 board, 2 winners for Q1
```javascript
payout = 100
winners = 2
perWinner = Math.round((100 / 2) * 100) / 100
          = Math.round(50.00 * 100) / 100
          = 50.00
// Each winner receives $50.00
```

**Example**: $10 board, 3 winners for Q2
```javascript
payout = 200
winners = 3
perWinner = Math.round((200 / 3) * 100) / 100
          = Math.round(66.666... * 100) / 100
          = 66.67
// Each winner receives $66.67
// Total paid: 66.67 × 3 = 200.01 (1¢ rounding gain)
```

## Payout Timing

### Immediate Payment
Payouts processed instantly when quarter ends:
```javascript
// Q1 ends → Q1 winners paid immediately
// Q2 ends → Q2 winners paid immediately
// Q3 ends → Q3 winners paid immediately
// Final → Final winners paid immediately + board closed
```

### No Delays
- No manual approval required
- No batch processing
- No waiting period
- Funds available instantly

## Payout Process

### Transaction Creation
```javascript
async function processQuarterPayoutsInTransaction({ 
  tx, db, boardRef, boardData, periodLabel, winnersSnap, gameId 
}) {
  const payoutPerQuarter = Number(boardData.payout || 0);
  
  if (payoutPerQuarter <= 0 || winnersSnap.empty) {
    return 0;
  }
  
  // Get unique winner UIDs
  const uidSet = new Set();
  winnersSnap.forEach((docSnap) => {
    const d = docSnap.data() || {};
    if (d.userID && typeof d.userID === 'object' && d.userID.id) {
      uidSet.add(d.userID.id);
    }
  });
  
  const winnerUids = Array.from(uidSet);
  const perWinner = Math.round((payoutPerQuarter / winnerUids.length) * 100) / 100;
  
  // Pay each winner
  for (const uid of winnerUids) {
    const userRef = db.doc(`users/${uid}`);
    const txRef = db.collection('transactions').doc();
    
    // Create transaction record
    tx.set(txRef, {
      userID: uid,
      userDocRef: userRef,
      type: 'winnings',
      amount: perWinner,
      currency: 'USD',
      status: 'completed',
      timestamp: FieldValue.serverTimestamp(),
      description: `${periodLabel} quarter winnings for board ${boardRef.id}`,
      boardId: boardRef.id,
      gameId: gameId,
      period: periodLabel.toUpperCase()
    });
    
    // Increment balance
    tx.update(userRef, {
      balance: FieldValue.increment(perWinner),
      updated_time: FieldValue.serverTimestamp()
    });
    
    // Create notification
    tx.set(notifRef, {...});
  }
  
  return payoutPerQuarter;
}
```

### Atomic Execution
All payout operations within single transaction:
1. Transaction record created
2. User balance incremented
3. Notification sent
4. Board metadata updated
5. Private win record created

**If any step fails**: Entire transaction rolls back, no partial payouts.

## Revenue Model

### Board Economics

**100-square board**:
```
Total squares: 100
Entry fee per square: $5
Gross revenue: $500

Payouts:
- Q1 winners: $100
- Q2 winners: $100
- Q3 winners: $100
- Final winners: $100
Total payouts: $400

House revenue: $100 (20%)
```

**Breakdown**:
- **80 squares** cover prize pool ($400)
- **20 squares** are profit ($100)
- **Profit margin**: 20%

### Revenue by Amount
| Amount | Pot | House Revenue | Margin |
|--------|-----|---------------|--------|
| $1     | $80 | $20           | 20%    |
| $5     | $400| $100          | 20%    |
| $10    | $800| $200          | 20%    |
| $20    | $1600| $400         | 20%    |

### Sweepstakes Economics
```
Entry fee: $0
Pot: $100 (fixed)
Revenue: -$100 per board (acquisition cost)
```

**Goal**: Convert free users to paid entries.

## Balance Updates

### Increment Operation
```javascript
tx.update(userRef, {
  balance: FieldValue.increment(perWinner)
});
```

**Advantages**:
- Atomic operation
- No race conditions
- Concurrent-safe
- No need to read current balance first

### Balance Consistency
Every balance change paired with transaction record:
```javascript
// Transaction record
tx.set(txRef, {
  type: 'winnings',
  amount: perWinner,
  status: 'completed'
});

// Balance update
tx.update(userRef, {
  balance: FieldValue.increment(perWinner)
});
```

If transaction record created but balance update fails → entire transaction rolls back.

## Notification Format

### Winner Notification
```javascript
// Title
title: `$${amount} - ${awayTeamName} @ ${homeTeamName}`
// Example: "$5 - Buccaneers @ Chiefs"

// Message
message: `Congratulations! You won $${perWinner.toFixed(2)} for pick ${winningSquare} in the ${periodLabel} quarter!`
// Example: "Congratulations! You won $50.00 for pick 74 in the first quarter!"
```

### Period Labels
```javascript
const periodMap = {
  'q1': 'first',
  'q2': 'second',
  'q3': 'third',
  'final': 'final'
};
```

## Edge Cases

### No Winners
```javascript
if (winnersSnap.empty) {
  console.log(`No winners for ${periodLabel} on board ${boardRef.id}`);
  return 0;  // No payout
}

// Public summary still created with winnerCount = 0
tx.set(publicSummaryRef, {
  period: periodLabel.toUpperCase(),
  winningSquare: winningSquare,
  winnerCount: 0,
  assignedAt: FieldValue.serverTimestamp()
});
```

### Rounding Edge Cases

**3 winners, $100 payout**:
```javascript
perWinner = Math.round((100 / 3) * 100) / 100
          = 33.33
// Each gets $33.33
// Total: 33.33 × 3 = 99.99 (1¢ lost to rounding)
```

**3 winners, $200 payout**:
```javascript
perWinner = Math.round((200 / 3) * 100) / 100
          = 66.67
// Each gets $66.67
// Total: 66.67 × 3 = 200.01 (1¢ gained from rounding)
```

**Acceptable variance**: ±1¢ per payout due to rounding.

### Failed Balance Update
```javascript
// Transaction ensures atomicity
await db.runTransaction(async (tx) => {
  try {
    tx.set(txRef, {...});
    tx.update(userRef, {balance: FieldValue.increment(amount)});
  } catch (error) {
    // Entire transaction rolls back
    // No partial payout
    throw error;
  }
});
```

## Payout Verification

### Board Metadata
```javascript
{
  winners: {
    q1: {
      assigned: true,
      paid: true,
      paidAmount: 100,
      assignedAt: Timestamp
    }
  }
}
```

### Transaction Records
Query all winnings for board:
```javascript
const winningsTxs = await db.collection('transactions')
  .where('boardId', '==', boardId)
  .where('type', '==', 'winnings')
  .get();

let totalPaid = 0;
winningsTxs.forEach(doc => {
  totalPaid += doc.data().amount;
});

console.log(`Total paid: $${totalPaid.toFixed(2)}`);
// Expected: board.pot value ($400 for $5 board)
```

### User Win Records
```javascript
const winRecords = await db.collection(`users/${userId}/wins`)
  .where('boardId', '==', boardId)
  .get();

console.log(`User won ${winRecords.size} periods on this board`);
```

## Admin Tools

### Manual Payout (Emergency)
```javascript
async function manualPayout(userId, amount, boardId, period) {
  await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${userId}`);
    const txRef = db.collection('transactions').doc();
    
    tx.set(txRef, {
      userID: userId,
      type: 'winnings',
      amount: amount,
      currency: 'USD',
      status: 'completed',
      boardId: boardId,
      period: period,
      description: `Manual payout for ${period}`,
      timestamp: FieldValue.serverTimestamp()
    });
    
    tx.update(userRef, {
      balance: FieldValue.increment(amount)
    });
  });
}
```

### Refund Payout (If Error)
```javascript
async function refundPayout(transactionId) {
  const txSnap = await db.doc(`transactions/${transactionId}`).get();
  const txData = txSnap.data();
  
  if (txData.type !== 'winnings') {
    throw new Error('Not a winnings transaction');
  }
  
  await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${txData.userID}`);
    const refundTxRef = db.collection('transactions').doc();
    
    // Reverse balance
    tx.update(userRef, {
      balance: FieldValue.increment(-txData.amount)
    });
    
    // Create refund record
    tx.set(refundTxRef, {
      userID: txData.userID,
      type: 'refund',
      amount: -txData.amount,
      status: 'completed',
      description: `Refund of winnings ${transactionId}`,
      relatedID: transactionId,
      timestamp: FieldValue.serverTimestamp()
    });
  });
}
```

### Verify Total Payouts
```javascript
async function verifyBoardPayouts(boardId) {
  const boardSnap = await db.doc(`boards/${boardId}`).get();
  const boardData = boardSnap.data();
  
  const expected = boardData.pot || 0;
  
  const winningsTxs = await db.collection('transactions')
    .where('boardId', '==', boardId)
    .where('type', '==', 'winnings')
    .get();
  
  let actual = 0;
  winningsTxs.forEach(doc => {
    actual += doc.data().amount;
  });
  
  const difference = actual - expected;
  
  console.log(`Board ${boardId}:`);
  console.log(`Expected payouts: $${expected.toFixed(2)}`);
  console.log(`Actual payouts: $${actual.toFixed(2)}`);
  console.log(`Difference: $${difference.toFixed(2)}`);
  
  if (Math.abs(difference) > 0.04) {  // Allow 4¢ variance (4 quarters × 1¢ rounding)
    console.warn(`⚠️  Payout mismatch exceeds tolerance!`);
  } else {
    console.log(`✅ Payouts verified (within rounding tolerance)`);
  }
}
```

## Performance Considerations

### Parallel Payouts
Winners paid in parallel within transaction:
```javascript
for (const uid of winnerUids) {
  // All writes batched together
  tx.set(txRef, {...});
  tx.update(userRef, {...});
  tx.set(notifRef, {...});
}
// Single commit for all winners
```

### Transaction Limits
- Max 500 operations per transaction
- Max 200 winners per board per quarter (query limit)
- If exceeded, batch into multiple transactions

### Database Writes
Per winner:
- 1 transaction record
- 1 balance update
- 1 notification
- 1 win record
**Total**: 4 writes per winner

Example: 10 winners = 40 writes in single transaction

## Testing

### Test Payout Calculation
```javascript
const testCases = [
  { payout: 100, winners: 1, expected: 100.00 },
  { payout: 100, winners: 2, expected: 50.00 },
  { payout: 100, winners: 3, expected: 33.33 },
  { payout: 200, winners: 3, expected: 66.67 },
  { payout: 25, winners: 4, expected: 6.25 }
];

testCases.forEach(test => {
  const result = Math.round((test.payout / test.winners) * 100) / 100;
  console.assert(
    result === test.expected,
    `FAILED: ${test.payout} ÷ ${test.winners} should be ${test.expected}, got ${result}`
  );
});
```

### Verify Winner Payout
```javascript
// After Q1 winner assignment
const txSnap = await db.collection('transactions')
  .where('boardId', '==', boardId)
  .where('period', '==', 'Q1')
  .where('type', '==', 'winnings')
  .get();

console.log(`Q1 winners paid: ${txSnap.size}`);
txSnap.forEach(doc => {
  const tx = doc.data();
  console.log(`- User ${tx.userID}: $${tx.amount.toFixed(2)}`);
});
```

