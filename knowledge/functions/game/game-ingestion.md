# Game Ingestion Functions

## Overview
Functions that create and update game documents from ESPN API data.

---

## ingestGamesForSportDate

### Type
Async Orchestration Function

### Purpose
Fetches and ingests all games for a specific sport and date. Handles bulk game creation/updates and auto-creates sweepstakes for Monday Night Football.

### Input
- **db** (Firestore): Firestore database instance
- **sport** (string): Sport code (e.g., "NFL")
- **yyyymmdd** (string): Date in YYYYMMDD format (e.g., "20241215")

### Output
```javascript
{
  success: true,
  upsertedCount: 14,
  gameIds: ["401772826", "401772827", ...]
}
```

### Logic

#### Step 1: Validate Input
```javascript
if (!/^[0-9]{8}$/.test(trimmed)) {
  throw new HttpsError("invalid-argument", "Provide date as YYYYMMDD");
}
```

#### Step 2: Fetch ESPN Events
```javascript
const events = await fetchScoreboardEvents(sport, yyyymmdd);
```

#### Step 3: Upsert Each Game
```javascript
const upserted = [];
for (const ev of events) {
  const ref = await upsertGameFromEspnEvent(db, sport, ev);
  if (ref) upserted.push(ref.id);
}
```

#### Step 4: Auto-Create MNF Sweepstakes (NFL Only)
```javascript
if (sport.toUpperCase() === "NFL") {
  const mondayGames = [];
  
  // Find Monday games using America/New_York timezone
  for (const gameId of upserted) {
    const gameSnap = await db.doc(`games/${gameId}`).get();
    const gameData = gameSnap.data();
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short'
    }).format(gameData.startTime.toDate());
    
    if (weekday === 'Mon') {
      mondayGames.push({ id: gameId, startTime: gameData.startTime });
    }
  }
  
  if (mondayGames.length > 0) {
    // Sort by start time (descending) and take latest
    mondayGames.sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis());
    const mnfGame = mondayGames[0];
    
    // Create sweepstakes for MNF game
    await createSweepstakesForMondayGame(db, mnfGame.id, gameData.week);
  }
}
```

### Database Operations

#### Collections Written
- `games/{gameId}` - Game documents (upserted)
- `sweepstakes/{sweepstakesId}` - MNF sweepstakes (created)
- `boards/{boardId}` - Free board for sweepstakes (created)

### Business Rules

#### Season Filtering
Only accepts current season games (2024+):
```javascript
if (eventSeason < 2024) {
  console.log(`Skipping old season game ${gameId} (season ${eventSeason})`);
  return null;
}
```

#### Monday Night Football Auto-Sweepstakes
- Automatically creates sweepstakes for Monday games
- Uses America/New_York timezone to determine Monday
- Takes latest Monday game if multiple exist
- Creates $100 pot free board (4 quarters × $25)
- Associates with active sweepstakes

### Error Handling
- Logs errors per game but continues processing
- Returns partial success if some games fail
- Does not fail entire batch on single game error

### Used By
- `ingestNflGamesByDate` - Callable function
- `ingestNflGamesByDateHttp` - HTTP endpoint
- `scheduleIngestNflWeeklySlate` - Scheduled function

### Example Call
```javascript
const result = await ingestGamesForSportDate(db, "NFL", "20241215");
// { success: true, upsertedCount: 14, gameIds: [...] }
```

