# My Boards API

## Endpoint
**GET** `/api/my-boards`

## Authentication
Required - Firebase ID Token in Authorization header

## Purpose
Fetches all boards where the authenticated user has purchased squares, including game details, team information, win status, and sweepstakes metadata.

## Request
- **Method**: GET
- **Headers**: 
  - `Authorization: Bearer <firebase-id-token>`
- **Body**: None

## Response

### Success Response (200)
```json
{
  "success": true,
  "boards": [
    {
      "id": "board123",
      "gameId": "game456",
      "homeTeam": {
        "id": "team1",
        "name": "Kansas City Chiefs",
        "fullName": "Kansas City Chiefs",
        "initials": "KC",
        "record": "11-1",
        "logo": "https://...",
        "color": "#E31837",
        "seccolor": "#FFB612"
      },
      "awayTeam": {
        "id": "team2",
        "name": "Buffalo Bills",
        "fullName": "Buffalo Bills",
        "initials": "BUF",
        "record": "10-2",
        "logo": "https://..."
      },
      "gameDateTime": "2024-12-15T18:30:00.000Z",
      "status": "active",
      "amount": 10,
      "stake": 10,
      "pot": 800,
      "is_live": true,
      "broadcast_provider": "NBC",
      "sport": "NFL",
      "league": "NFL",
      "userSquareCount": 5,
      "isFull": true,
      "selected_indexes_on_board": [0, 1, 2, ...],
      "totalSquareCount": 100,
      "userPickedSquares": [
        { "index": 23, "isUserSquare": true, "square": "37" }
      ],
      "q1_winning_square": "37",
      "q2_winning_square": null,
      "q3_winning_square": null,
      "q4_winning_square": null,
      "userWon_q1": true,
      "userWon_q2": false,
      "userWon_q3": false,
      "userWon_final": false,
      "sweepstakesID": "sweep789",
      "sweepstakesTitle": "NFL Showdown"
    }
  ],
  "timestamp": 1702656000000
}
```

### Response Fields
- **success**: Boolean operation status
- **boards**: Array of board objects
  - **id**: Board document ID
  - **gameId**: Associated game document ID
  - **homeTeam/awayTeam**: Team details (name, logo, colors, record)
  - **gameDateTime**: ISO 8601 game start time
  - **status**: Board status (`open`, `full`, `active`, `closed`, `unfilled`)
  - **amount**: Entry fee per square ($)
  - **stake**: Same as amount (for consistency)
  - **pot**: Total prize pool (amount × 80 squares)
  - **is_live**: Boolean indicating if game is currently live
  - **userSquareCount**: Number of squares user owns on this board
  - **isFull**: Boolean if all 100 squares are taken
  - **userPickedSquares**: Array of user's squares with index and square value
  - **q1/q2/q3/q4_winning_square**: Winning square for each period (format: "37")
  - **userWon_q1/q2/q3/final**: Boolean win status for each period
  - **sweepstakesID**: Associated sweepstakes ID (if free board)
  - **sweepstakesTitle**: Sweepstakes promotional title
- **timestamp**: Response generation timestamp

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
Missing or invalid Firebase ID token

### 500 Internal Server Error (Soft Fail)
```json
{
  "success": true,
  "boards": [],
  "timestamp": 1702656000000
}
```
Returns empty boards array on error to prevent page crashes

## Query Logic

### Step 1: Query User Squares
Queries top-level `squares` collection where `userID == userRef`

### Step 2: Group by Board
Extracts unique board IDs and groups squares by board

### Step 3: Fetch Boards
Fetches board documents directly (max 100 parallel gets)

### Step 4: Batch Fetch Related Data
- Games (from board.gameID references)
- Teams (from game.homeTeam/awayTeam references)
- Sweepstakes (from board.sweepstakesID references)

### Step 5: Query User Wins
Checks `users/{userId}/wins/{boardId}_{period}` documents for each board and period

### Step 6: Build Response
Combines all data into enriched board objects

## Database Operations

### Collections Read
1. `squares` - User's square selections
2. `boards` - Board details
3. `games` - Game information
4. `teams` - Team details
5. `sweepstakes` - Sweepstakes metadata
6. `users/{userId}/wins` - User win records (private)

### Indexes Required
- `squares`: `userID` (reference), `boardId` (string)
- `boards`: Document ID lookup
- None required for batch gets

## Business Rules
- Returns ALL boards (open, full, active, closed) - frontend filters by status
- Uses private wins subcollection for accurate win tracking
- Winning squares stored on game document (single source of truth)
- Free boards (amount=0) always have associated sweepstakes
- Pot calculation: amount × 80 squares (house retains 20%)

## Performance Optimizations
- Batch fetches for games/teams/sweepstakes (single round-trip)
- Parallel win queries for all boards
- Fallback mode available (`MY_BOARDS_FALLBACK=1`) for minimal data
- Caching: 60s with 120s stale-while-revalidate

## Fallback Mode
When `MY_BOARDS_FALLBACK=1` environment variable is set:
- Skips game/team/sweepstakes fetches
- Returns minimal board data with placeholder teams
- Used during migration or high-load periods

## Used By
- My Boards page (`/my-boards`)
- Dashboard board list
- User profile board history

## Related Documentation
- [Data Models: Board](../data-models/board.md)
- [Data Models: Square](../data-models/square.md)
- [Data Models: Game](../data-models/game.md)
- [Business Rules: Board States](../business-rules/board-lifecycle.md)
- [Business Rules: Winner Assignment](../business-rules/winner-assignment.md)

