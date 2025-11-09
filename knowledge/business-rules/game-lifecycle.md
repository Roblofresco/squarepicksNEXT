# Game Lifecycle Business Rules

## Overview
Games progress through distinct stages from creation to completion, with automatic state transitions and board management at each stage.

## Game States

### Status Values
- **scheduled**: Game is upcoming, boards accepting entries
- **in-progress**: Game is live, no new boards created
- **halftime**: Between Q2 and Q3 (subset of in-progress)
- **final**: Game completed, all winners assigned

### State Fields
- **statusState**: pre, in, post
- **isLive**: Boolean flag for active gameplay
- **isOver**: Boolean flag for game completion
- **quarter**: Current quarter/period (0-4+)

## Lifecycle Stages

### Stage 1: Game Ingestion (Status: scheduled)

**Trigger**: ESPN API returns new game OR game status changes to 'scheduled'

**Actions**:
1. Game document created/updated in Firestore
2. Auto-creates 4 standard boards ($1, $5, $10, $20)
3. Optional: Sweepstakes board ($0) if active sweepstakes exists

**Implementation**:
```javascript
// ESPN API → Firestore
exports.ingestNflWeeklyGamesScheduled = onSchedule({
  schedule: "0 5 * * 2",  // Tuesdays 05:00 ET
  timeZone: "America/New_York"
}, async () => {
  // Fetch Thu/Sun/Mon games for current week
  // Create game documents with status: 'scheduled'
});

// Auto-create boards
exports.ensureGameBoards = onDocumentWritten({
  document: "games/{gameId}"
}, async (event) => {
  if (afterData.status === 'scheduled' && !beforeData.status) {
    // Create boards for $1, $5, $10, $20
  }
});
```

**Board Behavior**:
- Status: 'open' (accepting entries)
- New 'open' board created when previous fills
- Users can select squares until board reaches 100

**Business Rules**:
- Games must have valid team references (homeTeam, awayTeam)
- Only current season games ingested (2024+)
- Games created 5-7 days before kickoff

---

### Stage 2: Pre-Game (Status: scheduled)

**Duration**: From creation until ~4 hours before kickoff

**Board Dynamics**:
- Open boards accept entries
- When board reaches 100 squares → status changes to 'full'
- Full board triggers:
  - Random number assignment (home_numbers, away_numbers)
  - Square coordinates assigned (e.g., "47")
  - Notifications sent to all participants
  - New 'open' board created (rollover)

**Implementation**:
```javascript
exports.handleBoardFull = onDocumentUpdated({
  document: "boards/{boardID}"
}, async (event) => {
  if (selected_indexes.length === 100 && status === 'open') {
    // Assign numbers
    // Update squares with coordinates
    // Notify participants
    // Create new open board (if game not live)
  }
});
```

**Business Rules**:
- Users can have multiple entries on same board
- Same square cannot be selected by multiple users
- Entry requires sufficient wallet balance
- Sweepstakes boards limited to 1 square per user

---

### Stage 3: Live Window Start (isLive: false → true)

**Trigger**: Within 4 hours of game start OR game actually starts

**Actions**:
1. isLive flag set to true
2. All open boards → status: 'active'
3. No new boards created (rollover stops)
4. Live polling begins (every 15 seconds)

**Implementation**:
```javascript
// Scheduled live polling
exports.liveUpdateNflGames = onSchedule({
  schedule: "every 15 seconds",
  timeZone: "America/New_York"
}, async () => {
  if (!isWithinNflLiveWindow()) return;
  
  // Query live games
  // Query scheduled games within 4 hours of start
  // Update from ESPN scoreboard API
});

// Board status transition
exports.onGameStatusChanged = onDocumentUpdated({
  document: "games/{gameId}"
}, async (event) => {
  if (!before.isLive && after.isLive) {
    // Update all boards: status → 'active'
  }
});
```

**Live Polling Windows** (Eastern Time):
- Thursday: 19:00-23:00
- Friday: 14:00-18:00 (Black Friday)
- Saturday: 12:00-23:00 (late season)
- Sunday: 09:00-23:00
- Monday: 19:00-23:00

**Business Rules**:
- Open boards cannot fill once game is live
- Full boards remain playable
- Live updates every 15 seconds during window
- Outside window: no updates (saves API calls)