### Related Documentation
- [Function: upsertGameFromEspnEvent](./game-ingestion.md#upsertGameFromEspnEvent)
- [Function: createSweepstakesForMondayGame](./sweepstakes.md)
- [Data Models: Game](../../data-models/game.md)

---

## upsertGameFromEspnEvent

### Type
Async Database Write Function

### Purpose
Creates or updates a single game document from ESPN event data. Includes diff checking to avoid unnecessary writes.

### Input
- **db** (Firestore): Firestore database instance
- **sport** (string): Sport code
- **event** (object): ESPN event object

### Output
```javascript
DocumentReference | null  // Game document reference, or null if skipped
```

### Logic

#### Step 1: Validate and Filter
```javascript
const gameId = String(event?.id || "");
if (!gameId) return null;

// Filter: only current season (2024+)
const eventSeason = Number(event?.season?.year || 0);
if (eventSeason < 2024) {
  console.log(`Skipping old season game ${gameId}`);
  return null;
}
```

#### Step 2: Extract Competition Data
```javascript
const comp = event.competitions[0];
const home = comp.competitors.find(x => x.homeAway === "home");
const away = comp.competitors.find(x => x.homeAway === "away");
```

#### Step 3: Find Team References
```javascript
const homeTeamRef = await findTeamByEspn(db, sport, home.team);
const awayTeamRef = await findTeamByEspn(db, sport, away.team);
```

#### Step 4: Extract Game Metadata
```javascript
const startDate = new Date(event.date);
const startTime = admin.firestore.Timestamp.fromDate(startDate);
const gameDate = formatEtDashedYyyyMmDd(startDate); // "2024-12-15"

const scores = {
  homeScore: Number(home.score || 0),
  awayScore: Number(away.score || 0)
};

const statusFields = mapStatusFields(comp);
const broadcastProvider = extractBroadcastProvider(comp);
```

#### Step 5: Diff Check (Optimization)
```javascript
const gameRef = db.doc(`games/${gameId}`);
const existingSnap = await gameRef.get();

if (existingSnap.exists) {
  const existing = existingSnap.data();
  const needsUpdate = (
    existing.status !== statusFields.status ||
    existing.quarter !== statusFields.quarter ||
    existing.timeRemaining !== statusFields.timeRemaining ||
    existing.isLive !== statusFields.isLive ||
    existing.isOver !== statusFields.isOver ||
    existing.homeScore !== scores.homeScore ||
    existing.awayScore !== scores.awayScore ||
    existing.broadcastProvider !== String(broadcastProvider || "")
  );
  
  if (!needsUpdate) {
    return gameRef; // Skip write - no changes
  }
}
```

#### Step 6: Write Game Document
```javascript
await gameRef.set({
  gameID: gameId,
  sport: sport,
  homeTeam: homeTeamRef,
  awayTeam: awayTeamRef,
  startTime,
  gameDate,
  season: String(event.season.year),
  week: Number(event.week.number),
  broadcastProvider,
  status: statusFields.status,
  statusState: statusFields.statusState,
  statusDetail: statusFields.statusDetail,
  quarter: statusFields.quarter,
  timeRemaining: statusFields.timeRemaining,
  isLive: statusFields.isLive,
  isOver: statusFields.isOver,
  homeScore: scores.homeScore,
  awayScore: scores.awayScore,
  lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  created: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true });
```

### Game Document Structure
```javascript
{
  gameID: "401772826",
  sport: "NFL",
  homeTeam: DocumentReference("teams/12"),
  awayTeam: DocumentReference("teams/5"),
  startTime: Timestamp(2024-12-15 18:30:00),
  gameDate: "2024-12-15",
  season: "2024",
  week: 15,
  broadcastProvider: "NBC",
  status: "in_progress",
  statusState: "in",
  statusDetail: "12:34 - 3rd Quarter",
  quarter: 3,
  timeRemaining: "12:34",
  isLive: true,
  isOver: false,
  homeScore: 21,
  awayScore: 17,
  lastUpdated: Timestamp(now),
  created: Timestamp(first creation)
}
```

### Database Operations

#### Collections Written
- `games/{gameId}` - Game document (merge write)

#### Team References
- `homeTeam` - DocumentReference to teams collection
- `awayTeam` - DocumentReference to teams collection

### Business Rules
- Uses merge write to preserve existing fields (e.g., quarter scores)
- Only writes if data has changed (diff check optimization)
- Sets both `lastUpdated` and `created` timestamps
- `created` timestamp only set on first write (merge preserves)
- Game date always in America/New_York timezone
- Season filtering prevents historical game pollution

### Performance Optimizations
- **Diff checking**: Skips write if no changes detected
- Reduces Firestore write costs for unchanged games
- Critical for scheduled functions polling ESPN every minute

### Error Handling
- Throws error if teams not found (handled by caller)
- Logs warnings for missing optional fields
- Does not fail on missing broadcast data

### Time Zone Handling
All game times use **America/New_York** (Eastern Time):
```javascript
// ESPN provides UTC timestamp
const startDate = new Date(event.date); // UTC

// Convert to ET for gameDate field
const gameDate = formatEtDashedYyyyMmDd(startDate); // "2024-12-15" in ET
```

### Used By
- `ingestGamesForSportDate` - Bulk ingestion
- `liveUpdateLeagueGames` - Live updates
- `updateGameWithCompleteData` - Complete data update

### Related Documentation
- [Function: findTeamByEspn](./espn-integration.md#findTeamByEspn)
- [Function: mapStatusFields](./espn-integration.md#mapStatusFields)
- [Data Models: Game](../../data-models/game.md)

---

## updateGameWithCompleteData

### Type
Async Combined Update Function

### Purpose
Updates game with complete data in a single atomic write, combining scoreboard data and quarter scores to avoid timing issues.

### Input
- **db** (Firestore): Firestore database instance
- **sport** (string): Sport code
- **event** (object): ESPN event object from scoreboard API
- **gameId** (string): Game document ID

### Output
```javascript
DocumentReference // Game document reference
```

### Logic

#### Step 1: Extract Scoreboard Data
Same as `upsertGameFromEspnEvent`:
```javascript
const comp = event.competitions[0];
const home = comp.competitors.find(x => x.homeAway === "home");
const away = comp.competitors.find(x => x.homeAway === "away");
const homeTeamRef = await findTeamByEspn(db, sport, home.team);
const awayTeamRef = await findTeamByEspn(db, sport, away.team);
// ... extract metadata
```

#### Step 2: Fetch Quarter Scores (If Live)
```javascript
let quarterScores = {};
const isLiveOrInProgress = statusFields.isLive || statusFields.status === 'in_progress';

if (isLiveOrInProgress) {
  const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/${league}/summary?event=${gameId}`;
  const summaryResp = await axiosGetWithRetry(summaryUrl, { timeout: 12000 }, 3, 600);
  const summaryData = summaryResp.data;
  
  // Try boxscore first
  const teams = summaryData.boxscore?.teams || [];
  const homeTeamBox = teams.find(t => t.homeAway === "home");
  const awayTeamBox = teams.find(t => t.homeAway === "away");
  
  if (homeTeamBox && awayTeamBox) {
    const hPer = homeTeamBox.periods || [];
    const aPer = awayTeamBox.periods || [];
    
    quarterScores = {
      homeQ1score: Number(hPer[0]?.score || 0),
      homeQ2score: Number(hPer[1]?.score || 0),
      homeQ3score: Number(hPer[2]?.score || 0),
      homeFscore: Number(hPer[hPer.length-1]?.score || 0),
      awayQ1score: Number(aPer[0]?.score || 0),
      awayQ2score: Number(aPer[1]?.score || 0),
      awayQ3score: Number(aPer[2]?.score || 0),
      awayFscore: Number(aPer[aPer.length-1]?.score || 0)
    };
  }
  
  // Fallback to scoring plays if boxscore empty
  if (!quarterScores.homeQ1score && !quarterScores.awayQ1score) {
    // ... derive from scoring plays (see updateSplitsFromSummary)
  }
}
```

#### Step 3: Diff Check with Quarter Scores
```javascript
const existingSnap = await gameRef.get();
if (existingSnap.exists) {
  const existing = existingSnap.data();
  const needsUpdate = (
    // ... status/score checks ...
    || (quarterScores.homeQ1score !== undefined && existing.homeQ1score !== quarterScores.homeQ1score)
    || (quarterScores.homeQ2score !== undefined && existing.homeQ2score !== quarterScores.homeQ2score)
    // ... other quarter score checks ...
  );
  
  if (!needsUpdate) return gameRef; // Skip write
}
```

#### Step 4: Single Atomic Write
```javascript
await gameRef.set({
  gameID: gameId,
  sport,
  homeTeam: homeTeamRef,
  awayTeam: awayTeamRef,
  startTime,
  gameDate,
  season,
  week,
  broadcastProvider,
  status: statusFields.status,
  statusState: statusFields.statusState,
  statusDetail: statusFields.statusDetail,
  quarter: statusFields.quarter,
  timeRemaining: statusFields.timeRemaining,
  isLive: statusFields.isLive,
  isOver: statusFields.isOver,
  homeScore: scores.homeScore,
  awayScore: scores.awayScore,
  ...quarterScores, // Spread quarter scores if available
  lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  created: admin.firestore.FieldValue.serverTimestamp()
}, { merge: true });
```

### Database Operations

#### Collections Written
- `games/{gameId}` - Game document with complete data

#### API Calls
1. ESPN Scoreboard API (provided as input)
2. ESPN Summary API (for quarter scores if live)

### Business Rules
- Only fetches quarter scores for live/in-progress games
- Single atomic write prevents timing issues
- Diff check includes quarter scores to avoid unnecessary writes
- Boxscore data preferred over scoring plays (more reliable)
- Falls back to scoring plays if boxscore unavailable

### Why This Function Exists

**Problem**: Timing issues with separate writes
- `upsertGameFromEspnEvent` writes status/scores
- `updateSplitsFromSummary` writes quarter scores separately
- Race conditions between reads/writes

**Solution**: Combined atomic write
- Fetches both scoreboard and summary data
- Writes everything in single operation
- Prevents partial updates and race conditions

### Used By
- `liveUpdateLeagueGames` - Live game updates

### Related Documentation
- [Function: upsertGameFromEspnEvent](./game-ingestion.md#upsertGameFromEspnEvent)
- [Function: updateSplitsFromSummary](./game-ingestion.md#updateSplitsFromSummary)
- [Data Models: Game](../../data-models/game.md)

