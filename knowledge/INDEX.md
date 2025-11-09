# Complete Documentation Index

## 🏠 Root Documentation
- [Main README](./README.md) - Documentation overview
- [Quick Start Guide](./QUICK-START.md) - Get started quickly
- **This File** - Complete navigation index

---

## 🎣 Custom Hooks
**Path**: `knowledge/hooks/`

### Overview
- [Hooks README](./hooks/README.md) - Overview and quick reference

### Individual Hooks
- [useAuth](./hooks/useAuth.md) - Basic Firebase authentication state
  - Real-time auth state tracking
  - User information access
  - Loading and error states

- [useAuthGuard](./hooks/useAuthGuard.md) - Protected route authentication
  - Auto-redirect to login
  - Email verification enforcement
  - User document creation
  - Loading states

- [useFcmToken](./hooks/useFcmToken.md) - Push notification management
  - FCM token generation
  - Permission requests
  - Token storage in Firestore
  - Foreground message handling

- [useWallet](./hooks/useWallet.md) - Wallet balance and operations
  - Real-time balance updates
  - Wallet initialization
  - Email verification resend
  - Transaction handling

---

## 🛠️ Utilities
**Path**: `knowledge/utils/`

### Overview
- [Utils README](./utils/README.md) - Overview and quick reference

### Utility Functions
- [cn() - Class Name Utility](./utils/cn-utility.md)
  - Tailwind CSS class merging
  - Conflict resolution
  - Conditional classes
  - Component styling patterns

- [Date Utilities](./utils/date-utils.md)
  - `getNFLWeekRange()` - Calculate NFL week dates
  - `getFirestoreTimestampRange()` - Firestore timestamps
  - `formatDateRange()` - Human-readable date ranges
  - NFL season calculations

---

## 🔌 External Integrations
**Path**: `knowledge/integrations/`

### Overview
- [Integrations README](./integrations/README.md) - Overview and architecture

### Sports Data
- [ESPN API](./integrations/espn-api.md)
  - Game schedules and scores
  - Live score polling
  - Scoreboard API
  - Retry logic and rate limiting
  - Error handling

### Payment Processing
- [PayPal Integration](./integrations/paypal.md)
  - Create order flow
  - Capture order flow
  - OAuth authentication
  - Webhook handling
  - Environment configuration
  - Testing with sandbox

- [Stripe Integration](./integrations/stripe.md)
  - Payment intents (planned)
  - Checkout sessions (planned)
  - Webhook verification
  - Testing with test cards
  - Migration from mock to production

### Backend Services
- [Firebase Integration](./integrations/firebase.md)
  - Authentication
  - Cloud Firestore
  - Cloud Messaging (FCM)
  - Analytics
  - App Check (reCAPTCHA)
  - Admin SDK
  - Client SDK

- [Google Authentication](./integrations/google-auth.md)
  - OAuth 2.0 sign-in
  - Sign-in with popup
  - Sign-in with redirect
  - Account linking
  - Error handling

### Communication Services
- [Resend Email](./integrations/resend.md)
  - Email sending
  - Email templates
  - Webhook events
  - Domain configuration
  - Delivery tracking
  - Testing

- [Twilio SMS](./integrations/twilio.md)
  - SMS messaging
  - Phone verification
  - Twilio Verify API
  - Two-factor authentication
  - Webhook callbacks
  - Testing with test numbers

---

## 🔒 Security
**Path**: `knowledge/security/`

### Overview
- [Security README](./security/README.md) - Security principles and best practices

### Security Documentation
- [Firestore Security Rules](./security/firestore-rules.md)
  - Complete rules breakdown
  - Helper functions
  - Collection-specific rules
  - User data protection
  - Board and square access
  - Transaction security
  - Notification rules
  - Testing rules
  - Performance considerations

---

## 📋 Full File Listing

### Hooks (4 files + README)
```
knowledge/hooks/
├── README.md
├── useAuth.md
├── useAuthGuard.md
├── useFcmToken.md
└── useWallet.md
```

### Utils (2 files + README)
```
knowledge/utils/
├── README.md
├── cn-utility.md
└── date-utils.md
```

### Integrations (7 files + README)
```
knowledge/integrations/
├── README.md
├── espn-api.md
├── paypal.md
├── stripe.md
├── firebase.md
├── google-auth.md
├── resend.md
└── twilio.md
```

### Security (1 file + README)
```
knowledge/security/
├── README.md
└── firestore-rules.md
```

### Root Files
```
knowledge/
├── README.md           (Main documentation entry)
├── INDEX.md           (This file)
└── QUICK-START.md     (Quick start guide)
```

