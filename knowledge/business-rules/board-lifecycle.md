# Board Lifecycle Business Rules

## Overview
Boards progress through a defined lifecycle from creation to closure, with distinct rules governing entries, number assignment, and state transitions.

## Board States

| Status | Description | Entry Allowed | Numbers Assigned | Winners Assigned |
|--------|-------------|---------------|------------------|------------------|
| `open` | Accepting entries | ✅ Yes | ❌ No | ❌ No |
| `full` | 100 squares selected | ❌ No | ✅ Yes | ❌ No (yet) |
| `active` | Game is live | ❌ No | ✅ Yes | 🔄 In progress |
| `closed` | Game complete | ❌ No | ✅ Yes | ✅ All assigned |

## Lifecycle Stages

### Stage 1: Creation (Status: open)

**Trigger Options**:
1. **Auto-creation**: When game status becomes 'scheduled'
2. **Rollover**: When previous board fills (becomes 'full')
3. **Manual**: Admin creates board directly

**Auto-Creation**:
```javascript
exports.ensureGameBoards = onDocumentWritten({
  document: "games/{gameId}"
}, async (event) => {
  if (afterData.status === 'scheduled') {
    const amounts = [1, 5, 10, 20];
    
    for (const amount of amounts) {
      // Check if board already exists
      const existing = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .where('amount', '==', amount)
        .limit(1)
        .get();
      
      if (existing.empty) {
        await db.collection('boards').add({
          gameID: gameRef,
          amount: amount,
          status: 'open',
          selected_indexes: [],
          pot: amount * 80,
          payout: amount * 20,
          currency: 'USD',
          created_time: FieldValue.serverTimestamp()
        });
      }
    }
  }
});
```

**Initial Fields**:
```javascript
{
  gameID: DocumentReference,
  amount: 5,  // dollars per square
  status: 'open',
  selected_indexes: [],
  pot: 400,        // 5 × 80
  payout: 100,     // 5 × 20 (per quarter)
  currency: 'USD',
  // home_numbers and away_numbers NOT set yet
  created_time: Timestamp,
  updated_time: Timestamp
}
```

**Business Rules**:
- Board cannot exist without valid game reference
- Financial fields calculated on creation (pot, payout)
- Standard amounts: $1, $5, $10, $20
- Sweepstakes boards: amount = 0, pot = 100, payout = 25

---

### Stage 2: Entry Phase (Status: open)

**Duration**: From creation until 100 squares selected

**Entry Process**:
```javascript
exports.enterBoard = onCall(async (request) => {
  const { boardId, selectedSquareIndexes } = request.data;
  
  await db.runTransaction(async (tx) => {
    // 1. Read board
    const boardSnap = await tx.get(boardRef);
    const boardData = boardSnap.data();
    
    // 2. Validate
    if (boardData.status !== 'open') {
      throw new HttpsError('failed-precondition', 'Board not open');
    }
    
    // Check squares not already taken
    for (const idx of selectedSquareIndexes) {
      if (boardData.selected_indexes.includes(idx)) {
        throw new HttpsError('already-exists', `Square ${idx} taken`);
      }
    }
    
    // Check balance
    const entryFee = boardData.amount * selectedSquareIndexes.length;
    if (userBalance < entryFee) {
      throw new HttpsError('failed-precondition', 'Insufficient balance');
    }
    
    // 3. Write: Create squares
    for (const idx of selectedSquareIndexes) {
      const squareRef = db.collection('squares').doc();
      tx.set(squareRef, {
        boardId: boardId,
        userID: userRef,
        index: idx,
        square: null,  // Not assigned until board full
        timestamp: FieldValue.serverTimestamp()
      });
    }
    
    // 4. Update board
    tx.update(boardRef, {
      selected_indexes: FieldValue.arrayUnion(...selectedSquareIndexes),
      updated_time: FieldValue.serverTimestamp()
    });
    
    // 5. Deduct balance
    tx.update(userRef, {
      balance: FieldValue.increment(-entryFee)
    });
    
    // 6. Create transaction
    tx.set(txRef, {
      userID: userId,
      type: 'entry_fee',
      amount: entryFee,
      status: 'completed',
      boardId: boardId,
      squareIndexes: selectedSquareIndexes
    });
    
    // 7. Create notification
    tx.set(notifRef, {...});
  });
});
```

