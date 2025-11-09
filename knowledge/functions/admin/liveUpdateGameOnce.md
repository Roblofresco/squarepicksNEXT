# liveUpdateGameOnce

## Overview
Callable function that performs a single-cycle live update for one game. Fetches current game status and quarter scores from ESPN API and updates the game document.

## Trigger
- **Type**: `onCall` (Callable)
- **Region**: `us-east1`
- **Authentication**: Required

## Request Parameters
```typescript
{
  gameId: string  // Required: Game document ID
}
```

## Flow

### 1. Validation
- Validates `gameId` parameter exists
- Fetches game document from Firestore
- Throws `not-found` error if game doesn't exist

### 2. Get Sport Configuration
- Extracts `sport` from game document
- Calls `getSportPaths()` to get ESPN API paths
- Returns `sportPath` (e.g., "football") and `league` (e.g., "nfl")

### 3. Fetch Scoreboard Data
- Calculates game date in ET timezone using `formatEtYyyyMmDd()`
- Constructs ESPN scoreboard API URL
- Fetches scoreboard data with 15s timeout
- Finds matching event by game ID
- Calls `upsertGameFromEspnEvent()` to update game status/scores

### 4. Fetch Summary Data (Quarter Scores)
- Constructs ESPN summary API URL
- Calls `updateSplitsFromSummary()` to update quarter scores
- Handles errors gracefully (logs warning, continues)

## Response
```typescript
{
  success: true
}
```

## Error Handling
- **invalid-argument**: Missing `gameId`
- **not-found**: Game not found
- **Scoreboard fetch failure**: Logs warning, continues to summary fetch
- **Summary fetch failure**: Logs warning, returns success (partial update)

## ESPN API Endpoints

### Scoreboard API
```
https://site.api.espn.com/apis/site/v2/sports/{sportPath}/{league}/scoreboard?dates={YYYYMMDD}
```
- Updates: `status`, `quarter`, `timeRemaining`, `isLive`, `isOver`, `homeScore`, `awayScore`

### Summary API
```
https://site.api.espn.com/apis/site/v2/sports/{sportPath}/{league}/summary?event={gameId}
```
- Updates: `homeQ1score`, `homeQ2score`, `homeQ3score`, `homeFscore`, `awayQ1score`, `awayQ2score`, `awayQ3score`, `awayFscore`

## Use Cases
- **Manual Updates**: Force update a single game
- **Testing**: Test game update logic
- **Debugging**: Troubleshoot game data issues
- **Recovery**: Fix stale game data

## Notes
- **Single Game**: Updates only one game at a time
- **Two API Calls**: Makes separate calls for status and quarter scores
- **Error Tolerance**: Continues even if one API call fails
- **ET Timezone**: Uses Eastern Time for date calculation
- **Timeout**: 15s timeout for scoreboard API

## Related Functions
- `upsertGameFromEspnEvent()`: Updates game from ESPN event data
- `updateSplitsFromSummary()`: Updates quarter scores from ESPN summary
- `liveUpdateNflGames`: Scheduled function for bulk updates
- `onGameUpdatedAssignWinners`: Processes winners when scores update

