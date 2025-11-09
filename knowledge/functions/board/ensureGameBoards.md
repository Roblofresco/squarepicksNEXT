# ensureGameBoards

## Overview
Firestore trigger function that automatically creates standard boards for games when they are created or updated to "scheduled" status.

## Function Type
`onDocumentWritten` (Firestore Trigger)

## Trigger Path
`games/{gameId}`

## Region
`us-east1`

## Trigger Conditions

The function processes a game document when:

1. **New Game Created**: Game document created with `status === "scheduled"`
2. **Status Changed**: Game status changes TO `"scheduled"` (from any other status)

**Note**: Function exits early if:
- Game document deleted (`after.exists === false`)
- Status is not "scheduled"
- Status unchanged (was already "scheduled")

## Standard Board Amounts

```javascript
const AUTO_CREATE_BOARD_AMOUNTS = [1, 5, 10, 20];
```

The function creates boards for these amounts if they don't already exist.

## Processing Logic

### For Each Standard Amount

1. **Check Existing Board**
   ```javascript
   boards
     .where("gameID", "==", gameRef)
     .where("amount", "==", amount)
     .limit(1)
   ```

2. **Create Board If Missing**
   - Only creates if no existing board found
   - Idempotent: won't create duplicates

### Board Document Structure

```javascript
{
  gameID: DocumentReference("games/{gameId}"),
  amount: number,                    // 1, 5, 10, or 20
  status: "open",
  selected_indexes: [],
  pot: amount * 80,                  // Total pot: amount × 80 squares
  payout: amount * 20,              // Per-quarter payout: amount × 20
  currency: "USD",
  created_time: Timestamp,
  updated_time: Timestamp
}
```

**Note**: `sweepstakesID` is intentionally NOT set for auto-created paid boards.

## Pot and Payout Calculations

### Paid Boards
- **Pot**: `amount × 80` (assumes 80 paid squares, 20 house share)
- **Payout**: `amount × 20` (per-quarter payout)

### Example Calculations

| Amount | Pot    | Payout per Quarter |
|--------|--------|-------------------|
| $1     | $80    | $20               |
| $5     | $400   | $100              |
| $10    | $800   | $200              |
| $20    | $1,600 | $400              |

## Error Handling

- Errors for individual amounts are logged but don't stop processing
- Function continues to next amount even if one fails
- Returns `null` on completion (standard for trigger functions)

## Use Cases

- **Game Ingestion**: When games are imported from ESPN API
- **Manual Game Creation**: When admins create games manually
- **Status Updates**: When game status changes to "scheduled"

## Related Functions
- `createBoardIfMissing`: Manual/idempotent board creation
- `handleBoardFull`: Processes boards when they fill

## Implementation Notes

### Idempotency
- Checks for existing boards before creating
- Safe to run multiple times
- Won't create duplicate boards for same game/amount

### Board Status
- All created boards start as `"open"`
- Ready to accept square selections immediately

### Game Reference
- Uses DocumentReference to game (not string ID)
- Enables efficient queries for game's boards

### Sweepstakes Exclusion
- Auto-created boards are paid boards only
- Free boards (amount = 0) not auto-created
- Free boards created manually or via `createBoardIfMissing`

## Example Flow

1. Game document created with `status: "scheduled"`
2. `ensureGameBoards` trigger fires
3. Function checks for boards with amounts [1, 5, 10, 20]
4. For each missing amount, creates new board:
   - `$1` board: pot=$80, payout=$20
   - `$5` board: pot=$400, payout=$100
   - `$10` board: pot=$800, payout=$200
   - `$20` board: pot=$1,600, payout=$400
5. All boards start as `"open"` and ready for entries

## Status Detection

Function uses case-insensitive status comparison:
```javascript
const currentStatus = afterData?.status?.toLowerCase();
const previousStatus = beforeData?.status?.toLowerCase();
```

This handles variations like "Scheduled", "SCHEDULED", "scheduled".

