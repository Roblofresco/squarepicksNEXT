# reconcileGameWinners

## Overview
Admin callable function that manually reconciles winners for a single game. Processes all boards for a game and assigns winners for any periods that haven't been assigned yet.

## Trigger
- **Type**: `onCall` (Callable)
- **Region**: `us-east1`
- **Authentication**: Required (but no admin check - consider adding)

## Request Parameters
```typescript
{
  gameId: string  // Required: Game document ID
}
```

## Flow

### 1. Validation
- Validates `gameId` parameter exists
- Fetches game document
- Throws `not-found` error if game doesn't exist

### 2. Detect Available Periods
Detects which periods have scores available:
- **Q1**: `homeQ1score` field exists
- **Q2**: `homeQ2score` field exists
- **Q3**: `homeQ3score` field exists
- **Final**: `status === 'final'` OR `isOver === true`

### 3. Query Boards
- Queries all boards for the game
- Uses `gameID` DocumentReference match

### 4. Process Each Board
For each board:
- Checks board's `winners` metadata
- Skips periods where `winners.{period}.assigned === true`
- For unassigned periods:
  - Gets scores from game document
  - Calls `assignWinnersForBoardPeriod()` for each period

### 5. Score Mapping
```typescript
{
  q1: { home: homeQ1score, away: awayQ1score },
  q2: { home: homeQ2score, away: awayQ2score },
  q3: { home: homeQ3score, away: awayQ3score },
  final: { home: homeScore, away: awayScore }  // Uses final score (handles overtime)
}
```

## Response
```typescript
{
  success: true
}
```

## Error Handling
- **invalid-argument**: Missing `gameId`
- **not-found**: Game not found
- **Internal errors**: Logged, function continues processing other boards

## Use Cases
- **Manual Reconciliation**: Fix missed winner assignments
- **Data Recovery**: Re-process winners after data issues
- **Testing**: Manually trigger winner assignment
- **Backfill**: Process winners for historical games

## Idempotency
- Checks `winners.{period}.assigned` flag before processing
- Skips already-assigned periods
- Safe to call multiple times

## Notes
- **No Admin Check**: Currently doesn't verify admin role (consider adding)
- **Handles 0-0 Scores**: Detects periods by field existence, not score value
- **Overtime Handling**: Uses `homeScore`/`awayScore` for final (handles overtime)
- **Parallel Processing**: Processes boards sequentially (could be parallelized)

## Related Functions
- `assignWinnersForBoardPeriod`: Core winner assignment logic (called by this function)
- `onGameUpdatedAssignWinners`: Automatic winner assignment trigger
- `reconcileWinnersDaily`: Scheduled daily reconciliation
- `resetAndTriggerWinnersHttp`: Testing function to re-trigger assignment

