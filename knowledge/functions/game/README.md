# Game Functions Documentation

## Overview
Documentation for core game management functions in Firebase Cloud Functions (`functions/index.js`). These functions handle ESPN integration, game ingestion, live updates, and winner computation.

## Function Categories

### ESPN Integration
Functions that fetch data from ESPN's public APIs.

- **[espn-integration.md](./espn-integration.md)**
  - `getSportPaths` - Map sport codes to ESPN API paths
  - `fetchScoreboardEvents` - Fetch games from ESPN Scoreboard API
  - `findTeamByEspn` - Match ESPN teams to Firestore teams
  - `mapStatusFields` - Normalize ESPN game status
  - `extractBroadcastProvider` - Extract TV network

### Game Ingestion
Functions that create and update game documents.

- **[game-ingestion.md](./game-ingestion.md)**
  - `ingestGamesForSportDate` - Bulk game ingestion for a date
  - `upsertGameFromEspnEvent` - Create/update single game
  - `updateGameWithCompleteData` - Atomic update with quarter scores

### Live Updates
Functions that monitor and update live games.

- **[live-updates.md](./live-updates.md)**
  - `liveUpdateLeagueGames` - Update all live games for a sport
  - `updateSplitsFromSummary` - Fetch quarter scores from ESPN
  - `reconcileGameWinnersInternal` - Catch missed winner assignments

### Time & Date Helpers
Pure functions for date handling in Eastern Time.

- **[time-helpers.md](./time-helpers.md)**
  - `formatEtYyyyMmDd` - Format date as YYYYMMDD in ET
  - `formatEtDashedYyyyMmDd` - Format date as YYYY-MM-DD in ET
  - `getCurrentNflTuesdayUtc` - Find current NFL week Tuesday
  - `computeNflWeeklyDates` - Generate Thu/Sun/Mon dates for week
  - `getNflSlateDatesForWeek` - Public wrapper for weekly dates
  - `getEasternDayInfo` - Extract ET day/time info
  - `isWithinNflLiveWindow` - Check if in typical game window

### Winner Computation
Pure functions for calculating winning squares.

- **[winner-computation.md](./winner-computation.md)**
  - `computeWinningIndexFromDigits` - Calculate winning square (unused)
  - `formatPeriodLabel` - Format period for display ("q1" → "first")

## Function Types

### Pure Functions
No side effects, deterministic output.
- All time/date helpers
- Winner computation helpers
- ESPN data transformers

### Database Read Functions
Read from Firestore, no writes.
- `findTeamByEspn` - Team lookup

### Database Write Functions
Modify Firestore data.
- `upsertGameFromEspnEvent` - Game documents
- `updateGameWithCompleteData` - Game documents
- `updateSplitsFromSummary` - Game documents

### Orchestration Functions
Coordinate multiple operations.
- `ingestGamesForSportDate` - Ingestion pipeline
- `liveUpdateLeagueGames` - Live update pipeline
- `reconcileGameWinnersInternal` - Reconciliation pipeline

## Data Flow

### Initial Game Ingestion
```
ESPN Scoreboard API
  ↓
fetchScoreboardEvents()
  ↓
ingestGamesForSportDate()
  ↓ (for each event)
findTeamByEspn() → upsertGameFromEspnEvent()
  ↓
Firestore games/{gameId}
```

### Live Game Updates
```
Scheduled Function (every minute)
  ↓
liveUpdateLeagueGames("NFL")
  ↓
Query: isLive=true OR (status=scheduled, startTime within 4h)
  ↓
Group by gameDate
  ↓
fetchScoreboardEvents(date) + ESPN Summary API
  ↓
updateGameWithCompleteData()
  ↓
Firestore games/{gameId} (status + quarter scores)
  ↓ (triggers)
onGameUpdatedAssignWinners
  ↓
assignWinnersForBoardPeriod()
```

### Daily Reconciliation
```
Scheduled Function (daily 09:10 UTC)
  ↓
Query: games updated in last 3 days
  ↓ (for each game)
reconcileGameWinnersInternal()
  ↓
Check each period (q1, q2, q3, final)
  ↓
assignWinnersForBoardPeriod() (if not assigned)
```

## ESPN API Endpoints Used

### Scoreboard API
```
https://site.api.espn.com/apis/site/v2/sports/{sportPath}/{league}/scoreboard?dates={YYYYMMDD}
```
**Returns**: Game list, scores, status, teams, broadcast info

### Summary API
```
https://site.api.espn.com/apis/site/v2/sports/{sportPath}/{league}/summary?event={gameId}
```
**Returns**: Detailed game data, boxscore, quarter scores, scoring plays

## Timezone Handling

### Critical Rule
**All NFL game scheduling uses America/New_York (Eastern Time)**

### Why Eastern Time?
- NFL schedule published in ET
- ESPN API returns UTC, but "game day" is ET-based
- Monday Night Football on "Monday" means Monday in ET
- Tuesday 05:00 ET is weekly boundary

