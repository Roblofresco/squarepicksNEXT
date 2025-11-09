# Winner Calculation Business Rules

## Overview
Winners are determined by matching the last digit of each team's score to the board's axis numbers. The calculation is performed independently of board data using only game scores.

## Core Algorithm

### Last Digit Extraction
```javascript
homeLastDigit = homeScore % 10
awayLastDigit = awayScore % 10
```

### Winning Square Formation
```javascript
winningSquare = `${awayLastDigit}${homeLastDigit}`
```

**Format**: 2-character string, away digit + home digit

### Example
```javascript
// Quarter ends: Home 24, Away 17
homeScore = 24
awayScore = 17

homeLastDigit = 24 % 10 = 4
awayLastDigit = 17 % 10 = 7

winningSquare = "74"  // Away (7) + Home (4)
```

## Score Sources by Period

### Q1 (First Quarter)
```javascript
homeScore = game.homeQ1score  // Cumulative Q1 score
awayScore = game.awayQ1score  // Cumulative Q1 score
```

**Example**: Q1 ends 14-17
- `game.homeQ1score = 14`
- `game.awayQ1score = 17`
- `winningSquare = "74"` (7 from 17, 4 from 14)

### Q2 (Halftime)
```javascript
homeScore = game.homeQ2score  // Cumulative through Q2
awayScore = game.awayQ2score  // Cumulative through Q2
```

**Example**: Q1 ends 14-17, Halftime is 24-27
- `game.homeQ2score = 24` (not Q2-only points)
- `game.awayQ2score = 27` (not Q2-only points)
- `winningSquare = "74"` (7 from 27, 4 from 24)

### Q3 (Third Quarter)
```javascript
homeScore = game.homeQ3score  // Cumulative through Q3
awayScore = game.awayQ3score  // Cumulative through Q3
```

**Example**: Q3 ends 31-34
- `game.homeQ3score = 31`
- `game.awayQ3score = 34`
- `winningSquare = "41"` (4 from 34, 1 from 31)

### Final
```javascript
homeScore = game.homeScore  // ✅ Use actual final (includes OT)
awayScore = game.awayScore  // ✅ Use actual final (includes OT)

// ❌ DO NOT USE:
// game.homeFscore  // This is regulation final only
// game.awayFscore  // This is regulation final only
```

**Example**: Game ends in OT 30-27 (regulation was 27-27)
- `game.homeScore = 30` ✅ Correct (includes OT)
- `game.awayScore = 27` ✅ Correct (includes OT)
- `game.homeFscore = 27` ❌ Wrong (regulation only)
- `game.awayFscore = 27` ❌ Wrong (regulation only)
- `winningSquare = "70"` (7 from 27, 0 from 30)

## Implementation

### Calculate from Game Document
```javascript
function calculateWinningSquare(gameData, periodLabel) {
  const scoreMap = {
    q1: { 
      home: Number(gameData.homeQ1score || 0), 
      away: Number(gameData.awayQ1score || 0) 
    },
    q2: { 
      home: Number(gameData.homeQ2score || 0), 
      away: Number(gameData.awayQ2score || 0) 
    },
    q3: { 
      home: Number(gameData.homeQ3score || 0), 
      away: Number(gameData.awayQ3score || 0) 
    },
    final: { 
      home: Number(gameData.homeScore || 0),    // ✅ Actual final
      away: Number(gameData.awayScore || 0)     // ✅ Actual final
    }
  };
  
  const scores = scoreMap[periodLabel];
  if (!scores) return null;
  
  const homeLast = String(scores.home % 10);
  const awayLast = String(scores.away % 10);
  
  return `${awayLast}${homeLast}`;
}
```

### Store on Game Document
```javascript
// Winner assignment trigger
exports.onGameUpdatedAssignWinners = onDocumentUpdated({
  document: 'games/{gameId}'
}, async (event) => {
  const after = event.data.after.data();
  const gameRef = event.data.after.ref;
  
  // Calculate winning squares
  const gameUpdates = {};
  
  if (after.homeQ1score !== undefined) {
    gameUpdates.q1WinningSquare = calculateWinningSquare(after, 'q1');
  }
  
  if (after.homeQ2score !== undefined) {
    gameUpdates.q2WinningSquare = calculateWinningSquare(after, 'q2');
  }
  
  if (after.homeQ3score !== undefined) {
    gameUpdates.q3WinningSquare = calculateWinningSquare(after, 'q3');
  }
  
  if (after.isOver && after.homeScore !== undefined) {
    gameUpdates.finalWinningSquare = calculateWinningSquare(after, 'final');
  }
  
  // Update game document (single source of truth)
  if (Object.keys(gameUpdates).length > 0) {
    await gameRef.update(gameUpdates);
  }
  
  // Then assign winners on boards
  // ...
});
```

