# Boards Collection

## Overview
Represents 100-square boards for a specific game and entry amount. Each board can have multiple winners across 4 quarters.

## Collection Path
`boards/{boardId}`

## Document Structure

### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gameID` | DocumentReference | Yes | Reference to game document |
| `amount` | number | Yes | Entry fee per square in USD (0 for sweepstakes) |
| `currency` | string | Yes | Currency code (always "USD") |
| `status` | string | Yes | Board status (open, full, active, closed) |

### Square Assignments
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `home_numbers` | array[string] | Conditional | Home axis numbers 0-9 (assigned when full) |
| `away_numbers` | array[string] | Conditional | Away axis numbers 0-9 (assigned when full) |
| `selected_indexes` | array[number] | Yes | Array of selected square indexes (0-99) |

### Financial
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pot` | number | Yes | Total prize pool for all 4 quarters |
| `payout` | number | Yes | Payout per quarter (pot ÷ 4) |

### Sweepstakes
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sweepstakesID` | DocumentReference | Conditional | Reference to sweepstakes (only if amount = 0) |

### Winners Metadata
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `winners` | map | No | Map of period labels to winner metadata |
| `winners.q1` | map | No | Q1 winner metadata |
| `winners.q1.assigned` | boolean | No | True if Q1 winner assigned |
| `winners.q1.winningIndex` | number | No | Winning square index |
| `winners.q1.assignedAt` | Timestamp | No | Assignment timestamp |
| `winners.q1.paid` | boolean | No | True if winners paid |
| `winners.q1.paidAmount` | number | No | Total amount paid |
| `winners.q2` | map | No | Q2 winner metadata (same structure) |
| `winners.q3` | map | No | Q3 winner metadata (same structure) |
| `winners.final` | map | No | Final winner metadata (same structure) |

### Timestamps
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `created_time` | Timestamp | Yes | Board creation timestamp |
| `updated_time` | Timestamp | Yes | Last update timestamp |
| `settled_at` | Timestamp | No | Final settlement timestamp (status = closed) |
| `computed_at` | Timestamp | No | Financial calculations timestamp |

## Subcollections

### winners
Path: `boards/{boardId}/winners/{period}`

Public winner summary documents for each period (q1, q2, q3, final).

**Document ID**: Period label ('q1', 'q2', 'q3', 'final')

**Fields**:
- `period` (string): Period identifier (Q1, Q2, Q3, FINAL)
- `winningIndex` (number): Winning square index (0-99)
- `winningSquare` (string): Winning square coordinates (e.g., "47")
- `winnerCount` (number): Number of winners for this period
- `assignedAt` (Timestamp): Winner assignment timestamp

## Status Lifecycle

### Status Values
```
open → full → active → closed
```

| Status | Description | Trigger |
|--------|-------------|---------|
| `open` | Accepting entries | Initial state |
| `full` | All 100 squares selected, numbers assigned | 100th square selected |
| `active` | Game is live | Game isLive = true |
| `closed` | Game complete, all winners paid | Final period winners assigned |

### Transition Rules
- **open → full**: Triggered by `handleBoardFull` function when `selected_indexes.length = 100`
- **full → active**: Triggered by `onGameStatusChanged` when game.isLive = true
- **active → closed**: Triggered by `assignWinnersForBoardPeriod` for final period

## Square Numbering System

### Index to Coordinates
Each square has an index (0-99) that maps to coordinates once numbers are assigned:
```
index = 0: away_numbers[0] + home_numbers[0]
index = 1: away_numbers[0] + home_numbers[1]
index = 10: away_numbers[1] + home_numbers[0]
...
index = 99: away_numbers[9] + home_numbers[9]

Formula: 
  homeIdx = index % 10
  awayIdx = Math.floor(index / 10)
  square = away_numbers[awayIdx] + home_numbers[homeIdx]
```

### Example
```javascript
home_numbers = ["5", "3", "8", "1", "0", "9", "2", "7", "4", "6"]
away_numbers = ["4", "7", "2", "9", "0", "3", "1", "8", "6", "5"]

// Square at index 23:
homeIdx = 23 % 10 = 3
awayIdx = Math.floor(23 / 10) = 2
square = "2" + "1" = "21"
```

### Number Assignment
- Numbers assigned randomly when board becomes full
- Each axis gets shuffled digits 0-9 (all 10 digits, no repeats)
- Assignment triggers update of all square documents with their coordinates

## Financial Calculations

### Standard Boards (amount > 0)
```javascript
// Entry fee per square
amount: 5  // dollars

// Total pot (80 squares break even, 20 squares = house share)
pot = amount × 80  // $400 for $5 board

// Payout per quarter (pot divided equally)
payout = pot ÷ 4  // $100 per quarter for $5 board

// House Revenue (20% of squares)
revenue = amount × 20  // $100 for $5 board
```

### Sweepstakes Boards (amount = 0)
```javascript
// Free entry
amount: 0

// Fixed pot
pot: 100  // $100 total

// Payout per quarter
payout: 25  // $25 per quarter
```