### Implementation
All date formatting functions use:
```javascript
new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  // ...
})
```

### Common Pitfall
```javascript
// WRONG - Uses local timezone
const gameDate = new Date().toISOString().split('T')[0];

// CORRECT - Uses Eastern Time
const gameDate = formatEtDashedYyyyMmDd(new Date());
```

## Performance Optimizations

### Diff Checking
Before writing to Firestore, compare with existing data:
```javascript
if (!needsUpdate) {
  return gameRef; // Skip write
}
```

Saves ~70% of writes during live updates.

### Batch Fetching
Fetch related documents in single call:
```javascript
const games = await db.getAll(...gameRefs);  // Parallel fetch
```

### Parallel Queries
Run independent queries simultaneously:
```javascript
const [liveSnap, scheduledSnap] = await Promise.all([
  db.collection("games").where("isLive", "==", true).get(),
  db.collection("games").where("status", "==", "scheduled").get()
]);
```

### Retry Logic with Backoff
```javascript
async function axiosGetWithRetry(url, options, attempts = 3, backoffMs = 500) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await axios.get(url, options);
    } catch (e) {
      if (shouldRetry(e) && i < attempts - 1) {
        const delay = backoffMs * Math.pow(2, i);  // Exponential backoff
        await sleep(delay);
        continue;
      }
      throw e;
    }
  }
}
```

## Error Handling Patterns

### Continue on Individual Failures
```javascript
for (const gameId of gameIds) {
  try {
    await updateGame(gameId);
  } catch (err) {
    console.error(`Failed for ${gameId}:`, err.message);
    continue;  // Don't fail entire batch
  }
}
```

### Read-Only Operations Throw
```javascript
const teamRef = await findTeamByEspn(db, sport, espnTeam);
if (!teamRef) {
  throw new Error('Team not found. Please add manually.');
}
```

Admin must fix data, system won't auto-create.

### Graceful Degradation
```javascript
try {
  quarterScores = await fetchQuarterScores(gameId);
} catch (err) {
  console.warn('Quarter scores unavailable:', err.message);
  quarterScores = {}; // Continue without
}
```

## Scheduled Functions

### Weekly Ingestion
```javascript
exports.scheduleIngestNflWeeklySlate = onSchedule({
  schedule: "0 9 * * 2",  // Every Tuesday 09:00 UTC (05:00 ET)
  timeZone: "UTC",
  memory: "256MiB"
}, async () => { ... });
```

### Live Updates
```javascript
exports.liveUpdateNflGames = onSchedule({
  schedule: "*/1 * * * *",  // Every minute
  timeZone: "UTC",
  memory: "256MiB"
}, async () => { ... });
```

### Daily Reconciliation
```javascript
exports.reconcileWinnersDaily = onSchedule({
  schedule: "10 9 * * *",  // Daily 09:10 UTC (05:10 ET)
  timeZone: "UTC",
  memory: "256MiB"
}, async () => { ... });
```

## Testing & Development

### Manual Triggers

#### Ingest Single Date
```javascript
// Cloud Function callable
const result = await functions.httpsCallable('ingestNflGamesByDate')({
  date: '20241215'
});
```

#### Update Single Game
```javascript
const result = await functions.httpsCallable('liveUpdateGameOnce')({
  gameId: '401772826'
});
```

#### Reconcile Single Game
```javascript
const result = await functions.httpsCallable('reconcileGameWinners')({
  gameId: '401772826'
});
```

### Kill Switch
```bash
# Disable live updates without redeployment
firebase functions:config:set env.disable_live_updates="true"
```

### HTTP Endpoints (Testing)
```http
GET /ingestNflGamesByDateHttp?date=20241215
GET /resetAndTriggerWinnersHttp?gameId=401772826
```

## Common Patterns

### ESPN Team Matching
```javascript
// Try multiple strategies
1. externalIds.espn (most reliable)
2. sport + abbrev (fallback)
3. team_id (legacy)
// Throw if not found
```

### Game Update Flow
```javascript
1. Fetch ESPN data
2. Find/create team references
3. Extract metadata
4. Diff check existing data
5. Write if changed (merge write)
```

### Winner Assignment Trigger
```javascript
// Game document updates trigger Cloud Function
onDocumentUpdated('games/{gameId}') 
  ↓
Detect quarter transitions
  ↓
Query boards for game
  ↓
Assign winners per board
```

## Related Documentation

- [Data Models: Game](../../data-models/game.md)
- [Data Models: Board](../../data-models/board.md)
- [Data Models: Team](../../data-models/team.md)
- [Business Rules: Winner Assignment](../../business-rules/winner-assignment.md)
- [Business Rules: Live Updates](../../business-rules/live-updates.md)
- [Cloud Functions](../README.md) - All Cloud Functions overview

