# enterBoard

## Overview
Callable Cloud Function that allows authenticated users to enter/select squares on a board. Handles both single and multiple square selections with atomic transaction logic.

## Function Type
`onCall` (Callable Cloud Function)

## Region
`us-east1`

## Authentication
Required - User must be authenticated via Firebase Auth

## Input Parameters

```typescript
{
  boardId: string;                    // Required: Board document ID
  selectedSquareIndexes?: number[];  // Optional: Array of square indices (0-99)
  selectedNumber?: number;           // Optional: Single square index (0-99)
  sweepstakesId?: string;            // Optional: Sweepstakes ID for paid entries
}
```

**Note**: Either `selectedSquareIndexes` (array) OR `selectedNumber` (single) must be provided.

## Transaction Logic

The function uses a Firestore transaction to ensure atomicity across multiple operations:

### Pre-Transaction Validation (Outside Transaction)
1. **Board Validation**
   - Verifies board exists and status is "open"
   - Checks board is not full

2. **Square Availability Check**
   - Queries top-level `squares` collection for each selected index
   - Ensures no duplicate selections exist
   - Throws `already-exists` error if square is taken

3. **Balance Validation**
   - Calculates total entry fee: `entryFee × squareCount`
   - Verifies user has sufficient balance
   - Throws `permission-denied` if insufficient funds

4. **Free Board Rules**
   - Free boards (amount = 0) allow only 1 square per user per board
   - Validates sweepstakes association for free boards

### Transaction Reads (All Reads Before Writes)
1. **Re-read User Balance**
   - Fresh balance check to prevent race conditions
   - Validates balance hasn't changed since pre-transaction check

2. **Re-check Square Availability**
   - Parallel queries for all selected squares within transaction
   - Ensures squares still available at transaction time

3. **Pre-read Game/Team Context**
   - Fetches game document and team references
   - Used for notification title generation (team matchup format)
   - Must be read before any writes

4. **Sweepstakes Validation** (if applicable)
   - Validates sweepstakes exists and is active
   - Checks if user is already participant (blocks free board re-entry)
   - Pre-reads sweepstakes data for participant check

### Transaction Writes (Atomic Operations)
1. **Create Square Documents**
   - Creates one square document per selected index in top-level `squares` collection
   - Each square document contains:
     - `userID`: DocumentReference to user
     - `index`: Square position (0-99)
     - `boardId`: Board document ID (string)
     - `gameId`: Game document ID (string)
     - `square`: null (assigned later when board fills)
     - Timestamps

2. **Update Board Selected Indexes**
   - Adds all selected indices to board's `selected_indexes` array
   - Uses `FieldValue.arrayUnion()` for atomic array update

3. **Create Sweepstakes Participant** (if applicable)
   - Creates participant document in `sweepstakes/{sweepstakesId}/participants`
   - Only if user is not already participant
   - Free boards: blocks if already participant
   - Paid boards: allows entry even if already participant

4. **Deduct User Balance**
   - Decrements user balance by total entry fee
   - Only if `totalEntryFee > 0` (free entries skip this)

5. **Create Transaction Record**
   - Creates document in `transactions` collection
   - Transaction types:
     - `entry_fee`: Paid board entry
     - `sweepstakes_entry`: Free sweepstakes entry
   - Includes all entered square indexes for traceability

6. **Create User Notification**
   - Creates notification document
   - Title format: `{titlePrefix} - {awayTeam} @ {homeTeam}`
   - Title prefix: Sweepstakes title (free) or `$amount` (paid)
   - Message varies by entry type and square count

## Business Rules

### Square Selection Rules
- One square = one user (enforced by transaction)
- Cannot select same index twice on same board
- Must have sufficient balance to select
- Free boards limited to 1 square per user per board
- Square indices must be 0-99 (validated)

### Free Board Rules
- Free boards (amount = 0) must be associated with active sweepstakes
- User can only enter free board once (prevents duplicate participant documents)
- No balance deduction for free entries

### Paid Board Rules
- Multiple squares allowed per entry
- Each square costs `board.amount`
- Total cost = `amount × squareCount`
- Optional sweepstakes association (doesn't block entry if already participant)

## Error Handling

### Validation Errors
- `unauthenticated`: User not authenticated
- `invalid-argument`: Missing boardId, invalid square indices, or invalid amount
- `not-found`: Board or user document not found
- `failed-precondition`: Board not open, sweepstakes inactive, or free board setup issue
- `already-exists`: Square already taken or user already entered free board
- `permission-denied`: Insufficient balance

### Transaction Errors
- `aborted`: Balance changed or square taken during transaction (retry recommended)
- `internal`: Unexpected error during processing

## Return Value

```typescript
{
  success: true;
  message: "Entry successful!";
}
```

## Related Functions
- `handleBoardFull`: Triggered when board reaches 100 squares
- `getBoardUserSelections`: Retrieves user's squares on a board

## Implementation Notes

### Square Document Structure
Squares are stored in top-level `squares` collection (not subcollection):
- Enables efficient queries across boards
- Supports composite indexes for winner queries
- `square` field remains null until board fills and numbers assigned

### Transaction Idempotency
- Transaction checks are idempotent
- Duplicate calls will fail validation (square already exists)
- Safe to retry on `aborted` errors

### Notification Context
- Game context (team names) pre-read in transaction
- Sweepstakes title pre-read for free boards
- Notification title uses team matchup format: `{prefix} - {away} @ {home}`

## Example Usage

```javascript
// Single square entry
const result = await enterBoard({
  boardId: "abc123",
  selectedNumber: 42
});

// Multiple squares entry
const result = await enterBoard({
  boardId: "abc123",
  selectedSquareIndexes: [10, 20, 30]
});

// Paid entry with sweepstakes
const result = await enterBoard({
  boardId: "abc123",
  selectedSquareIndexes: [5, 15],
  sweepstakesId: "sweep123"
});
```

