# closeOldSweepstakesHttp

## Overview
HTTP Cloud Function that automatically closes sweepstakes when their associated game ends. Checks all active sweepstakes and closes those whose games have finished.

## Trigger
- **Type**: `onRequest` (HTTP)
- **Region**: `us-east1`
- **Method**: GET or POST
- **CORS**: Enabled

## Flow

### 1. Query Active Sweepstakes
- Queries `sweepstakes` collection where `status === "active"`
- Returns early if no active sweepstakes found

### 2. Check Game Status
For each active sweepstakes:
- Gets `gameID` DocumentReference
- Fetches game document
- Checks if game is finished:
  - `gameData.status === 'final'` OR
  - `gameData.isOver === true`

### 3. Close Sweepstakes
- Creates batch update for all sweepstakes to close
- Updates:
  - `status`: Changed to `"closed"`
  - `closedAt`: Server timestamp

### 4. Response
Returns JSON with:
- `success`: boolean
- `message`: Status message
- `closedSweepstakes`: Array of closed sweepstakes with:
  - `id`: Sweepstakes document ID
  - `gameId`: Game document ID
  - `gameStatus`: Game status at closure

## Request/Response

### Request
```
GET /closeOldSweepstakesHttp
POST /closeOldSweepstakesHttp
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Closed {count} sweepstakes",
  "closedSweepstakes": [
    {
      "id": "sweepstakesId",
      "gameId": "gameId",
      "gameStatus": "final"
    }
  ]
}
```

### No Sweepstakes to Close (200)
```json
{
  "success": true,
  "message": "No sweepstakes need to be closed"
}
```

### No Active Sweepstakes (200)
```json
{
  "success": true,
  "message": "No active sweepstakes found"
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Error message"
}
```

## Usage
- **Manual Trigger**: Call HTTP endpoint directly
- **Scheduled**: Can be called by Cloud Scheduler (recommended)
- **Frequency**: Daily or after games complete

## Sweepstakes Closure Criteria
- Sweepstakes status is `"active"`
- Associated game status is `"final"` OR `isOver === true`

## Error Handling
- Missing game reference: Skips sweepstakes, logs warning
- Missing game document: Skips sweepstakes, logs warning
- Batch commit failure: Returns 500 error

## Related Functions
- `createSweepstakesForMondayGame`: Creates sweepstakes that get closed here
- `onGameUpdatedAssignWinners`: Processes winners before closure

## Notes
- This is an HTTP function (not a trigger)
- Should be scheduled to run periodically (e.g., daily at 2 AM ET)
- Can also be called manually for testing
- No authentication required (consider adding admin auth)

