# ESPN Integration Functions

## Overview
Functions that integrate with ESPN's public APIs to fetch real-time game data, scores, and metadata.

---

## getSportPaths

### Type
Helper Function (Pure)

### Purpose
Maps sport abbreviation to ESPN API path and league identifier.

### Input
- **sport** (string): Sport code (e.g., "NFL", "CFB", "NBA", "WNBA")

### Output
```javascript
{
  sportPath: "football",  // ESPN API sport path
  league: "nfl"           // ESPN league identifier
}
```

### Logic
```javascript
const key = String(sport || "").toUpperCase();
switch (key) {
  case "NFL": return { sportPath: "football", league: "nfl" };
  case "CFB": return { sportPath: "football", league: "college-football" };
  case "NBA": return { sportPath: "basketball", league: "nba" };
  case "WNBA": return { sportPath: "basketball", league: "wnba" };
  default: return { sportPath: "football", league: "nfl" }; // Default to NFL
}
```

### Supported Sports
- **NFL**: Professional football (primary)
- **CFB**: College football
- **NBA**: Professional basketball
- **WNBA**: Women's professional basketball

### Business Rules
- Case-insensitive matching
- Defaults to NFL if sport unknown
- Returns consistent ESPN API path structure

### Used By
- `fetchScoreboardEvents`
- `updateSplitsFromSummary`
- `liveUpdateGameOnce`

---

## fetchScoreboardEvents

### Type
Async Data Retrieval Function

### Purpose
Fetches all games for a specific sport and date from ESPN Scoreboard API with retry logic.

### Input
- **sport** (string): Sport code (e.g., "NFL")
- **yyyymmdd** (string): Date in YYYYMMDD format (e.g., "20241215")

### Output
```javascript
Array<EspnEvent> // Array of game events from ESPN API
```

### Logic

