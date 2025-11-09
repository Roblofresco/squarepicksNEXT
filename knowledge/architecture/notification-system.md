# Notification System Architecture

## Overview
Multi-channel notification system using Firestore documents for in-app notifications and Firebase Cloud Messaging (FCM) for push notifications.

## Notification Channels

### In-App Notifications
- Stored in Firestore `notifications` collection
- Real-time sync via Firestore listeners
- Persistent across sessions
- Read/unread tracking

### Push Notifications (FCM)
- Sent via Firebase Cloud Messaging
- Device registration with FCM tokens
- Background and foreground delivery
- Optional (requires user permission)

### Future Channels
- Email (via Resend)
- SMS (via Twilio)

## Notification Creation

### Server-Side Generation
```javascript
// In Cloud Function (within transaction)
const notifRef = db.collection('notifications').doc();

tx.set(notifRef, {
  userID: userId,
  tag: 'winnings',
  title: `$5 - Buccaneers @ Chiefs`,
  message: `Congratulations! You won $50.00 for pick 74 in the first quarter!`,
  type: 'winnings',
  relatedID: transactionId,
  boardId: boardId,
  gameId: gameId,
  isRead: false,
  timestamp: FieldValue.serverTimestamp()
});
```

### Notification Tags
```javascript
const tags = {
  'board_entry': 'Paid board entry',
  'sweepstakes_entry': 'Free sweepstakes entry',
  'board_full': 'Board numbers assigned',
  'sweepstakes_full': 'Sweepstakes board full',
  'winnings': 'Quarter/final winner',
  'deposit': 'Deposit successful',
  'withdrawal': 'Withdrawal update'
};
```

## Client-Side Subscription

### Real-Time Listener
```javascript
useEffect(() => {
  if (!userId) return;
  
  const q = query(
    collection(db, 'notifications'),
    where('userID', '==', userId),
    where('isRead', '==', false),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notifications = [];
    
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        notifications.push({
          id: change.doc.id,
          ...change.doc.data()
        });
      }
    });
    
    // Display new notifications
    notifications.forEach(notif => {
      showToast(notif.title, notif.message);
    });
    
    // Update state
    setUnreadNotifications(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  });
  
  return () => unsubscribe();
}, [userId]);
```

### Mark as Read
```javascript
async function markAsRead(notificationId) {
  await updateDoc(doc(db, 'notifications', notificationId), {
    isRead: true
  });
}

async function markAllAsRead(userId) {
  const q = query(
    collection(db, 'notifications'),
    where('userID', '==', userId),
    where('isRead', '==', false)
  );
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { isRead: true });
  });
  
  await batch.commit();
}
```

## FCM Push Notifications

### Token Registration
```javascript
// Client-side (on login)
import { getToken } from 'firebase/messaging';

async function registerFcmToken() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    
    // Save to user document
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token
    });
  }
}
```

### Sending Push Notifications
```javascript
// Server-side (Cloud Function)
async function sendPushNotification(userId, notification) {
  const userSnap = await db.doc(`users/${userId}`).get();
  const fcmToken = userSnap.data()?.fcmToken;
  
  if (!fcmToken) {
    console.log(`No FCM token for user ${userId}`);
    return;
  }
  
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        notificationId: notification.id,
        type: notification.type,
        boardId: notification.boardId || '',
        gameId: notification.gameId || ''
      },
      webpush: {
        fcmOptions: {
          link: buildNotificationLink(notification)
        }
      }
    });
    
    console.log(`Push notification sent to user ${userId}`);
  } catch (error) {
    if (error.code === 'messaging/invalid-registration-token') {
      // Token expired, remove from user document
      await db.doc(`users/${userId}`).update({
        fcmToken: admin.firestore.FieldValue.delete()
      });
    }
    
    console.error(`Failed to send push notification: ${error.message}`);
  }
}
```

### Click Action Handling
```javascript
// Client-side (service worker or main app)
function buildNotificationLink(notification) {
  switch (notification.type) {
    case 'board_entry':
    case 'board_full':
    case 'winnings':
      return `/my-boards?board=${notification.boardId}`;
    case 'deposit':
    case 'withdrawal':
      return '/transactions';
    default:
      return '/profile/notifications';
  }
}
```

