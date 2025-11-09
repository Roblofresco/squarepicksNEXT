# Data Models

This directory contains comprehensive documentation for all 8 Firestore collections in the SquarePicks platform.

## Collections Overview

### Core Collections
1. **[users](./users.md)** - User accounts, wallets, KYC data
2. **[games](./games.md)** - Sports game data from ESPN API
3. **[boards](./boards.md)** - 100-square boards for each game
4. **[squares](./squares.md)** - Individual square selections
5. **[transactions](./transactions.md)** - Financial transaction records
6. **[notifications](./notifications.md)** - User notifications
7. **[sweepstakes](./sweepstakes.md)** - Free board promotions
8. **[teams](./teams.md)** - Team reference data

## Entity Relationships

```
users
  ├─> squares (userID reference)
  ├─> transactions (userID reference)
  ├─> notifications (userID reference)
  └─> wins (subcollection)

games
  ├─> teams (homeTeam, awayTeam references)
  └─> boards (gameID reference)

boards
  ├─> games (gameID reference)
  ├─> squares (boardId string match)
  ├─> sweepstakes (sweepstakesID reference, optional)
  └─> winners (subcollection)

squares
  ├─> users (userID reference)
  └─> boards (boardId string match)

transactions
  ├─> users (userID reference)
  ├─> boards (boardId string match, optional)
  └─> games (gameId string match, optional)

notifications
  ├─> users (userID reference)
  ├─> transactions (relatedID reference, optional)
  ├─> boards (boardId string match, optional)
  └─> games (gameId string match, optional)

sweepstakes
  ├─> boards (boardIDs array of references)
  └─> participants (subcollection)

teams
  └─> games (referenced by homeTeam, awayTeam)
```

## Key Patterns

### DocumentReferences vs String IDs
- **DocumentReferences**: Used for foreign key relationships (e.g., `board.gameID → games/{gameId}`)
- **String IDs**: Used for reverse lookups and queries (e.g., `square.boardId = "abc123"`)

### Subcollections
- `users/{uid}/wins/{winDocId}` - Private win records
- `boards/{boardId}/winners/{period}` - Public winner summaries
- `sweepstakes/{sweepId}/participants/{participantId}` - Sweepstakes entries

### Timestamps
All collections use consistent timestamp fields:
- `created_time` / `timestamp` / `createdAt` - Creation
- `updated_time` / `updatedAt` - Last modification
- `settled_at` / `completedAt` - Completion (conditional)

### Financial Consistency
All balance changes paired with transaction records:
```javascript
await db.runTransaction(async (tx) => {
  tx.set(txRef, {...});  // Transaction record
  tx.update(userRef, {   // Balance update
    balance: FieldValue.increment(amount)
  });
});
```

## Query Patterns

### User Data
```javascript
// User's squares on board
.where('boardId', '==', boardId)
.where('userID', '==', userRef)

// User's transactions
.where('userID', '==', userId)
.orderBy('timestamp', 'desc')

// User's notifications
.where('userID', '==', userId)
.where('isRead', '==', false)
```

### Game Data
```javascript
// Live games
.where('sport', '==', 'NFL')
.where('isLive', '==', true)
.where('isOver', '==', false)

// Scheduled games
.where('sport', '==', 'NFL')
.where('status', '==', 'scheduled')
.where('startTime', '>=', startDate)
```

### Board Data
```javascript
// Open boards for game
.where('gameID', '==', gameRef)
.where('status', '==', 'open')

// Winners on board
.where('boardId', '==', boardId)
.where('square', '==', winningSquare)
```

## Index Requirements

All required indexes are documented in each collection's file. Key composite indexes:

- `games`: `sport + isLive + isOver`, `sport + status + startTime`
- `boards`: `gameID + status`, `gameID + amount`
- `squares`: `boardId + square` (critical for winner queries)
- `transactions`: `userID + type + timestamp`, `userID + type + requestedAt`
- `notifications`: `userID + isRead + timestamp`

## Data Integrity

### Transaction Safety
- All financial operations use Firestore transactions
- Balance checks repeated inside transactions
- Deterministic IDs prevent duplicate credits

### Idempotency
- Winner assignment checks for existing completion
- Duplicate entries prevented via index checks
- PayPal deposits use deterministic transaction IDs

### Referential Integrity
- DocumentReferences validated before use
- Missing references throw errors (fail fast)
- Orphaned records prevented via atomic operations

## Performance Considerations

### Write Optimization
- Diff-based updates (only write if changed)
- Batch operations for bulk updates
- Transaction reads before writes (Firestore requirement)

### Query Optimization
- Indexes on high-selectivity fields (userID, boardId)
- Composite indexes for common filter combinations
- Limit clauses to prevent unbounded queries

### Caching Strategy
- Team data (rarely changes)
- Board numbers (static after assignment)
- User's squares (fetched once per board view)

## Migration Notes

### Legacy Fields
- `team_id` → `externalIds.espn` (teams)
- Balance moved from `wallets` collection to `users.balance`

### New Fields
- `tag` added to notifications for categorization
- `winners` map added to boards for metadata
- `riskScore` added to withdrawal transactions

## Testing Data

For development/testing, use test scripts:
- `create-test-data.js` - Populate test games and boards
- `create-test-firestore.js` - Initialize collections with sample data
- `create-test-live-game.js` - Create live game for testing winner assignment

## Further Documentation

- **[Business Rules](../business-rules/)** - Game lifecycle, payouts, entry fees
- **[Architecture](../architecture/)** - System design, data flow
- **[Workflows](../workflows/)** - User journeys, processes

