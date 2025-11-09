# Entry Fee Business Rules

## Overview
Entry fees are charged when users select squares on boards. Payment is immediate and atomic with square creation.

## Fee Structure

### Per-Square Pricing
```javascript
entryFee = boardAmount × squareCount
```

**Examples**:
- $1 board, 1 square = $1.00
- $5 board, 3 squares = $15.00
- $10 board, 5 squares = $50.00
- Free board, 1 square = $0.00

### Board Amounts
- **Standard**: $1, $5, $10, $20 per square
- **Sweepstakes**: $0 per square (free entry)

## Entry Process

### Transaction Flow
```javascript
exports.enterBoard = onCall(async (request) => {
  const { boardId, selectedSquareIndexes } = request.data;
  
  await db.runTransaction(async (tx) => {
    // 1. Read board and user
    const boardSnap = await tx.get(boardRef);
    const userSnap = await tx.get(userRef);
    
    // 2. Calculate fee
    const entryFee = boardData.amount × selectedSquareIndexes.length;
    
    // 3. Validate
    if (userBalance < entryFee) {
      throw new HttpsError('failed-precondition', 'Insufficient balance');
    }
    
    // 4. Create squares
    for (const idx of selectedSquareIndexes) {
      tx.set(squareRef, {
        boardId, userID: userRef, index: idx, square: null
      });
    }
    
    // 5. Update board
    tx.update(boardRef, {
      selected_indexes: FieldValue.arrayUnion(...selectedSquareIndexes)
    });
    
    // 6. Deduct balance
    tx.update(userRef, {
      balance: FieldValue.increment(-entryFee)
    });
    
    // 7. Record transaction
    tx.set(txRef, {
      type: 'entry_fee',
      amount: entryFee,
      status: 'completed',
      boardId, squareIndexes: selectedSquareIndexes
    });
    
    // 8. Notify user
    tx.set(notifRef, {...});
  });
});
```

### Validations

**Board Status**:
```javascript
if (boardData.status !== 'open') {
  throw new HttpsError('failed-precondition', 'Board not accepting entries');
}
```

**Square Availability**:
```javascript
for (const idx of selectedSquareIndexes) {
  if (boardData.selected_indexes.includes(idx)) {
    throw new HttpsError('already-exists', `Square ${idx} already taken`);
  }
}
```

**Balance Check**:
```javascript
const entryFee = boardAmount × squareCount;
if (userBalance < entryFee) {
  throw new HttpsError('failed-precondition', 'Insufficient balance');
}
```

**Sweepstakes Limit**:
```javascript
if (boardAmount === 0 && selectedSquareIndexes.length > 1) {
  throw new HttpsError('invalid-argument', 'Max 1 square per free board');
}
```

## Entry Restrictions

### Paid Boards
- No limit on squares per user
- Must have sufficient wallet balance
- Squares must not be taken by others

### Free Boards (Sweepstakes)
- **1 square per user** per board
- **1 entry per sweepstakes** total
- No balance required

## Transaction Records

### Entry Fee Transaction
```javascript
{
  userID: "user123",
  type: "entry_fee",
  amount: 15.00,
  currency: "USD",
  status: "completed",
  boardId: "board456",
  gameId: "game789",
  squareIndexes: [23, 45, 67],
  timestamp: Timestamp,
  description: "Entry fee for 3 square(s) on board board456"
}
```

### Sweepstakes Entry Transaction
```javascript
{
  userID: "user123",
  type: "sweepstakes_entry",
  amount: 0,
  currency: "USD",
  status: "completed",
  boardId: "board456",
  gameId: "game789",
  squareIndexes: [23],
  timestamp: Timestamp,
  description: "Sweepstakes entry for square 23 on board board456"
}
```

## Balance Impact
```javascript
// Before entry
userBalance: 100.00

// Entry: 3 squares on $5 board
entryFee = 5 × 3 = 15.00

// After entry
userBalance: 85.00
```

## Notifications

### Paid Entry
```javascript
title: "$5 - Buccaneers @ Chiefs"
message: "Your 3 square entries are confirmed."
// or for single: "Your square entry for Square 23 is confirmed."
```

### Free Entry
```javascript
title: "Free Entry Sweepstakes - Buccaneers @ Chiefs"
message: "Your sweepstakes entry for Square 23 is confirmed."
```

## Refund Rules

### Game Cancellation
If game cancelled before start:
```javascript
// Get all squares for board
const squaresSnap = await db.collection('squares')
  .where('boardId', '==', boardId)
  .get();

// Refund each user
for (const doc of squaresSnap.docs) {
  const userId = doc.data().userID.id;
  const refundAmount = boardData.amount;
  
  await db.runTransaction(async (tx) => {
    tx.update(userRef, {
      balance: FieldValue.increment(refundAmount)
    });
    tx.set(refundTxRef, {
      type: 'refund',
      amount: refundAmount,
      boardId: boardId
    });
  });
}
```

## Wallet Requirements

### Minimum Balance
No hard minimum, but must cover entry fee:
```javascript
requiredBalance = boardAmount × desiredSquares
```

### Deposit Flow
```
User → Deposit $20 → Select 3 squares on $5 board → Balance: $5
```

### Insufficient Balance Error
```
Error: Insufficient balance
Current: $10.00
Required: $15.00
Please deposit at least $5.00
```

## Performance Considerations

### Transaction Size
- Entry creates: 1 + squareCount operations
  - Board update: 1
  - User balance: 1
  - Transaction record: 1
  - Notification: 1
  - Squares: squareCount
- Example: 5 squares = 9 total operations

### Concurrent Entries
- Firestore transactions prevent race conditions
- arrayUnion ensures atomic square selection
- Balance decrements are serialized

### Query Optimization
- Board status check via single read
- Square availability checked in memory
- No additional queries needed

