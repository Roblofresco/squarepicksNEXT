# handleBoardFull

## Overview
Firestore trigger function that automatically assigns random numbers to board axes and updates all square coordinates when a board reaches 100 selected squares.

## Function Type
`onDocumentUpdated` (Firestore Trigger)

## Trigger Path
`boards/{boardID}`

## Region
`us-east1`

## Trigger Conditions

The function processes a board update when ALL of the following are true:

1. **Board Status**: `after.status === "open"` AND `before.status === "open"`
2. **Board Full**: `after.selected_indexes.length === 100`
3. **Numbers Not Assigned**: Board does NOT have valid `home_numbers` and `away_numbers` arrays (each with 10 elements)

## Number Assignment Logic

### Random Number Generation

```javascript
function generateRandomNumbers() {
  const numbers = [];
  while (numbers.length < 10) {
    const num = Math.floor(Math.random() * 10);  // 0-9
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.map(String);  // ["0", "1", ..., "9"]
}
```

- Generates two independent arrays: `home_numbers` and `away_numbers`
- Each array contains digits 0-9 in random order
- No duplicates within each array
- Returns as array of strings

### Square Coordinate Calculation

For each square document with `index` (0-99):

```javascript
const homeIdx = index % 10;                    // Column (0-9)
const awayIdx = Math.floor(index / 10);         // Row (0-9)
const homeDigit = assignedHomeNumbers[homeIdx];
const awayDigit = assignedAwayNumbers[awayIdx];
const square = `${awayDigit}${homeDigit}`;     // e.g., "47"
```

**Business Rule**: Square coordinate format is `{awayDigit}{homeDigit}` (away digit first, then home digit)

### Example Calculation

For square at index 23:
- `homeIdx = 23 % 10 = 3`
- `awayIdx = Math.floor(23 / 10) = 2`
- If `home_numbers[3] = "1"` and `away_numbers[2] = "2"`
- Square coordinate = `"21"`

## Processing Steps

### 1. Update Board Document

```javascript
await boardRef.update({
  home_numbers: assignedHomeNumbers,  // Array of 10 strings
  away_numbers: assignedAwayNumbers,   // Array of 10 strings
  status: "full",                      // Changes from "open" to "full"
  updated_time: FieldValue.serverTimestamp()
});
```

### 2. Batch Update Square Documents

- Queries all squares for board: `squares.where("boardId", "==", boardID)`
- Uses Firestore batch write (max 500 operations)
- Updates each square document:
  ```javascript
  {
    square: xySquareString,           // e.g., "47"
    updated_time: FieldValue.serverTimestamp()
  }
  ```

### 3. Send Notifications

- Collects unique user IDs from all square documents
- Creates notification for each participant
- Notification details:
  - **Title**: `{titlePrefix} - {awayTeam} @ {homeTeam}`
  - **Message**: "Your Picks Have Been Assigned!"
  - **Type**: `board_full` or `sweepstakes_full` (if free board)
  - Includes game context and board ID

### 4. Create New Open Board (Conditional)

**Condition**: Only if game is NOT live (`game.isLive !== true`)

Creates new board with:
- Same `gameID` and `amount` as filled board
- Status: `"open"`
- Empty `selected_indexes: []`
- Pot calculation:
  - Sweepstakes (amount = 0): `pot = 100`, `payout = 25`
  - Paid boards: `pot = amount × 80`, `payout = amount × 20`
- Sweepstakes association (if amount = 0):
  - Finds active sweepstakes
  - Associates new board with sweepstakes
  - Updates sweepstakes document with board reference

## Board Status Transitions

```
open → full
```

- Board starts as `"open"` (accepting entries)
- When 100 squares selected, status changes to `"full"`
- Board remains `"full"` until game goes live (then becomes `"active"`)

## Square Document Updates

### Before Assignment
```javascript
{
  boardId: "abc123",
  userID: DocumentReference("users/user456"),
  index: 23,
  square: null,  // Not assigned yet
  timestamp: Timestamp,
  updated_time: Timestamp
}
```

### After Assignment
```javascript
{
  boardId: "abc123",
  userID: DocumentReference("users/user456"),
  index: 23,
  square: "21",  // Assigned coordinate
  timestamp: Timestamp,
  updated_time: Timestamp  // Updated
}
```

## Error Handling

- Logs warnings for squares with invalid indices
- Continues processing even if some squares fail
- Does not throw errors (trigger function should be resilient)

## Related Functions
- `enterBoard`: Creates squares that trigger this function
- `onGameLiveCloseBoardsAndRefund`: Activates full boards when game goes live

## Implementation Notes

### Idempotency
- Function checks if numbers already assigned before processing
- Safe to retry if trigger fires multiple times
- Uses `numbersAssignedAndValid` check to prevent duplicate processing

### Batch Writes
- Uses Firestore batch for square updates
- Batch limit: 500 operations
- If board has exactly 100 squares, fits within one batch

### Game Live Check
- Checks game `isLive` status before creating new board
- Prevents creating boards for games already in progress
- New board creation is best-effort (errors logged but don't fail function)

### Sweepstakes Association
- Free boards automatically associated with active sweepstakes
- Sweepstakes document updated with new board reference
- If no active sweepstakes found, board created without association

## Example Flow

1. User enters 100th square via `enterBoard`
2. Board `selected_indexes` array reaches length 100
3. `handleBoardFull` trigger fires
4. Function generates random numbers: `home_numbers = ["5","3","8","1","0","9","2","7","4","6"]`
5. Function generates: `away_numbers = ["4","7","2","9","0","3","1","8","6","5"]`
6. Board document updated with numbers and status "full"
7. All 100 square documents updated with coordinates
8. Notifications sent to all participants
9. New open board created (if game not live)

