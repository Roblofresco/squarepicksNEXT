# handleBoardFull

## Overview
Cloud Function that processes boards when they reach 100 selected squares. Assigns random axis numbers, updates square documents, creates notifications, and optionally creates a new open board.

## Trigger
- **Type**: `onDocumentUpdated`
- **Path**: `boards/{boardID}`
- **Region**: `us-east1`

## Flow

### 1. Criteria Check
Board must meet ALL conditions:
- Status is `"open"` (before and after)
- `selected_indexes.length === 100` (board is full)
- Numbers NOT yet assigned (`home_numbers` and `away_numbers` not valid arrays of 10)

### 2. Number Assignment
- Generates random 0-9 arrays for home and away axes
- Each array contains exactly 10 unique digits
- Updates board document:
  - `home_numbers`: Array of 10 strings (0-9)
  - `away_numbers`: Array of 10 strings (0-9)
  - `status`: Changed to `"full"`

### 3. Square Document Updates
- Queries all squares in top-level `squares` collection for this board
- Calculates X-Y square string for each square: `{awayDigit}{homeDigit}`
- Updates each square document with `square` field
- Collects unique participant user IDs

### 4. Notification Creation
- **Title Format**: `{titlePrefix} - {awayTeam} @ {homeTeam}`
  - Sweepstakes boards: Uses sweepstakes title
  - Paid boards: Uses `$${amount}` format
- **Message**: `"Your Picks Have Been Assigned!"`
- **Tag**: `"board_full"` or `"sweepstakes_full"` (for free boards)
- **Type**: Matches tag
- **Related Fields**: `boardId`, `gameId`, `relatedID` (boardId)
- Creates one notification per participant

### 5. New Board Creation (Conditional)
- **Condition**: Game is NOT live (`isLive !== true`)
- **Board Data**:
  - Same `gameID` and `amount`
  - Status: `"open"`
  - Empty `selected_indexes`
  - `pot`: Calculated based on amount
    - Free boards (sweepstakes): $100 total
    - Paid boards: `amount × 80`
  - `payout`: Per-quarter amount
    - Free boards: $25 per quarter
    - Paid boards: `amount × 20`
- **Sweepstakes Association**: If amount is 0, links to active sweepstakes
- Updates sweepstakes document with new board reference

## Key Functions Called
- `getGameContext()`: Resolves game and team names for notifications
- `getBoardTitlePrefix()`: Gets board title (handles sweepstakes)
- `getUserSquares()`: Gets user's squares for a board

## Notification Structure
```typescript
{
  userID: string,
  tag: "board_full" | "sweepstakes_full",
  title: string,              // "{titlePrefix} - {awayTeam} @ {homeTeam}"
  message: "Your Picks Have Been Assigned!",
  type: "board_full" | "sweepstakes_full",
  relatedID: string,        // boardId
  boardId: string,
  gameId: string | null,
  isRead: false,
  timestamp: Timestamp
}
```

## Error Handling
- Missing squares: Logs warning, continues
- Notification creation failure: Logs error, doesn't block board processing
- New board creation failure: Logs error, doesn't affect current board

## Related Functions
- `sendNotifications`: Sends the created notifications via email/SMS/push
- `onGameLiveCloseBoardsAndRefund`: Handles board activation when game goes live

