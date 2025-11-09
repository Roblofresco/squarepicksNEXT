# Squares Collection

## Overview
Represents individual square selections on boards. Each square is owned by one user and may have a winning coordinate once board numbers are assigned.

## Collection Path
`squares/{squareId}`

## Document Structure

### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `boardId` | string | Yes | Board document ID this square belongs to |
| `userID` | DocumentReference | Yes | Reference to user document |
| `index` | number | Yes | Square position on board (0-99) |
| `square` | string | Conditional | Two-digit coordinate (e.g., "47"), assigned when board full |

### Timestamps
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | Timestamp | Yes | Square selection timestamp |
| `updated_time` | Timestamp | Yes | Last update timestamp |

## Square Index System

### Grid Layout
Board is a 10x10 grid with 100 squares indexed 0-99:

```
        Home Numbers →
        0   1   2   3   4   5   6   7   8   9
A   0   0   1   2   3   4   5   6   7   8   9
w   1  10  11  12  13  14  15  16  17  18  19
a   2  20  21  22  23  24  25  26  27  28  29
y   3  30  31  32  33  34  35  36  37  38  39
    4  40  41  42  43  44  45  46  47  48  49
N   5  50  51  52  53  54  55  56  57  58  59
u   6  60  61  62  63  64  65  66  67  68  69
m   7  70  71  72  73  74  75  76  77  78  79
s   8  80  81  82  83  84  85  86  87  88  89
↓   9  90  91  92  93  94  95  96  97  98  99
```

### Index Calculation
```javascript
// From row/column to index
index = (awayIndex * 10) + homeIndex

// From index to row/column
homeIndex = index % 10
awayIndex = Math.floor(index / 10)
```

## Square Assignment Lifecycle

### Phase 1: Selection (status = 'open')
User selects square(s):
```javascript
{
  boardId: "abc123",
  userID: DocumentReference("users/user456"),
  index: 23,
  square: null,  // Not assigned yet
  timestamp: Timestamp,
  updated_time: Timestamp
}
```

### Phase 2: Number Assignment (status = 'full')
When board reaches 100 squares, numbers assigned:
```javascript
// Board document updated
board.home_numbers = ["5", "3", "8", "1", "0", "9", "2", "7", "4", "6"]
board.away_numbers = ["4", "7", "2", "9", "0", "3", "1", "8", "6", "5"]

// All square documents updated
// For index 23:
homeIdx = 23 % 10 = 3
awayIdx = Math.floor(23 / 10) = 2
square = away_numbers[2] + home_numbers[3] = "2" + "1" = "21"

{
  boardId: "abc123",
  userID: DocumentReference("users/user456"),
  index: 23,
  square: "21",  // ✅ Now assigned
  timestamp: Timestamp,
  updated_time: Timestamp
}
```

### Phase 3: Winner Determination
When quarter ends, winning square calculated from game scores:
```javascript
// Game scores: Home 24, Away 17
homeLastDigit = 24 % 10 = 4
awayLastDigit = 17 % 10 = 7
winningSquare = "74"

// Query all squares with this coordinate
squares
  .where("boardId", "==", "abc123")
  .where("square", "==", "74")
  .get()
// Winners found!
```

## Document Creation

### Entry Transaction
Square documents created atomically with entry transaction:
```javascript
exports.enterBoard = onCall(async (request) => {
  await db.runTransaction(async (tx) => {
    // For each selected index
    for (const idx of selectedSquareIndexes) {
      const squareRef = squaresCollectionRef.doc();
      tx.set(squareRef, {
        boardId,
        userID: userRef,
        index: idx,
        square: null,  // Assigned later
        timestamp: FieldValue.serverTimestamp(),
        updated_time: FieldValue.serverTimestamp()
      });
    }
    
    // Update board selected_indexes
    tx.update(boardRef, {
      selected_indexes: FieldValue.arrayUnion(...selectedSquareIndexes)
    });
    
    // Deduct balance
    tx.update(userRef, {
      balance: FieldValue.increment(-totalCost)
    });
    
    // Create transaction record
    // Send notification
  });
});
```

## Batch Number Assignment

When board becomes full, all squares updated in batch:
```javascript
exports.handleBoardFull = onDocumentUpdated({
  document: "boards/{boardID}"
}, async (event) => {
  // Generate random numbers
  const assignedHomeNumbers = generateRandomNumbers();
  const assignedAwayNumbers = generateRandomNumbers();
  
  // Update board
  await boardRef.update({
    home_numbers: assignedHomeNumbers,
    away_numbers: assignedAwayNumbers,
    status: "full"
  });
  
  // Batch update all squares
  const squaresSnapshot = await squaresCollectionRef
    .where("boardId", "==", boardID)
    .get();
    
  const batch = admin.firestore().batch();
  squaresSnapshot.forEach((docSnap) => {
    const squareData = docSnap.data();
    const index = squareData.index;
    
    const homeIdx = index % 10;
    const awayIdx = Math.floor(index / 10);
    const xySquareString = assignedAwayNumbers[awayIdx] + assignedHomeNumbers[homeIdx];
    
    batch.update(docSnap.ref, {
      square: xySquareString,
      updated_time: FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
});
```

