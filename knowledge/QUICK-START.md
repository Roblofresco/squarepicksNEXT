# Quick Start Guide

## Get Started in 5 Minutes

This guide will get you up and running with the SquarePicks codebase quickly.

---

## Prerequisites

- Node.js 20+ installed
- Git installed
- Firebase account
- Code editor (VS Code recommended)

---

## 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-org/squarepicks
cd squarepicks

# Install dependencies
npm install
```

---

## 2. Environment Setup

Create `.env.local` file in the project root:

```bash
# Firebase Client Config (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=your_recaptcha_key

# Firebase Admin (Secret) - Use service account JSON
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# PayPal (for local testing use sandbox)
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_ENV=sandbox

# Optional: Set these if you're working on specific features
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
RESEND_API_KEY=re_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

**Where to get credentials:**
- Firebase: [Firebase Console](https://console.firebase.google.com)
- PayPal: [PayPal Developer](https://developer.paypal.com/dashboard/)
- Stripe: [Stripe Dashboard](https://dashboard.stripe.com)
- Resend: [Resend Dashboard](https://resend.com/dashboard)
- Twilio: [Twilio Console](https://console.twilio.com)

---

## 3. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 4. Understand the Structure

```
squarepicks/
├── src/
│   ├── app/              # Next.js pages & API routes
│   ├── components/       # React components
│   ├── hooks/           # Custom hooks (START HERE)
│   ├── lib/             # Utilities & configs
│   └── context/         # React context providers
├── knowledge/           # This documentation
└── firestore.rules      # Security rules
```

---

## 5. Key Concepts

### Authentication
```typescript
import { useAuthGuard } from '@/hooks/useAuthGuard';

function ProtectedPage() {
  const { user, loading } = useAuthGuard();
  
  if (loading) return <Spinner />;
  return <div>Welcome {user?.email}</div>;
}
```

### Wallet Operations
```typescript
import { useWallet } from '@/hooks/useWallet';

function WalletDisplay() {
  const { balance, hasWallet } = useWallet();
  
  return <div>Balance: ${balance.toFixed(2)}</div>;
}
```

### Styling
```typescript
import { cn } from '@/lib/utils';

function Button({ variant, className }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded',
        variant === 'primary' && 'bg-blue-500',
        className
      )}
    />
  );
}
```

---

## 6. Common Tasks

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

---

## 7. Development Workflow

### Making Changes
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes
3. Test locally
4. Commit: `git commit -m "feat: add feature"`
5. Push: `git push origin feature/your-feature`
6. Create pull request

### Testing Changes
- Local: `http://localhost:3000`
- Firebase Emulator: `firebase emulators:start`
- Preview: Automatic on PR (Vercel)

---

## 8. Essential Documentation

### Must Read First
1. **[Custom Hooks](./hooks/README.md)** - Start here for frontend
2. **[Security Rules](./security/firestore-rules.md)** - Understand data access
3. **[Firebase Integration](./integrations/firebase.md)** - Core backend

### Integration Guides
- [PayPal Setup](./integrations/paypal.md) - Payment processing
- [ESPN API](./integrations/espn-api.md) - Game data
- [Email Setup](./integrations/resend.md) - Email notifications

### Reference
- [Complete Index](./INDEX.md) - All documentation
- [Main README](./README.md) - Full overview

---

## 9. Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000
# or
lsof -ti:3000 | xargs kill
```

### Firebase initialization errors
- Check all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Verify API keys are correct
- Ensure Firebase project is active

### "Permission denied" errors
- Review [Firestore Rules](./security/firestore-rules.md)
- Ensure user is authenticated
- Check document paths are correct

### PayPal sandbox not working
- Verify `PAYPAL_ENV=sandbox`
- Check sandbox credentials are correct
- Ensure using sandbox test accounts

### Build errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## 10. Getting Help

### Quick References
- [Index of all docs](./INDEX.md)
- [Hook documentation](./hooks/README.md)
- [Integration docs](./integrations/README.md)

### Code Examples
Every documentation file includes usage examples. Look for:
- "Usage" sections
- "Common Use Cases" sections
- "Implementation" sections

### Common Questions
- **How do I authenticate users?** → [useAuthGuard](./hooks/useAuthGuard.md)
- **How do I handle payments?** → [PayPal Integration](./integrations/paypal.md)
- **How do I send emails?** → [Resend Integration](./integrations/resend.md)
- **How do I query Firestore?** → [Firebase Integration](./integrations/firebase.md)
- **How do I protect data?** → [Security Rules](./security/firestore-rules.md)

### Need More Help?
- 📧 Email: dev@squarepicks.com
- 💬 Slack: #dev-squarepicks
- 📖 Full docs: [Complete Index](./INDEX.md)

---

## Next Steps

### Frontend Development
1. Explore [hooks/](./hooks/)
2. Review [components/](../src/components/)
3. Understand [styling with cn()](./utils/cn-utility.md)

### Backend Development
1. Study [Firebase integration](./integrations/firebase.md)
2. Review [security rules](./security/firestore-rules.md)
3. Explore [Cloud Functions](../functions/)

### Full Stack Features
1. Read [PayPal integration](./integrations/paypal.md)
2. Study [wallet system](./hooks/useWallet.md)
3. Understand [notification system](./hooks/useFcmToken.md)

---

## Development Tips

### VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Firebase Explorer
- TypeScript Error Translator

### Useful Commands
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Firebase emulators
firebase emulators:start

# View all npm scripts
npm run
```

### Hot Keys (VS Code)
- `Cmd/Ctrl + P` - Quick file open
- `Cmd/Ctrl + Shift + P` - Command palette
- `F12` - Go to definition
- `Shift + F12` - Find references
- `Cmd/Ctrl + .` - Quick fix

---

## Learning Path

### Day 1: Setup & Basics
- ✅ Install and run project
- ✅ Understand project structure
- ✅ Read [hooks README](./hooks/README.md)
- ✅ Create first component

### Day 2-3: Core Concepts
- 📖 Study [authentication](./hooks/useAuthGuard.md)
- 📖 Learn [wallet system](./hooks/useWallet.md)
- 📖 Understand [security rules](./security/firestore-rules.md)
- 🔨 Build a protected page

### Week 1: Integration
- 🔌 Integrate [PayPal](./integrations/paypal.md)
- 🔌 Work with [Firebase](./integrations/firebase.md)
- 🔌 Implement [notifications](./hooks/useFcmToken.md)
- 🚀 Deploy feature to staging

---

## Success Checklist

- [ ] Project running locally
- [ ] Can sign in with Firebase Auth
- [ ] Can view user profile
- [ ] Understand custom hooks
- [ ] Can query Firestore
- [ ] Understand security rules
- [ ] Know where to find docs
- [ ] Made first code change
- [ ] Ran tests successfully
- [ ] Read relevant integration docs

---

**Ready to dive deeper?** Check out the [Complete Index](./INDEX.md) for all documentation.

**Need help?** See [Getting Help](#getting-help) section above.

---

[🏠 Back to Main Documentation](./README.md)

