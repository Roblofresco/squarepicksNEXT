# System Overview

## Architecture
SquarePicks is a serverless sports squares platform built on Firebase with Next.js frontend.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: React Context + Hooks
- **Auth**: Firebase Authentication

### Backend
- **Platform**: Firebase (Google Cloud)
- **Database**: Cloud Firestore
- **Functions**: Cloud Functions (Node.js)
- **Storage**: Cloud Storage (for assets)
- **Hosting**: Firebase Hosting

### External Services
- **Payments**: PayPal (deposits & withdrawals)
- **Sports Data**: ESPN API
- **Notifications**: Firebase Cloud Messaging (FCM)
- **Email**: Resend
- **SMS**: Twilio

## System Components

### Client Application
```
Next.js App
├── Pages (app router)
├── Components (React)
├── Context (Auth, Notifications)
├── Hooks (useAuth, useWallet)
└── API Routes (Next.js API)
```

### Firebase Backend
```
Cloud Functions
├── HTTP Triggers (callable, onRequest)
├── Firestore Triggers (onCreate, onUpdate)
├── Scheduled Triggers (cron jobs)
└── Document Triggers (onWrite, onDelete)

Firestore Collections
├── users
├── games
├── boards
├── squares
├── transactions
├── notifications
├── sweepstakes
└── teams
```

### External Integrations
```
ESPN API → Game data ingestion
PayPal API → Payment processing
FCM → Push notifications
Resend → Email notifications
Twilio → SMS notifications (optional)
```

## Data Flow

### Game Ingestion
```
ESPN API → Cloud Function → Firestore (games) → Trigger → Create boards
```

### Board Entry
```
User → Next.js → Cloud Function → Transaction (squares + balance + transaction) → Notification
```

### Live Updates
```
Scheduler → Cloud Function → ESPN API → Update games → Trigger → Assign winners → Payout
```

### Withdrawals
```
User → Cloud Function → Risk Assessment → PayPal Payout → Balance refund (if failed)
```

## Deployment Architecture

### Production Environment
```
firebase-prod (project ID)
├── Hosting: squarepicks.com
├── Functions: us-east1
├── Firestore: nam5 (multi-region)
└── Storage: us-central1
```

### Development Environment
```
firebase-dev (project ID)
├── Hosting: dev.squarepicks.com
├── Functions: us-east1
├── Firestore: us-central1
└── Emulators (local development)
```

## Scaling Considerations

### Firestore
- Automatic horizontal scaling
- 1M document reads/day (free tier)
- Composite indexes required for complex queries
- Subcollections for hierarchical data

### Cloud Functions
- Auto-scaling (0 to N instances)
- Cold start mitigation via min instances
- Regional deployment for low latency
- Timeout: 60s HTTP, 540s event-driven

### Real-Time Updates
- Firestore listeners for live data
- FCM for push notifications
- Client-side caching for performance

## Security Model

### Authentication
- Firebase Auth (email/password)
- JWT tokens for API calls
- Session management via Firebase SDK

### Authorization
- Firestore Security Rules (read/write permissions)
- Cloud Function auth checks (request.auth)
- Role-based access (admin vs user)

### Data Protection
- Encryption at rest (Firebase default)
- Encryption in transit (HTTPS only)
- PII minimization
- GDPR/CCPA compliance

## Monitoring & Logging

### Application Monitoring
- Firebase Console (usage metrics)
- Cloud Functions logs (execution logs)
- Firestore usage dashboard
- Error tracking via console.error

### Business Metrics
- Daily Active Users (DAU)
- Board fill rates
- Conversion rates (free → paid)
- Revenue per user

### Alerting
- Function error rates > threshold
- API quota limits approached
- Payment failures
- Security rule violations

## Cost Structure

### Firebase Costs
- Firestore: $0.18 per 100K reads
- Functions: $0.40 per million invocations
- Hosting: $0.15 per GB transferred
- Storage: $0.026 per GB/month

### Third-Party Costs
- PayPal: 2.9% + $0.30 per transaction
- ESPN API: Free tier (rate limited)
- Resend: $20/month (50K emails)

### Estimated Monthly Cost (1K users)
- Firebase: ~$50
- PayPal fees: ~$150 (variable)
- Third-party: ~$20
- Total: ~$220/month

## Disaster Recovery

### Backup Strategy
- Firestore: Daily exports to Cloud Storage
- Functions: Source code in Git
- Secrets: Stored in Secret Manager

### Recovery Time Objective (RTO)
- Critical functions: < 1 hour
- Full system: < 4 hours

### Recovery Point Objective (RPO)
- Firestore: < 24 hours (daily backups)
- Real-time data: Best effort (no backup)