## Board Number Mapping

Once winning square is calculated from game scores, it must be mapped to board square indexes using the board's number assignments.

### Index Calculation
```javascript
function computeWinningIndexFromDigits(boardData, homeLastDigitStr, awayLastDigitStr) {
  if (!Array.isArray(boardData?.home_numbers) || !Array.isArray(boardData?.away_numbers)) {
    return null;
  }
  
  // Find positions in number arrays
  const homeIdx = boardData.home_numbers.indexOf(homeLastDigitStr);
  const awayIdx = boardData.away_numbers.indexOf(awayLastDigitStr);
  
  if (homeIdx < 0 || awayIdx < 0) {
    return null;  // Numbers not found (shouldn't happen)
  }
  
  // Calculate grid index
  const winningIndex = awayIdx * 10 + homeIdx;
  
  return {
    winningIndex: winningIndex,
    winningSquare: `${awayLastDigitStr}${homeLastDigitStr}`
  };
}
```

### Example
```javascript
// Board numbers
home_numbers = ["5", "3", "8", "1", "0", "9", "2", "7", "4", "6"]
away_numbers = ["4", "7", "2", "9", "0", "3", "1", "8", "6", "5"]

// Winning square from game
winningSquare = "74"  // Away 7, Home 4

// Find positions
homeIdx = home_numbers.indexOf("4") = 8  // "4" is at position 8
awayIdx = away_numbers.indexOf("7") = 1  // "7" is at position 1

// Calculate index
winningIndex = 1 * 10 + 8 = 18

// Result: Square at index 18 wins
```

### Grid Visualization
```
        Home Numbers →
        5   3   8   1   0   9   2   7   4   6
A   4   0   1   2   3   4   5   6   7   8*  9
w   7  10  11  12  13  14  15  16  17 [18] 19  ← Winning square
a   2  20  21  22  23  24  25  26  27  28  29
y   9  30  31  32  33  34  35  36  37  38  39
    0  40  41  42  43  44  45  46  47  48  49
N   3  50  51  52  53  54  55  56  57  58  59
u   1  60  61  62  63  64  65  66  67  68  69
m   8  70  71  72  73  74  75  76  77  78  79
s   6  80  81  82  83  84  85  86  87  88  89
↓   5  90  91  92  93  94  95  96  97  98  99

Square at index 18 has coordinate "74"
```

## Query Winners

### Find Winning Squares
```javascript
const winningSquare = "74";  // Calculated from scores

const winnersQuery = db.collection('squares')
  .where('boardId', '==', boardId)
  .where('square', '==', winningSquare)
  .limit(200);  // Safety limit

const winnersSnap = await winnersQuery.get();
```

### Extract Winner User IDs
```javascript
const uidSet = new Set();

winnersSnap.forEach((docSnap) => {
  const data = docSnap.data();
  if (data.userID && typeof data.userID === 'object' && data.userID.id) {
    uidSet.add(data.userID.id);
  }
  if (typeof data.userID === 'string') {
    uidSet.add(data.userID);
  }
});

const winnerUids = Array.from(uidSet);
```

## Edge Cases

### Score Ending in 0
```javascript
// Q1 ends: Home 20, Away 10
homeLastDigit = 20 % 10 = 0
awayLastDigit = 10 % 10 = 0
winningSquare = "00"
```

### Double Digits Same
```javascript
// Q2 ends: Home 17, Away 27
homeLastDigit = 17 % 10 = 7
awayLastDigit = 27 % 10 = 7
winningSquare = "77"
```

### Overtime Winner
```javascript
// Regulation: 24-24
// OT ends: 27-24
homeScore = 27  // Use actual final score
awayScore = 24
winningSquare = "47"  // 4 from 24, 7 from 27
```

### No Winner (Shouldn't Happen)
```javascript
// If board numbers not assigned yet
if (!boardData.home_numbers || !boardData.away_numbers) {
  console.warn(`Board ${boardId} numbers not assigned, cannot determine winner`);
  return null;
}

// If winning square calculation fails
const winnersSnap = await winnersQuery.get();
if (winnersSnap.empty) {
  console.warn(`No winners found for ${winningSquare} on board ${boardId}`);
  // Still create public summary with winnerCount = 0
}
```

### Multiple Winners
```javascript
// Two users own square "74"
winnersSnap.size = 2

// Both users receive notification
// Both users receive payout (split equally)
// Both users get win record
```

## Validation

### Score Availability Check
```javascript
if (homeScore === undefined || awayScore === undefined) {
  console.warn(`Scores not available for ${periodLabel}, skipping winner assignment`);
  return;
}
```