---

### Stage 4: Quarter 1 Completion (Q1 → Q2)

**Trigger**: `quarter` changes from 1 → 2 AND `homeQ1score` available

**Actions**:
1. Game document updated with `q1WinningSquare`
2. Winner assignment triggered for all boards
3. For each board:
   - Query squares matching winning coordinate
   - Pay winners ($25 per quarter for $5 board)
   - Create transaction records
   - Update user balances
   - Send winner notifications
   - Update board metadata

**Implementation**:
```javascript
exports.onGameUpdatedAssignWinners = onDocumentUpdated({
  document: 'games/{gameId}'
}, async (event) => {
  // Detect Q1 completion
  if (before.quarter === 1 && after.quarter === 2 && after.homeQ1score) {
    // Calculate winning square from Q1 scores
    // Update game.q1WinningSquare
    // Trigger board winner assignment
  }
});

async function assignWinnersForBoardPeriod({ boardSnap, periodLabel, homeScore, awayScore }) {
  await db.runTransaction(async (tx) => {
    // All reads first
    const winnersSnap = await tx.get(winnersQuery);
    
    // All writes
    tx.set(publicSummaryRef, {...});  // Public winner doc
    tx.update(boardRef, {...});       // Board metadata
    tx.set(txRef, {...});             // Transaction record
    tx.update(userRef, {...});        // Balance increment
    tx.set(notifRef, {...});          // Notification
    tx.set(winRef, {...});            // Private win record
  });
}
```

**Winning Square Calculation**:
```javascript
homeLastDigit = homeQ1score % 10  // e.g., 14 % 10 = 4
awayLastDigit = awayQ1score % 10  // e.g., 17 % 10 = 7
winningSquare = "74"  // awayLastDigit + homeLastDigit
```

**Payout Example** ($5 board):
```javascript
payout = 100         // $25 per quarter
winners = 2          // Two users have square "74"
perWinner = 50.00    // $50.00 each

// Each winner receives:
// - Transaction record (type: 'winnings', amount: 50.00)
// - Balance increment (+$50.00)
// - Notification ("You won $50.00 for pick 74 in the first quarter!")
// - Private win record in users/{uid}/wins/
```

**Business Rules**:
- Winners paid immediately (no delay)
- Multiple winners split payout equally
- Idempotent (safe to retry)
- Board remains 'active' (not closed yet)

---

### Stage 5: Halftime (Q2 Completion)

**Trigger**: `status` changes to 'halftime' AND `homeQ2score` available

**Actions**:
- Same as Q1: calculate Q2 winning square, assign winners, pay out
- Q2 payout processed

**Business Rules**:
- Uses cumulative Q2 scores (not Q2-only points)
- Example: Q1 ends 14-17, halftime is 24-27 → Q2 score is 24-27
- Halftime status detected via ESPN API status field

---

### Stage 6: Quarter 3 Completion (Q3 → Q4)

**Trigger**: `quarter` changes from 3 → 4 AND `homeQ3score` available

**Actions**:
- Calculate Q3 winning square
- Assign Q3 winners
- Process Q3 payouts

**Business Rules**:
- Uses cumulative Q3 scores
- Board still remains 'active'

---

### Stage 7: Game Completion (Final)

**Trigger**: `isOver` becomes true AND `homeScore`/`awayScore` available

**Actions**:
1. Calculate final winning square (uses `homeScore`/`awayScore`, not `homeFscore`/`awayFscore`)
2. Assign final winners
3. Process final payouts
4. **Close all boards** (status: 'active' → 'closed')
5. Set `settled_at` timestamp

**Implementation**:
```javascript
exports.onGameUpdatedAssignWinners = onDocumentUpdated({
  document: 'games/{gameId}'
}, async (event) => {
  if (!before.isOver && after.isOver && after.homeScore) {
    // Use actual final scores (includes OT)
    await assignWinnersForBoardPeriod({
      periodLabel: 'final',
      homeScore: after.homeScore,
      awayScore: after.awayScore
    });
    
    // Board closure handled in assignWinnersForBoardPeriod
  }
});
```

