# API: My Boards

## Endpoint

`GET /api/my-boards`

## Purpose

Fetches all boards where the authenticated user has purchased squares, including board details, game info, teams, and win status.

## Authentication

**Required** - Firebase ID Token in Authorization header (`Bearer <token>`)

## Input

- **Query Params**: None
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
        "id": "string",
        "name": "string",
        "fullName": "string",
        "initials": "string",
        "record": "string",
        "logo": "string",
        "color": "string",
        "seccolor": "string"
      },
      "awayTeam": { /* same structure as homeTeam */ },
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
      "userWon_q1": "boolean",
      "userWon_q2": "boolean",
      "userWon_q3": "boolean",
      "userWon_final": "boolean",
      "sweepstakesID": "string",
      "sweepstakesTitle": "string"
    }
  ],
  "timestamp": "number"
}
```

## Error Codes

- **401**: Unauthorized - Missing or invalid Firebase ID token
- **500**: Internal server error - Returns empty boards array with error header

## Implementation Details

### Data Flow

1. **Verify Authentication**: Validates Firebase ID token from Authorization header
2. **Query User Squares**: Queries top-level `squares` collection where `userID` equals user reference
3. **Extract Board IDs**: Collects unique board IDs from squares and groups squares by board
4. **Fetch Boards**: Retrieves board documents by ID (max 100 per batch)
5. **Batch Fetch Related Data**:
   - Games (from `gameID` references)
   - Teams (from game's `homeTeam` and `awayTeam` references)
   - Sweepstakes (from board's `sweepstakesID` reference)
6. **Query User Wins**: Checks user's wins subcollection for each board (q1, q2, q3, final)
7. **Build Response**: Combines all data into enriched board objects

### Feature Flags

- **MY_BOARDS_FALLBACK**: Set `process.env.MY_BOARDS_FALLBACK=1` to enable minimal response mode without fetching games/teams (faster, reduced reliability)

### Caching

- **Cache-Control**: `private, max-age=60, stale-while-revalidate=120`
- **Fallback Mode**: `private, max-age=120` with `X-MyBoards-Fallback: 1` header

### Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## Used By

- `src/app/my-boards/page.tsx` - My Boards page
- User dashboard components

## Related Functions

### Firestore Collections

- `squares` - User's purchased squares
- `boards` - Board documents
- `games` - Game documents
- `teams` - Team documents
- `sweepstakes` - Sweepstakes documents
- `users/{userId}/wins` - User win records

### Dependencies

- `@/lib/firebase-admin` - Firebase Admin SDK initialization
- `firebase-admin/auth` - Token verification
- `firebase-admin/firestore` - Firestore queries

## Performance Considerations

- Batches board fetches (Firestore `in` operator limit: 10 per query)
- Uses `db.getAll()` for batch fetching related documents (max 100)
- Groups squares by board in memory to avoid N+1 queries
- Parallel win queries for all boards
- Soft-fails to empty array on error to prevent page breaks

