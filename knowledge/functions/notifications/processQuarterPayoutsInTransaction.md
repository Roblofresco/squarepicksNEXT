# processQuarterPayoutsInTransaction

## Overview
Helper function that processes per-quarter payouts within a Firestore transaction. Pays winners immediately after each quarter ends and creates winnings notifications.

## Usage
Called from `assignWinnersForBoardPeriod` during winner assignment for Q1, Q2, Q3, and FINAL periods.

## Parameters
```typescript
{
  tx: Transaction,                    // Firestore transaction
  db: Firestore,                      // Firestore instance
  boardRef: DocumentReference,       // Board document reference
  boardData: object,                  // Board document data
  periodLabel: "q1" | "q2" | "q3" | "final",
  winnersSnap: QuerySnapshot,         // Winning squares query result
  gameId: string,                     // Game ID
  gameContext: object | null,         // Pre-read game context (team names)
  titlePrefix: string | null          // Pre-read board title prefix
}
```

## Flow

### 1. Validation
- Checks `payout` field exists and > 0
- Returns 0 if no payout configured
- Returns 0 if no winners found
- Extracts unique winner user IDs from square documents

### 2. Payout Calculation
- Divides per-quarter payout equally among winners
- Formula: `Math.round((payoutPerQuarter / winnerCount) * 100) / 100`
- Handles multiple winners sharing the same square

### 3. Transaction Creation
For each winner:
- Creates transaction document:
  - Type: `"winnings"`
  - Amount: Per-winner share
  - Status: `"completed"`
  - Description: `"{period} quarter winnings for board {boardId} (game {gameId})"`
  - Period: Uppercase period label (Q1, Q2, Q3, FINAL)
- Increments user balance atomically

### 4. Notification Creation
- **Title**: `"{titlePrefix} - {awayTeam} @ {homeTeam}"`
  - Uses pre-read game context and title prefix (avoids transaction reads)
- **Message**: `"Congratulations! You won ${amount} for pick {winningSquare} in the {period} quarter!"`
- **Tag**: `"winnings"`
- **Type**: `"winnings"`
- **Related Fields**: `relatedID` (transactionId), `boardId`, `gameId`

## Notification Structure
```typescript
{
  userID: string,
  tag: "winnings",
  title: string,              // "{titlePrefix} - {awayTeam} @ {homeTeam}"
  message: string,            // "Congratulations! You won ${amount} for pick {square} in the {period} quarter!"
  type: "winnings",
  relatedID: string,         // transactionId
  boardId: string,
  gameId: string,
  isRead: false,
  timestamp: Timestamp
}
```

## Transaction Structure
```typescript
{
  userID: string,
  userDocRef: DocumentReference,
  type: "winnings",
  amount: number,            // Per-winner share
  currency: "USD",
  status: "completed",
  timestamp: Timestamp,
  description: string,       // "{period} quarter winnings for board {boardId} (game {gameId})"
  boardId: string,
  gameId: string,
  period: "Q1" | "Q2" | "Q3" | "FINAL"
}
```

## Payout Amounts
- **Free Boards (Sweepstakes)**: $25 per quarter ($100 total ÷ 4)
- **Paid Boards**: `boardAmount × 20` per quarter (`boardAmount × 80` total ÷ 4)

## Performance Optimizations
- Pre-reads game context and title prefix before transaction
- Avoids transaction reads for game/team/sweepstakes documents
- Uses batch writes within transaction for atomicity

## Error Handling
- Returns 0 if no payout configured (doesn't throw)
- Returns 0 if no winners (doesn't throw)
- All writes are atomic within transaction (all succeed or all fail)

## Related Functions
- `assignWinnersForBoardPeriod`: Calls this function during winner assignment
- `sendNotifications`: Sends created notifications via email/SMS/push
- `formatPeriodLabel()`: Formats period labels (q1 → "first", etc.)