**Final Score Handling** (Overtime):
```javascript
// DO NOT use homeFscore/awayFscore for final winner
// USE homeScore/awayScore (includes OT)

// Example: Regulation ends 27-27, OT ends 30-27
homeScore: 30     // ✅ Use this
awayScore: 27     // ✅ Use this
homeFscore: 27    // ❌ Don't use (regulation only)
awayFscore: 27    // ❌ Don't use (regulation only)

finalWinningSquare = "70"  // 27 % 10 = 7, 30 % 10 = 0
```

**Board Closure**:
```javascript
// In assignWinnersForBoardPeriod
if (periodLabel === 'final') {
  tx.update(boardRef, {
    'status': 'closed',
    'settled_at': FieldValue.serverTimestamp(),
    'winners.final.assigned': true,
    'winners.final.paid': true,
    'winners.final.paidAmount': totalPaid
  });
}
```

**Business Rules**:
- All 4 payouts complete before board closure
- Closed boards cannot be reopened
- settled_at timestamp recorded
- Board remains in database (audit trail)

---

## State Transition Diagram

```
┌─────────────┐
│  Ingestion  │
│  (Tuesday)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  scheduled  │ ◄── Boards: open/full, entries active
└──────┬──────┘
       │ (4 hours before kickoff)
       ▼
┌─────────────┐
│   isLive    │ ◄── Boards: active, no new boards
│ (Polling)   │     Live updates every 15s
└──────┬──────┘
       │
       ├──► Q1 Complete → Winners assigned, paid
       │
       ├──► Q2 Complete (Halftime) → Winners assigned, paid
       │
       ├──► Q3 Complete → Winners assigned, paid
       │
       ▼
┌─────────────┐
│   isOver    │ ◄── Final winners assigned, paid
│   (final)   │     Boards: closed
└─────────────┘
```

## Error Handling

### Missing Scores
```javascript
// Skip winner assignment if scores not available
if (homeScore === undefined || awayScore === undefined) {
  console.warn(`Scores not available for ${periodLabel}, skipping`);
  return;
}
```

### Concurrent Updates
- All winner assignments use Firestore transactions
- Idempotency checks prevent duplicate payouts
- Optimistic locking via transaction reads

### Failed ESPN API Calls
- Retries with exponential backoff (3 attempts)
- Failed games logged but don't block other games
- Manual reconciliation function available

### Invalid Team References
- Game ingestion fails fast if team not found
- Error message includes ESPN ID for manual addition
- Games not created until teams exist

## Manual Reconciliation

### Force Winner Assignment
```javascript
exports.reconcileGameWinners = onCall(async (request) => {
  const { gameId } = request.data;
  
  // Detect available periods from scores
  const periods = [];
  if (gameData.homeQ1score !== undefined) periods.push('q1');
  if (gameData.homeQ2score !== undefined) periods.push('q2');
  if (gameData.homeQ3score !== undefined) periods.push('q3');
  if (gameData.isOver) periods.push('final');
  
  // Assign winners for all unassigned periods
  for (const label of periods) {
    if (boardData.winners?.[label]?.assigned !== true) {
      await assignWinnersForBoardPeriod({...});
    }
  }
});
```

### Reset and Retrigger
```javascript
exports.resetAndTriggerWinnersHttp = onRequest(async (req, res) => {
  const { gameId } = req.query;
  
  // Delete quarter score fields
  await gameRef.update({
    homeQ1score: FieldValue.delete(),
    // ... other scores
  });
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Re-write scores (triggers onGameUpdatedAssignWinners)
  await gameRef.update({
    homeQ1score: originalQ1Score,
    // ... other scores
  });
});
```

## Performance Considerations

### Live Update Optimization
- Only updates games that are live or scheduled within 4 hours
- Diff-based updates (only writes if values changed)
- Query limits prevent unbounded operations

### Winner Assignment Scale
- Parallel winner assignment across multiple boards
- Transaction batching for multiple winners
- Query limits (200 winners max per board per period)

### Database Reads
- All transaction reads batched at beginning
- Pre-reads game/team context for notifications
- Minimizes round trips to database

## Testing Procedures

### Create Test Game
```bash
node create-test-live-game-q1.js
```

### Trigger Live Status
```bash
node toggle-game-isover.js <gameId>
```

### Manually Assign Winners
```bash
node manually-assign-q1-winner.js <boardId>
```

### Verify Results
```bash
node verify-process5-results.js <gameId>
```

