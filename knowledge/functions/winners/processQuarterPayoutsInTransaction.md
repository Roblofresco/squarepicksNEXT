# processQuarterPayoutsInTransaction

## Overview
Internal helper function that processes per-quarter payouts to winners within a Firestore transaction. Pays winners immediately after each quarter ends and creates transaction records and notifications.

## Function Type
Internal Helper Function (called within `assignWinnersForBoardPeriod` transaction)

## Parameters

```typescript
{
  tx: Transaction;                    // Firestore transaction object
  db: Firestore;                      // Firestore database instance
  boardRef: DocumentReference;        // Board document reference
  boardData: BoardData;               // Board document data
  periodLabel: string;                // Period: "q1", "q2", "q3", or "final"
  winnersSnap: QuerySnapshot;         // Query snapshot of winning squares
  gameId: string;                     // Game document ID
  gameContext?: GameContext;          // Pre-read game context (team names)
  titlePrefix?: string;               // Pre-read title prefix (board amount or sweepstakes title)
}
```

## Payout Transaction Flow

### 1. Validate Payout Configuration

```javascript
const payoutPerQuarter = Number(boardData.payout || 0);

if (payoutPerQuarter <= 0) {
  return 0;  // No payout configured
}
```

- Checks board has payout amount configured
- Returns 0 if no payout (free boards may have $0 payout)

### 2. Extract Unique Winner UIDs

```javascript
const uidSet = new Set();
winnersSnap.forEach((docSnap) => {
  const d = docSnap.data() || {};
  if (d.userID && typeof d.userID === 'object' && d.userID.id) {
    uidSet.add(d.userID.id);
  }
  if (typeof d.userID === 'string') {
    uidSet.add(d.userID);
  }
});
const winnerUids = Array.from(uidSet);
```

- Handles both DocumentReference and string userID formats
- Uses Set to ensure unique winners
- Multiple squares per user count as one winner

### 3. Calculate Per-Winner Amount

```javascript
const perWinner = Math.round((payoutPerQuarter / winnerUids.length) * 100) / 100;
```

**Formula**: `payoutPerQuarter ÷ winnerCount` (rounded to 2 decimals)

- Divides total payout equally among winners
- Rounds to nearest cent
- Example: $100 payout ÷ 3 winners = $33.33 each

### 4. Process Each Winner (Within Transaction)

For each winner UID:

#### a. Create Transaction Record

```javascript
tx.set(txRef, {
  userID: uid,
  userDocRef: userRef,
  type: 'winnings',
  amount: perWinner,
  currency: 'USD',
  status: 'completed',
  timestamp: FieldValue.serverTimestamp(),
  description: `${formatPeriodLabel(periodLabel)} quarter winnings for board ${boardRef.id}`,
  boardId: boardRef.id,
  gameId: gameId,
  period: periodLabel.toUpperCase()
});
```

#### b. Increment User Balance

```javascript
tx.update(userRef, {
  balance: FieldValue.increment(perWinner),
  updated_time: FieldValue.serverTimestamp()
});
```

- Atomic balance update within transaction
- Uses `FieldValue.increment()` for thread-safe updates

#### c. Create Notification

```javascript
const message = `Congratulations! You won $${perWinner.toFixed(2)} for pick ${winningSquare} in the ${formatPeriodLabel(periodLabel)} quarter!`;

tx.set(notifRef, {
  userID: uid,
  tag: "winnings",
  title: `${titlePrefix} - ${awayTeam} @ ${homeTeam}`,
  message: message,
  type: 'winnings',
  relatedID: txRef.id,
  boardId: boardRef.id,
  gameId: gameId,
  isRead: false,
  timestamp: FieldValue.serverTimestamp()
});
```

## Return Value

```typescript
number  // Total amount paid out (payoutPerQuarter)
```

Returns the total payout amount (same for all winners combined).

## Payout Rules

### Equal Distribution
- All winners receive equal share
- Payout split: `totalPayout ÷ winnerCount`
- Rounded to 2 decimal places

### Multiple Squares Per User
- User with multiple winning squares counts as one winner
- Receives one payout (not multiplied by square count)

### Zero Winners
- Returns 0 if no winners found
- No transactions or notifications created

## Transaction Atomicity

All operations within single Firestore transaction:
- ✅ Transaction records created
- ✅ User balances updated
- ✅ Notifications created

If any operation fails, entire transaction rolls back.

## Error Handling

- Returns 0 if no payout configured (not an error)
- Returns 0 if no winners found (not an error)
- Transaction failures propagate to caller (transaction rollback)

## Related Functions
- `assignWinnersForBoardPeriod`: Calls this function within transaction
- `onGameUpdatedAssignWinners`: Triggers winner assignment

## Implementation Notes

### Pre-read Context
- `gameContext` and `titlePrefix` pre-read in parent transaction
- Avoids additional transaction reads
- Ensures consistent notification formatting

### Winning Square
- Extracted from first winner's square document
- Used in notification message
- Format: "47" (away digit + home digit)

### Period Label Formatting
- Uses `formatPeriodLabel()` helper
- Converts "q1" → "first", "q2" → "second", etc.
- Used in transaction description and notification message

### Notification Title
- Format: `{titlePrefix} - {awayTeam} @ {homeTeam}`
- Title prefix: Sweepstakes title (free) or `$amount` (paid)
- Team names from pre-read game context

## Example Flow

### Input
```javascript
payoutPerQuarter = 100;
winnersSnap.size = 3;  // 3 winners
winningSquare = "47";
periodLabel = "q1";
```

### Processing
1. Extract 3 unique winner UIDs
2. Calculate: `perWinner = 100 / 3 = 33.33`
3. For each winner:
   - Create transaction: $33.33 winnings
   - Increment balance: +$33.33
   - Send notification: "Congratulations! You won $33.33 for pick 47 in the first quarter!"

### Return
```javascript
100  // Total paid out
```