**Entry Validations**:
- Board status must be 'open'
- Selected squares not already taken
- User has sufficient balance
- Square indexes 0-99
- Free boards: max 1 square per user
- Paid boards: unlimited squares per user

**Entry Restrictions**:
```javascript
// Free boards (sweepstakes)
if (boardData.amount === 0) {
  if (selectedSquareIndexes.length > 1) {
    throw new HttpsError('invalid-argument', 'Only 1 square allowed on free boards');
  }
  
  // Check if user already entered this sweepstakes
  const sweepstakesRef = boardData.sweepstakesID;
  const participantSnap = await db
    .collection(`sweepstakes/${sweepstakesRef.id}/participants`)
    .where('userID', '==', userRef)
    .limit(1)
    .get();
  
  if (!participantSnap.empty) {
    throw new HttpsError('already-exists', 'Already entered this sweepstakes');
  }
}
```

---

### Stage 3: Board Full Trigger (100 Squares)

**Trigger**: `selected_indexes.length` reaches 100

**Detection**:
```javascript
exports.handleBoardFull = onDocumentUpdated({
  document: "boards/{boardID}"
}, async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  
  const MAX_SQUARES = 100;
  
  // Check if board just became full
  const homeNumbersValid = 
    Array.isArray(afterData.home_numbers) && 
    afterData.home_numbers.length === 10;
  const awayNumbersValid = 
    Array.isArray(afterData.away_numbers) && 
    afterData.away_numbers.length === 10;
  const numbersAssigned = homeNumbersValid && awayNumbersValid;
  
  const meetsCriteria =
    afterData.status === 'open' &&
    afterData.selected_indexes?.length === MAX_SQUARES &&
    !numbersAssigned &&
    beforeData.status === 'open';
  
  if (!meetsCriteria) return;
  
  // Process full board
  await processBoardFull(boardID, afterData);
});
```

---

### Stage 4: Number Assignment (Status: full)

**Actions**:
1. Generate random numbers for both axes
2. Update board document
3. Update all 100 square documents with coordinates
4. Send notifications to all participants
5. Create new 'open' board (if game not live)

**Number Generation**:
```javascript
function generateRandomNumbers() {
  const numbers = [];
  while (numbers.length < 10) {
    const num = Math.floor(Math.random() * 10);
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  return numbers.map(String);  // ["0", "1", ..., "9"]
}

const assignedHomeNumbers = generateRandomNumbers();
const assignedAwayNumbers = generateRandomNumbers();
// Example: ["5", "3", "8", "1", "0", "9", "2", "7", "4", "6"]
```

**Board Update**:
```javascript
await boardRef.update({
  home_numbers: assignedHomeNumbers,
  away_numbers: assignedAwayNumbers,
  status: 'full',
  updated_time: FieldValue.serverTimestamp()
});
```

**Square Update** (Batch):
```javascript
const batch = db.batch();
const squaresSnap = await db.collection('squares')
  .where('boardId', '==', boardID)
  .get();

squaresSnap.forEach((docSnap) => {
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
```

**Example**:
```
Board numbers assigned:
home_numbers = ["5", "3", "8", "1", "0", "9", "2", "7", "4", "6"]
away_numbers = ["4", "7", "2", "9", "0", "3", "1", "8", "6", "5"]

Square at index 23:
homeIdx = 23 % 10 = 3
awayIdx = Math.floor(23 / 10) = 2
square = away_numbers[2] + home_numbers[3] = "2" + "1" = "21"

Square 23 updated: { square: "21" }
```

**Participant Notifications**:
```javascript
const notifBatch = db.batch();
const uniqueUserIds = new Set();

// Collect user IDs from squares
squaresSnap.forEach((docSnap) => {
  const squareData = docSnap.data();
  if (squareData.userID && squareData.userID.id) {
    uniqueUserIds.add(squareData.userID.id);
  }
});

// Create notification for each participant
for (const uid of uniqueUserIds) {
  const notifRef = db.collection('notifications').doc();
  notifBatch.set(notifRef, {
    userID: uid,
    tag: isSweepstakesBoard ? 'sweepstakes_full' : 'board_full',
    title: `$${amount} - ${awayTeamName} @ ${homeTeamName}`,
    message: 'Your Picks Have Been Assigned!',
    type: isSweepstakesBoard ? 'sweepstakes_full' : 'board_full',
    relatedID: boardID,
    boardId: boardID,
    gameId: gameId,
    isRead: false,
    timestamp: FieldValue.serverTimestamp()
  });
}

await notifBatch.commit();
```

