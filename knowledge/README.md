# SquarePicks Knowledge Base

Complete foundation documentation for the SquarePicks sports squares platform.

## Documentation Structure

### 📊 [Data Models](./data-models/)
Database schema and collection structures for all 8 Firestore collections:
- [users](./data-models/users.md) - User accounts and wallets
- [games](./data-models/games.md) - Sports game data
- [boards](./data-models/boards.md) - 100-square boards
- [squares](./data-models/squares.md) - Individual square selections
- [transactions](./data-models/transactions.md) - Financial records
- [notifications](./data-models/notifications.md) - User notifications
- [sweepstakes](./data-models/sweepstakes.md) - Free board promotions
- [teams](./data-models/teams.md) - Team reference data

### 📋 [Business Rules](./business-rules/)
Core business logic and calculation rules:
- [Game Lifecycle](./business-rules/game-lifecycle.md) - Game state transitions
- [Board Lifecycle](./business-rules/board-lifecycle.md) - Board management
- [Winner Calculation](./business-rules/winner-calculation.md) - Scoring algorithm
- [Payout Rules](./business-rules/payout-rules.md) - Winner compensation
- [Entry Fees](./business-rules/entry-fees.md) - Entry pricing and validation
- [Sweepstakes](./business-rules/sweepstakes.md) - Free board rules
- [Withdrawals](./business-rules/withdrawals.md) - Cash-out process

### 🏗️ [Architecture](./architecture/)
System design and technical architecture:
- [System Overview](./architecture/system-overview.md) - Technology stack
- [Data Flow](./architecture/data-flow.md) - Request/response flows
- [Real-Time Updates](./architecture/real-time-updates.md) - ESPN polling, Firestore listeners
- [Payment Architecture](./architecture/payment-architecture.md) - PayPal integration
- [Notification System](./architecture/notification-system.md) - In-app and push notifications

### 🔄 [Workflows](./workflows/)
End-to-end user journeys:
- [Signup](./workflows/signup.md) - New user registration
- [Board Entry](./workflows/board-entry.md) - Select and enter boards
- [Game Lifecycle (User)](./workflows/game-lifecycle-user.md) - From entry to payout
- [Deposit](./workflows/deposit.md) - Add funds via PayPal
- [Withdrawal](./workflows/withdrawal.md) - Cash out winnings
- [Sweepstakes Entry](./workflows/sweepstakes-entry.md) - Free board entry

## Quick Reference

### Core Concepts

**Squares Game**: A 10×10 grid (100 squares) where each square represents a combination of last digits from both teams' scores. Winners determined at end of each quarter.

**Board Lifecycle**: open → full → active → closed

**Winner Calculation**: 
```
homeLastDigit = score % 10
awayLastDigit = score % 10
winningSquare = awayLastDigit + homeLastDigit
```

**Payout Structure**: 25% per quarter
- Q1: 25% of pot
- Q2: 25% of pot  
- Q3: 25% of pot
- Final: 25% of pot

**Financial Model**:
- 80 squares cover prize pool
- 20 squares are profit (20% margin)
- Example: $5 board = $400 pot, $100 profit

### Key Integrations

**ESPN API**: Real-time game scores and schedules
- Polling: Every 15 seconds during live windows
- Endpoints: Scoreboard, Summary
- Data: Teams, scores, status, quarter splits

**PayPal**:
- Deposits: PayPal Checkout SDK
- Withdrawals: PayPal Payouts API
- Fees: 2.9% + $0.30 (user pays on deposit)

**Firebase**:
- Firestore: Database (8 collections)
- Cloud Functions: Backend logic (40+ functions)
- Authentication: User management
- Hosting: Frontend deployment
- FCM: Push notifications

### Critical Rules

✅ **Atomic Operations**: All financial transactions use Firestore transactions
✅ **Idempotency**: Safe to retry winner assignments and payouts
✅ **Immediate Payouts**: Winners paid instantly when quarter ends
✅ **Balance Consistency**: Every balance change has transaction record
✅ **Rate Limiting**: Max 3 withdrawals per 24 hours

### Common Queries

**Find open boards for game**:
```javascript
db.collection('boards')
  .where('gameID', '==', gameRef)
  .where('status', '==', 'open')
  .get()
```

