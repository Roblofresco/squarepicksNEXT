# Security Documentation

## Overview
Security configurations and best practices for the SquarePicks application.

## Security Components

### Database Security
- **[Firestore Security Rules](./firestore-rules.md)** - Comprehensive access control for all collections

## Security Principles

### 1. Defense in Depth
Multiple layers of security:
- Client-side validation (UX)
- Firestore security rules (database access control)
- Cloud Functions (server-side business logic)
- API routes (server-side validation)
- reCAPTCHA (bot protection)

### 2. Principle of Least Privilege
Users and services granted minimum necessary permissions:
- Users can only access their own data
- Public data is read-only
- Writes restricted to Cloud Functions
- Service accounts have specific scopes

### 3. Zero Trust
Never trust client-side code:
- All writes validated server-side
- Sensitive operations in Cloud Functions
- User input always sanitized
- Rate limiting on all endpoints

## Security Layers

### Client-Side

#### Input Validation
```typescript
// Validate before sending to server
const schema = z.object({
  amount: z.number().min(5).max(10000),
  email: z.string().email(),
});

const result = schema.safeParse(formData);
if (!result.success) {
  return { error: result.error.message };
}
```

#### XSS Prevention
```typescript
// Sanitize user input displayed in UI
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput);
```

#### CSRF Protection
- All mutations use POST/PUT/DELETE (not GET)
- Firebase Auth tokens included in requests
- SameSite cookie policy

### Firestore Rules

#### Ownership Validation
```javascript
// User can only access their own data
allow read, write: if request.auth.uid == userId;
```

#### Conditional Access
```javascript
// Public read only if status is open
allow read: if resource.data.status == "open" || signedIn();
```

#### Field-Level Control
```javascript
// Only allow updating specific fields
request.writeFields.hasOnly(['isRead'])
```

See [Firestore Rules](./firestore-rules.md) for complete documentation.

### Server-Side (Cloud Functions & API Routes)

#### Authentication Verification
```typescript
import { initAdmin } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

const app = initAdmin();
const auth = admin.auth(app);

// Verify Firebase ID token
const decodedToken = await auth.verifyIdToken(idToken);
const uid = decodedToken.uid;
```

#### Transaction Integrity
```typescript
// Use Firestore transactions for atomic operations
await admin.firestore().runTransaction(async (t) => {
  const userRef = admin.firestore().doc(`users/${userId}`);
  const userDoc = await t.get(userRef);
  
  const currentBalance = userDoc.data()?.balance || 0;
  const newBalance = currentBalance - amount;
  
  if (newBalance < 0) {
    throw new Error('Insufficient funds');
  }
  
  t.update(userRef, { balance: newBalance });
});
```

#### Rate Limiting
```typescript
// Implement rate limiting on API routes
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Bot Protection

#### reCAPTCHA v3
```typescript
// Automatically validates all Firestore requests
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider(siteKey),
  isTokenAutoRefreshEnabled: true,
});
```

## Authentication Security

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: special character

### Email Verification
- Required before wallet access
- Required before deposits
- Prevents fake account creation

### Session Management
- Firebase Auth handles session tokens
- Automatic token refresh
- Secure HTTP-only cookies (when using server-side)

### Multi-Factor Authentication (Planned)
- SMS verification via Twilio
- Authenticator app support

## Payment Security

### PCI Compliance
- No card data touches our servers
- PayPal handles all payment processing
- Stripe Elements for card input
- Tokenized payment methods

### Transaction Validation
```typescript
// Verify payment on server
const payment = await verifyPaymentWithProvider(paymentId);

if (payment.status !== 'COMPLETED') {
  throw new Error('Payment not completed');
}

if (payment.amount !== expectedAmount) {
  throw new Error('Amount mismatch');
}

// Update wallet only after verification
await updateWalletBalance(userId, payment.amount);
```

### Webhook Security
```typescript
// Verify webhook signatures
import crypto from 'crypto';

function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

## Data Protection

### Personally Identifiable Information (PII)
- Email addresses encrypted at rest (Firebase handles)
- Phone numbers stored securely
- Payment info never stored (tokenized)
- User data access restricted by rules

### Data Minimization
Only collect necessary data:
- Email (required for auth)
- Display name (required for UX)
- Phone number (optional, for 2FA/SMS)
- Location (required for legal compliance)

