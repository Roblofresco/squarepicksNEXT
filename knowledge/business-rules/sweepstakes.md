# Sweepstakes Business Rules

## Overview
Sweepstakes provide free board entries with real cash prizes. Used for user acquisition and engagement.

## Core Rules

### Entry Requirements
- **Cost**: $0 (free entry)
- **Limit**: 1 square per user per board
- **Restriction**: 1 entry per sweepstakes total

### Prize Structure
- **Pot**: $100 per board (fixed)
- **Payout**: $25 per quarter
- **Winners**: Paid immediately like standard boards

## Sweepstakes Lifecycle

### Creation
```javascript
await db.collection('sweepstakes').add({
  title: 'Free Entry Sweepstakes',
  description: 'Enter free boards to win real cash!',
  status: 'active',
  prizePerBoard: 100,
  boardIDs: [],
  createdAt: FieldValue.serverTimestamp()
});
```

### Board Association
Free boards auto-link to active sweepstakes:
```javascript
if (boardAmount === 0) {
  const activeSweeps = await db.collection('sweepstakes')
    .where('status', '==', 'active')
    .limit(1)
    .get();
  
  if (!activeSweeps.empty) {
    newBoardData.sweepstakesID = activeSweeps.docs[0].ref;
  }
}
```

### Participation Tracking
```javascript
// sweepstakes/{sweepstakesId}/participants/{participantId}
{
  userID: DocumentReference,
  enteredAt: Timestamp,
  boards: ["board1", "board2"]
}
```

## Entry Validation

### Check Prior Entry
```javascript
const participantSnap = await db
  .collection(`sweepstakes/${sweepstakesId}/participants`)
  .where('userID', '==', userRef)
  .limit(1)
  .get();

if (!participantSnap.empty) {
  throw new HttpsError('already-exists', 'Already entered this sweepstakes');
}
```

### Single Square Enforcement
```javascript
if (boardAmount === 0 && selectedSquareIndexes.length > 1) {
  throw new HttpsError('invalid-argument', 'Only 1 square allowed on free boards');
}
```

## Participant Creation

### Add Participant
```javascript
await db.runTransaction(async (tx) => {
  const existing = await tx.get(participantQuery);
  
  if (!existing.empty) {
    throw new HttpsError('already-exists', 'Already entered');
  }
  
  // Create participant record
  tx.set(participantRef, {
    userID: userRef,
    enteredAt: FieldValue.serverTimestamp(),
    boards: [boardId]
  });
  
  // Create square (free)
  tx.set(squareRef, {...});
  
  // Create transaction (amount = 0)
  tx.set(txRef, {
    type: 'sweepstakes_entry',
    amount: 0
  });
});
```

## Revenue Model

### Acquisition Cost
```
Cost per board: $100
Expected acquisitions: up to 100 users
Cost per acquisition: ~$1.00

Goal: Convert 10%+ to paid entries
Target LTV: >$10 per converted user
```

### Conversion Tracking
```javascript
// Users who entered sweepstakes
const participants = await db
  .collectionGroup('participants')
  .get();

// Check for paid entries
for (const participant of participants.docs) {
  const userId = participant.data().userID.id;
  const paidEntries = await db.collection('transactions')
    .where('userID', '==', userId)
    .where('type', '==', 'entry_fee')
    .where('amount', '>', 0)
    .limit(1)
    .get();
  
  if (!paidEntries.empty) {
    conversions++;
  }
}

conversionRate = conversions / participants.size;
```

## Status Management

### Active Sweepstakes
- Receives all new free boards
- Accepts new participants
- Only one active at a time

### Inactive Sweepstakes
- No new boards created
- Existing boards still playable
- Historical record maintained

### Ending Sweepstakes
```javascript
await db.doc(`sweepstakes/${sweepstakesId}`).update({
  status: 'ended',
  endDate: FieldValue.serverTimestamp()
});
```

## Notifications

### Entry Confirmation
```javascript
title: "Free Entry Sweepstakes - Buccaneers @ Chiefs"
message: "Your sweepstakes entry for Square 23 is confirmed."
```

### Board Full
```javascript
title: "Free Entry Sweepstakes - Buccaneers @ Chiefs"
message: "Your Picks Have Been Assigned!"
```

### Winnings
```javascript
title: "Free Entry Sweepstakes - Buccaneers @ Chiefs"
message: "Congratulations! You won $12.50 for pick 74 in the first quarter!"
```

## Business Rules Summary
1. Free entry (no balance required)
2. 1 square per board per user
3. 1 entry per sweepstakes per user
4. $100 fixed prize pool per board
5. Winners paid immediately like standard boards
6. Used for user acquisition, not revenue

