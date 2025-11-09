# Games Collection

## Overview
Represents scheduled, live, and completed sports games. Primary data source is ESPN API with real-time synchronization.

## Collection Path
`games/{gameId}`

## Document Structure

### Identification
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gameID` | string | Yes | ESPN event ID, matches document ID |
| `sport` | string | Yes | Sport identifier (NFL, CFB, NBA, WNBA) |
| `season` | string | Yes | Season year (e.g., "2024") |
| `week` | number | No | Week number (for sports with week structure) |

### Teams
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `homeTeam` | DocumentReference | Yes | Reference to teams collection |
| `awayTeam` | DocumentReference | Yes | Reference to teams collection |

### Scheduling
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startTime` | Timestamp | Yes | Game start time (UTC) |
| `gameDate` | string | Yes | Game date in ET (YYYY-MM-DD) |
| `broadcastProvider` | string | No | TV network/streaming service |

### Game Status
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | Game status (scheduled, in-progress, halftime, final) |
| `statusState` | string | Yes | Status state (pre, in, post) |
| `statusDetail` | string | No | Detailed status description |
| `quarter` | number | Yes | Current quarter/period (0-4) |
| `timeRemaining` | string | No | Clock display (e.g., "5:23") |
| `isLive` | boolean | Yes | True if game is currently in progress |
| `isOver` | boolean | Yes | True if game has ended |

### Scores - Current
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `homeScore` | number | Yes | Current/final home team score |
| `awayScore` | number | Yes | Current/final away team score |

### Scores - Quarter Splits
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `homeQ1score` | number | No | Home score at end of Q1 |
| `awayQ1score` | number | No | Away score at end of Q1 |
| `homeQ2score` | number | No | Home score at end of Q2 (halftime) |
| `awayQ2score` | number | No | Away score at end of Q2 (halftime) |
| `homeQ3score` | number | No | Home score at end of Q3 |
| `awayQ3score` | number | No | Away score at end of Q3 |
| `homeFscore` | number | No | Home final score (includes OT) |
| `awayFscore` | number | No | Away final score (includes OT) |

### Winning Squares
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `q1WinningSquare` | string | No | Q1 winning square (e.g., "47") |
| `q2WinningSquare` | string | No | Q2 winning square |
| `q3WinningSquare` | string | No | Q3 winning square |
| `finalWinningSquare` | string | No | Final winning square |

### Timestamps
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `created` | Timestamp | Yes | Document creation timestamp |
| `lastUpdated` | Timestamp | Yes | Last update from ESPN API |

## Winning Square Calculation

Winning squares are calculated from score last digits:
```
winningSquare = awayLastDigit + homeLastDigit
Example: Away 27, Home 14 → "74"
```

### Quarter-by-Quarter
- **Q1**: End of 1st quarter scores
- **Q2**: End of 2nd quarter (halftime) scores  
- **Q3**: End of 3rd quarter scores
- **Final**: Final game scores (includes overtime)

## Status Lifecycle

### Transitions
```
scheduled → in-progress → halftime → in-progress → final
```

### Status Values
- `scheduled`: Pre-game
- `in-progress`: Game is live (quarter 1-4)
- `halftime`: Between Q2 and Q3
- `final`: Game completed

### State Values
- `pre`: Before kickoff
- `in`: Game in progress
- `post`: Game finished

## ESPN API Integration

### Data Sources
1. **Scoreboard API**: Game status, current scores, basic info
   - Endpoint: `/scoreboard?dates={YYYYMMDD}`
   - Update frequency: Every 15 seconds during live window

2. **Summary API**: Quarter-by-quarter score splits
   - Endpoint: `/summary?event={gameId}`
   - Called after each quarter completion

### Live Update Windows
NFL games are checked during these windows (Eastern Time):
- **Thursday**: 19:00-23:00
- **Friday**: 14:00-18:00 (Black Friday)
- **Saturday**: 12:00-23:00 (late season)
- **Sunday**: 09:00-23:00 (includes international games)
- **Monday**: 19:00-23:00

### Update Strategy
```javascript
// Scheduled: Every 15 seconds via Cloud Scheduler
exports.liveUpdateNflGames = onSchedule({
  schedule: "every 15 seconds",
  timeZone: "America/New_York"
}, async () => {
  // Only runs during live windows
  // Updates games marked isLive=true
  // Checks scheduled games within 4 hours of start
});
```

## Indexes Required
- `sport` + `isLive` + `isOver` (composite) - Live game queries
- `sport` + `status` + `startTime` (composite) - Scheduled game queries
- `gameDate` (ascending) - Date-based queries
- `season` + `week` (composite) - Season navigation

## Triggers

### onGameUpdatedAssignWinners
Fires when quarter scores change to assign winners:
```javascript
exports.onGameUpdatedAssignWinners = onDocumentUpdated({
  document: 'games/{gameId}'
}, async (event) => {
  // Detects quarter completions
  // Updates game winning squares
  // Triggers board winner assignment
});
```

**Trigger Conditions**:
- Q1: `quarter` changes from 1 → 2
- Q2: `status` changes to 'halftime'
- Q3: `quarter` changes from 3 → 4
- Final: `isOver` becomes true

### ensureGameBoards
Auto-creates boards when game status becomes 'scheduled':
```javascript
exports.ensureGameBoards = onDocumentWritten({
  document: "games/{gameId}"
}, async (event) => {
  // Creates boards for $1, $5, $10, $20 amounts
  // Only runs once when status = 'scheduled'
});
```

## Related Collections
- **teams**: Home and away team details
- **boards**: All boards for this game
- **squares**: All squares selected for this game (via boards)

## Business Rules

### Score Availability
- Quarter scores only available after quarter completion
- Quarter scores frozen once assigned
- Final scores include overtime (use `homeScore`/`awayScore`, not `homeFscore`/`awayFscore`)

### Winning Square Assignment
- Calculated independently from board data
- Stored on game document (single source of truth)
- Triggers winner assignment across all boards

### Game Lifecycle
- Games must exist before boards can be created
- Games in 'scheduled' status auto-generate standard boards
- Live games prevent new board creation

## Implementation Notes

### Diff-Based Updates
To minimize Firestore writes, updates only occur when values change:
```javascript
const needsUpdate = (
  existing.status !== statusFields.status ||
  existing.quarter !== statusFields.quarter ||
  existing.homeScore !== scores.homeScore ||
  // ... other fields
);
if (!needsUpdate) return; // Skip write
```

### Retry Logic
ESPN API calls include exponential backoff retry:
```javascript
async function axiosGetWithRetry(url, options, attempts = 3, backoffMs = 500) {
  // Retries on 429 (rate limit) and 5xx errors
  // Exponential backoff: 500ms, 1000ms, 2000ms
}
```

### Season Filtering
Only current season games (2024+) are ingested to avoid historical data pollution.

## Error Handling

### Missing Teams
If ESPN provides unknown team, function throws error:
```
Team not found: {teamName} (ESPN ID: {espnId}). 
Please add this team to Firestore manually.
```
**Resolution**: Manually add team document to teams collection

### API Timeouts
- Primary fetch timeout: 15 seconds
- Summary fetch timeout: 12 seconds
- Failed updates logged but don't block other games

### Concurrent Updates
All game document writes use `merge: true` to prevent overwrites of concurrent updates.