---

### Stage 5: Board Rollover

**Trigger**: Board status changes to 'full' AND game.isLive === false

**Action**: Create new 'open' board with same game and amount

**Implementation**:
```javascript
// In handleBoardFull, after number assignment
const gameDocSnap = await db.doc(gameRef.path).get();
const gameData = gameDocSnap.data();

let createNewBoard = true;
if (gameData.isLive === true) {
  createNewBoard = false;
  console.log('Game is live, not creating new board');
}

if (createNewBoard) {
  const newBoardData = {
    gameID: afterData.gameID,
    status: 'open',
    amount: afterData.amount,
    selected_indexes: [],
    pot: afterData.amount === 0 ? 100 : afterData.amount * 80,
    payout: afterData.amount === 0 ? 25 : afterData.amount * 20,
    currency: 'USD',
    created_time: FieldValue.serverTimestamp()
  };
  
  // For sweepstakes boards, link to active sweepstakes
  if (afterData.amount === 0) {
    const activeSweeps = await db.collection('sweepstakes')
      .where('status', '==', 'active')
      .limit(1)
      .get();
    
    if (!activeSweeps.empty) {
      newBoardData.sweepstakesID = activeSweeps.docs[0].ref;
      
      // Update sweepstakes with new board reference
      await activeSweeps.docs[0].ref.update({
        boardIDs: FieldValue.arrayUnion(newBoardRef)
      });
    }
  }
  
  const newBoardDoc = await db.collection('boards').add(newBoardData);
  console.log(`Created new open board: ${newBoardDoc.id}`);
}
```

**Rollover Rules**:
- Only happens if game not live
- Same game, same amount
- Fresh selected_indexes array
- No numbers assigned yet
- Sweepstakes boards link to same sweepstakes

---

### Stage 6: Activation (Status: full → active)

**Trigger**: Game isLive becomes true

**Implementation**:
```javascript
exports.onGameStatusChanged = onDocumentUpdated({
  document: "games/{gameId}"
}, async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  
  if (!before.isLive && after.isLive) {
    const gameRef = event.data.after.ref;
    
    // Update all 'full' boards to 'active'
    const boardsSnap = await db.collection('boards')
      .where('gameID', '==', gameRef)
      .where('status', '==', 'full')
      .get();
    
    const batch = db.batch();
    boardsSnap.forEach((boardDoc) => {
      batch.update(boardDoc.ref, {
        status: 'active',
        updated_time: FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
  }
});
```

**Active Board Characteristics**:
- Numbers already assigned
- Squares have coordinates
- Game is live
- Winners will be assigned as quarters complete
- Cannot accept new entries

---

### Stage 7: Winner Assignment (Status: active)

**Progression**: Q1 → Q2 (Halftime) → Q3 → Final

**For each quarter**:
```javascript
await db.runTransaction(async (tx) => {
  // Read board
  const freshBoard = await tx.get(boardRef);
  const boardData = freshBoard.data();
  
  // Check if already assigned
  if (boardData.winners?.[periodLabel]?.assigned === true) {
    return;  // Idempotent
  }
  
  // Query winners
  const winnersSnap = await tx.get(winnersQuery);
  
  // Write winner data
  tx.set(publicSummaryRef, {
    period: periodLabel.toUpperCase(),
    winningSquare: winningSquare,
    winnerCount: winnersSnap.size,
    assignedAt: FieldValue.serverTimestamp()
  });
  
  // Process payouts for all winners
  await processQuarterPayoutsInTransaction({...});
  
  // Update board metadata
  tx.update(boardRef, {
    [`winners.${periodLabel}.assigned`]: true,
    [`winners.${periodLabel}.paid`]: true,
    [`winners.${periodLabel}.paidAmount`]: totalPaid,
    updated_time: FieldValue.serverTimestamp()
  });
  
  // For FINAL period only: Close board
  if (periodLabel === 'final') {
    tx.update(boardRef, {
      status: 'closed',
      settled_at: FieldValue.serverTimestamp()
    });
  }
});
```

**Business Rules**:
- Q1, Q2, Q3: Board stays 'active'
- Final: Board becomes 'closed'
- Payouts processed immediately
- All operations atomic (transaction)

