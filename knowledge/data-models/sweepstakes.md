# Sweepstakes Collection

## Overview
Promotional sweepstakes offering free board entries with real cash prizes. Each sweepstakes is linked to multiple free boards across different games.

## Collection Path
`sweepstakes/{sweepstakesId}`

## Document Structure

### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Sweepstakes name (e.g., "Free Entry Sweepstakes") |
| `description` | string | Yes | Sweepstakes description/terms |
| `status` | string | Yes | Sweepstakes status (active, inactive, ended) |
| `createdAt` | Timestamp | Yes | Creation timestamp |
| `updatedAt` | Timestamp | Yes | Last update timestamp |

### Prize Pool
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `totalPrizePool` | number | No | Total prize pool amount (informational) |
| `prizePerBoard` | number | No | Prize pool per board ($100 default) |

### Board References
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `boardIDs` | array[DocumentReference] | Yes | Array of board document references |

### Participation Limits
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `maxEntriesPerUser` | number | No | Max entries per user across all sweepstakes boards |
| `requiresDeposit` | boolean | No | Whether user must have deposited to enter |

### Dates (Optional)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startDate` | Timestamp | No | Sweepstakes start date |
| `endDate` | Timestamp | No | Sweepstakes end date |

## Subcollections

### participants
Path: `sweepstakes/{sweepstakesId}/participants/{participantId}`

Tracks users who have entered any board in this sweepstakes.

**Fields**:
- `userID` (DocumentReference): Reference to user document
- `enteredAt` (Timestamp): First entry timestamp
- `boards` (array[string]): Array of board IDs user has entered

## Status Lifecycle

| Status | Description | Boards State |
|--------|-------------|--------------|
| `active` | Accepting entries | New free boards link to this sweepstakes |
| `inactive` | Paused | No new boards created, existing boards still playable |
| `ended` | Completed | All boards closed, historical record |

## Sweepstakes Board Creation

### Auto-Creation
When a free board (amount = 0) is created, it links to active sweepstakes:

```javascript
// In handleBoardFull function
if (newBoardData.amount === 0) {
  const activeSweepstakesSnap = await db.collection('sweepstakes')
    .where('status', '==', 'active')
    .limit(1)
    .get();
  
  if (!activeSweepstakesSnap.empty) {
    const sweepstakesDoc = activeSweepstakesSnap.docs[0];
    newBoardData.sweepstakesID = sweepstakesDoc.ref;
    
    // Update sweepstakes with new board reference
    await sweepstakesDoc.ref.update({
      boardIDs: FieldValue.arrayUnion(newBoardRef)
    });
  }
}
```

### Manual Creation
Admins can manually create sweepstakes boards:
```javascript
const sweepstakesRef = db.doc(`sweepstakes/${sweepstakesId}`);

await db.collection('boards').add({
  gameID: gameRef,
  amount: 0,
  sweepstakesID: sweepstakesRef,
  status: 'open',
  selected_indexes: [],
  pot: 100,  // Fixed $100 total
  payout: 25,  // $25 per quarter
  currency: 'USD',
  created_time: FieldValue.serverTimestamp(),
  updated_time: FieldValue.serverTimestamp()
});

// Update sweepstakes
await sweepstakesRef.update({
  boardIDs: FieldValue.arrayUnion(newBoardRef)
});
```

## Participant Tracking

### Check Participation
```javascript
exports.checkSweepstakesParticipation = onCall(async (request) => {
  const { sweepstakesID } = request.data;
  const userId = request.auth.uid;
  const userRef = db.doc(`users/${userId}`);
  
  const participantsRef = db.collection(`sweepstakes/${sweepstakesID}/participants`);
  const existingParticipant = await participantsRef
    .where('userID', '==', userRef)
    .limit(1)
    .get();
  
  return { isParticipant: !existingParticipant.empty };
});
```

### Add Participant
```javascript
// During board entry
await db.runTransaction(async (tx) => {
  // Check if already participant
  const participantQuery = participantsRef
    .where('userID', '==', userRef)
    .limit(1);
  const existingParticipant = await tx.get(participantQuery);
  
  if (existingParticipant.empty) {
    // Create new participant record
    const participantRef = participantsRef.doc();
    tx.set(participantRef, {
      userID: userRef,
      enteredAt: FieldValue.serverTimestamp(),
      boards: [boardId]
    });
  } else {
    // Update existing participant
    const participantDoc = existingParticipant.docs[0];
    tx.update(participantDoc.ref, {
      boards: FieldValue.arrayUnion(boardId)
    });
  }
});
```

## Entry Restrictions

