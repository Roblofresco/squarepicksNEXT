# Sweepstakes Entry Workflow

## User Journey

### 1. Discover Sweepstakes
```
User browses lobby
  ↓
See "🎁 Free Entry" boards
  ↓
Badge: "Win Real Cash - No Entry Fee!"
  ↓
Click to view sweepstakes board
```

### 2. View Sweepstakes Board
```
Display sweepstakes information:
  - Title: "Free Entry Sweepstakes"
  - Prize: $100 total ($25 per quarter)
  - Entry: FREE
  - Limit: 1 square per user
  ↓
Show 10x10 grid
  ↓
Available squares highlighted
  ↓
User selects 1 square
```

### 3. Confirm Entry
```
Display confirmation:
  - Selected square: #23
  - Entry fee: $0.00
  - Current balance: Unchanged
  ↓
Note: "Limited to 1 free square per sweepstakes"
  ↓
User clicks "Enter Free Square"
```

### 4. Validation
```
Check sweepstakes participation
  ↓
Query: sweepstakes/{id}/participants where userID = user
  ↓
If exists: Show error "Already entered this sweepstakes"
  ↓
If not exists: Proceed with entry
```

### 5. Process Entry
```
Call enterBoard function
  ↓
Firestore Transaction:
  - Create square document
  - Update board.selected_indexes
  - Create participant record
  - Create transaction (amount = 0)
  - Create notification
  ↓
No balance deduction (free entry)
  ↓
Return success
```

### 6. Confirmation
```
Display success message
  ↓
Show: "You're entered in the sweepstakes!"
  ↓
Display selected square
  ↓
Option to view /my-boards
```

## Technical Flow

### Sweepstakes Check
```javascript
// Before entry
const participantQuery = db
  .collection(`sweepstakes/${sweepstakesId}/participants`)
  .where('userID', '==', userRef)
  .limit(1);

const existing = await participantQuery.get();

if (!existing.empty) {
  throw new HttpsError('already-exists', 'Already entered this sweepstakes');
}
```

### Entry Transaction
```javascript
await db.runTransaction(async (tx) => {
  // Validate single square selection
  if (selectedSquareIndexes.length > 1) {
    throw new HttpsError('invalid-argument', 'Only 1 square allowed on free boards');
  }
  
  // Check sweepstakes participation
  const participantSnap = await tx.get(participantQuery);
  if (!participantSnap.empty) {
    throw new HttpsError('already-exists', 'Already entered this sweepstakes');
  }
  
  // Create square
  tx.set(squareRef, {
    boardId: boardId,
    userID: userRef,
    index: selectedSquareIndexes[0],
    square: null,
    timestamp: FieldValue.serverTimestamp()
  });
  
  // Update board
  tx.update(boardRef, {
    selected_indexes: FieldValue.arrayUnion(selectedSquareIndexes[0])
  });
  
  // Create participant record
  const participantRef = db.collection(`sweepstakes/${sweepstakesId}/participants`).doc();
  tx.set(participantRef, {
    userID: userRef,
    enteredAt: FieldValue.serverTimestamp(),
    boards: [boardId]
  });
  
  // Create transaction (amount = 0)
  tx.set(txRef, {
    userID: userId,
    type: 'sweepstakes_entry',
    amount: 0,
    currency: 'USD',
    status: 'completed',
    boardId: boardId,
    gameId: gameId,
    squareIndexes: selectedSquareIndexes,
    timestamp: FieldValue.serverTimestamp()
  });
  
  // Create notification
  tx.set(notifRef, {
    userID: userId,
    tag: 'sweepstakes_entry',
    title: `${sweepstakesTitle} - ${awayTeamName} @ ${homeTeamName}`,
    message: `Your sweepstakes entry for Square ${selectedSquareIndexes[0]} is confirmed.`,
    type: 'sweepstakes_entry',
    timestamp: FieldValue.serverTimestamp(),
    isRead: false
  });
});
```

## UI Components

### Sweepstakes Badge
```
🎁 FREE ENTRY
Win up to $100!
```

### Board Display
```
Free Entry Sweepstakes
Buccaneers @ Chiefs
Sunday, January 15, 2025 1:00 PM ET

Prize Pool: $100
Q1: $25 | Q2: $25 | Q3: $25 | Final: $25

[10x10 Grid]

⚠️ Limit: 1 square per user
```

