# getBoardUserSelections

## Overview
Callable Cloud Function that retrieves all square selections (indices) for an authenticated user on a specific board.

## Function Type
`onCall` (Callable Cloud Function)

## Region
`us-east1`

## Authentication
Required - User must be authenticated via Firebase Auth

## Input Parameters

```typescript
{
  boardID: string;  // Required: Board document ID
}
```

## Function Logic

1. **Authentication Check**
   - Verifies user is authenticated
   - Extracts `userId` from auth token
   - Creates user DocumentReference

2. **Input Validation**
   - Validates `boardID` is provided
   - Throws `invalid-argument` if missing

3. **Query User Squares**
   - Queries top-level `squares` collection
   - Filters by:
     - `boardId` == provided boardID
     - `userID` == authenticated user's DocumentReference
   - Extracts `index` field from each square document

4. **Return Results**
   - Returns array of square indices (0-99)
   - Empty array if user has no selections on board

## Return Value

```typescript
{
  selectedIndexes: number[];  // Array of square indices (0-99)
}
```

## Query Details

### Collection
`squares` (top-level collection)

### Query Filters
```javascript
.where("boardId", "==", boardID)
.where("userID", "==", userDocRef)
```

### Index Requirements
- Composite index: `boardId ASC, userID ASC`
- Required for efficient query performance

## Error Handling

- `unauthenticated`: User not authenticated
- `invalid-argument`: Missing boardID
- `internal`: Query execution failed

## Use Cases

- Display user's selected squares on board UI
- Check if user has already entered a board
- Show user's square positions before numbers assigned

## Related Functions
- `enterBoard`: Creates square selections
- Used by frontend to display user's board participation

## Implementation Notes

### UserID Storage
- Squares store `userID` as DocumentReference
- Query must use DocumentReference (not string) for proper filtering
- DocumentReference created from authenticated user ID

### Square Index Format
- Indices are numbers (0-99)
- Represents position on 10x10 grid
- Returned as array for easy iteration

### Performance
- Query is efficient with proper composite index
- Returns only indices (not full square documents)
- Minimal data transfer

## Example Usage

```javascript
const result = await getBoardUserSelections({
  boardID: "abc123"
});

console.log(result.selectedIndexes);  // [10, 25, 42]
```