### One Entry Per User Per Board
```javascript
// Enforced during entry validation
if (boardAmount === 0 && selectedSquareIndexes.length > 1) {
  throw new HttpsError(
    'invalid-argument',
    'Only one square allowed per free board'
  );
}
```

### Sweepstakes Participation Check
```javascript
// Check if user already entered this sweepstakes
const sweepstakesRef = boardData.sweepstakesID;
if (sweepstakesRef) {
  const participantsSnap = await db
    .collection(`sweepstakes/${sweepstakesRef.id}/participants`)
    .where('userID', '==', userRef)
    .limit(1)
    .get();
  
  if (!participantsSnap.empty) {
    throw new HttpsError(
      'already-exists',
      'You have already entered this sweepstakes'
    );
  }
}
```

## Financial Model

### Prize Structure
```javascript
// Per board (100 squares)
pot: 100           // $100 total prize pool
payout: 25         // $25 per quarter (pot ÷ 4)
amount: 0          // Free entry

// Revenue Model: Acquisition cost
// $100 spent per board to acquire users
// Goal: Convert free users to paid entries
```

### Winner Payouts
Same payout logic as paid boards:
```javascript
// Q1, Q2, Q3, FINAL each pay $25
// If 1 winner: $25
// If 2 winners: $12.50 each
// If 3 winners: $8.33 each
```

## Indexes Required
- `status` (ascending) - Find active sweepstakes
- `createdAt` (descending) - Chronological listing
- `endDate` (ascending) - Expiration queries

### Subcollection Indexes
- `participants/{participantId}`: `userID` (ascending) - Participation check

## Related Collections
- **boards**: Boards belonging to this sweepstakes (via boardIDs)
- **users**: Users who have entered (via participants subcollection)
- **transactions**: Sweepstakes entry transactions (type: sweepstakes_entry)
- **games**: Games with sweepstakes boards (via boards.gameID)

## Business Rules

### Active Sweepstakes
- Only one sweepstakes should be active at a time
- Active sweepstakes receives all new free boards
- Inactive sweepstakes still playable but doesn't receive new boards

### Board Lifecycle
- Boards created as 'open' with amount = 0
- Board links to sweepstakes via sweepstakesID field
- Sweepstakes tracks boards via boardIDs array
- Board closure doesn't affect sweepstakes status

### User Restrictions
- User limited to 1 square per free board
- User can enter multiple free boards (different games)
- **Current Implementation**: One entry per sweepstakes total
- **Future**: May allow multiple entries across different boards in same sweepstakes

### Prize Pool
- Each free board has independent prize pool ($100)
- Winners paid immediately like paid boards
- Payouts processed automatically (no manual intervention)

## Administration

### Create Sweepstakes
```javascript
const sweepstakesRef = await db.collection('sweepstakes').add({
  title: 'Free Entry Sweepstakes',
  description: 'Enter free boards to win real cash prizes!',
  status: 'active',
  totalPrizePool: 0,  // Updated as boards created
  prizePerBoard: 100,
  boardIDs: [],
  maxEntriesPerUser: 1,
  requiresDeposit: false,
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp()
});
```

### Activate/Deactivate
```javascript
// Activate
await db.doc(`sweepstakes/${sweepstakesId}`).update({
  status: 'active',
  updatedAt: FieldValue.serverTimestamp()
});

// Deactivate
await db.doc(`sweepstakes/${sweepstakesId}`).update({
  status: 'inactive',
  updatedAt: FieldValue.serverTimestamp()
});
```

### End Sweepstakes
```javascript
// Mark as ended (all boards should be closed first)
await db.doc(`sweepstakes/${sweepstakesId}`).update({
  status: 'ended',
  endDate: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp()
});
```

## Query Examples

### Get Active Sweepstakes
```javascript
const activeSweeps = await db.collection('sweepstakes')
  .where('status', '==', 'active')
  .limit(1)
  .get();
```

### Get Sweepstakes Boards
```javascript
const sweepstakesRef = db.doc(`sweepstakes/${sweepstakesId}`);
const boardsSnap = await db.collection('boards')
  .where('sweepstakesID', '==', sweepstakesRef)
  .where('status', '==', 'open')
  .get();
```

### Get Participant Count
```javascript
const participantsSnap = await db
  .collection(`sweepstakes/${sweepstakesId}/participants`)
  .get();

const participantCount = participantsSnap.size;
```

### Get User's Sweepstakes Entries
```javascript
const userRef = db.doc(`users/${userId}`);
const participantsSnap = await db
  .collectionGroup('participants')
  .where('userID', '==', userRef)
  .get();

// Get all sweepstakes user has entered
const sweepstakesIds = participantsSnap.docs.map(doc => 
  doc.ref.parent.parent.id  // Parent is sweepstakes doc
);
```

