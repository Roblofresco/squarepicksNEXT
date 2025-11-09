# Data Flow Architecture

## ESPN API Integration

### Game Ingestion (Scheduled)
```mermaid
Scheduler (Tuesday 5am ET)
  ↓
liveUpdateNflGames Function
  ↓
ESPN Scoreboard API
  ↓
Parse Games
  ↓
Firestore (games collection)
  ↓
Trigger: ensureGameBoards
  ↓
Create 4 Standard Boards ($1, $5, $10, $20)
```

### Live Game Updates (Every 15s)
```
Scheduler (Every 15 seconds during live windows)
  ↓
liveUpdateNflGames Function
  ↓
Query: games.isLive = true OR (games.status = scheduled AND startTime within 4 hours)
  ↓
For each game:
  ├─ ESPN Scoreboard API (status, scores)
  ├─ ESPN Summary API (quarter splits)
  └─ Update Firestore (game document)
      ↓
      Trigger: onGameUpdatedAssignWinners
      ↓
      Detect quarter completion
      ↓
      Calculate winning squares
      ↓
      For each board:
        ├─ Query winning squares
        ├─ Process payouts
        └─ Update board metadata
```

## Board Entry Flow

### User Entry
```
User selects squares on board (client)
  ↓
enterBoard Cloud Function (callable)
  ↓
Firestore Transaction:
  ├─ Read: board, user
  ├─ Validate: status, squares available, balance
  ├─ Write: squares documents
  ├─ Update: board.selected_indexes
  ├─ Update: user.balance (decrement)
  ├─ Create: transaction document
  └─ Create: notification document
  ↓
Response: success
  ↓
Client: Refresh board state
```

### Board Full Trigger
```
Board updated: selected_indexes.length = 100
  ↓
Trigger: handleBoardFull
  ↓
Generate random numbers (home, away)
  ↓
Update board: home_numbers, away_numbers, status = 'full'
  ↓
Batch update all squares with coordinates
  ↓
Create notifications for all participants
  ↓
Check: game.isLive?
  ├─ No: Create new 'open' board (rollover)
  └─ Yes: No rollover
```

## Winner Assignment Flow

### Quarter Completion
```
Game quarter changes (ESPN API)
  ↓
Game document updated (quarter field)
  ↓
Trigger: onGameUpdatedAssignWinners
  ↓
Detect transition (e.g., quarter 1 → 2)
  ↓
Calculate winning square from scores
  ↓
Update game.q1WinningSquare
  ↓
Query: boards where gameID = this game
  ↓
For each board:
  ├─ Query: squares where boardId AND square = winningSquare
  ├─ Firestore Transaction:
  │   ├─ Read: board, winners, game context
  │   ├─ Create: public winner summary
  │   ├─ Update: board.winners.q1
  │   ├─ For each winner:
  │   │   ├─ Create: transaction (winnings)
  │   │   ├─ Update: user.balance (increment)
  │   │   ├─ Create: notification
  │   │   └─ Create: private win record
  │   └─ If final period: Update board.status = 'closed'
  └─ Transaction committed atomically
```

## Payment Flows

### Deposit (PayPal)
```
User: PayPal checkout button
  ↓
PayPal: Create order (client-side SDK)
  ↓
User: Approve in PayPal interface
  ↓
capturePayPalOrder Function (callable)
  ↓
PayPal API: Capture order
  ↓
Firestore Transaction:
  ├─ Check: Transaction ID not already used (idempotent)
  ├─ Create: transaction document (deposit)
  ├─ Update: user.balance (increment)
  └─ Create: notification document
  ↓
Response: success
```

### Withdrawal (PayPal)
```
User: Request withdrawal
  ↓
requestWithdrawal Function (callable)
  ↓
Risk Assessment:
  ├─ Check: Rate limits (3/day, $25K/24h, $50K/7d)
  ├─ Calculate: Risk score (account age, deposits, amount)
  └─ Determine: Auto-process or manual review
  ↓
Firestore Transaction:
  ├─ Update: user.balance (decrement)
  ├─ Create: transaction document (status: processing or pending_review)
  └─ Create: notification document
  ↓
If auto-process:
  ├─ PayPal Payouts API
  ├─ Success: Update transaction (status: completed)
  └─ Failure: Refund balance, update transaction (status: failed)
  ↓
If manual review:
  └─ Admin approves/rejects later
```

## Notification Flow

### In-App Notifications
```
Event occurs (entry, win, deposit, etc.)
  ↓
Create notification document in Firestore
  ↓
Client: Real-time listener on notifications collection
  ↓
Display notification in UI
```

### Push Notifications
```
Event occurs
  ↓
Create notification document
  ↓
Optional: Get user.fcmToken
  ↓
FCM API: Send push notification
  ↓
Device: Display system notification
```

## Real-Time Data Sync

### Firestore Listeners (Client)
```
Component mounts
  ↓
Subscribe to Firestore collection/document
  ↓
onSnapshot callback
  ↓
Update local state
  ↓
Re-render component
  ↓
Component unmounts: Unsubscribe
```

**Example**:
```javascript
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'boards'), where('gameID', '==', gameRef)),
    (snapshot) => {
      const boards = snapshot.docs.map(doc => doc.data());
      setBoards(boards);
    }
  );
  return () => unsubscribe();
}, [gameId]);
```

## Error Handling Flow

### Function Errors
```
Function execution
  ↓
Error occurs
  ↓
console.error (logged to Cloud Logging)
  ↓
If HttpsError: Return error to client
  ↓
If unexpected: Return generic internal error
  ↓
Client: Display error message
```

### Transaction Failures
```
Transaction starts
  ↓
Error occurs (validation, constraint, timeout)
  ↓
Entire transaction rolled back
  ↓
No partial writes committed
  ↓
Error thrown to caller
  ↓
Client: Retry or display error
```

## Data Consistency Guarantees

### Strong Consistency
- Firestore transactions (ACID)
- Balance changes always paired with transaction records
- Winner assignment atomic (all winners or none)

### Eventual Consistency
- ESPN API updates (scores may be delayed)
- Cross-collection aggregations
- Notification delivery

### Idempotency
- Deposit transactions use deterministic IDs
- Winner assignment checks if already completed
- Retry-safe operations

