# Notifications Collection

## Overview
User notifications for board entries, winnings, deposits, withdrawals, and board status updates. Supports both in-app and push notifications.

## Collection Path
`notifications/{notificationId}`

## Document Structure

### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userID` | string | Yes | User ID this notification belongs to |
| `tag` | string | Yes | Notification category tag (see tags below) |
| `title` | string | Yes | Notification title |
| `message` | string | Yes | Notification message body |
| `type` | string | Yes | Notification type (see types below) |
| `timestamp` | Timestamp | Yes | Notification creation timestamp |
| `isRead` | boolean | Yes | Read status (default: false) |

### Context Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `relatedID` | string | No | Related entity ID (transaction, board, etc.) |
| `boardId` | string | Conditional | Board ID for board-related notifications |
| `gameId` | string | Conditional | Game ID for game-related notifications |
| `squareIndexes` | array[number] | Conditional | Square indexes for entry notifications |

## Notification Tags

Tags are used for categorization and filtering:

| Tag | Description | Use Case |
|-----|-------------|----------|
| `board_entry` | Paid board entry | Square selection on paid board |
| `sweepstakes_entry` | Free sweepstakes entry | Square selection on free board |
| `board_full` | Board numbers assigned | User's board became full |
| `sweepstakes_full` | Sweepstakes board numbers assigned | User's sweepstakes board became full |
| `winnings` | Quarter/final winner | User won a quarter/final |
| `deposit` | Deposit successful | PayPal deposit completed |
| `withdrawal` | Withdrawal update | Withdrawal request, processed, or failed |

## Notification Types

Types correspond to transaction types and board events:

| Type | Description | Paired With |
|------|-------------|-------------|
| `entry_fee` | Paid entry confirmation | Transaction type: entry_fee |
| `sweepstakes_entry` | Free entry confirmation | Transaction type: sweepstakes_entry |
| `board_full` | Board full (paid) | Board status: full |
| `sweepstakes_full` | Board full (free) | Board status: full |
| `winnings` | Winner announcement | Transaction type: winnings |
| `deposit_success` | Deposit completed | Transaction type: deposit |
| `withdrawal_request` | Withdrawal submitted | Transaction type: withdrawal_request |
| `withdrawal_completed` | Withdrawal processed | Withdrawal status: completed |
| `withdrawal_failed` | Withdrawal failed | Withdrawal status: failed |

## Title & Message Formats

### Board Entry (Paid)
```javascript
// Title: "$5 - Buccaneers @ Chiefs"
title: `$${amount} - ${awayTeamName} @ ${homeTeamName}`

// Message (single square)
message: `Your square entry for Square ${squareIndex} is confirmed.`

// Message (multiple squares)
message: `Your ${squareCount} square entries are confirmed.`
```

### Sweepstakes Entry (Free)
```javascript
// Title: "Free Entry Sweepstakes - Buccaneers @ Chiefs"
title: `${sweepstakesTitle} - ${awayTeamName} @ ${homeTeamName}`

// Message
message: `Your sweepstakes entry for Square ${squareIndex} is confirmed.`
```

### Board Full
```javascript
// Title: "$5 - Buccaneers @ Chiefs"
title: `$${amount} - ${awayTeamName} @ ${homeTeamName}`

// Message
message: `Your Picks Have Been Assigned!`
```

### Winnings
```javascript
// Title: "$5 - Buccaneers @ Chiefs"
title: `$${amount} - ${awayTeamName} @ ${homeTeamName}`

// Message
message: `Congratulations! You won $${winAmount.toFixed(2)} for pick ${winningSquare} in the ${periodLabel} quarter!`
// periodLabel: "first", "second", "third", "final"
```

### Deposit
```javascript
// Title
title: `Deposit Successful: $${amount.toFixed(2)}`

// Message
message: `Your deposit of $${amount.toFixed(2)} has been successfully added to wallet!`
```

### Withdrawal Request
```javascript
// Title
title: `Withdrawal Request: $${amount.toFixed(2)}`

// Message (pending review)
message: `Your withdrawal request for $${amount.toFixed(2)} has been submitted and is pending review. We'll notify you when it's processed.`

// Message (processing)
message: `Your withdrawal request for $${amount.toFixed(2)} is being processed. You'll receive a confirmation once it's completed.`
```

