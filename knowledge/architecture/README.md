# Architecture

System architecture, data flow, and integration patterns for SquarePicks.

## Documents

1. **[System Overview](./system-overview.md)** - Technology stack, components, deployment
2. **[Data Flow](./data-flow.md)** - Request/response flows, data pipelines
3. **[Real-Time Updates](./real-time-updates.md)** - ESPN polling, Firestore listeners, FCM
4. **[Payment Architecture](./payment-architecture.md)** - PayPal integration, deposits, withdrawals
5. **[Notification System](./notification-system.md)** - In-app, push, and future channels

## Architecture Principles

### Serverless-First
- No server management
- Auto-scaling
- Pay-per-use pricing
- Focus on business logic

### Event-Driven
- Firestore triggers
- Cloud Function triggers
- Real-time listeners
- Scheduled tasks

### Transactional Integrity
- ACID guarantees via Firestore transactions
- Atomic balance changes
- Idempotent operations
- No partial states

### Security by Default
- Firebase Auth for authentication
- Firestore rules for authorization
- HTTPS only
- Secrets in Secret Manager

## Technology Decisions

### Why Firebase?
- ✅ Real-time database with listeners
- ✅ Built-in authentication
- ✅ Serverless functions
- ✅ Generous free tier
- ✅ Global CDN for hosting
- ❌ Vendor lock-in (acceptable trade-off)

### Why PayPal?
- ✅ User trust and familiarity
- ✅ Payouts API for withdrawals
- ✅ No PCI compliance burden
- ❌ Transaction fees (2.9% + $0.30)

### Why ESPN API?
- ✅ Comprehensive sports data
- ✅ Real-time scores
- ✅ Free tier available
- ❌ Rate limiting (mitigated with caching)

### Why Next.js?
- ✅ Server-side rendering (SEO)
- ✅ API routes (backend for frontend)
- ✅ File-based routing
- ✅ TypeScript support
- ✅ Great DX with hot reload

## Scalability

### Current Capacity
- **Users**: 10K concurrent
- **Games**: 50 live games
- **Boards**: 1K active boards
- **Transactions**: 100/second

### Bottlenecks
1. **Firestore writes**: 10K writes/sec limit per database
2. **Cloud Functions**: Cold start latency
3. **ESPN API**: Rate limiting (~1K req/hour)

### Scaling Strategies
1. **Horizontal**: More Cloud Function instances (automatic)
2. **Caching**: Cache ESPN responses client-side
3. **Sharding**: Multiple Firestore databases (if needed)
4. **CDN**: Static assets via Firebase Hosting CDN

## Monitoring & Observability

### Metrics
- Function execution time
- Firestore read/write counts
- Error rates
- User session duration

### Logs
- Cloud Functions logs (console.log)
- Firestore audit logs
- Security rule violations
- Payment failures

### Alerts
- Function error rate > 5%
- API quota > 80%
- Payment failure spike
- Abnormal balance changes

## Disaster Recovery

### Backup
- Firestore: Daily exports to Cloud Storage
- Functions: Source code in Git
- Secrets: Secret Manager with versioning

### Recovery
- Deploy from Git
- Import Firestore backup
- Restore secrets from backup
- DNS update if needed

## Future Enhancements

### Performance
- Edge functions (reduce latency)
- Firestore caching layer
- Optimistic UI updates

### Features
- Multi-sport support (NBA, MLB)
- Live leaderboards
- Social features (friend groups)
- Mobile apps (React Native)

### Infrastructure
- Multi-region deployment
- A/B testing framework
- Advanced analytics (BigQuery)
- Machine learning (fraud detection)

