# Real-Time Updates Architecture

## ESPN API Polling

### Scheduled Functions
```javascript
// Every 15 seconds during live windows
exports.liveUpdateNflGames = onSchedule({
  schedule: "every 15 seconds",
  timeZone: "America/New_York",
  region: "us-east1"
}, async () => {
  if (!isWithinNflLiveWindow()) return;
  await liveUpdateLeagueGames(db, 'NFL');
});
```

### Live Windows (Eastern Time)
- Thursday: 19:00-23:00
- Friday: 14:00-18:00 (Black Friday)
- Saturday: 12:00-23:00 (late season)
- Sunday: 09:00-23:00
- Monday: 19:00-23:00

### Update Strategy
1. Query games marked isLive = true
2. Query scheduled games within 4 hours of start
3. Fetch scoreboard from ESPN
4. Diff-check: Only write if changed
5. Update game documents
6. Triggers fire for winner assignment

## Firestore Real-Time Listeners

### Client-Side Subscriptions
```javascript
// Subscribe to board updates
const unsubscribe = onSnapshot(
  doc(db, 'boards', boardId),
  (snapshot) => {
    const boardData = snapshot.data();
    updateUI(boardData);
  }
);
```

### Common Listener Patterns

**Game Status**:
```javascript
onSnapshot(doc(db, 'games', gameId), (snap) => {
  const { isLive, quarter, homeScore, awayScore } = snap.data();
  updateScoreboard({ isLive, quarter, homeScore, awayScore });
});
```

**Unread Notifications**:
```javascript
onSnapshot(
  query(
    collection(db, 'notifications'),
    where('userID', '==', userId),
    where('isRead', '==', false),
    orderBy('timestamp', 'desc')
  ),
  (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        showNotification(change.doc.data());
      }
    });
  }
);
```

**User Balance**:
```javascript
onSnapshot(doc(db, 'users', userId), (snap) => {
  const { balance } = snap.data();
  updateBalanceDisplay(balance);
});
```

## Push Notifications (FCM)

### Token Registration
```javascript
// Client-side (on login)
const token = await getToken(messaging);
await updateDoc(doc(db, 'users', userId), {
  fcmToken: token
});
```

### Sending Notifications
```javascript
// Server-side (Cloud Function)
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
      type: notificationType,
      boardId: boardId || ''
    }
  });
}
```

## Update Optimization

### Diff-Based Writes
```javascript
// Only write if values changed
const needsUpdate = (
  existing.status !== newStatus ||
  existing.homeScore !== newHomeScore ||
  existing.quarter !== newQuarter
);

if (!needsUpdate) {
  return; // Skip write, save cost
}

await gameRef.update({ status: newStatus, homeScore: newHomeScore });
```

### Batch Operations
```javascript
// Update multiple documents together
const batch = db.batch();
squaresSnapshot.docs.forEach(doc => {
  batch.update(doc.ref, { square: calculatedSquare });
});
await batch.commit();
```

### Query Limits
```javascript
// Prevent unbounded queries
const liveGames = await db.collection('games')
  .where('isLive', '==', true)
  .limit(50) // Safety cap
  .get();
```

## Latency Considerations

### ESPN API
- Response time: 200-500ms typical
- Timeout: 15s (with retries)
- Rate limiting: Handled with backoff

### Firestore
- Single document read: 50-100ms
- Query: 100-300ms
- Write: 100-200ms
- Listener setup: 200-500ms

### Cloud Functions
- Cold start: 1-3s
- Warm execution: 100-500ms
- Min instances: Reduce cold starts

## Caching Strategy

### Client-Side
- Board numbers: Cache until page refresh
- Team data: Cache for session
- User squares: Cache per board view

### Server-Side
- No caching (Firestore handles internally)
- Team lookups: In-memory cache during execution
- ESPN responses: No caching (real-time data)

## Error Handling

### Network Failures
```javascript
try {
  const response = await axios.get(espnUrl);
  return response.data;
} catch (error) {
  if (error.code === 'ETIMEDOUT') {
    // Retry with backoff
  }
  console.error('ESPN API error:', error);
  return null; // Don't block other games
}
```

### Listener Errors
```javascript
onSnapshot(
  query,
  (snapshot) => {
    // Success handler
  },
  (error) => {
    console.error('Listener error:', error);
    // Attempt to resubscribe
    setTimeout(() => setupListener(), 5000);
  }
);
```

## Performance Monitoring

### Metrics Tracked
- Function execution time
- ESPN API response time
- Firestore query latency
- Listener subscription count

### Optimization Targets
- Function execution: < 1s
- ESPN fetch: < 2s
- Firestore read: < 500ms
- UI update: < 100ms (from listener)