### Withdrawal Completed
```javascript
// Title
title: `Withdrawal Processed: $${amount.toFixed(2)}`

// Message
message: `Your withdrawal of $${amount.toFixed(2)} has been processed and sent to your PayPal account (${paypalEmail}).`
```

### Withdrawal Failed
```javascript
// Title
title: `Withdrawal Failed: $${amount.toFixed(2)}`

// Message (temporary error)
message: `Your withdrawal of $${amount.toFixed(2)} encountered a temporary issue. Your funds have been returned to your wallet. Please try again later.`

// Message (permanent error)
message: `Your withdrawal of $${amount.toFixed(2)} could not be processed. Your funds have been returned to your wallet. Please verify your PayPal email address and try again.`
```

## Document Creation

### Entry Notification
```javascript
await db.runTransaction(async (tx) => {
  const notifRef = db.collection('notifications').doc();
  
  tx.set(notifRef, {
    userID: userId,
    tag: entryFee === 0 ? 'sweepstakes_entry' : 'board_entry',
    title: notificationTitle,
    message: notificationMessage,
    type: transactionType,
    relatedID: transactionRef.id,
    boardId: boardId,
    gameId: gameId,
    squareIndexes: selectedSquareIndexes,
    isRead: false,
    timestamp: FieldValue.serverTimestamp()
  });
});
```

### Board Full Notification
```javascript
// Created in batch for all participants
const notifBatch = db.batch();

for (const uid of uniqueUserIds) {
  const notifRef = db.collection('notifications').doc();
  
  notifBatch.set(notifRef, {
    userID: uid,
    tag: isSweepstakesBoard ? 'sweepstakes_full' : 'board_full',
    title: title,
    message: 'Your Picks Have Been Assigned!',
    type: isSweepstakesBoard ? 'sweepstakes_full' : 'board_full',
    relatedID: boardId,
    boardId: boardId,
    gameId: gameId,
    isRead: false,
    timestamp: FieldValue.serverTimestamp()
  });
}

await notifBatch.commit();
```

### Winnings Notification
```javascript
await db.runTransaction(async (tx) => {
  const notifRef = db.collection('notifications').doc();
  
  tx.set(notifRef, {
    userID: uid,
    tag: 'winnings',
    title: title,  // Team matchup format
    message: message,  // Congratulations message
    type: 'winnings',
    relatedID: transactionRef.id,
    boardId: boardId,
    gameId: gameId,
    isRead: false,
    timestamp: FieldValue.serverTimestamp()
  });
});
```

## Push Notifications

### FCM Integration
When notification document is created, push notification can be sent via FCM:

```javascript
// User document contains FCM token
const userSnap = await db.doc(`users/${userId}`).get();
const fcmToken = userSnap.data()?.fcmToken;

if (fcmToken) {
  await admin.messaging().send({
    token: fcmToken,
    notification: {
      title: notificationTitle,
      body: notificationMessage
    },
    data: {
      notificationId: notifRef.id,
      type: notificationType,
      boardId: boardId || '',
      gameId: gameId || ''
    }
  });
}
```

### Push Notification Priority
- **High Priority**: Winnings, withdrawal completed, withdrawal failed
- **Normal Priority**: Entry confirmations, board full
- **Low Priority**: System updates (future)

## Read Status Management

### Mark as Read
```javascript
await db.doc(`notifications/${notificationId}`).update({
  isRead: true
});
```

### Batch Mark as Read
```javascript
const batch = db.batch();
const unreadSnap = await db.collection('notifications')
  .where('userID', '==', userId)
  .where('isRead', '==', false)
  .get();

unreadSnap.forEach(doc => {
  batch.update(doc.ref, { isRead: true });
});

await batch.commit();
```

### Unread Count
```javascript
const unreadSnap = await db.collection('notifications')
  .where('userID', '==', userId)
  .where('isRead', '==', false)
  .get();

const unreadCount = unreadSnap.size;
```

## Indexes Required
- `userID` + `isRead` + `timestamp` (composite) - Unread notifications
- `userID` + `timestamp` (composite) - User notification history
- `userID` + `tag` + `timestamp` (composite) - Tag-filtered notifications
- `timestamp` (descending) - Global notification feed (admin)

