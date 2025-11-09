# API: My Boards All (Debug)

## Endpoint

`GET /api/my-boards/all`

## Purpose

Debug route that queries all possible user ID field variants to diagnose data consistency issues during migration.

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

- `X-MyBoards-All`: Total number of boards found
- `X-MyBoards-Squares`: Total number of squares found
- `X-MyBoards-Variants`: JSON object with counts per field variant
- `X-MyBoards-Error`: Error message if query fails

## Error Codes

- **401**: Unauthorized - Missing or invalid Firebase ID token
- **500**: Returns success with empty boards array and error in response/header

## Implementation Details

### Query Variants

Queries **6 different field/value combinations** in parallel:

1. `userID` with reference (`db.doc('users/{userId}')`)
2. `userID` with UID string (`userId`)
3. `userID` with path string (`'users/{userId}'`)
4. `userId` with reference
5. `userId` with UID string
6. `userId` with path string

### Variant Tracking

Returns diagnostic headers showing which variants found squares:
- `userID_ref`: Count from userID field with DocumentReference
- `userID_uid`: Count from userID field with UID string
- `userID_path`: Count from userID field with path string
- `userId_ref`: Count from userId field with DocumentReference
- `userId_uid`: Count from userId field with UID string
- `userId_path`: Count from userId field with path string

### Data Deduplication

Merges results from all variants using square document path as unique key.

### Caching

- **Cache-Control**: `private, max-age=120`

## Used By

- Debug/diagnostic purposes during data migration
- Troubleshooting user square visibility issues

## Related Functions

### Firestore Collections

- `boards/{boardId}/squares` - CollectionGroup query for all user squares
- `boards` - Board documents

### Dependencies

- `@/lib/firebase-admin` - Firebase Admin SDK initialization
- `firebase-admin/auth` - Token verification
- `firebase-admin/firestore` - Firestore collection group queries

## Notes

- Uses `collectionGroup('squares')` to query nested squares collections
- Gracefully handles missing Firestore indexes (skips failed variants)
- Does NOT fetch game or team data for performance
- Returns minimal board data with placeholder team info
- Intended for migration debugging, not production use

