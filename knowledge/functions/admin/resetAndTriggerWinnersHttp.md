# resetAndTriggerWinnersHttp

## Overview
HTTP testing function that resets quarter score fields and re-triggers winner assignment. Useful for testing winner assignment logic without modifying actual game scores.

## Trigger
- **Type**: `onRequest` (HTTP)
- **Region**: `us-east1`
- **Method**: GET or POST
- **CORS**: Enabled
- **Authentication**: None (testing function)

## Request Parameters

### Query/Body Parameters
- `gameId`: Game document ID (required)

### Example
```
GET /resetAndTriggerWinnersHttp?gameId=401772826
POST /resetAndTriggerWinnersHttp
Body: { "gameId": "401772826" }
```

## Flow

### 1. Validation
- Validates `gameId` parameter exists
- Fetches game document
- Returns 404 if game not found

### 2. Delete Quarter Score Fields
Deletes all quarter score fields:
- `homeQ1score`
- `awayQ1score`
- `homeQ2score`
- `awayQ2score`
- `homeQ3score`
- `awayQ3score`
- `homeFscore`
- `awayFscore`

### 3. Wait for Deletion
- 500ms delay to ensure deletion is processed
- Prevents race conditions with Firestore updates

### 4. Re-write Quarter Scores
- Reads original scores from game data (before deletion)
- Re-writes only fields that existed before
- Triggers `onGameUpdatedAssignWinners` function

### 5. Return Results
- Returns list of fields that were re-triggered

## Request/Response

### Request
```
GET /resetAndTriggerWinnersHttp?gameId=401772826
POST /resetAndTriggerWinnersHttp
Body: { "gameId": "401772826" }
```

### Success Response (200)
```json
{
  "success": true,
  "gameId": "401772826",
  "retriggeredFields": [
    "homeQ1score",
    "awayQ1score",
    "homeQ2score",
    "awayQ2score",
    "homeQ3score",
    "awayQ3score",
    "homeFscore",
    "awayFscore"
  ]
}
```

### Error Response (400)
```json
{
  "error": "gameId required"
}
```

### Error Response (404)
```json
{
  "error": "Game not found"
}
```

### Error Response (500)
```json
{
  "error": "Failed to reset and trigger",
  "details": "Error message"
}
```

## Use Cases
- **Testing**: Re-test winner assignment without changing scores
- **Debugging**: Troubleshoot winner assignment issues
- **Development**: Test winner assignment logic with existing scores

## How It Works
1. **Delete**: Removes quarter score fields from game document
2. **Wait**: Short delay for Firestore to process deletion
3. **Re-write**: Writes same scores back (triggers `onDocumentUpdated`)
4. **Trigger**: `onGameUpdatedAssignWinners` processes the update

## Notes
- **Testing Only**: Should not be used in production
- **No Score Changes**: Does not modify actual scores
- **Idempotent**: Can be called multiple times safely
- **Triggers Functions**: Re-triggers `onGameUpdatedAssignWinners`
- **Race Conditions**: Uses delay to prevent timing issues

## Related Functions
- `onGameUpdatedAssignWinners`: Processes winner assignment (triggered by this function)
- `reconcileGameWinners`: Manual reconciliation function
- `assignWinnersForBoardPeriod`: Core winner assignment logic

