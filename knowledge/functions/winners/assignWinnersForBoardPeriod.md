# assignWinnersForBoardPeriod

## Overview
Core function that assigns winners for a specific period (q1/q2/q3/final) on a single board. All operations are atomic within a single Firestore transaction: winner identification, payout processing, board updates, and notifications.

## Function Type
Internal Helper Function (called by `onGameUpdatedAssignWinners` and `reconcileGameWinners`)

## Parameters

```typescript
{
  db: Firestore;                      // Firestore database instance
  boardSnap: DocumentSnapshot;        // Board document snapshot
  gameId: string;                     // Game document ID
  periodLabel: string;                // Period: "q1", "q2", "q3", or "final"
  homeScore: number;                  // Home team score for period
  awayScore: number;                  // Away team score for period
}
```

## Winner Calculation Math

### Step 1: Extract Last Digits

```javascript
const homeLast = String(Number(homeScore || 0) % 10);
const awayLast = String(Number(awayScore || 0) % 10);
```

- Uses modulo 10 to get last digit
- Handles 0 scores correctly
- Converts to string for coordinate construction

### Step 2: Calculate Winning Square

```javascript
const winningSquare = `${awayLast}${homeLast}`;
```

**Business Rule**: Square coordinate format is `{awayDigit}{homeDigit}` (away digit first, then home digit)

**Example**: Home score 24, Away score 17 → `"74"` (7 from away, 4 from home)

### Step 3: Query Winning Squares

```javascript
squares
  .where("boardId", "==", boardRef.id)
  .where("square", "==", winningSquare)
  .limit(200)
```

- Queries top-level `squares` collection
- Finds all squares with matching coordinate
- Limit 200 for safety (prevents excessive results)

## Transaction Flow

### Phase 1: Transaction Reads (All Reads Before Writes)

1. **Re-read Board Document**
   - Gets fresh board data within transaction
   - Checks if winners already assigned (idempotency check)

2. **Query Winners**
   - Executes winners query within transaction
   - Gets all square documents with winning coordinate
   - Counts winner documents

3. **Pre-read Game Context**
   - Fetches game document
   - Fetches home and away team documents
   - Extracts team names for notifications

4. **Pre-read Sweepstakes** (if free board)
   - Fetches sweepstakes document if `boardData.amount === 0`
   - Extracts title for notification prefix

### Phase 2: Validation Checks

```javascript
if (winnersMeta.assigned === true) {
  return;  // Already assigned, skip (idempotent)
}
```

- Checks if winners already assigned for this period
- Prevents duplicate processing
- Returns early if already processed

### Phase 3: Transaction Writes (All Writes Atomic)

1. **Create Public Winner Summary**

```javascript
boards/{boardId}/winners/{periodLabel}
{
  period: "Q1",  // Uppercase
  winningIndex: number,  // First winner's square index
  winningSquare: "47",
  winnerCount: number,
  assignedAt: Timestamp
}
```

2. **Process Payouts**

```javascript
const totalPaid = await processQuarterPayoutsInTransaction({
  tx, db, boardRef, boardData, periodLabel,
  winnersSnap, gameId, gameContext, titlePrefix
});
```

- Calls payout processing function
- Creates transaction records
- Updates user balances
- Sends notifications

3. **Update Board Metadata**

```javascript
board.winners.{periodLabel} = {
  assigned: true,
  winningIndex: firstWinnerIndex,
  assignedAt: Timestamp,
  paid: true,
  paidAmount: totalPaid
}
```

- Marks period as assigned
- Records payout information
- Updates timestamp

4. **Close Board** (Final Period Only)

```javascript
if (periodLabel === 'final') {
  board.status = 'closed';
  board.settled_at = Timestamp;
}
```

- Only final period closes board
- Other periods keep board active

5. **Create Private Win Records**

```javascript
users/{uid}/wins/{boardId}_{periodLabel}
{
  boardId: string,
  gameId: string,
  period: "Q1",
  winningIndex: number,
  winningSquare: "47",
  squareID: string,  // Square document ID
  assignedAt: Timestamp
}
```

- One record per winner per period
- Stored in user's private wins subcollection
- Used for user history/statistics

## Period-Specific Logic

### Q1, Q2, Q3 (Quarter Periods)
- Uses quarter-specific scores: `homeQ1score`, `awayQ1score`, etc.
- Board remains `active` after assignment
- Payout processed immediately

### Final Period
- Uses final game scores: `homeScore`, `awayScore`
- Board status changes to `closed`
- `settled_at` timestamp set
- Payout processed immediately

## Idempotency

Function is idempotent:
- Checks `winners.{periodLabel}.assigned` before processing
- Returns early if already assigned
- Safe to call multiple times

## Error Handling

- Returns early if scores undefined
- Returns early if board doesn't exist
- Transaction failures roll back all changes
- Errors logged but don't stop other board processing

## Related Functions
- `onGameUpdatedAssignWinners`: Triggers this function on game updates
- `processQuarterPayoutsInTransaction`: Processes payouts within transaction
- `reconcileGameWinners`: Manual reconciliation calls this function

## Implementation Notes

### Transaction Requirements
- All reads must occur before any writes
- Game/team context pre-read to avoid transaction conflicts
- Winner query executed within transaction for consistency

### Winner Query Limit
- Limited to 200 results for safety
- Prevents excessive transaction size
- Unlikely to exceed in practice (100 squares max per board)

### Winning Square Calculation
- Calculated directly from scores (not from board mappings)
- Independent of board number assignment
- Same calculation for all boards on same game

### Board Status Transitions

```
active → active  (Q1, Q2, Q3)
active → closed  (Final)
```

### Payout Timing
- All periods pay immediately upon assignment
- No delayed payouts
- Final period pays same as quarters

## Example Flow

### Input
```javascript
boardSnap = board document
gameId = "401772826"
periodLabel = "q1"
homeScore = 7
awayScore = 3
```

### Processing
1. Calculate: `winningSquare = "37"` (3 from away, 7 from home)
2. Query: Find all squares with `square == "37"`
3. Transaction:
   - Create winner summary document
   - Process payouts (if winners found)
   - Update board metadata
   - Create win records
4. Result: Winners assigned and paid

### Board Update
```javascript
board.winners.q1 = {
  assigned: true,
  winningIndex: 23,
  assignedAt: Timestamp,
  paid: true,
  paidAmount: 100
}
```