### Entry Confirmation
```
Confirm Sweepstakes Entry

Selected Square: 23
Entry Fee: FREE
Prize if you win: Up to $100

✅ No deposit required
✅ Real cash prizes
✅ Same rules as paid boards

[Confirm Free Entry Button]
```

## Validation Rules

### Single Square
```javascript
if (selectedSquareIndexes.length > 1) {
  throw new Error('You can only select 1 square on free boards');
}
```

### No Duplicate Entry
```javascript
const participant = await db
  .collection(`sweepstakes/${sweepstakesId}/participants`)
  .where('userID', '==', userRef)
  .limit(1)
  .get();

if (!participant.empty) {
  throw new Error('You have already entered this sweepstakes');
}
```

### No Balance Required
```javascript
if (boardAmount === 0) {
  entryFee = 0;
  // No balance check needed
}
```

## Error Handling

### Already Entered
```
Error: You have already entered this sweepstakes
Message: "You've already entered this sweepstakes. Try other games!"
Action: Redirect to lobby
```

### Multiple Squares Selected
```
Error: Only 1 square allowed
Message: "You can only select 1 square on free boards. Please deselect extras."
Action: Clear selection, prompt re-selection
```

### Board Full
```
Error: Board is full
Message: "This free board filled up! Check back for more sweepstakes."
Action: Redirect to lobby
```

## Board Full Notification

### When Board Fills
```
Notification to all participants:
  Title: "Free Entry Sweepstakes - Buccaneers @ Chiefs"
  Message: "Your Picks Have Been Assigned!"
  Tag: sweepstakes_full
```

## Winning Experience

### Quarter Win (Sweepstakes)
```
Notification:
  Title: "Free Entry Sweepstakes - Buccaneers @ Chiefs"
  Message: "Congratulations! You won $12.50 for pick 74 in the first quarter!"
  
Balance updated: +$12.50
Transaction created: type = winnings, amount = 12.50
```

### Multiple Winners
```
25 payout ÷ 2 winners = $12.50 each

Notification to each:
"Congratulations! You won $12.50 for pick 74 in the first quarter!"
```

## User Experience Enhancements

### Sweepstakes Discovery
```
Lobby → Filter by "Free Entry"
  ↓
Show only sweepstakes boards
  ↓
Badge: "🎁 No deposit required!"
```

### First-Time User Flow
```
New user (no deposits yet)
  ↓
Highlight free boards
  ↓
Tooltip: "Try a free board first!"
  ↓
Guide to sweepstakes entry
```

### Conversion Prompt
```
After sweepstakes entry:
"Enjoying the game? Try a paid board for bigger prizes!"
[View $1 Boards] [View $5 Boards]
```

## Marketing Strategy

### Acquisition
- Free entry attracts new users
- No risk to try platform
- Real cash prizes build trust

### Conversion
- Show paid boards after free entry
- "Try $1 board" CTA after win
- Balance display encourages deposits

### Retention
- Weekly sweepstakes promotions
- Email notifications for new sweepstakes
- Loyalty rewards (future)

## Admin Management

### Create Sweepstakes
```javascript
await db.collection('sweepstakes').add({
  title: 'Free Entry Sweepstakes',
  description: 'Win real cash with no entry fee!',
  status: 'active',
  prizePerBoard: 100,
  boardIDs: [],
  createdAt: FieldValue.serverTimestamp()
});
```

### Link Boards
```javascript
// Auto-link when free board created
if (boardAmount === 0) {
  const activeSweeps = await db.collection('sweepstakes')
    .where('status', '==', 'active')
    .limit(1)
    .get();
  
  if (!activeSweeps.empty) {
    boardData.sweepstakesID = activeSweeps.docs[0].ref;
  }
}
```

### Monitor Participation
```javascript
// Check participant count
const participants = await db
  .collection(`sweepstakes/${sweepstakesId}/participants`)
  .get();

console.log(`Participants: ${participants.size}`);
```

## Sweepstakes ROI

### Cost
```
Prize per board: $100
Expected participants: ~100
Cost per acquisition: ~$1.00
```

### Target Metrics
```
Conversion rate: >10%
Average LTV: >$10 per user
ROI: Positive at 10%+ conversion
```

### Tracking
```javascript
// Users who entered sweepstakes
const sweepsUsers = await db.collectionGroup('participants').get();

// Users who made paid entries
const conversions = await db.collection('transactions')
  .where('type', '==', 'entry_fee')
  .where('amount', '>', 0)
  .get();

// Calculate conversion rate
const conversionRate = conversions.size / sweepsUsers.size;
```