## Winner Queries

### Finding Winners for Period
```javascript
// After calculating winning square from game scores
const winningSquare = "74";

const winnersQuery = db.collection("squares")
  .where("boardId", "==", boardId)
  .where("square", "==", winningSquare)
  .limit(200);  // Safety limit

const winnersSnap = await winnersQuery.get();

// Extract unique user IDs
const uidSet = new Set();
winnersSnap.forEach((docSnap) => {
  const d = docSnap.data();
  if (d.userID && d.userID.id) {
    uidSet.add(d.userID.id);
  }
});

const winnerUids = Array.from(uidSet);
// Pay each winner
```

### User's Squares on Board
```javascript
const userRef = db.doc(`users/${userId}`);
const userSquaresSnap = await db.collection('squares')
  .where('boardId', '==', boardId)
  .where('userID', '==', userRef)
  .get();

const userSquares = userSquaresSnap.docs.map(doc => {
  const data = doc.data();
  return {
    index: data.index,
    square: data.square || null  // May be null if not assigned yet
  };
});
```

## Indexes Required
- `boardId` + `index` (composite) - Uniqueness check, prevent duplicate selections
- `boardId` + `square` (composite) - Winner queries **[CRITICAL]**
- `boardId` + `userID` (composite) - User's squares on board
- `userID` + `timestamp` (composite) - User's entry history

## Related Collections
- **boards**: Board this square belongs to
- **users**: Owner of this square
- **games**: Game associated with board (via board.gameID)
- **transactions**: Entry fee transaction for this square
- **users/{uid}/wins**: Win records if this square wins

## Business Rules

### Selection Rules
- One square = one user (enforced by transaction)
- Cannot select same index twice on same board
- Must have sufficient balance to select
- Free boards limited to 1 square per user per board

### Assignment Rules
- Square coordinates assigned only when board full
- Coordinates never change once assigned
- All 100 squares assigned simultaneously
- Assignment triggers "board_full" notifications

### Winner Rules
- Multiple users can win if they share winning coordinate (edge case, but possible if implementation allows)
- Winners determined by exact coordinate match
- All winners for a period paid equally (split payout)

## Implementation Notes

### Duplicate Prevention
Index uniqueness enforced at entry transaction level:
```javascript
// Check if square already taken
const existingSquare = await db.collection('squares')
  .where('boardId', '==', boardId)
  .where('index', '==', idx)
  .limit(1)
  .get();

if (!existingSquare.empty) {
  throw new HttpsError('already-exists', `Square ${idx} already taken`);
}
```

### UserID Storage
userID stored as DocumentReference for consistency:
```javascript
userID: db.doc(`users/${userId}`)
```

When querying, use reference:
```javascript
const userRef = db.doc(`users/${userId}`);
const query = squaresRef.where('userID', '==', userRef);
```

### Coordinate Format
- Always 2 characters
- Both digits 0-9
- Format: awayDigit + homeDigit
- Examples: "00", "47", "99"

### Null Handling
`square` field is null until board numbers assigned:
```javascript
// Safe access
const coordinate = squareData.square || null;

// UI display
display = coordinate ? coordinate : "??";
```

## Query Optimization

### Winner Queries
Most critical query during winner assignment:
```javascript
// Optimized with composite index
.where("boardId", "==", boardId)
.where("square", "==", winningSquare)
```

**Index**: `boardId ASC, square ASC`

### User Board Participation
```javascript
// Check if user has squares on board
.where("boardId", "==", boardId)
.where("userID", "==", userRef)
```

**Index**: `boardId ASC, userID ASC`

## Error Handling

### Invalid Index
```javascript
if (index < 0 || index >= 100) {
  throw new HttpsError('invalid-argument', 'Invalid square index');
}
```

### Missing Board
```javascript
const boardSnap = await boardRef.get();
if (!boardSnap.exists) {
  throw new HttpsError('not-found', 'Board not found');
}
```

### Full Board
```javascript
const boardData = boardSnap.data();
if (boardData.selected_indexes.length >= 100) {
  throw new HttpsError('failed-precondition', 'Board is full');
}
```

## Performance Considerations

### Batch Writes
- Number assignment uses batches (max 500 operations)
- Winner queries limited to 200 results (safety cap)
- Entry transactions minimize reads

### Denormalization
- `boardId` stored as string (not reference) for query performance
- `index` enables fast duplicate checking
- `square` enables fast winner queries

### Caching
- Board numbers cached client-side after assignment
- User's squares fetched once per board view
- Winner queries run only at quarter end (low frequency)