## Winner Assignment

### Assignment Process
Executed atomically within Firestore transaction:

1. **Calculate winning square** from game scores
2. **Query winning square documents** for this board
3. **Create public summary** in winners subcollection
4. **Update board metadata** with winner flags
5. **Process payouts** for all winners
6. **Create transaction records** for each winner
7. **Update user balances** (atomic increment)
8. **Send notifications** to winners
9. **Create private win records** in users/{uid}/wins

### Payout Rules
- **Q1, Q2, Q3**: Immediate payout when quarter ends
- **Final**: Immediate payout + board closure
- **Multiple winners**: Payout split equally among winners
- **Rounding**: Amounts rounded to 2 decimal places

### Example Payout
```javascript
// Board: $5, Q1 winner
payout = 100  // $25 per quarter
winners = 2   // Two users have winning square
perWinner = Math.round((100 / 2) * 100) / 100  // $50.00 each

// Transaction created for each winner:
{
  type: 'winnings',
  amount: 50.00,
  period: 'Q1',
  boardId: 'abc123'
}

// User balance incremented:
balance: FieldValue.increment(50.00)
```

## Auto-Board Creation

### Standard Amounts
When a game status becomes 'scheduled', boards are auto-created for:
- $1 per square
- $5 per square
- $10 per square
- $20 per square

### Implementation
```javascript
exports.ensureGameBoards = onDocumentWritten({
  document: "games/{gameId}"
}, async (event) => {
  // Only creates if status = 'scheduled'
  // Checks if board already exists for each amount
  // Creates missing boards
});
```

## Board Rollover

When a board fills (becomes 'full'), a new 'open' board is automatically created for the same game and amount, **unless** the game is already live.

### Rollover Rules
```javascript
if (boardStatus === 'full' && game.isLive === false) {
  // Create new open board with same game and amount
  createNewBoard({
    gameID: board.gameID,
    amount: board.amount,
    status: 'open',
    selected_indexes: []
  });
}
```

### Sweepstakes Rollover
For sweepstakes boards (amount = 0):
- New board links to same active sweepstakes
- Sweepstakes `boardIDs` array updated with new board reference

## Indexes Required
- `gameID` + `amount` (composite) - Find boards for game
- `gameID` + `status` (composite) - Find open boards
- `status` + `amount` (composite) - Lobby filtering
- `sweepstakesID` (ascending) - Sweepstakes board queries

## Related Collections
- **games**: Game this board belongs to
- **squares**: Individual square selections on this board
- **users**: Players who have entered this board (via squares)
- **transactions**: Financial transactions related to this board
- **sweepstakes**: Optional sweepstakes promotion (if amount = 0)

## Business Rules

### Entry Rules
- Users can select multiple squares on same board
- Same square cannot be selected by multiple users
- Entries require sufficient balance (amount × squares)
- Free boards (sweepstakes) limited to 1 square per user

### Number Assignment Rules
- Numbers only assigned when board reaches 100 selected squares
- Numbers never change once assigned
- Status changes from 'open' to 'full' when numbers assigned

### Winner Assignment Rules
- Winners assigned automatically when game quarter ends
- Assignment is idempotent (safe to retry)
- Multiple users can win same period if they share winning square
- Payouts processed immediately upon winner assignment

### Board Closure
- Only final period winner assignment closes board
- Closed boards cannot be reopened
- `settled_at` timestamp recorded at closure

## Implementation Notes

### Transaction Safety
Winner assignment uses Firestore transactions to ensure atomicity:
```javascript
await db.runTransaction(async (tx) => {
  // ALL reads first
  const freshBoard = await tx.get(boardRef);
  const winnersSnap = await tx.get(winnersQuery);
  const gameSnap = await tx.get(gameRef);
  
  // THEN all writes
  tx.set(publicSummaryRef, {...});
  tx.update(boardRef, {...});
  tx.set(txRef, {...});
  tx.update(userRef, {...});
  tx.set(notifRef, {...});
});
```

### Notification Context
Winner notifications include team names and game context:
```javascript
// Title format: "$5 - Buccaneers @ Chiefs"
const title = `$${amount} - ${awayTeamName} @ ${homeTeamName}`;

// Message format: "Congratulations! You won $50.00 for pick 47 in the first quarter!"
const message = `Congratulations! You won $${amount.toFixed(2)} for pick ${winningSquare} in the ${periodLabel} quarter!`;
```

### Idempotency
All winner assignment operations check if already completed:
```javascript
if (boardData.winners?.[periodLabel]?.assigned === true) {
  return; // Already assigned, skip
}
```

## Error Handling

### Race Conditions
- Balance checks repeated inside transactions
- selected_indexes validated atomically
- Winner assignment uses optimistic locking

### Incomplete Data
- Boards require valid gameID reference
- Financial fields calculated on creation
- Missing numbers prevented by status checks

### Failed Payouts
- If payout fails, transaction rolled back
- User balance not modified on failure
- Error logged for admin review

