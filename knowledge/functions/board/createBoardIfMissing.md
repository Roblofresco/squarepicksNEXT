# createBoardIfMissing

## Overview
Callable Cloud Function that creates a board for a specific game and amount if one doesn't already exist. Idempotent operation safe to call multiple times.

## Function Type
`onCall` (Callable Cloud Function)

## Region
`us-east1`

## Authentication
Required - User must be authenticated via Firebase Auth

## Input Parameters

```typescript
{
  gameId: string;   // Required: Game document ID
  amount: number;   // Required: Board amount (must be 0, 1, 5, 10, or 20)
}
```

## Validation

### Game ID
- Must be provided and non-empty string
- Game document must exist
- Throws `not-found` if game doesn't exist

### Amount
- Must be one of: `0, 1, 5, 10, 20`
- Throws `invalid-argument` if invalid amount

## Function Logic

### 1. Check Existing Board

```javascript
boards
  .where("gameID", "==", gameRef)
  .where("amount", "==", numAmount)
  .where("status", "==", "open")
  .limit(1)
```

**Note**: Only checks for `"open"` boards. Closed/full boards don't prevent creation.

### 2. Return Existing Board (If Found)

```typescript
{
  created: false,
  boardId: string  // Existing board ID
}
```

### 3. Create New Board (If Missing)

```javascript
{
  gameID: DocumentReference("games/{gameId}"),
  amount: number,
  status: "open",
  selected_indexes: [],
  created_time: Timestamp,
  updated_time: Timestamp,
  sweepstakesID?: DocumentReference  // Only if amount = 0
}
```

### 4. Sweepstakes Association (Free Boards Only)

If `amount === 0`:
- Queries for active sweepstakes: `sweepstakes.where("status", "==", "active")`
- Associates board with first active sweepstakes found
- Sets `sweepstakesID` as DocumentReference

**Note**: If no active sweepstakes found, board created without association.

## Return Value

### Board Created
```typescript
{
  created: true,
  boardId: string  // New board document ID
}
```

### Board Already Exists
```typescript
{
  created: false,
  boardId: string  // Existing board document ID
}
```

## Error Handling

- `unauthenticated`: User not authenticated
- `invalid-argument`: Missing gameId or invalid amount
- `not-found`: Game document doesn't exist
- `internal`: Unexpected error during creation

## Use Cases

- **Manual Board Creation**: Admin or user creates board for specific game/amount
- **On-Demand Creation**: Frontend creates board when user wants to enter
- **Sweepstakes Boards**: Create free boards for sweepstakes promotions

## Related Functions
- `ensureGameBoards`: Auto-creates standard boards when game scheduled
- `handleBoardFull`: Processes boards when they fill

## Implementation Notes

### Idempotency
- Safe to call multiple times with same parameters
- Returns existing board if already created
- No duplicate boards created

### Board Status
- All created boards start as `"open"`
- Ready to accept entries immediately

### Sweepstakes Handling
- Free boards (amount = 0) attempt sweepstakes association
- Paid boards (amount > 0) never have sweepstakesID
- Sweepstakes lookup is best-effort (errors don't fail creation)

### Pot/Payout Not Set
- Unlike `ensureGameBoards`, this function doesn't set `pot` or `payout`
- These fields set later by `handleBoardFull` or manual updates

## Differences from ensureGameBoards

| Feature | createBoardIfMissing | ensureGameBoards |
|---------|---------------------|------------------|
| Trigger | Manual (callable) | Automatic (trigger) |
| Amounts | Any (0,1,5,10,20) | Fixed (1,5,10,20) |
| Pot/Payout | Not set | Auto-calculated |
| Sweepstakes | Attempts association | Never associates |
| Use Case | On-demand | Auto-setup |

## Example Usage

```javascript
// Create $10 board
const result = await createBoardIfMissing({
  gameId: "401772826",
  amount: 10
});

if (result.created) {
  console.log(`Created board ${result.boardId}`);
} else {
  console.log(`Board ${result.boardId} already exists`);
}

// Create free sweepstakes board
const freeResult = await createBoardIfMissing({
  gameId: "401772826",
  amount: 0
});
```

