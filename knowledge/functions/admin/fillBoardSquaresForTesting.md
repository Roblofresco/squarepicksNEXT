# fillBoardSquaresForTesting

## Overview
HTTP testing function that fills board squares for UI testing. Updates board `selected_indexes` and creates square documents for a test user.

## Trigger
- **Type**: `onRequest` (HTTP)
- **Region**: Default
- **Method**: GET or POST
- **CORS**: Enabled
- **Authentication**: None (testing function)

## Request Parameters

### Query Parameters
- `boardIds`: Comma-separated list of board IDs (required)

### Example
```
GET /fillBoardSquaresForTesting?boardIds=board1,board2,board3
```

## Flow

### 1. Parse Board IDs
- Extracts `boardIds` from query parameters
- Splits comma-separated list
- Returns 400 error if no board IDs provided

### 2. Process Each Board
For each board ID:

#### 2a. Validate Board
- Checks if board document exists
- Skips if board not found (adds to results with error)

#### 2b. Update Board
- Sets `selected_indexes` to array `[0, 1, 2, ..., 99]` (all 100 squares)
- Overwrites existing selected indexes

#### 2c. Clear Existing Squares
- Queries squares subcollection for test user
- Deletes all existing squares for test user
- Uses batch delete for efficiency

#### 2d. Create Square Documents
- Creates 100 square documents in `boards/{boardId}/squares` subcollection
- Each square document:
  - `userID`: Test user DocumentReference
  - `index`: Square index (0-99)
  - `square`: Square index as string (e.g., `"0"`, `"1"`)
  - `created_time`: Server timestamp
- Uses batch write for atomicity

### 3. Return Results
- Returns array of results for each board processed
- Includes before/after `selected_indexes` and squares created count

## Hardcoded Values
- **Test User ID**: `"0CUDUtFMoTWujVvQuSlGaWG9fwP2"`
- **All Squares**: Array `[0, 1, 2, ..., 99]`

## Request/Response

### Request
```
GET /fillBoardSquaresForTesting?boardIds=board1,board2
POST /fillBoardSquaresForTesting?boardIds=board1,board2
```

### Success Response (200)
```json
{
  "success": true,
  "results": [
    {
      "boardId": "board1",
      "before": [0, 5, 10],        // Previous selected_indexes
      "after": [0, 1, 2, ..., 99], // All 100 squares
      "squaresCreated": 100
    },
    {
      "boardId": "board2",
      "before": [],
      "after": [0, 1, 2, ..., 99],
      "squaresCreated": 100
    }
  ]
}
```

### Error Response (400)
```json
{
  "error": "boardIds query parameter is required"
}
```

### Error Response (500)
```json
{
  "error": "Error message"
}
```

## Square Document Structure
```typescript
{
  userID: DocumentReference,  // Test user reference
  index: number,             // Square index (0-99)
  square: string,            // Square index as string
  created_time: Timestamp   // Server timestamp
}
```

## Use Cases
- **UI Testing**: Fill boards to test full board UI states
- **Development**: Quickly populate boards for testing
- **Demo**: Show board states with all squares selected

## Notes
- **Testing Only**: Should not be used in production
- **Overwrites Data**: Replaces existing squares for test user
- **No Validation**: Does not validate board status or game state
- **Hardcoded User**: Uses fixed test user ID
- **No Rollback**: Changes are permanent

## Related Functions
- `handleBoardFull`: Processes boards when they reach 100 squares
- `enterBoard`: User-facing function to enter boards
- `getBoardUserSelections`: Gets user's squares for a board