**Find winners for period**:
```javascript
db.collection('squares')
  .where('boardId', '==', boardId)
  .where('square', '==', winningSquare)
  .get()
```

**User transaction history**:
```javascript
db.collection('transactions')
  .where('userID', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get()
```

## Implementation Guidelines

### Adding New Features

1. **Data Model**: Design Firestore structure
2. **Business Rules**: Define logic and validation
3. **Cloud Function**: Implement server-side logic
4. **Frontend**: Build UI components
5. **Testing**: Test with Firebase emulators
6. **Documentation**: Update knowledge base

### Code Organization

```
functions/
  └─ index.js           # All Cloud Functions

src/
  ├─ app/               # Next.js pages
  ├─ components/        # React components
  ├─ context/           # React context
  ├─ hooks/             # Custom hooks
  └─ lib/               # Utilities

knowledge/
  ├─ data-models/       # Database docs
  ├─ business-rules/    # Logic docs
  ├─ architecture/      # System docs
  └─ workflows/         # User journey docs
```

### Security Best Practices

- ✅ All financial operations in Cloud Functions
- ✅ Firestore Security Rules enforce read/write permissions
- ✅ Firebase Auth required for all user actions
- ✅ PayPal credentials in Secret Manager
- ✅ HTTPS only, no client-side secrets
- ✅ Input validation on client and server

### Performance Optimization

- 🚀 Diff-based writes (only update if changed)
- 🚀 Composite indexes for common queries
- 🚀 Client-side caching for static data
- 🚀 Batch operations for bulk updates
- 🚀 Query limits prevent unbounded reads

## Getting Started

### For Developers

1. **Clone repository**
2. **Install dependencies**: `npm install`
3. **Set up Firebase**: Configure project credentials
4. **Run emulators**: `firebase emulators:start`
5. **Start dev server**: `npm run dev`
6. **Read docs**: Start with [System Overview](./architecture/system-overview.md)

### For Product Managers

1. Start with [Workflows](./workflows/) to understand user journeys
2. Review [Business Rules](./business-rules/) for game mechanics
3. Check [Data Models](./data-models/) for data structure

### For Designers

1. Review [Workflows](./workflows/) for user experience
2. Check [Notification System](./architecture/notification-system.md) for messaging
3. See existing components in `src/components/`

## Support & Troubleshooting

### Common Issues

**Winners not assigned**: Check game quarter scores are available
**Payout incorrect**: Verify board pot/payout values
**Withdrawal pending**: Check risk assessment flags
**Board not filling**: Verify game not already live

### Debugging Tools

```bash
# Check game status
node query-live-games.js

# Verify board structure
node check-board-structure.js <boardId>

# Test winner assignment
node manually-assign-q1-winner.js <boardId>

# Verify user balance
node check-user-wins.js <userId>
```

### Logs & Monitoring

- Cloud Functions logs: Firebase Console → Functions
- Firestore operations: Firebase Console → Firestore
- Error tracking: Search logs for "Error"
- Performance: Firebase Console → Performance

## Maintenance

### Weekly Tasks
- Review pending withdrawals (manual review queue)
- Check error logs for anomalies
- Verify ESPN API rate limit usage
- Monitor Firebase quota usage

### Monthly Tasks
- Archive old notifications (>90 days)
- Review conversion metrics
- Update team data if needed
- Backup Firestore data

### Quarterly Tasks
- Security audit
- Performance review
- Cost optimization
- Feature roadmap planning

## Resources

### External Documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [ESPN API](https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c)
- [PayPal API](https://developer.paypal.com/docs/)

### Internal Resources
- Firebase Console: [console.firebase.google.com](https://console.firebase.google.com)
- PayPal Developer: [developer.paypal.com](https://developer.paypal.com)
- Repository: Check Git remote URL
- Design Files: (Add Figma/design tool link)

## Contributing

When adding new documentation:
1. Follow existing structure and format
2. Include code examples
3. Add cross-references to related docs
4. Update this README with new doc links
5. Keep docs in sync with implementation

## Version History

- **v1.0** (Jan 2025): Initial complete documentation
  - 8 data models
  - 7 business rules
  - 5 architecture docs
  - 6 workflows

---

**Last Updated**: January 2025  
**Documentation Version**: 1.0  
**Platform Version**: MVP (Production-ready)

