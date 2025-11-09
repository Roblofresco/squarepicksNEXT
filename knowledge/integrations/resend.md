# Resend Email Integration

## Overview
Resend is used for transactional email delivery in the SquarePicks application, providing reliable email sending for notifications, receipts, and user communications.

## API Details

### Base URL
```
https://api.resend.com
```

### Endpoints Used

#### Send Email
```
POST /emails
```

#### Get Email Status
```
GET /emails/{email_id}
```

## Implementation Status

Resend SDK is installed but email sending logic is not yet fully implemented in the codebase.

### Installation
```json
{
  "resend": "^4.5.2"
}
```

## Environment Variables

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@squarepicks.com
```

## Planned Implementation

### API Route Setup

```typescript
// src/app/api/email/send/route.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { to, subject, html } = await request.json();

  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to,
      subject,
      html,
    });

    return Response.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('Email send error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Email Templates

#### Welcome Email
```typescript
async function sendWelcomeEmail(user: { email: string; name: string }) {
  await resend.emails.send({
    from: 'SquarePicks <noreply@squarepicks.com>',
    to: user.email,
    subject: 'Welcome to SquarePicks!',
    html: `
      <h1>Welcome ${user.name}!</h1>
      <p>Thanks for joining SquarePicks.</p>
      <p>Get started by:</p>
      <ul>
        <li>Setting up your wallet</li>
        <li>Browsing available games</li>
        <li>Picking your first square</li>
      </ul>
      <a href="https://squarepicks.com/lobby">Go to Lobby</a>
    `,
  });
}
```

#### Deposit Confirmation
```typescript
async function sendDepositConfirmation(data: {
  email: string;
  name: string;
  amount: number;
  transactionId: string;
  newBalance: number;
}) {
  await resend.emails.send({
    from: 'SquarePicks <receipts@squarepicks.com>',
    to: data.email,
    subject: `Deposit Confirmation - $${data.amount}`,
    html: `
      <h1>Deposit Successful</h1>
      <p>Hi ${data.name},</p>
      <p>Your deposit of <strong>$${data.amount.toFixed(2)}</strong> has been processed.</p>
      
      <h2>Transaction Details</h2>
      <table>
        <tr><td>Amount:</td><td>$${data.amount.toFixed(2)}</td></tr>
        <tr><td>Transaction ID:</td><td>${data.transactionId}</td></tr>
        <tr><td>New Balance:</td><td>$${data.newBalance.toFixed(2)}</td></tr>
        <tr><td>Date:</td><td>${new Date().toLocaleString()}</td></tr>
      </table>
      
      <p><a href="https://squarepicks.com/wallet">View Wallet</a></p>
    `,
  });
}
```

#### Winner Notification
```typescript
async function sendWinnerEmail(data: {
  email: string;
  name: string;
  quarter: string;
  amount: number;
  gameTitle: string;
  boardId: string;
}) {
  await resend.emails.send({
    from: 'SquarePicks <wins@squarepicks.com>',
    to: data.email,
    subject: `🎉 You Won ${data.quarter}! - $${data.amount}`,
    html: `
      <h1>🎉 Congratulations!</h1>
      <p>Hi ${data.name},</p>
      <p>Your square won <strong>${data.quarter}</strong>!</p>
      
      <h2>Win Details</h2>
      <ul>
        <li><strong>Game:</strong> ${data.gameTitle}</li>
        <li><strong>Quarter:</strong> ${data.quarter}</li>
        <li><strong>Winnings:</strong> $${data.amount.toFixed(2)}</li>
      </ul>
      
      <p>The winnings have been added to your wallet.</p>
      <p><a href="https://squarepicks.com/game/${data.boardId}">View Game</a></p>
    `,
  });
}
```

#### Password Reset
```typescript
async function sendPasswordResetEmail(data: {
  email: string;
  name: string;
  resetLink: string;
}) {
  await resend.emails.send({
    from: 'SquarePicks <noreply@squarepicks.com>',
    to: data.email,
    subject: 'Reset Your Password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Hi ${data.name},</p>
      <p>We received a request to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${data.resetLink}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
```

## Email Types

### Transactional Emails
- Welcome email
- Email verification
- Password reset
- Deposit confirmation
- Withdrawal confirmation
- Win notifications
- Transaction receipts

### Operational Emails
- Game reminders
- Board filled notifications
- Quarter result updates
- Weekly summary

## Authentication

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// API key is included automatically in headers
```

## Rate Limits

### Free Tier
- 100 emails/day
- 3,000 emails/month

### Paid Plans
- **Pro**: 50,000 emails/month
- **Scale**: 100,000+ emails/month
- Scales with usage

### Rate Limit Headers
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1699564800
```

## Error Handling

### Common Errors

```typescript
try {
  await resend.emails.send(emailData);
} catch (error: any) {
  switch (error.name) {
    case 'validation_error':
      console.error('Invalid email data:', error.message);
      break;
      
    case 'missing_required_field':
      console.error('Missing required field:', error.message);
      break;
      
    case 'invalid_from_address':
      console.error('From address not verified');
      break;
      
    case 'rate_limit_exceeded':
      console.error('Rate limit exceeded');
      // Implement retry with exponential backoff
      break;
      
    default:
      console.error('Email send failed:', error);
  }
}
```

### Error Response Format
```json
{
  "name": "validation_error",
  "message": "Invalid email address",
  "statusCode": 422
}
```

## Best Practices

1. **Use Templates**: Create reusable email templates
2. **Track Emails**: Store email IDs for tracking
3. **Verify Domain**: Configure SPF, DKIM, DMARC records
4. **Test Emails**: Test all templates before deployment
5. **Handle Bounces**: Monitor bounce rates
6. **Unsubscribe Links**: Include in marketing emails
7. **Rate Limiting**: Implement exponential backoff

## Email Tracking

### Store Email Records
```typescript
interface EmailRecord {
  id: string;              // Resend email ID
  userId: string;
  type: string;            // 'welcome', 'deposit', 'win', etc.
  to: string;
  subject: string;
  status: string;          // 'sent', 'delivered', 'bounced', 'failed'
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
}

// Store in Firestore
await setDoc(doc(db, 'emails', emailId), emailRecord);
```

### Check Email Status
```typescript
async function checkEmailStatus(emailId: string) {
  const email = await resend.emails.get(emailId);
  
  return {
    id: email.id,
    status: email.last_event, // 'delivered', 'opened', 'clicked', etc.
    created_at: email.created_at,
    from: email.from,
    to: email.to,
    subject: email.subject,
  };
}
```

## Webhooks (Planned)

### Webhook Endpoint
```typescript
// src/app/api/email/webhook/route.ts
export async function POST(request: Request) {
  const event = await request.json();

  switch (event.type) {
    case 'email.delivered':
      await handleDelivered(event.data);
      break;
      
    case 'email.bounced':
      await handleBounced(event.data);
      break;
      
    case 'email.complained':
      await handleComplaint(event.data);
      break;
      
    case 'email.opened':
      await handleOpened(event.data);
      break;
      
    case 'email.clicked':
      await handleClicked(event.data);
      break;
  }

  return Response.json({ received: true });
}
```

### Webhook Events
- `email.sent`
- `email.delivered`
- `email.bounced`
- `email.complained`
- `email.opened`
- `email.clicked`

## Testing

### Test Mode
```typescript
// Use test API key for development
const resend = new Resend(
  process.env.NODE_ENV === 'production'
    ? process.env.RESEND_API_KEY
    : process.env.RESEND_TEST_API_KEY
);
```

### Preview Emails
```typescript
// Send to test email instead
const testEmail = process.env.NODE_ENV === 'development'
  ? 'test@example.com'
  : userEmail;

await resend.emails.send({
  to: testEmail,
  // ... rest of email data
});
```

## Domain Configuration

### DNS Records Required

```
# SPF Record
TXT @ "v=spf1 include:_spf.resend.com ~all"

# DKIM Record (provided by Resend)
TXT resend._domainkey "v=DKIM1; k=rsa; p=..."

# DMARC Record
TXT _dmarc "v=DMARC1; p=none; rua=mailto:dmarc@squarepicks.com"
```

### Verify Domain
```bash
# In Resend Dashboard
1. Add domain
2. Add DNS records
3. Verify domain
4. Start sending
```

## Integration with Cloud Functions

```typescript
// functions/src/email/sendEmail.ts
import { onCall } from 'firebase-functions/v2/https';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = onCall(async (request) => {
  const { to, template, data } = request.data;

  const emailContent = generateEmailContent(template, data);

  const result = await resend.emails.send({
    from: 'SquarePicks <noreply@squarepicks.com>',
    to,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  return { success: true, emailId: result.id };
});
```

## Monitoring

### Metrics to Track
- Emails sent per day
- Delivery rate
- Bounce rate
- Open rate
- Click rate
- Complaint rate

### Logging
```typescript
console.log('[email:send]', {
  type: emailType,
  to: recipient,
  emailId: result.id,
  timestamp: new Date().toISOString(),
});
```

## Security Considerations

1. **API Key Protection**: Never expose API key to client
2. **Sender Verification**: Only use verified domains
3. **Rate Limiting**: Implement application-level limits
4. **Content Validation**: Sanitize user data in emails
5. **Bounce Handling**: Disable sending to bounced addresses
6. **Spam Compliance**: Include unsubscribe links

## Related Documentation

- [Resend API Reference](https://resend.com/docs/api-reference/introduction)
- [Resend Node.js SDK](https://github.com/resendlabs/resend-node)
- [Email Best Practices](https://resend.com/docs/knowledge-base/best-practices)

## Troubleshooting

### Emails not delivered
- Verify domain DNS records
- Check spam folder
- Verify recipient email address
- Review bounce logs

### Rate limit exceeded
- Upgrade plan
- Implement email queuing
- Batch emails appropriately

### Domain not verified
- Check DNS propagation (can take 24-48 hours)
- Verify all required records are added
- Contact Resend support if stuck

## Future Enhancements

- Implement React Email for better templates
- Add email preview in admin panel
- Implement email scheduling
- Add A/B testing for email content
- Create email templates library
- Implement bounce management
- Add unsubscribe functionality
- Create email analytics dashboard

