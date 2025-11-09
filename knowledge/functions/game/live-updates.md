# Live Game Update Functions

## Overview
Functions that monitor and update live games in real-time.

---

## liveUpdateLeagueGames

### Type
Async Orchestration Function

### Purpose
Finds and updates all live or recently scheduled games for a specific sport. Combines two queries to catch both already-live games and newly-live games.

### Input
- **db** (Firestore): Firestore database instance
- **sport** (string): Sport code (e.g., "NFL")

### Output
```javascript
{
  updated: 14,              // Number of games updated
  dates: ["20241215", ...]  // Unique game dates processed
}
```

### Logic

#### Step 1: Query Live Games
```javascript
const liveSnap = await db.collection("games")
  .where("sport", "==", sport)
  .where("isLive", "==", true)
  .where("isOver", "==", false)
  .get();
```

#### Step 2: Query Recently Scheduled Games
```javascript
const now = admin.firestore.Timestamp.now();
const fourHoursAgo = admin.firestore.Timestamp.fromMillis(
  now.toMillis() - 4 * 60 * 60 * 1000
);

const scheduledSnap = await db.collection("games")
  .where("sport", "==", sport)
  .where("status", "==", "scheduled")
  .where("startTime", ">=", fourHoursAgo)
  .where("startTime", "<=", now)
  .get();
```

**Why 4-hour window?**
- Catches games that just went live
- ESPN may not immediately mark game as live
- Handles timezone edge cases
- Buffer for delayed game starts

#### Step 3: Combine and Group by Date
```javascript
const allDocs = [...liveSnap.docs, ...scheduledSnap.docs];
const dates = new Set();
const gamesById = new Map();

for (const doc of allDocs) {
  const data = doc.data();
  // Convert gameDate "2024-12-15" to "20241215"
  const gameDate = String(data.gameDate || "").replace(/-/g, "").slice(0, 8);
  if (gameDate) dates.add(gameDate);
  gamesById.set(doc.id, { ref: doc.ref, data });
}
```

#### Step 4: Fetch ESPN Data by Date
```javascript
let updatedCount = 0;

for (const date of dates) {
  try {
    const events = await fetchScoreboardEvents(sport, date);
    const eventMap = new Map(events.map(ev => [String(ev.id), ev]));
    
    for (const [gameId, meta] of gamesById.entries()) {
      const ev = eventMap.get(gameId);
      if (!ev) continue;
      
      try {
        await updateGameWithCompleteData(db, sport, ev, gameId);
        updatedCount += 1;
      } catch (writeErr) {
        console.error(`Update error ${sport} ${gameId}`, writeErr.message);
      }
    }
  } catch (fetchErr) {
    console.error(`Fetch failed for ${sport} ${date}`, fetchErr.message);
    continue; // Continue with next date
  }
}

return { updated: updatedCount, dates: Array.from(dates) };
```

### Database Operations

#### Collections Read
- `games` - Two queries (live + scheduled)

#### Collections Written
- `games/{gameId}` - Updated via `updateGameWithCompleteData`

#### Indexes Required
- `games`: composite on `sport` + `isLive` + `isOver`
- `games`: composite on `sport` + `status` + `startTime`

### Business Rules

#### Two-Query Strategy
Necessary because Firestore doesn't support OR queries:
1. **Query 1**: Already live games (isLive=true, isOver=false)
2. **Query 2**: Recently scheduled games (might have just gone live)

#### Why Not Just Query All Games?
- Would be inefficient (thousands of games)
- Most games not live
- Queries are cheap, full scans expensive

#### Error Handling Per Game
- Continues processing if individual game fails
- Logs errors but doesn't fail entire batch
- Prevents one bad game from blocking all updates

#### Date-Based Fetching
- Groups games by date to minimize API calls
- Single ESPN scoreboard call per date
- Efficient for days with multiple games

### Scheduled Execution

Called by `liveUpdateNflGames` scheduled function:
```javascript
exports.liveUpdateNflGames = onSchedule({
  schedule: "*/1 * * * *",  // Every minute
  timeZone: "UTC",
  memory: "256MiB"
}, async () => {
  const db = admin.firestore();
  const result = await liveUpdateLeagueGames(db, "NFL");
  console.log("liveUpdateNflGames", result);
  return null;
});
```