## Implementation Notes

### Transaction Safety
Participant creation uses transactions to prevent duplicate entries:
```javascript
await db.runTransaction(async (tx) => {
  // Check existing
  const existing = await tx.get(participantQuery);
  
  if (!existing.empty) {
    throw new HttpsError('already-exists', 'Already entered');
  }
  
  // Create participant
  tx.set(participantRef, {...});
  
  // Create square
  tx.set(squareRef, {...});
  
  // Create notification
  tx.set(notifRef, {...});
});
```

### Board Reference Updates
Board references updated using arrayUnion for idempotency:
```javascript
await sweepstakesRef.update({
  boardIDs: FieldValue.arrayUnion(newBoardRef)
});
// Safe to call multiple times with same board
```

### Title in Notifications
Sweepstakes title used in notification titles instead of dollar amount:
```javascript
// Get sweepstakes title
const sweepstakesSnap = await sweepstakesRef.get();
const sweepstakesTitle = sweepstakesSnap.data().title || 'Free Board';

// Use in notification
title: `${sweepstakesTitle} - ${awayTeamName} @ ${homeTeamName}`;
// Example: "Free Entry Sweepstakes - Buccaneers @ Chiefs"
```

## Error Handling

### No Active Sweepstakes
```javascript
if (activeSweepstakesSnap.empty) {
  console.warn('No active sweepstakes found to link free board');
  // Board still created, but not linked to sweepstakes
}
```

### Duplicate Entry Prevention
```javascript
// Check at entry time
const existing = await participantsRef
  .where('userID', '==', userRef)
  .limit(1)
  .get();

if (!existing.empty) {
  throw new HttpsError(
    'already-exists',
    'You have already entered this sweepstakes'
  );
}
```

### Invalid Sweepstakes Reference
```javascript
// Validate sweepstakes exists and is active
if (boardData.sweepstakesID) {
  const sweepstakesSnap = await boardData.sweepstakesID.get();
  
  if (!sweepstakesSnap.exists) {
    throw new HttpsError('not-found', 'Sweepstakes not found');
  }
  
  if (sweepstakesSnap.data().status !== 'active') {
    throw new HttpsError(
      'failed-precondition',
      'Sweepstakes is not active'
    );
  }
}
```

## Marketing & Analytics

### Conversion Tracking
Track conversion of sweepstakes users to paid entries:
```javascript
// Users who entered sweepstakes
const sweepstakesUsers = await db
  .collectionGroup('participants')
  .get();

// Check for paid entries
for (const participant of sweepstakesUsers.docs) {
  const userId = participant.data().userID.id;
  const paidEntries = await db.collection('transactions')
    .where('userID', '==', userId)
    .where('type', '==', 'entry_fee')
    .where('amount', '>', 0)
    .get();
  
  if (!paidEntries.empty) {
    // User converted to paid
  }
}
```

### Performance Metrics
- **Acquisition Cost**: $100 per board
- **Entries per Board**: Up to 100 (one per user)
- **Conversion Rate**: % of sweepstakes users who make paid entries
- **LTV**: Lifetime value of converted users

## Future Enhancements

### Multiple Entry Limits
```javascript
// Allow up to 5 entries per sweepstakes
maxEntriesPerUser: 5

// Check count in participants.boards array
if (participant.boards.length >= sweepstakes.maxEntriesPerUser) {
  throw new HttpsError(
    'failed-precondition',
    'Maximum entries reached for this sweepstakes'
  );
}
```

### Deposit Requirement
```javascript
// Require deposit to enter sweepstakes
requiresDeposit: true

// Validation
if (sweepstakes.requiresDeposit) {
  const deposits = await db.collection('transactions')
    .where('userID', '==', userId)
    .where('type', '==', 'deposit')
    .where('status', '==', 'completed')
    .limit(1)
    .get();
  
  if (deposits.empty) {
    throw new HttpsError(
      'failed-precondition',
      'Deposit required to enter sweepstakes'
    );
  }
}
```

### Time-Limited Promotions
```javascript
// Check date range
const now = admin.firestore.Timestamp.now();
if (sweepstakes.startDate && now < sweepstakes.startDate) {
  throw new HttpsError(
    'failed-precondition',
    'Sweepstakes has not started yet'
  );
}
if (sweepstakes.endDate && now > sweepstakes.endDate) {
  throw new HttpsError(
    'failed-precondition',
    'Sweepstakes has ended'
  );
}
```