#### Step 1: Build ESPN API URL
```javascript
const { sportPath, league } = getSportPaths(sport);
const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/${league}/scoreboard?dates=${yyyymmdd}`;
```

Example URLs:
- NFL: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20241215`
- NBA: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20241215`

#### Step 2: Execute with Retry
```javascript
const resp = await axiosGetWithRetry(url, {
  timeout: 15000,
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, 3, 600); // 3 attempts, 600ms base backoff
```

#### Step 3: Extract Events
```javascript
return resp?.data?.events || [];
```

### Retry Strategy
Uses `axiosGetWithRetry` helper:
- **Attempts**: 3
- **Backoff**: Exponential (600ms, 1200ms, 2400ms)
- **Retry Conditions**:
  - HTTP 429 (Rate Limit)
  - HTTP 5xx (Server Errors)
  - Network errors

### ESPN Response Structure
```json
{
  "events": [
    {
      "id": "401772826",
      "date": "2024-12-15T18:30:00Z",
      "season": { "year": 2024 },
      "week": { "number": 15 },
      "competitions": [
        {
          "competitors": [
            {
              "homeAway": "home",
              "team": { "id": "1", "abbreviation": "KC" },
              "score": "21"
            },
            {
              "homeAway": "away",
              "team": { "id": "2", "abbreviation": "BUF" },
              "score": "17"
            }
          ],
          "status": {
            "type": { "name": "STATUS_IN_PROGRESS", "state": "in" },
            "period": 3,
            "displayClock": "12:34"
          },
          "broadcasts": [
            { "names": ["NBC"], "shortName": "NBC" }
          ]
        }
      ]
    }
  ]
}
```

### Database Operations
None (read-only API call)

### Business Rules
- Only fetches games for specified date
- No filtering by team or status
- Returns all events regardless of game state
- User-Agent header required to avoid rate limiting

### Error Handling
- Retries on transient errors (429, 5xx)
- Throws on permanent errors (404, 401)
- Logs errors with sport and date context

### Used By
- `ingestGamesForSportDate` - Bulk game ingestion
- `liveUpdateLeagueGames` - Live score updates
- `scheduleIngestNflWeeklySlate` - Weekly scheduled ingestion

### Related Documentation
- [ESPN Scoreboard API](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard)
- [Function: axiosGetWithRetry](./helpers.md#axiosGetWithRetry)

---

## findTeamByEspn

### Type
Async Database Lookup Function

### Purpose
Finds a Firestore team document matching ESPN team data. Tries multiple lookup strategies with read-only behavior.

### Input
- **db** (Firestore): Firestore database instance
- **sport** (string): Sport code (e.g., "NFL")
- **espnTeam** (object): ESPN team object from API response

### Output
```javascript
DocumentReference // Firestore team document reference
```

### Logic

#### Lookup Strategy (Priority Order)

**1. Match by ESPN ID (externalIds.espn)**
```javascript
const espnId = String(espnTeam?.id || "");
if (espnId) {
  const q1 = await teamsCol.where("externalIds.espn", "==", espnId).limit(1).get();
  if (!q1.empty) return q1.docs[0].ref;
}
```

**2. Match by Sport + Abbreviation**
```javascript
const abbrev = String(espnTeam?.abbreviation || espnTeam?.shortDisplayName || "").trim();
if (abbrev) {
  const q2 = await teamsCol
    .where("sport", "==", sport)
    .where("abbrev", "==", abbrev)
    .limit(1)
    .get();
  if (!q2.empty) return q2.docs[0].ref;
}
```

**3. Legacy Match by team_id**
```javascript
if (espnId) {
  const q3 = await teamsCol.where("team_id", "==", espnId).limit(1).get();
  if (!q3.empty) return q3.docs[0].ref;
}
```

**4. Not Found - Throw Error**
```javascript
throw new Error(
  `Team not found: ${espnTeam?.displayName} (ESPN ID: ${espnId}). ` +
  `Please add this team to Firestore manually.`
);
```

### ESPN Team Object Structure
```json
{
  "id": "12",
  "abbreviation": "KC",
  "shortDisplayName": "Chiefs",
  "displayName": "Kansas City Chiefs",
  "name": "Chiefs"
}
```

### Database Operations

#### Collections Read
- `teams` - Team documents

#### Indexes Required
- `teams`: `externalIds.espn` (string)
- `teams`: composite on `sport` (string) + `abbrev` (string)
- `teams`: `team_id` (string) [legacy]

### Business Rules
- **Read-only**: Never creates teams automatically
- **Throws error** if team not found (admin must add manually)
- Tries multiple strategies to handle data inconsistencies
- Prioritizes ESPN ID (most reliable)
- Falls back to sport+abbreviation (handles missing ESPN IDs)
- Checks legacy team_id field (backwards compatibility)

### Error Cases

#### Team Not Found
```javascript
Error: Team not found: Kansas City Chiefs (ESPN ID: 12). 
Please add this team to Firestore manually.
```

**Resolution**: Admin must create team document with correct ESPN ID or abbreviation

### Used By
- `upsertGameFromEspnEvent` - Game ingestion
- `updateGameWithCompleteData` - Live updates

### Migration Context
Multiple lookup strategies handle historical data inconsistencies:
- Early versions used `team_id` field
- Current version uses `externalIds.espn`
- Abbreviation matching handles missing IDs

### Related Documentation
- [Data Models: Team](../../data-models/team.md)
- [Business Rules: Team Management](../../business-rules/team-management.md)

---

## mapStatusFields

### Type
Pure Transformation Function

### Purpose
Extracts and normalizes game status fields from ESPN competition data into standardized format.

### Input
- **comp** (object): ESPN competition object from API response

### Output
```javascript
{
  status: "in_progress",      // Normalized status (lowercase, no STATUS_ prefix)
  statusState: "in",           // ESPN state: "pre", "in", "post"
  statusDetail: "12:34 - 3rd Quarter",
  quarter: 3,                  // Current period number
  timeRemaining: "12:34",      // Clock display
  isLive: true,                // Boolean if game is live
  isOver: false                // Boolean if game is final
}
```

### Logic

#### Step 1: Extract ESPN Status Fields
```javascript
const s = comp?.status?.type || {};
const period = comp?.status?.period;
const displayClock = comp?.status?.displayClock;
const rawStatus = s?.name || "scheduled";
```

#### Step 2: Normalize Status String
```javascript
let status = String(rawStatus);
if (status.startsWith("STATUS_")) {
  status = status.substring(7); // Remove "STATUS_" prefix
}
status = status.toLowerCase();
```

**ESPN Status Mapping**:
- `STATUS_SCHEDULED` → `scheduled`
- `STATUS_IN_PROGRESS` → `in_progress`
- `STATUS_HALFTIME` → `halftime`
- `STATUS_FINAL` → `final`
- `STATUS_END_PERIOD` → `end_period`

#### Step 3: Determine Game State
```javascript
const statusState = s?.state || "pre";
const statusDetail = s?.detail || "";
const isLive = statusState === "in";
const isOver = status === "final";
```

### ESPN Competition Status Structure
```json
{
  "status": {
    "type": {
      "name": "STATUS_IN_PROGRESS",
      "state": "in",
      "detail": "12:34 - 3rd Quarter"
    },
    "period": 3,
    "displayClock": "12:34"
  }
}
```

### Status States

#### Pre-Game (`state: "pre"`)
- `scheduled`: Game not started
- `postponed`: Game delayed
- `canceled`: Game canceled

#### Live (`state: "in"`)
- `in_progress`: Game in progress
- `halftime`: Halftime break
- `end_period`: End of quarter

#### Post-Game (`state: "post"`)
- `final`: Game complete
- `final/ot`: Game complete with overtime

### Business Rules
- Normalizes ESPN's inconsistent status naming
- Removes `STATUS_` prefix for cleaner storage
- Uses lowercase for consistency
- `isLive` only true during active play (not halftime)
- `isOver` true only for final status

### Used By
- `upsertGameFromEspnEvent` - Game creation/update
- `updateGameWithCompleteData` - Live updates
- UI components for game status display

### Related Documentation
- [Data Models: Game](../../data-models/game.md)
- [ESPN API Status Values](https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard)

---

## extractBroadcastProvider

### Type
Pure Extraction Function

### Purpose
Extracts primary broadcast network from ESPN competition broadcasts array.

### Input
- **comp** (object): ESPN competition object

### Output
```javascript
"NBC"  // Network abbreviation, or empty string if none
```

### Logic
```javascript
try {
  const b = Array.isArray(comp?.broadcasts) ? comp.broadcasts[0] : null;
  return b?.names?.[0] || b?.shortName || "";
} catch {
  return "";
}
```

### ESPN Broadcast Structure
```json
{
  "broadcasts": [
    {
      "names": ["NBC Sunday Night Football"],
      "shortName": "NBC"
    }
  ]
}
```

### Extraction Priority
1. First name in `names` array
2. Fall back to `shortName`
3. Return empty string if none

### Business Rules
- Returns only primary broadcast (first in array)
- Gracefully handles missing broadcast data
- Returns empty string (not null) for consistent typing

### Common Values
- `"NBC"` - Sunday Night Football
- `"FOX"` - NFC games
- `"CBS"` - AFC games
- `"ESPN"` - Monday Night Football
- `"ABC"` - Select prime games
- `"NFL+"` - Streaming-only games
- `""` - No broadcast info

### Used By
- `upsertGameFromEspnEvent` - Game metadata
- UI to display "Watch on NBC" badges

### Related Documentation
- [Data Models: Game](../../data-models/game.md#broadcastProvider)

