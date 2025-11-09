# My Boards All API (Diagnostic)

## Endpoint
**GET** `/api/my-boards/all`

## Authentication
Required - Firebase ID Token in Authorization header

## Purpose
Diagnostic endpoint that tests all possible square query variants to identify which userID field formats exist in the database. Used for migration and debugging.

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
  "boards": [...],
  "timestamp": 1702656000000
}
```

### Response Headers
- `X-MyBoards-All`: Total board count
- `X-MyBoards-Squares`: Total square count found
- `X-MyBoards-Variants`: JSON object showing counts per query variant

**Variants Tracked**:
```json
{
  "userID_ref": 45,    // squares where userID = DocumentReference
  "userID_uid": 12,    // squares where userID = string UID
  "userID_path": 3,    // squares where userID = "users/{uid}" path
  "userId_ref": 0,     // squares where userId = DocumentReference
  "userId_uid": 0,     // squares where userId = string UID
  "userId_path": 0     // squares where userId = "users/{uid}" path
}
```

## Query Logic

### Parallel Query Variants
Runs 6 queries simultaneously using `collectionGroup('squares')`:
1. `userID` == DocumentReference (userRef)
2. `userID` == string UID (userId)
3. `userID` == path string ("users/{userId}")
4. `userId` == DocumentReference (userRef)
5. `userId` == string UID (userId)
6. `userId` == path string ("users/{userId}")

### Deduplication
- Merges all results by document path
- Eliminates duplicates across variants
- Returns unified board list

## Database Operations

### Collections Read
1. `squares` (collectionGroup) - All squares across all boards
2. `boards` - Board documents for found squares

### Indexes Required
Optional - queries gracefully fail if indexes missing:
- `squares`: `userID` (various types)
- `squares`: `userId` (various types)

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 500 Internal Server Error (Soft Fail)
```json
{
  "success": true,
  "boards": [],
  "timestamp": 1702656000000,
  "error": "error message"
}
```

## Business Rules
- Used ONLY for diagnostics and migration testing
- NOT for production board fetching
- Provides minimal board data (no game/team enrichment)
- Helps identify data inconsistencies during migration

## Migration Context
This endpoint addresses historical data inconsistencies:

**Problem**: Earlier versions stored userID in different formats:
- Some as Firebase DocumentReference
- Some as string UID
- Some as path string "users/{uid}"
- Field name varied between `userID` and `userId`

**Solution**: Query all variants and merge results

## Used By
- Database migration scripts
- DevOps team for data consistency checks
- NOT used by production frontend

## Related Documentation
- [Data Models: Square](../data-models/square.md)
- [Migration Guide](../migrations/square-userID-migration.md)
- [API: My Boards](./my-boards.md) - Production endpoint