## Related Collections
- **users**: Notification recipient
- **transactions**: Related transaction (via relatedID)
- **boards**: Related board (via boardId)
- **games**: Related game (via gameId)

## Business Rules

### Creation Rules
- Every transaction creates corresponding notification
- Board full creates one notification per participant
- Winner assignment creates one notification per winner
- Notifications created atomically with triggering action

### Read Status
- Default: isRead = false
- User can mark individual notifications as read
- Batch mark all as read supported
- Read status never resets to unread

### Retention
- Notifications retained indefinitely (audit trail)
- Old notifications can be archived (>90 days)
- No automatic deletion

## Query Examples

### User Notifications (Recent)
```javascript
const notifSnap = await db.collection('notifications')
  .where('userID', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get();
```

### Unread Notifications
```javascript
const unreadSnap = await db.collection('notifications')
  .where('userID', '==', userId)
  .where('isRead', '==', false)
  .orderBy('timestamp', 'desc')
  .get();
```

### Notifications by Tag
```javascript
const winningsSnap = await db.collection('notifications')
  .where('userID', '==', userId)
  .where('tag', '==', 'winnings')
  .orderBy('timestamp', 'desc')
  .limit(20)
  .get();
```

### Board Notifications
```javascript
const boardNotifs = await db.collection('notifications')
  .where('boardId', '==', boardId)
  .where('userID', '==', userId)
  .get();
```

## Real-Time Listeners

### Live Notification Updates
```javascript
const unsubscribe = db.collection('notifications')
  .where('userID', '==', userId)
  .where('isRead', '==', false)
  .orderBy('timestamp', 'desc')
  .limit(10)
  .onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        // New notification arrived
        displayNotification(change.doc.data());
      }
      if (change.type === 'modified') {
        // Notification marked as read
        updateNotificationUI(change.doc.data());
      }
    });
  });
```

## Implementation Notes

### Atomic Creation
Notifications created within same transaction as triggering event:
```javascript
await db.runTransaction(async (tx) => {
  // Create transaction
  tx.set(txRef, {...});
  
  // Update balance
  tx.update(userRef, {...});
  
  // Create notification
  tx.set(notifRef, {...});
});
```

### Title Context
Team names fetched during notification creation to include game context:
```javascript
// Pre-read game and team documents (before writes in transaction)
const gameSnap = await tx.get(gameRef);
const homeTeamSnap = await tx.get(gameData.homeTeam);
const awayTeamSnap = await tx.get(gameData.awayTeam);

const title = `$${amount} - ${awayTeamName} @ ${homeTeamName}`;
```

### Error Handling
- Notification creation failures logged but don't block primary operation
- FCM token errors logged but don't fail notification creation
- Missing context fields result in fallback display text

## UI Display

### Notification Item
```typescript
interface NotificationDisplay {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  icon: string;  // Derived from tag
  color: string;  // Derived from tag
  link?: string;  // Derived from relatedID/boardId/gameId
}
```

### Tag Icons & Colors
```javascript
const tagConfig = {
  'board_entry': { icon: '🎯', color: 'blue' },
  'sweepstakes_entry': { icon: '🎁', color: 'purple' },
  'board_full': { icon: '✅', color: 'green' },
  'sweepstakes_full': { icon: '🎉', color: 'purple' },
  'winnings': { icon: '🏆', color: 'gold' },
  'deposit': { icon: '💰', color: 'green' },
  'withdrawal': { icon: '💵', color: 'orange' }
};
```

### Click Actions
- **board_entry/board_full**: Navigate to board detail
- **winnings**: Navigate to board detail
- **deposit/withdrawal**: Navigate to transaction history
- **sweepstakes_entry/sweepstakes_full**: Navigate to board detail

## Performance Considerations

### Pagination
- Fetch notifications in batches (e.g., 50 at a time)
- Use `startAfter` for pagination
- Cache previously loaded notifications

### Real-Time Updates
- Limit real-time listeners to unread notifications
- Detach listeners when user navigates away
- Batch updates for mark-as-read operations

### Data Volume
- Grows continuously with user activity
- Consider archiving strategy for old notifications
- Index on userID + timestamp ensures fast queries

