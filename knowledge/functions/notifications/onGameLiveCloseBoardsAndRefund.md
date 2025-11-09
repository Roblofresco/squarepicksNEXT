# onGameLiveCloseBoardsAndRefund

## Overview
Cloud Function that handles board lifecycle when a game goes live. Closes unfilled boards (with refunds for paid boards), activates full boards, and sends notifications to participants.

## Trigger
- **Type**: `onDocumentUpdated`
- **Path**: `games/{gameId}`
- **Region**: `us-east1`
- **Condition**: `!before.isLive && after.isLive === true` (game transitioned to live)

## Flow

### Part 1: Close Unfilled Boards

#### 1. Query Open Boards
- Finds all boards for the game with status `"open"`
- Boards that haven't reached 100 squares

#### 2. Close Unfilled Boards
- Updates board status to `"unfilled"`
- Sets `closed_at` timestamp
- Sets `closure_reason`: `"game_started_unfilled"`

#### 3. Process Refunds (Paid Boards Only)
- Queries all squares for each unfilled board
- Groups squares by user ID
- Calculates refund: `squareCount × boardAmount`
- For each user:
  - Increments user balance
  - Creates refund transaction document
  - Creates refund notification

#### 4. Sweepstakes Board Notifications
- For free boards (sweepstakes):
  - No refund (no payment was made)
  - Sends cancellation notification
  - Tag: `"sweepstakes_unfilled"`

### Part 2: Activate Full Boards

#### 1. Query Full Boards
- Finds all boards for the game with status `"full"`
- Boards that have 100 squares and assigned numbers

#### 2. Activate Boards
- Updates status to `"active"`
- Sets `activated_at` timestamp

#### 3. Send Activation Notifications
- Gets all participants for each activated board
- Creates notification per participant:
  - **Title**: `"{titlePrefix} - {awayTeam} @ {homeTeam}"`
  - **Message**: `"Track Your Picks Live!"`
  - **Tag**: `"board_active"` or `"sweepstakes_active"`
  - **Type**: Matches tag

## Notification Types

### Refund Notification (Paid Boards)
```typescript
{
  userID: string,
  tag: "refund",
  title: string,              // "{titlePrefix} - {awayTeam} @ {homeTeam}"
  message: string,            // "Sorry! Vacant squares remained when game started. You've received ${amount} refund for your {count} purchased square(s)."
  type: "refund",
  relatedID: string,        // transactionId
  boardId: string,
  gameId: string,
  isRead: false,
  timestamp: Timestamp
}
```

### Sweepstakes Unfilled Notification
```typescript
{
  userID: string,
  tag: "sweepstakes_unfilled",
  title: string,              // Sweepstakes title
  message: "Sorry! This sweepstakes board didn't fill before the game started. Your entry has been canceled.",
  type: "sweepstakes_unfilled",
  relatedID: string,        // boardId
  boardId: string,
  gameId: string,
  isRead: false,
  timestamp: Timestamp
}
```

### Board Activation Notification
```typescript
{
  userID: string,
  tag: "board_active" | "sweepstakes_active",
  title: string,              // "{titlePrefix} - {awayTeam} @ {homeTeam}"
  message: "Track Your Picks Live!",
  type: "board_active" | "sweepstakes_active",
  relatedID: string,        // boardId
  boardId: string,
  gameId: string,
  isRead: false,
  timestamp: Timestamp
}
```

## Transaction Structure (Refund)
```typescript
{
  userID: string,
  userDocRef: DocumentReference,
  type: "refund",
  amount: number,            // squareCount × boardAmount
  currency: "USD",
  status: "completed",
  timestamp: Timestamp,
  description: string,       // "Refund for {count} square(s) on board {boardId} (game started unfilled)"
  boardId: string,
  gameId: string
}
```

## Key Functions Called
- `getGameContext()`: Resolves game and team names
- `getBoardTitlePrefix()`: Gets board title (handles sweepstakes)

## Error Handling
- Missing squares: Logs and continues
- Notification creation failure: Logs error, doesn't block processing
- Batch operations: Uses Firestore batches for atomic writes

## Related Functions
- `sendNotifications`: Sends created notifications via email/SMS/push
- `handleBoardFull`: Creates full boards that get activated here
- `onGameUpdatedAssignWinners`: Processes winners for active boards

