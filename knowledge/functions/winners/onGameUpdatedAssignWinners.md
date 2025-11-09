# onGameUpdatedAssignWinners

## Overview
Firestore trigger function that automatically assigns winners when game scores update and quarter periods end. Detects game state transitions (quarter ends, halftime, game final) and processes winner assignment for all boards associated with the game.

## Function Type
`onDocumentUpdated` (Firestore Trigger)

## Trigger Path
`games/{gameId}`

## Region
`us-east1`

## Trigger Detection

The function detects period transitions by comparing `before` and `after` game document states:

### Q1 End
```javascript
before.quarter === 1 && after.quarter === 2 && after.homeQ1score !== undefined
```
- Quarter changes from 1 to 2
- Q1 scores available

### Q2 End (Halftime)
```javascript
before.status !== 'halftime' && after.status === 'halftime' && after.homeQ2score !== undefined
```
- Status changes to "halftime"
- Q2 scores available

### Q3 End
```javascript
before.quarter === 3 && after.quarter === 4 && after.homeQ3score !== undefined
```
- Quarter changes from 3 to 4
- Q3 scores available

### Final Period
```javascript
!before.isOver && after.isOver === true && after.homeScore !== undefined
```
- `isOver` changes from false to true
- Final scores available (includes overtime)

## Processing Flow

### Step 1: Update Game Document with Winning Squares

**Purpose**: Store winning squares on game document (independent of boards)

```javascript
game.q1WinningSquare = "47"
game.q2WinningSquare = "23"
game.q3WinningSquare = "89"
game.finalWinningSquare = "12"
```

**Calculation**:
```javascript
const homeLast = String(Number(scores.home || 0) % 10);
const awayLast = String(Number(scores.away || 0) % 10);
const winningSquare = `${awayLast}${homeLast}`;
```

**Idempotency**: Only updates if field not already set

### Step 2: Process All Boards for Game

For each board associated with the game:

1. **Query Boards**
   ```javascript
   boards.where('gameID', '==', gameRef).get()
   ```

2. **Process Each Period**
   - For each detected transition (q1, q2, q3, final)
   - Calls `assignWinnersForBoardPeriod()` for each board/period combination

3. **Parallel Processing**
   - Processes boards in parallel
   - Error handling per board (one failure doesn't stop others)
   - Continues processing even if individual boards fail

## Score Mapping

```javascript
const scoreMap = {
  q1: { home: homeQ1score, away: awayQ1score },
  q2: { home: homeQ2score, away: awayQ2score },
  q3: { home: homeQ3score, away: awayQ3score },
  final: { home: homeScore, away: awayScore }  // Uses final score (includes OT)
};
```

**Note**: Final period uses `homeScore`/`awayScore` (not `homeFscore`/`awayFscore`) to include overtime scores.

## Error Handling

### Game Document Update
- Errors logged but don't stop board processing
- Continues to process boards even if game update fails

### Board Processing
- Errors per board logged but don't stop other boards
- Uses `.catch()` to handle individual board failures
- Returns `null` on completion (standard for triggers)

## Related Functions
- `assignWinnersForBoardPeriod`: Processes individual board/period combinations
- `processQuarterPayoutsInTransaction`: Handles payout processing
- `reconcileGameWinners`: Manual reconciliation alternative

## Implementation Notes

### Transition Detection
- Compares `before` and `after` states
- Only processes when transitions occur (not on every update)
- Handles multiple transitions in single update

### Game Document Updates
- Updates game document FIRST (before board processing)
- Stores winning squares for reference
- Independent of board processing

### Board Processing
- Processes all boards for game
- Handles multiple periods simultaneously
- Parallel execution for performance

### Final Period Handling
- Uses final game scores (includes overtime)
- Different from quarter scores
- Ensures correct winner for game end

## Example Flow

### Game Update Triggers Q1 End

**Before**:
```javascript
{
  quarter: 1,
  homeQ1score: undefined
}
```

**After**:
```javascript
{
  quarter: 2,
  homeQ1score: 7,
  awayQ1score: 3
}
```

**Processing**:
1. Detects Q1 transition
2. Calculates: `winningSquare = "37"`
3. Updates game: `game.q1WinningSquare = "37"`
4. Finds all boards for game
5. For each board: Calls `assignWinnersForBoardPeriod({ periodLabel: "q1", homeScore: 7, awayScore: 3 })`

### Game Update Triggers Final

**Before**:
```javascript
{
  isOver: false,
  homeScore: 24
}
```

**After**:
```javascript
{
  isOver: true,
  homeScore: 28,  // Includes overtime
  awayScore: 24
}
```

**Processing**:
1. Detects final transition
2. Calculates: `winningSquare = "48"` (from final scores)
3. Updates game: `game.finalWinningSquare = "48"`
4. Finds all boards for game
5. For each board: Calls `assignWinnersForBoardPeriod({ periodLabel: "final", homeScore: 28, awayScore: 24 })`
6. Boards closed after final assignment

## Multiple Transitions

If game update includes multiple transitions (e.g., Q2 and Q3 scores added simultaneously):

```javascript
transitions = ['q2', 'q3']
```

Function processes both periods for all boards.

## Performance Considerations

- Parallel board processing improves performance
- Error isolation prevents cascade failures
- Game document update separate from board processing
- Efficient query: single query for all game boards