---

### Stage 8: Closure (Status: closed)

**Trigger**: Final period winners assigned and paid

**Final State**:
```javascript
{
  status: 'closed',
  settled_at: Timestamp,
  winners: {
    q1: { assigned: true, paid: true, paidAmount: 100 },
    q2: { assigned: true, paid: true, paidAmount: 100 },
    q3: { assigned: true, paid: true, paidAmount: 100 },
    final: { assigned: true, paid: true, paidAmount: 100 }
  }
}
```

**Business Rules**:
- Board cannot be reopened
- All winners paid
- No further state changes
- Retained for audit/history
- Users can view results indefinitely

---

## State Transition Diagram

```
      ┌──────────┐
      │ Creation │
      └────┬─────┘
           │
           ▼
      ┌──────────┐
      │   open   │ ◄── Entries active, no numbers
      └────┬─────┘
           │ (100 squares)
           ▼
      ┌──────────┐
      │   full   │ ◄── Numbers assigned, no more entries
      └────┬─────┘     New 'open' board created (if game not live)
           │ (game goes live)
           ▼
      ┌──────────┐
      │  active  │ ◄── Game in progress, winners assigned per quarter
      └────┬─────┘
           │ (final quarter)
           ▼
      ┌──────────┐
      │  closed  │ ◄── All winners paid, board immutable
      └──────────┘
```

## Edge Cases

### Board Fills During Live Game
**Scenario**: 99th square selected, game starts, 100th square selected

**Handling**:
- Board becomes 'full' (numbers assigned)
- Rollover check sees game is live
- No new board created
- Board transitions to 'active' immediately

### Game Starts Before Board Fills
**Scenario**: Game goes live with board at 80/100 squares

**Handling**:
- Board remains 'open'
- Users can still enter (until 100)
- When full, becomes 'active' directly (no rollover)

### Orphaned Open Boards
**Scenario**: Game ends with open board at 50/100 squares

**Handling**:
- Board stays 'open' indefinitely
- No winners assigned (game over)
- Users can still enter technically, but no payout
- **Future**: Auto-close orphaned boards after game ends

### Multiple Winners per Square
**Scenario**: Two users somehow select same square (race condition)

**Prevention**:
- Transaction checks selected_indexes before write
- arrayUnion ensures atomic array update
- Duplicate check throws error

**If it happens**:
- Both users have square with same coordinate
- Both users paid equally when square wins
- Payout split among all winners

## Manual Operations

### Force Board Closure
```javascript
await db.doc(`boards/${boardId}`).update({
  status: 'closed',
  settled_at: FieldValue.serverTimestamp()
});
```

### Manually Assign Numbers
```javascript
await db.doc(`boards/${boardId}`).update({
  home_numbers: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
  away_numbers: ["9", "8", "7", "6", "5", "4", "3", "2", "1", "0"],
  status: 'full'
});

// Then update squares
const squaresSnap = await db.collection('squares')
  .where('boardId', '==', boardId)
  .get();

const batch = db.batch();
squaresSnap.forEach(docSnap => {
  const idx = docSnap.data().index;
  const homeIdx = idx % 10;
  const awayIdx = Math.floor(idx / 10);
  const square = away_numbers[awayIdx] + home_numbers[homeIdx];
  
  batch.update(docSnap.ref, { square: square });
});

await batch.commit();
```

### Refund Board Entries
```javascript
// Get all squares for board
const squaresSnap = await db.collection('squares')
  .where('boardId', '==', boardId)
  .get();

// Group by user
const userSquares = {};
squaresSnap.forEach(doc => {
  const userId = doc.data().userID.id;
  userSquares[userId] = (userSquares[userId] || 0) + 1;
});

// Refund each user
for (const [userId, count] of Object.entries(userSquares)) {
  const refundAmount = boardData.amount * count;
  
  await db.runTransaction(async (tx) => {
    const userRef = db.doc(`users/${userId}`);
    const txRef = db.collection('transactions').doc();
    
    tx.set(txRef, {
      userID: userId,
      type: 'refund',
      amount: refundAmount,
      status: 'completed',
      boardId: boardId,
      description: `Refund for ${count} squares on board ${boardId}`
    });
    
    tx.update(userRef, {
      balance: FieldValue.increment(refundAmount)
    });
  });
}
```