## Notification Templates

### Entry Confirmation
```javascript
{
  tag: 'board_entry',
  title: '$5 - Buccaneers @ Chiefs',
  message: 'Your 3 square entries are confirmed.',
  type: 'entry_fee',
  boardId: 'abc123',
  gameId: 'game789'
}
```

### Winner Announcement
```javascript
{
  tag: 'winnings',
  title: '$5 - Buccaneers @ Chiefs',
  message: 'Congratulations! You won $50.00 for pick 74 in the first quarter!',
  type: 'winnings',
  relatedID: 'tx456',
  boardId: 'abc123',
  gameId: 'game789'
}
```

### Withdrawal Status
```javascript
{
  tag: 'withdrawal',
  title: 'Withdrawal Processed: $100.00',
  message: 'Your withdrawal of $100.00 has been processed and sent to your PayPal account.',
  type: 'withdrawal_completed',
  relatedID: 'tx789'
}
```

## Batching Strategies

### Board Full Notifications
```javascript
// Send to all participants at once
const batch = db.batch();
const uniqueUserIds = new Set(/* collect from squares */);

for (const uid of uniqueUserIds) {
  const notifRef = db.collection('notifications').doc();
  batch.set(notifRef, {
    userID: uid,
    tag: 'board_full',
    title: `$${amount} - ${awayTeamName} @ ${homeTeamName}`,
    message: 'Your Picks Have Been Assigned!',
    timestamp: FieldValue.serverTimestamp(),
    isRead: false
  });
}

await batch.commit();
```

### Winner Notifications
```javascript
// Send within winner assignment transaction
await db.runTransaction(async (tx) => {
  // Process payouts
  for (const uid of winnerUids) {
    const notifRef = db.collection('notifications').doc();
    tx.set(notifRef, {
      userID: uid,
      tag: 'winnings',
      title: title,
      message: message,
      timestamp: FieldValue.serverTimestamp()
    });
  }
});
```

## Performance Considerations

### Query Optimization
```javascript
// Index on: userID + isRead + timestamp
.where('userID', '==', userId)
.where('isRead', '==', false)
.orderBy('timestamp', 'desc')
.limit(50)  // Paginate for performance
```

### Listener Scope
```javascript
// Only listen to unread (not all notifications)
where('isRead', '==', false)

// Limit results
.limit(50)

// Detach when component unmounts
return () => unsubscribe();
```

### Batch Operations
```javascript
// Mark multiple as read in single batch
const batch = writeBatch(db);
notificationIds.forEach(id => {
  batch.update(doc(db, 'notifications', id), { isRead: true });
});
await batch.commit();
```

## Error Handling

### FCM Errors
```javascript
// Invalid token
if (error.code === 'messaging/invalid-registration-token') {
  // Remove expired token from user document
  await userRef.update({ fcmToken: FieldValue.delete() });
}

// Not registered
if (error.code === 'messaging/registration-token-not-registered') {
  // Remove token
}

// Other errors
console.error('FCM error:', error);
// Continue (don't block notification creation)
```

### Listener Errors
```javascript
onSnapshot(
  query,
  (snapshot) => {
    // Success
  },
  (error) => {
    console.error('Notification listener error:', error);
    // Attempt reconnect after delay
    setTimeout(() => setupListener(), 5000);
  }
);
```

## Retention Policy

### Active Notifications
- Unread: Retained indefinitely
- Read: Retained for 90 days

### Archiving Strategy
```javascript
// Run monthly: Archive notifications > 90 days old
const ninetyDaysAgo = Timestamp.fromMillis(Date.now() - 90 * 24 * 60 * 60 * 1000);

const oldNotifs = await db.collection('notifications')
  .where('isRead', '==', true)
  .where('timestamp', '<', ninetyDaysAgo)
  .limit(500)
  .get();

const batch = db.batch();
oldNotifs.docs.forEach(doc => {
  batch.delete(doc.ref);
});
await batch.commit();
```

## Analytics

### Notification Metrics
- Sent count by type
- Read rate
- Click-through rate (push notifications)
- Delivery success rate (FCM)

### User Engagement
- Average time to read
- Most engaged notification types
- User preferences (opt-in/opt-out rates)

