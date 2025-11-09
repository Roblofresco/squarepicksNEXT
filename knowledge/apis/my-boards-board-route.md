# API: My Boards - Single Board

## Endpoint

`GET /api/my-boards/board?id={boardId}`

## Purpose

Fetches a single board where the authenticated user has purchased squares.

## Authentication

**Required** - Firebase ID Token in Authorization header (`Bearer <token>`)

## Input

- **Query Params**:
  - `id` (required): Board ID to fetch
- **Headers**:
  - `Authorization: Bearer <firebase_id_token>` (required)

## Output

```json
{
  "success": true,
  "boards": [
    {
      "id": "string",
      "gameId": "string",
      "homeTeam": {
        "name": "string",
        "initials": "string"
      },
      "awayTeam": {
        "name": "string",
        "initials": "string"
      },
      "gameDateTime": "ISO8601 string",
      "status": "string",
      "amount": "number",
      "stake": "number",
      "pot": "number",
      "is_live": "boolean",
      "broadcast_provider": "string",
      "sport": "string",
      "league": "string",
      "userSquareCount": "number",
      "isFull": "boolean",
      "selected_indexes_on_board": ["number"],
      "totalSquareCount": 100,
      "userPickedSquares": [
        {
          "index": "number",
          "isUserSquare": true,
          "square": "string"
        }
      ],
      "q1_winning_square": "string",
      "q2_winning_square": "string",
      "q3_winning_square": "string",
      "q4_winning_square": "string",
      "q1_winning_index": "number",
      "q2_winning_index": "number",
      "q3_winning_index": "number",
      "q4_winning_index": "number",
      "userWon_q1": "boolean",
      "userWon_q2": "boolean",
      "userWon_q3": "boolean",
      "userWon_final": "boolean"
    }
  ],
  "timestamp": "number"
}
```

## Response Headers

- `X-MyBoards-Board-Squares`: Number of user's squares on this board
- `X-MyBoards-Error`: Error code if query fails

## Error Codes

- **400**: Missing board ID - Returns empty boards array with `X-MyBoards-Error: missing-board-id`
- **401**: Unauthorized - Missing or invalid Firebase ID token
- **404**: Board not found - Returns empty boards array with `X-MyBoards-Error: board-not-found`
- **500**: Returns success with empty boards array and error in response/header

## Implementation Details

### Data Flow

1. **Verify Authentication**: Validates Firebase ID token
2. **Query User Squares**: Queries `squares` collection where `boardId == {id}` AND `userID == userRef`
3. **Fetch Board**: Retrieves single board document by ID
4. **Build Response**: Returns board with user's squares

### Performance

- Single compound query: `boardId` + `userID`
- Returns empty array if user has no squares on board
- No game/team data fetching for minimal response time

### Caching

- No explicit Cache-Control header (uses Next.js defaults)

## Used By

- Board detail pages
- Real-time board updates
- Verification of user participation

## Related Functions

### Firestore Collections

- `squares` - Top-level squares collection
- `boards` - Board documents

### Dependencies

- `@/lib/firebase-admin` - Firebase Admin SDK initialization
- `firebase-admin/auth` - Token verification
- `firebase-admin/firestore` - Firestore queries

## Notes

- Mirrors Cloud Function query logic for consistency
- Does NOT verify user actually owns squares (query handles authorization)
- Returns minimal board data without enrichment
- Uses placeholder team info (name: 'Home'/'Away', initials: 'HM'/'AW')