### Numbers Assignment Check
```javascript
if (!Array.isArray(boardData.home_numbers) || boardData.home_numbers.length !== 10) {
  console.error(`Board ${boardId} home_numbers invalid`);
  return;
}

if (!Array.isArray(boardData.away_numbers) || boardData.away_numbers.length !== 10) {
  console.error(`Board ${boardId} away_numbers invalid`);
  return;
}
```

### Idempotency Check
```javascript
// Don't reassign if already assigned
if (boardData.winners?.[periodLabel]?.assigned === true) {
  console.log(`Winners already assigned for ${periodLabel} on board ${boardId}`);
  return;
}
```

## Testing

### Manual Winner Calculation
```javascript
// Given game scores
const gameId = "401547402";
const gameSnap = await db.doc(`games/${gameId}`).get();
const gameData = gameSnap.data();

// Calculate each period
const q1Winner = calculateWinningSquare(gameData, 'q1');
const q2Winner = calculateWinningSquare(gameData, 'q2');
const q3Winner = calculateWinningSquare(gameData, 'q3');
const finalWinner = calculateWinningSquare(gameData, 'final');

console.log('Q1:', q1Winner);
console.log('Q2:', q2Winner);
console.log('Q3:', q3Winner);
console.log('Final:', finalWinner);
```

### Verify Against Board
```javascript
// Given board and period
const boardId = "abc123";
const periodLabel = "q1";

// Get game winning square
const gameSnap = await db.doc(`games/${gameId}`).get();
const winningSquare = gameSnap.data().q1WinningSquare;

// Find winners
const winnersSnap = await db.collection('squares')
  .where('boardId', '==', boardId)
  .where('square', '==', winningSquare)
  .get();

console.log(`Winning square: ${winningSquare}`);
console.log(`Winners found: ${winnersSnap.size}`);

winnersSnap.forEach(doc => {
  console.log(`- User: ${doc.data().userID.id}, Square index: ${doc.data().index}`);
});
```

### Test Score Scenarios
```javascript
const testCases = [
  { home: 0, away: 0, expected: "00" },
  { home: 7, away: 14, expected: "47" },
  { home: 24, away: 17, expected: "74" },
  { home: 31, away: 28, expected: "81" },
  { home: 30, away: 27, expected: "70" }
];

testCases.forEach(test => {
  const homeLast = String(test.home % 10);
  const awayLast = String(test.away % 10);
  const result = `${awayLast}${homeLast}`;
  
  console.assert(
    result === test.expected,
    `FAILED: ${test.away}-${test.home} should be ${test.expected}, got ${result}`
  );
});

console.log('All test cases passed!');
```

## Common Issues

### Issue: Winners not assigned despite quarter ending
**Cause**: Scores not available in game document yet
**Resolution**: Wait for ESPN API update, or manually trigger with `liveUpdateGameOnce`

### Issue: Wrong winners assigned
**Cause**: Using wrong score fields (e.g., `homeFscore` instead of `homeScore` for final)
**Resolution**: Always use `homeScore`/`awayScore` for final period

### Issue: No winners found
**Cause**: Board numbers not assigned yet, or query error
**Resolution**: Verify board status is 'full' or 'active', check `home_numbers` and `away_numbers` exist

### Issue: Duplicate winner assignments
**Cause**: Function triggered multiple times
**Resolution**: Idempotency check prevents duplicate payouts (`winners.${period}.assigned === true`)

## Audit Trail

### Game Document
Winning squares stored on game document (single source of truth):
```javascript
{
  q1WinningSquare: "74",
  q2WinningSquare: "74",
  q3WinningSquare: "41",
  finalWinningSquare: "70"
}
```

### Board Document
Winner assignment metadata:
```javascript
{
  winners: {
    q1: {
      assigned: true,
      winningIndex: 18,
      assignedAt: Timestamp,
      paid: true,
      paidAmount: 100
    },
    // ... q2, q3, final
  }
}
```

### Board Subcollection
Public winner summary:
```javascript
// boards/{boardId}/winners/q1
{
  period: "Q1",
  winningIndex: 18,
  winningSquare: "74",
  winnerCount: 2,
  assignedAt: Timestamp
}
```

### User Subcollection
Private win records:
```javascript
// users/{uid}/wins/{boardId}_q1
{
  boardId: "abc123",
  gameId: "401547402",
  period: "Q1",
  winningIndex: 18,
  winningSquare: "74",
  squareID: "square_doc_id",
  assignedAt: Timestamp
}
```

This multi-level audit trail ensures winner calculations can be verified and traced at any time.

