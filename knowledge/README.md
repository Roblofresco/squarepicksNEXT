# SquarePicks Technical Documentation

## Overview
Comprehensive technical documentation for the SquarePicks application - an NFL squares pool betting platform built with Next.js, Firebase, and modern web technologies.

## Documentation Structure

### 📚 [Quick Start Guide](./QUICK-START.md)
Get up and running with development in minutes

### 🔍 [Complete Index](./INDEX.md)
Full navigation to all documentation sections

## Core Documentation Sections

### 🎣 [Custom Hooks](./hooks/)
React hooks for authentication, wallet management, and push notifications
- `useAuth` - Firebase authentication state
- `useAuthGuard` - Protected route authentication
- `useWallet` - Wallet balance and management
- `useFcmToken` - Push notification tokens

### 🛠️ [Utilities](./utils/)
Helper functions and utilities
- `cn()` - Tailwind class merging
- Date utilities - NFL week calculations
- Firestore timestamp helpers

### 🔌 [External Integrations](./integrations/)
Third-party service integrations
- **ESPN API** - Game data and live scores
- **PayPal** - Payment processing
- **Stripe** - Alternative payment processing
- **Firebase** - Auth, database, cloud messaging
- **Google Auth** - OAuth sign-in
- **Resend** - Email delivery
- **Twilio** - SMS notifications

### 🔒 [Security](./security/)
Security configurations and best practices
- Firestore security rules
- Authentication patterns
- Payment security
- Data protection

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: React hooks, Context API
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth
- **Cloud Functions**: Firebase Functions (Node.js)
- **Hosting**: Vercel (frontend), Firebase (functions)

### External Services
- **Payment**: PayPal, Stripe (planned)
- **Sports Data**: ESPN API
- **Email**: Resend
- **SMS**: Twilio
- **Push Notifications**: Firebase Cloud Messaging

## Project Architecture

```
squarepicks/
├── src/
│   ├── app/                  # Next.js app router pages
│   ├── components/           # React components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and configs
│   ├── context/             # React context providers
│   └── types/               # TypeScript types
├── functions/               # Firebase Cloud Functions (separate repo)
├── public/                  # Static assets
├── knowledge/              # This documentation
└── firestore.rules         # Firestore security rules
```

## Key Features

### User Features
- 🎯 Pick squares on NFL game boards
- 💰 Wallet system for deposits/withdrawals
- 🏆 Automatic winner determination per quarter
- 📱 Push notifications for game updates
- 📧 Email notifications for wins and transactions
- 📊 Real-time score updates
- 🎮 Live game tracking

### Technical Features
- ⚡ Real-time data synchronization
- 🔒 Secure payment processing
- 🛡️ Comprehensive security rules
- 📲 Progressive Web App (PWA) support
- 🎨 Responsive design
- ♿ Accessibility features
- 🚀 Optimized performance

## Quick Links

### Getting Started
- [Quick Start](./QUICK-START.md)
- [Environment Setup](./config/environment-variables.md)
- [Local Development](./config/local-development.md)

### Core Concepts
- [Authentication Flow](./hooks/useAuthGuard.md)
- [Wallet System](./hooks/useWallet.md)
- [Payment Processing](./integrations/paypal.md)
- [Security Rules](./security/firestore-rules.md)

### Integration Guides
- [ESPN API Integration](./integrations/espn-api.md)
- [PayPal Setup](./integrations/paypal.md)
- [Firebase Configuration](./integrations/firebase.md)
- [Email Setup](./integrations/resend.md)

## Development Workflow

### 1. Setup
```bash
# Clone repository
git clone https://github.com/your-org/squarepicks

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### 2. Development
- Follow [component patterns](./components/)
- Use [custom hooks](./hooks/) for reusable logic
- Follow [TypeScript best practices](./types/)
- Test with [Firebase emulators](./config/firebase-emulators.md)

### 3. Testing
- Unit tests with Jest
- Integration tests with Playwright
- Firestore rules testing with emulator
- Manual testing checklist

### 4. Deployment
- Staging: Vercel preview deployments
- Production: Vercel production + Firebase Functions
- Database: Firebase Firestore
- Security rules: Deployed with Firebase CLI

## Common Tasks

### Add a New Hook
1. Create file in `src/hooks/`
2. Document in `knowledge/hooks/`
3. Add to `knowledge/hooks/README.md`
4. Export from `src/hooks/index.ts`

### Add a New Integration
1. Install SDK: `npm install package-name`
2. Add environment variables
3. Create API route or service
4. Document in `knowledge/integrations/`
5. Update integration README

### Update Security Rules
1. Edit `firestore.rules`
2. Test with Firebase emulator
3. Document in `knowledge/security/firestore-rules.md`
4. Deploy: `firebase deploy --only firestore:rules`

### Add a New Component
1. Create in `src/components/`
2. Follow naming conventions
3. Add TypeScript types
4. Document props and usage
5. Add to Storybook (if applicable)

## Contributing

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits

### Documentation
- Update docs with code changes
- Include examples for new features
- Document breaking changes
- Keep README files current

### Pull Request Process
1. Create feature branch
2. Make changes with tests
3. Update documentation
4. Submit PR with description
5. Address review feedback
6. Merge after approval

## Support & Resources

### Internal Resources
- [Complete Index](./INDEX.md)
- [Quick Start](./QUICK-START.md)
- [Architecture Docs](../ARCHITECTURE.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Getting Help
- 📧 Email: dev@squarepicks.com
- 💬 Team Chat: Slack #dev-squarepicks
- 🐛 Issues: GitHub Issues
- 📖 Docs: This knowledge base

## Version History

### Current Version: 1.0.0
- Initial production release
- Core features implemented
- PayPal integration active
- Firebase backend complete

### Upcoming
- Stripe integration completion
- Enhanced analytics
- Social features
- Mobile app development

## License

Proprietary - All Rights Reserved

Copyright © 2024 SquarePicks

---

**Last Updated**: November 9, 2024

**Maintained By**: SquarePicks Development Team

**Documentation Version**: 1.0.0