### Performance Characteristics
- **Typical execution**: 1-5 seconds
- **Games updated per minute**: 10-20 during peak times
- **ESPN API calls**: 1-3 per execution (grouped by date)
- **Firestore reads**: ~20-40 documents
- **Firestore writes**: 10-20 documents (with diff checking)

### Kill Switch
```javascript
if (process.env.DISABLE_LIVE_UPDATES === 'true') {
  console.log('liveUpdateNflGames: DISABLED');
  return null;
}
```

Environment variable for emergency stop without redeployment.

### Used By
- `liveUpdateNflGames` - Scheduled function (every minute)
- Manual trigger for testing

### Example Output
```javascript
{
  updated: 14,
  dates: ["20241215", "20241216"]
}
```

### Related Documentation
- [Function: updateGameWithCompleteData](./game-ingestion.md#updateGameWithCompleteData)
- [Function: fetchScoreboardEvents](./espn-integration.md#fetchScoreboardEvents)
- [Business Rules: Live Updates](../../business-rules/live-updates.md)

---

## updateSplitsFromSummary

### Type
Async Quarter Score Update Function

### Purpose
Fetches quarter-by-quarter scoring from ESPN Summary API and updates game document. Uses boxscore data primarily, with fallback to scoring plays.

### Input
- **db** (Firestore): Firestore database instance
- **sport** (string): Sport code
- **gameId** (string): Game document ID

### Output
None (void) - writes to Firestore

### Logic

#### Step 1: Fetch ESPN Summary Data
```javascript
const { sportPath, league } = getSportPaths(sport);
const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/${league}/summary?event=${gameId}`;
const resp = await axiosGetWithRetry(url, { timeout: 12000 }, 3, 600);
const data = resp.data;
```

#### Step 2: Try Boxscore First (Most Reliable)
```javascript
let homeQ = {}, awayQ = {};

try {
  const teams = data.boxscore?.teams || [];
  const homeTeamBox = teams.find(t => t.homeAway === "home");
  const awayTeamBox = teams.find(t => t.homeAway === "away");
  
  const hPer = homeTeamBox?.periods || [];
  const aPer = awayTeamBox?.periods || [];
  
  const pick = (arr, idx) => Number(arr[idx]?.score || 0);
  
  homeQ = {
    Q1: pick(hPer, 0),
    Q2: pick(hPer, 1),
    Q3: pick(hPer, 2),
    F: pick(hPer, hPer.length - 1)  // Final includes OT
  };
  
  awayQ = {
    Q1: pick(aPer, 0),
    Q2: pick(aPer, 1),
    Q3: pick(aPer, 2),
    F: pick(aPer, aPer.length - 1)
  };
} catch {}
```

**ESPN Boxscore Structure**:
```json
{
  "boxscore": {
    "teams": [
      {
        "homeAway": "home",
        "periods": [
          { "number": 1, "score": 7 },
          { "number": 2, "score": 14 },
          { "number": 3, "score": 21 },
          { "number": 4, "score": 28 }
        ]
      }
    ]
  }
}
```

#### Step 3: Fallback to Scoring Plays
```javascript
if (!homeQ.Q1 && !awayQ.Q1) {
  const scoringPlays = data.scoringPlays || [];
  const comp = data.header?.competitions?.[0] || {};
  const currentPeriod = Number(comp.status?.period || 1);
  const statusState = String(comp.status?.type?.state || "");
  const statusDetail = String(comp.status?.type?.detail || "").toLowerCase();
  const isGameOver = statusState === "post";
  const isHalftime = statusDetail.includes("halftime");
  
  homeQ = { Q1: 0, Q2: 0, Q3: 0, F: 0 };
  awayQ = { Q1: 0, Q2: 0, Q3: 0, F: 0 };
  
  // Track last score in each period
  const periodScores = { home: {}, away: {} };
  for (const play of scoringPlays) {
    const period = Number(play.period?.number || 0);
    periodScores.home[period] = Number(play.homeScore || 0);
    periodScores.away[period] = Number(play.awayScore || 0);
  }
  
  // Only set COMPLETED quarter scores
  if (currentPeriod >= 2 || isGameOver) {
    homeQ.Q1 = periodScores.home[1] || 0;
    awayQ.Q1 = periodScores.away[1] || 0;
  }
  if (currentPeriod >= 3 || isHalftime || isGameOver) {
    homeQ.Q2 = periodScores.home[2] || homeQ.Q1;
    awayQ.Q2 = periodScores.away[2] || awayQ.Q1;
  }
  if (currentPeriod >= 4 || isGameOver) {
    homeQ.Q3 = periodScores.home[3] || homeQ.Q2;
    awayQ.Q3 = periodScores.away[3] || awayQ.Q2;
  }
  if (isGameOver) {
    homeQ.F = periodScores.home[4] || homeQ.Q3;
    awayQ.F = periodScores.away[4] || awayQ.Q3;
  }
}
```

**Why Only Set Completed Quarters?**
- Prevents premature winner assignment
- Q1 winner only determined after Q1 ends (quarter >= 2)
- Q2 winner at halftime or Q3 start
- Q3 winner at Q4 start
- Final winner after game over

#### Step 4: Diff Check and Write
```javascript
const gameRef = db.doc(`games/${gameId}`);
const existingSnap = await gameRef.get();

if (existingSnap.exists) {
  const existing = existingSnap.data();
  const needsUpdate = (
    existing.homeQ1score !== homeQ.Q1 ||
    existing.homeQ2score !== homeQ.Q2 ||
    existing.homeQ3score !== homeQ.Q3 ||
    existing.homeFscore !== homeQ.F ||
    existing.awayQ1score !== awayQ.Q1 ||
    existing.awayQ2score !== awayQ.Q2 ||
    existing.awayQ3score !== awayQ.Q3 ||
    existing.awayFscore !== awayQ.F
  );
  
  if (!needsUpdate) return; // Skip write
}

await gameRef.set({
  homeQ1score: homeQ.Q1,
  homeQ2score: homeQ.Q2,
  homeQ3score: homeQ.Q3,
  homeFscore: homeQ.F,
  awayQ1score: awayQ.Q1,
  awayQ2score: awayQ.Q2,
  awayQ3score: awayQ.Q3,
  awayFscore: awayQ.F,
  lastUpdated: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true });
```

### Database Operations

#### Collections Written
- `games/{gameId}` - Quarter score fields (merge)

### Business Rules

#### Boxscore vs Scoring Plays
**Boxscore preferred**:
- More reliable when available
- Properly handles overtime
- Cumulative scores already calculated

**Scoring plays fallback**:
- Used when boxscore unavailable
- Requires complex logic to determine quarter boundaries
- Must check game state to avoid premature scores

#### Completed Quarters Only
Only set quarter scores when quarter is complete:
- Prevents 0-0 score during Q1 from triggering winner assignment
- Uses period number and game state to determine completion
- Critical for accurate winner determination

#### Final Score Includes Overtime
- Final score is last period score
- Handles overtime automatically
- Different from Q4 score if OT occurred

### ESPN Summary API Structure
```json
{
  "boxscore": {
    "teams": [...]
  },
  "scoringPlays": [
    {
      "period": { "number": 1 },
      "homeScore": 7,
      "awayScore": 0,
      "text": "TD: Smith 5 yd pass from Mahomes"
    }
  ],
  "header": {
    "competitions": [
      {
        "status": {
          "period": 2,
          "type": {
            "state": "in",
            "detail": "3:45 - 2nd Quarter"
          }
        }
      }
    ]
  }
}
```

### Used By
- `liveUpdateGameOnce` - Manual single game update
- **Deprecated**: Replaced by `updateGameWithCompleteData` in live flow

### Why Deprecated in Live Updates
- Separate call creates timing issues
- `updateGameWithCompleteData` combines both APIs
- This function still useful for:
  - Manual corrections
  - Backfill missing quarter scores
  - Testing

### Related Documentation
- [Function: updateGameWithCompleteData](./game-ingestion.md#updateGameWithCompleteData)
- [Business Rules: Winner Assignment](../../business-rules/winner-assignment.md)
- [Data Models: Game](../../data-models/game.md)

---

## reconcileGameWinnersInternal

### Type
Async Reconciliation Function

### Purpose
Ensures all eligible quarter winners are assigned for a game. Used for catching missed assignments due to timing issues or failures.

### Input
- **db** (Firestore): Firestore database instance
- **gameId** (string): Game document ID

### Output
None (void) - writes to board documents

### Logic

#### Step 1: Read Game Data
```javascript
const g = await db.doc(`games/${gameId}`).get();
if (!g.exists) {
  console.warn(`Game ${gameId} not found`);
  return;
}
const d = g.data();
```

#### Step 2: Determine Available Periods
```javascript
const periods = [];
if (d.homeQ1score !== undefined) periods.push('q1');
if (d.homeQ2score !== undefined) periods.push('q2');
if (d.homeQ3score !== undefined) periods.push('q3');
if (d.status === 'final' || d.isOver === true) periods.push('final');
```

**Note**: Uses field existence, not value comparison:
- `undefined` = quarter not completed
- `0` = valid score (0-0 tie possible)

#### Step 3: Query All Boards for Game
```javascript
const gameRef = db.doc(`games/${gameId}`);
const boardsSnap = await db.collection('boards')
  .where('gameID', '==', gameRef)
  .get();
```

#### Step 4: Assign Winners for Each Period
```javascript
for (const b of boardsSnap.docs) {
  const bd = b.data();
  
  for (const label of periods) {
    // Skip if already assigned
    if (bd.winners?.[label]?.assigned === true) continue;
    
    // Get scores for this period
    const scoreMap = {
      q1: { home: Number(d.homeQ1score || 0), away: Number(d.awayQ1score || 0) },
      q2: { home: Number(d.homeQ2score || 0), away: Number(d.awayQ2score || 0) },
      q3: { home: Number(d.homeQ3score || 0), away: Number(d.awayQ3score || 0) },
      final: { home: Number(d.homeScore || 0), away: Number(d.awayScore || 0) }
    };
    const scores = scoreMap[label];
    
    // Assign winners
    await assignWinnersForBoardPeriod({
      db,
      boardSnap: b,
      gameId,
      periodLabel: label,
      homeScore: scores.home,
      awayScore: scores.away
    });
  }
}
```

### Database Operations

#### Collections Read
- `games/{gameId}` - Game data
- `boards` - Boards for game

#### Collections Written
- `boards/{boardId}` - Winner metadata (via `assignWinnersForBoardPeriod`)
- `users/{userId}` - Balance updates (via `assignWinnersForBoardPeriod`)
- `transactions` - Payout records (via `assignWinnersForBoardPeriod`)
- `notifications` - Winner notifications (via `assignWinnersForBoardPeriod`)

### Business Rules

#### Idempotent Operation
- Checks `winners.{period}.assigned` before processing
- Safe to run multiple times
- Skips already-assigned periods

#### Catches Missed Assignments
Used when:
- Live trigger failed or timed out
- Game document updated but trigger didn't fire
- Manual intervention needed
- Backfilling after system outage

#### Uses Actual Final Score
For final period, uses `homeScore`/`awayScore` (includes OT), not `homeFscore`:
```javascript
final: { home: Number(d.homeScore || 0), away: Number(d.awayScore || 0) }
```

### Scheduled Execution

Called by `reconcileWinnersDaily`:
```javascript
exports.reconcileWinnersDaily = onSchedule({
  schedule: '10 9 * * *',  // 09:10 UTC (05:10 ET) daily
  timeZone: 'UTC',
  memory: '256MiB'
}, async () => {
  const db = admin.firestore();
  const now = admin.firestore.Timestamp.now();
  const threeDaysAgo = admin.firestore.Timestamp.fromMillis(
    now.toMillis() - 3 * 24 * 60 * 60 * 1000
  );
  
  // Reconcile games updated in last 3 days
  const gamesSnap = await db.collection('games')
    .where('lastUpdated', '>=', threeDaysAgo)
    .get();
  
  for (const g of gamesSnap.docs) {
    try {
      await reconcileGameWinnersInternal(db, g.id);
    } catch (e) {
      console.error(`Reconcile failed for ${g.id}`, e.message);
    }
  }
  
  return null;
});
```

**Why 3-day window?**
- Catches games that ended over weekend
- Allows time for ESPN data to stabilize
- Balances coverage vs. processing time

### Manual Callable

Also exposed as callable function:
```javascript
exports.reconcileGameWinners = onCall({ region: 'us-east1' }, async (request) => {
  const { gameId } = request.data;
  await reconcileGameWinnersInternal(db, gameId);
  return { success: true };
});
```

### Used By
- `reconcileWinnersDaily` - Scheduled daily reconciliation
- `reconcileGameWinners` - Manual callable function
- Admin tools for fixing missed assignments

### Related Documentation
- [Function: assignWinnersForBoardPeriod](./winner-assignment.md)
- [Business Rules: Winner Assignment](../../business-rules/winner-assignment.md)
- [Data Models: Board](../../data-models/board.md)

