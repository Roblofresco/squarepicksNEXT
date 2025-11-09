# Business Rules

Core business logic governing game lifecycle, board management, winner calculation, payouts, entries, and withdrawals.

## Documents

1. **[Game Lifecycle](./game-lifecycle.md)** - Game state transitions from ingestion to completion
2. **[Board Lifecycle](./board-lifecycle.md)** - Board states from creation to closure
3. **[Winner Calculation](./winner-calculation.md)** - Algorithm for determining winners from scores
4. **[Payout Rules](./payout-rules.md)** - Winner compensation and financial distribution
5. **[Entry Fees](./entry-fees.md)** - Entry pricing, validation, and transaction processing
6. **[Sweepstakes](./sweepstakes.md)** - Free board promotions and acquisition strategy
7. **[Withdrawals](./withdrawals.md)** - Cash-out process, risk assessment, and fraud prevention

## Key Principles

### Atomicity
All financial operations execute within Firestore transactions:
- Balance changes paired with transaction records
- Entry creates squares + deducts balance + notifies (single transaction)
- Payout creates transaction + increments balance + notifies (single transaction)
- Failures roll back entire operation (no partial state)

### Immediacy
- Payouts process instantly upon quarter completion
- No batch processing delays
- No manual approval for standard payouts
- Funds available immediately after win

### Idempotency
- Winner assignment safe to retry
- Duplicate prevention via checks
- Deterministic IDs for deposits
- State flags prevent re-execution

### Transparency
- All calculations documented
- Audit trail maintained
- Public winner summaries
- Private win records

## Financial Model

### Board Economics (100 squares)
```
Entry: $5 per square
Revenue: $500 gross

Payouts:
Q1: $100
Q2: $100
Q3: $100
Final: $100
Total: $400

Profit: $100 (20%)
```

### Key Ratios
- **80 squares** cover prize pool
- **20 squares** are profit
- **20% margin** on all boards

### Sweepstakes
- **Cost**: $100 per board
- **Revenue**: -$100 (acquisition)
- **Goal**: 10%+ conversion to paid

## Critical Rules

### Entry Validation
✅ Board status = 'open'
✅ Squares not already taken
✅ Sufficient wallet balance
✅ Free boards: 1 square per user

### Winner Assignment
✅ Use actual game scores (not board data)
✅ Process immediately when quarter ends
✅ Pay all winners equally (split if multiple)
✅ Close board only after final period

### Withdrawal Limits
✅ Min: $5, Max: $10,000 per request
✅ Max 3 per 24 hours
✅ Max $25K per 24 hours
✅ Max $50K per 7 days

### Risk Thresholds
🚩 New account (< 7 days) + large amount (> $1K)
🚩 No deposits + withdrawal > $500
🚩 Recent win + immediate withdrawal (< 3 days old account)

## State Machines

### Game States
```
scheduled → isLive → isOver
```

### Board States
```
open → full → active → closed
```

### Withdrawal States
```
processing → completed/failed
pending_review → processing → completed/failed/rejected
```

## Implementation Notes

### Use FieldValue.increment()
```javascript
// ✅ Correct (atomic, race-safe)
tx.update(userRef, { balance: FieldValue.increment(50) });

// ❌ Wrong (race condition)
const balance = userSnap.data().balance;
tx.update(userRef, { balance: balance + 50 });
```

### Quarter Score Sources
```javascript
// ✅ Correct for final
homeScore = game.homeScore  // Includes OT

// ❌ Wrong for final
homeScore = game.homeFscore  // Regulation only
```

### Transaction Reads Before Writes
```javascript
await db.runTransaction(async (tx) => {
  // ✅ All reads first
  const boardSnap = await tx.get(boardRef);
  const winnersSnap = await tx.get(winnersQuery);
  
  // Then all writes
  tx.set(publicSummaryRef, {...});
  tx.update(boardRef, {...});
});
```

## Testing Procedures

### Verify Payouts
```bash
node verify-board-payouts.js <boardId>
```

### Manual Winner Assignment
```bash
node manually-assign-q1-winner.js <boardId>
```

### Test Entry Flow
```bash
node test-fill-board-process5.js
```

### Check Rate Limits
```bash
node check-user-withdrawal-limits.js <userId>
```