### Data Retention
- Active accounts: Indefinite
- Inactive accounts: Review after 2 years
- Deleted accounts: 30-day soft delete, then permanent
- Transaction history: 7 years (legal requirement)

## Environment Security

### Environment Variables
```bash
# Never commit secrets to git
# Use .env.local for local development
# Use hosting platform's secret management for production

# Example .gitignore
.env.local
.env.*.local
serviceAccountKey.json
```

### Secret Management

#### Vercel (Production)
```bash
# Set via Vercel dashboard or CLI
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY
```

#### Local Development
```bash
# .env.local
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### Access Control
- Principle of least privilege for all service accounts
- Regular audit of access logs
- Rotate keys regularly
- Revoke unused credentials

## API Security

### Input Validation
```typescript
// Validate all inputs
import { z } from 'zod';

const depositSchema = z.object({
  amount: z.number().min(5).max(10000),
  currency: z.literal('USD'),
  userId: z.string().uuid(),
});

const { amount, currency, userId } = depositSchema.parse(body);
```

### Output Sanitization
```typescript
// Don't expose internal errors
try {
  // Operation
} catch (error) {
  console.error('Internal error:', error);
  return { error: 'Operation failed' }; // Generic message
}
```

### CORS Configuration
```typescript
// Only allow specific origins
const allowedOrigins = [
  'https://squarepicks.com',
  'https://www.squarepicks.com',
];

if (allowedOrigins.includes(origin)) {
  response.setHeader('Access-Control-Allow-Origin', origin);
}
```

## Monitoring & Auditing

### Audit Logs
```typescript
// Log all sensitive operations
await admin.firestore().collection('audit_logs').add({
  userId,
  action: 'wallet_update',
  amount,
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  ip: request.ip,
  userAgent: request.headers['user-agent'],
});
```

### Monitoring Alerts
- Failed login attempts
- Unusual transaction patterns
- Rate limit violations
- Database rule violations
- API errors

### Security Metrics
- Authentication success/failure rate
- Payment success/failure rate
- Rule violation frequency
- API error rates
- Suspicious activity patterns

## Compliance

### Legal Requirements
- **Age Verification**: 18+ only
- **Location Restrictions**: State/country restrictions
- **KYC/AML**: Identity verification for withdrawals
- **Data Privacy**: GDPR, CCPA compliance

### Terms of Service
- User acceptance required
- Clear privacy policy
- Responsible gaming guidelines
- Dispute resolution process

## Incident Response

### Security Incident Process
1. **Detect**: Monitoring alerts
2. **Contain**: Disable affected systems
3. **Investigate**: Determine scope and cause
4. **Remediate**: Fix vulnerability
5. **Communicate**: Notify affected users
6. **Document**: Post-mortem analysis

### Contact
- Security issues: security@squarepicks.com
- General support: support@squarepicks.com

## Security Checklist

### Pre-Deployment
- [ ] All secrets in environment variables
- [ ] Firestore rules deployed and tested
- [ ] reCAPTCHA configured and working
- [ ] API rate limiting enabled
- [ ] Webhook signatures verified
- [ ] Error messages sanitized
- [ ] Audit logging enabled
- [ ] Access logs monitored

### Regular Maintenance
- [ ] Review access logs monthly
- [ ] Rotate API keys quarterly
- [ ] Audit user permissions quarterly
- [ ] Update dependencies monthly
- [ ] Security scan weekly
- [ ] Penetration testing annually

## Best Practices

1. **Never trust client input** - Always validate server-side
2. **Use HTTPS everywhere** - No exceptions
3. **Encrypt sensitive data** - At rest and in transit
4. **Principle of least privilege** - Minimum necessary permissions
5. **Keep dependencies updated** - Regular security patches
6. **Monitor everything** - Logs, metrics, alerts
7. **Test security rules** - Before deploying to production
8. **Regular audits** - Review access patterns and permissions

## Related Documentation

- [Firestore Rules](./firestore-rules.md)
- [Firebase Integration](../integrations/firebase.md)
- [Authentication Hooks](../hooks/useAuth.md)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security](https://firebase.google.com/docs/rules)
- [Web Security Best Practices](https://web.dev/security/)