---

## 📊 Documentation Statistics

- **Total Directories**: 4 (hooks, utils, integrations, security)
- **Total Files**: 20 markdown files
- **Custom Hooks**: 4 documented
- **Utilities**: 2 documented
- **Integrations**: 7 documented
- **Security Docs**: 2 files

---

## 🔍 Quick Navigation by Topic

### Authentication & Users
- [useAuth Hook](./hooks/useAuth.md)
- [useAuthGuard Hook](./hooks/useAuthGuard.md)
- [Firebase Authentication](./integrations/firebase.md)
- [Google Auth](./integrations/google-auth.md)
- [User Security Rules](./security/firestore-rules.md#usersuserid)

### Wallet & Payments
- [useWallet Hook](./hooks/useWallet.md)
- [PayPal Integration](./integrations/paypal.md)
- [Stripe Integration](./integrations/stripe.md)
- [Transaction Security Rules](./security/firestore-rules.md#transactionstransactionid)

### Notifications
- [useFcmToken Hook](./hooks/useFcmToken.md)
- [Firebase Cloud Messaging](./integrations/firebase.md#firebase-cloud-messaging)
- [Resend Email](./integrations/resend.md)
- [Twilio SMS](./integrations/twilio.md)
- [Notification Security Rules](./security/firestore-rules.md#notificationsnotificationid)

### Game Data
- [ESPN API Integration](./integrations/espn-api.md)
- [Date Utilities (NFL Weeks)](./utils/date-utils.md)
- [Game Security Rules](./security/firestore-rules.md#gamesgamedocid)

### Styling & UI
- [cn() Utility](./utils/cn-utility.md)
- [Component Patterns](./hooks/README.md#common-usage-patterns)

### Security
- [Security Overview](./security/README.md)
- [Firestore Rules](./security/firestore-rules.md)
- [Firebase Security](./integrations/firebase.md#security-rules)
- [Payment Security](./integrations/paypal.md#security-considerations)

---

## 📖 Reading Guide

### For New Developers
1. Start with [Quick Start Guide](./QUICK-START.md)
2. Read [Hooks Overview](./hooks/README.md)
3. Understand [Firebase Integration](./integrations/firebase.md)
4. Review [Security Rules](./security/firestore-rules.md)

### For Frontend Developers
1. [Custom Hooks](./hooks/README.md)
2. [Utils (cn and date)](./utils/README.md)
3. [Firebase Client SDK](./integrations/firebase.md)
4. [PayPal Integration](./integrations/paypal.md)

### For Backend Developers
1. [Firebase Admin SDK](./integrations/firebase.md)
2. [Security Rules](./security/firestore-rules.md)
3. [ESPN API](./integrations/espn-api.md)
4. [Email/SMS Services](./integrations/resend.md)

### For DevOps/Deployment
1. [Firebase Configuration](./integrations/firebase.md)
2. [PayPal Setup](./integrations/paypal.md)
3. [Environment Variables](./integrations/README.md#environment-variables-summary)
4. [Security Best Practices](./security/README.md)

---

## 🔗 Related Project Documentation

### Root Level Docs (Outside knowledge/)
- `ARCHITECTURE.md` - System architecture overview
- `DEPLOYMENT_GUIDE.md` - Deployment procedures
- `CONTRIBUTING.md` - Contribution guidelines
- `FAQ.md` - Frequently asked questions
- `HOWTOPLAY.md` - User-facing game instructions

### Code Documentation
- Component READMEs in `src/components/`
- Type definitions in `src/types/`
- API route documentation in `src/app/api/`

---

## 🔄 Documentation Updates

### Last Updated: November 9, 2024

### Recent Changes
- Initial documentation creation
- All 4 custom hooks documented
- All 7 integrations documented
- Security rules fully documented
- Utility functions documented

### Maintenance
Documentation is maintained alongside code changes. When updating functionality:
1. Update relevant documentation files
2. Update this index if structure changes
3. Update README files in each section
4. Verify all links are working

---

## 📝 Documentation Standards

### File Naming
- Use kebab-case: `use-auth.md`, `espn-api.md`
- Descriptive names: Include what it documents
- README files: Uppercase `README.md`

### Content Structure
- H1 title at top
- Overview section
- Detailed sections with H2/H3
- Code examples with syntax highlighting
- Related links at bottom

### Code Examples
- Always include language identifier
- Show complete, runnable examples
- Include error handling
- Add comments for clarity

---

**Navigation**: [🏠 Home](./README.md) | [⚡ Quick Start](./QUICK-START.md)

