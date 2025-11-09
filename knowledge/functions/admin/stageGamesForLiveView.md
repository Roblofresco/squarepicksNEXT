# stageGamesForLiveView

## Overview
HTTP testing function that stages specific games with live status and scores for UI testing. Updates game documents and board statuses to simulate live game scenarios.

## Trigger
- **Type**: `onRequest` (HTTP)
- **Region**: `us-east1`
- **Method**: GET or POST
- **CORS**: Enabled
- **Authentication**: None (testing function)

## Flow

### 1. Stage Sweepstakes Game (401772826)
Updates game document:
- `status`: `"in_progress"`
- `isLive`: `true`
- `isOver`: `false`
- `quarter`: `2`
- `homeScore`: `14`
- `awayScore`: `10`
- `timeRemaining`: `"8:32"`
- `homeQ1score`: `7`
- `awayQ1score`: `3`
- `homeQ2score`: `7`
- `awayQ2score`: `7`

### 2. Stage 10/16 Game (401772941)
Updates game document:
- `status`: `"in_progress"`
- `isLive`: `true`
- `isOver`: `false`
- `quarter`: `3`
- `homeScore`: `21`
- `awayScore`: `17`
- `timeRemaining`: `"12:45"`
- `homeQ1score`: `7`
- `awayQ1score`: `0`
- `homeQ2score`: `7`
- `awayQ2score`: `10`
- `homeQ3score`: `7`
- `awayQ3score`: `7`

### 3. Fix Board Status
Updates board `nvvDMkAIAPDJHaeMpqWN`:
- `status`: `"active"`
- Removes `closed_at` field
- Removes `closure_reason` field
- Updates `updated_time` timestamp

## Request/Response

### Request
```
GET /stageGamesForLiveView
POST /stageGamesForLiveView
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Games successfully staged for live view",
  "stagedGames": [
    {
      "gameId": "401772826",
      "description": "Sweepstakes game - 2nd quarter, 8:32 remaining, 14-10"
    },
    {
      "gameId": "401772941",
      "description": "10/16 game - 3rd quarter, 12:45 remaining, 21-17"
    }
  ]
}
```

### Error Response (500)
```json
{
  "success": false,
  "error": "Error message"
}
```

## Use Cases
- **UI Testing**: Test live game views with specific scores
- **Development**: Simulate game states without waiting for real games
- **Demo**: Show live game functionality with controlled data

## Hardcoded Values
- **Game IDs**: `401772826`, `401772941`
- **Board ID**: `nvvDMkAIAPDJHaeMpqWN`
- **Scores**: Fixed quarter and total scores
- **Time Remaining**: Fixed time values

## Notes
- **Testing Only**: Should not be used in production
- **No Validation**: Does not validate game/board existence
- **Overwrites Data**: Replaces existing game/board data
- **No Rollback**: Changes are permanent

## Related Functions
- `liveUpdateGameOnce`: Updates a single game from ESPN API
- `onGameLiveCloseBoardsAndRefund`: Processes boards when games go live
- `onGameUpdatedAssignWinners`: Processes winners when scores update

