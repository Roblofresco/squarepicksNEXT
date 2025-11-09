# reconcileGameWinners

## Overview
Callable Cloud Function for manual winner reconciliation. Processes all periods for a specific game and assigns winners for any periods that haven't been assigned yet. Useful for recovery, testing, or fixing missed assignments.

## Function Type
`onCall` (Callable Cloud Function)

## Region
`us-east1`

## Authentication
Not explicitly required (but recommended for admin use)

## Input Parameters

```typescript
{
  gameId: string;  // Required: Game document ID
}
```

## Function Logic

### 1. Validate Game Exists

```javascript
const g = await db.doc(`games/${gameId}`).get();
if (!g.exists) throw new HttpsError('not-found', 'game not found');
```

### 2. Detect Available Periods

```javascript
const periods = [];
if (d.homeQ1score !== undefined) periods.push('q1');
if (d.homeQ2score !== undefined) periods.push('q2');
if (d.homeQ3score !== undefined) periods.push('q3');
if (d.status === 'final' || d.isOver === true) periods.push('final');
```

**Detection Logic**:
- **Q1**: `homeQ1score` field exists (handles 0-0 scores)
- **Q2**: `homeQ2score` field exists
- **Q3**: `homeQ3score` field exists
- **Final**: Game status is "final" OR `isOver === true`

**Note**: Uses field existence (not zero checks) to handle 0-0 scores correctly.

### 3. Process Each Board

```javascript
const boardsSnap = await db.collection('boards')
  .where('gameID', '==', gameRef)
  .get();

for (const b of boardsSnap.docs) {
  // Process each period
}
```

### 4. Process Each Period (Skip If Already Assigned)

```javascript
for (const label of periods) {
  if (bd?.winners?.[label]?.assigned === true) continue;
  
  // Assign winners for this period
  await assignWinnersForBoardPeriod({
    db,
    boardSnap: b,
    gameId,
    periodLabel: label,
    homeScore: scores.home,
    awayScore: scores.away
  });
}
```

**Idempotency**: Skips periods already assigned (`winners.{period}.assigned === true`)

## Score Mapping

```javascript
const scoreMap = {
  q1: { home: Number(d.homeQ1score || 0), away: Number(d.awayQ1score || 0) },
  q2: { home: Number(d.homeQ2score || 0), away: Number(d.awayQ2score || 0) },
  q3: { home: Number(d.homeQ3score || 0), away: Number(d.awayQ3score || 0) },
  final: { home: Number(d.homeScore || 0), away: Number(d.awayScore || 0) }
};
```

**Note**: Final uses `homeScore`/`awayScore` (includes overtime), not `homeFscore`/`awayFscore`.

## Return Value

```typescript
{
  success: true;
}
```

## Use Cases

### Recovery Scenarios
- Fix missed winner assignments
- Recover from failed automatic assignments
- Process winners after manual score corrections

### Testing
- Test winner assignment logic
- Verify payout calculations
- Validate notification delivery

### Manual Processing
- Admin-triggered reconciliation
- Batch processing for multiple games
- Debugging winner assignment issues

## Error Handling

- `invalid-argument`: Missing gameId
- `not-found`: Game document doesn't exist
- Individual board/period errors logged but don't stop processing
- Function continues processing all boards even if some fail

## Related Functions
- `onGameUpdatedAssignWinners`: Automatic winner assignment (preferred)
- `assignWinnersForBoardPeriod`: Core assignment logic (called by this function)
- `reconcileWinnersDaily`: Scheduled daily reconciliation (if implemented)

## Implementation Notes

### Idempotency
- Safe to call multiple times
- Skips already-assigned periods
- Won't create duplicate assignments

### Sequential Processing
- Processes boards sequentially (not parallel)
- Processes periods sequentially per board
- Simpler error handling than parallel approach

### Period Detection
- Uses field existence (not zero checks)
- Handles 0-0 scores correctly
- Final period detected by status or `isOver` flag

### Score Handling
- Uses `Number()` conversion with `|| 0` fallback
- Handles undefined/null scores
- Final period uses actual final scores (includes OT)

## Differences from onGameUpdatedAssignWinners

| Feature | reconcileGameWinners | onGameUpdatedAssignWinners |
|---------|---------------------|---------------------------|
| Trigger | Manual (callable) | Automatic (trigger) |
| Timing | On-demand | Real-time on game updates |
| Processing | Sequential | Parallel |
| Use Case | Recovery/testing | Production flow |
| Period Detection | Field existence | State transitions |

## Example Usage

```javascript
// Reconcile winners for a game
const result = await reconcileGameWinners({
  gameId: "401772826"
});

console.log(result.success);  // true
```

## Example Flow

### Input
```javascript
gameId = "401772826"
```

### Game Data
```javascript
{
  homeQ1score: 7,
  awayQ1score: 3,
  homeQ2score: 14,
  awayQ2score: 10,
  status: "final",
  isOver: true,
  homeScore: 28,
  awayScore: 24
}
```

### Processing
1. Detects periods: `['q1', 'q2', 'final']`
2. Finds all boards for game
3. For each board:
   - Checks Q1: Not assigned → Assigns winners
   - Checks Q2: Not assigned → Assigns winners
   - Checks Final: Not assigned → Assigns winners and closes board

### Result
```javascript
{
  success: true
}
```

