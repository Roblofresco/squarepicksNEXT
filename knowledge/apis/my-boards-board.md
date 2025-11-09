# My Boards Single Board API

## Endpoint
**GET** `/api/my-boards/board?id={boardId}`

## Authentication
Required - Firebase ID Token in Authorization header

## Purpose
Fetches a single board where the authenticated user has squares. Optimized for single-board queries with faster response time than fetching all boards.

## Request
- **Method**: GET
- **Headers**: 
  - `Authorization: Bearer <firebase-id-token>`
- **Query Parameters**:
  - `id` (required): Board document ID

## Response

### Success Response (200)
```json
{
  "success": true,
  "boards": [
    {
      "id": "board123",
      "gameId": "game456",
      "homeTeam": { "name": "Home", "initials": "HM" },
      "awayTeam": { "name": "Away", "initials": "AW" },
      "gameDateTime": "2024-12-15T18:30:00.000Z",
      "status": "open",
      "amount": 10,
      "stake": 10,
      "pot": 800,
      "is_live": false,
      "broadcast_provider": null,
      "sport": "NFL",
      "league": "NFL",
      "userSquareCount": 5,
      "isFull": false,
      "selected_indexes_on_board": [0, 1, 2, 23, 45],
      "totalSquareCount": 100,
      "userPickedSquares": [
        { "index": 23, "isUserSquare": true, "square": "37" },
        { "index": 45, "isUserSquare": true, "square": "62" }
      ],
      "q1_winning_square": null,
      "q2_winning_square": null,
      "q3_winning_square": null,
      "q4_winning_square": null,
      "userWon_q1": false,
      "userWon_q2": false,
      "userWon_q3": false,
      "userWon_final": false
    }
  ],
  "timestamp": 1702656000000
}
```

### Response Headers
- `X-MyBoards-Board-Squares`: Number of squares user owns on this board

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request (Missing ID)
```json
{
  "success": true,
  "boards": [],
  "timestamp": 1702656000000
}
```
Response header: `X-MyBoards-Error: missing-board-id`

### 404 Not Found (Board Doesn't Exist)
```json
{
  "success": true,
  "boards": [],
  "timestamp": 1702656000000
}
```
Response header: `X-MyBoards-Error: board-not-found`

### 404 Not Found (User Has No Squares)
```json
{
  "success": true,
  "boards": [],
  "timestamp": 1702656000000
}
```
Response header: `X-MyBoards-Board-Squares: 0`

## Query Logic

### Step 1: Query User Squares
Query: `squares` collection where `boardId == boardId AND userID == userRef`

### Step 2: Fetch Board
Direct document get: `boards/{boardId}`

### Step 3: Build Response
Minimal board object with user's squares

## Database Operations

### Collections Read
1. `squares` - User's squares for this specific board
2. `boards` - Single board document

### Indexes Required
- `squares`: composite index on `boardId` (string) + `userID` (reference)

## Business Rules
- Returns empty array if user has no squares on this board
- Returns minimal data (no game/team enrichment for performance)
- Used when board ID is already known
- Placeholder team data (enrichment done client-side)

## Performance Characteristics
- **Faster**: Single board query vs. fetching all boards
- **Lighter**: Minimal data without game/team joins
- **Targeted**: When board ID is known (e.g., from URL param)

## Use Cases

### When to Use
1. Board detail page with ID in URL (`/boards/{id}`)
2. Quick square verification for specific board
3. Real-time updates for single board (polling/SSE)

### When to Use `/api/my-boards` Instead
1. Displaying all user's boards (My Boards page)
2. Need game/team data enrichment
3. Don't have specific board ID

## Used By
- Board detail page square verification
- Real-time board status updates
- Quick user participation checks

## Related Documentation
- [API: My Boards](./my-boards.md) - Full boards list
- [Data Models: Square](../data-models/square.md)
- [Data Models: Board](../data-models/board.md)

