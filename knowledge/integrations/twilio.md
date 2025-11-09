# Twilio Integration

## Overview
Twilio provides SMS and voice communication capabilities for the SquarePicks application, enabling text notifications and phone verification.

## API Details

### Base URL
```
https://api.twilio.com/2010-04-01
```

### Services Available
- SMS messaging
- Voice calls
- Phone verification (Twilio Verify)
- Two-factor authentication (2FA)

## Implementation Status

Twilio SDK is installed but not yet fully implemented in the codebase.

### Installation
```json
{
  "twilio": "^5.7.0"
}
```

## Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxxx...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=VAxxxx...  # For Verify API
```

## Authentication

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
```

## Planned Implementation

### SMS Messaging

#### Send SMS
```typescript
async function sendSMS(to: string, message: string) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log('SMS sent:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error: any) {
    console.error('SMS error:', error);
    throw error;
  }
}
```

#### SMS Templates

##### Deposit Confirmation
```typescript
async function sendDepositSMS(data: {
  phone: string;
  name: string;
  amount: number;
}) {
  const message = `Hi ${data.name}, your deposit of $${data.amount.toFixed(2)} was successful! Your new balance is available in your SquarePicks wallet.`;
  
  await sendSMS(data.phone, message);
}
```

##### Win Notification
```typescript
async function sendWinSMS(data: {
  phone: string;
  name: string;
  quarter: string;
  amount: number;
  gameTitle: string;
}) {
  const message = `🎉 ${data.name}, you won ${data.quarter}! Winnings: $${data.amount.toFixed(2)} for ${data.gameTitle}. Check your wallet!`;
  
  await sendSMS(data.phone, message);
}
```

##### Game Reminder
```typescript
async function sendGameReminderSMS(data: {
  phone: string;
  gameTitle: string;
  startTime: string;
}) {
  const message = `⚡ Game starting soon: ${data.gameTitle} at ${data.startTime}. Your squares are ready! squarepicks.com/lobby`;
  
  await sendSMS(data.phone, message);
}
```

### Phone Verification

#### Send Verification Code
```typescript
async function sendVerificationCode(phoneNumber: string) {
  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms', // or 'call' for voice
      });

    console.log('Verification sent:', verification.sid);
    return { success: true, status: verification.status };
  } catch (error: any) {
    console.error('Verification error:', error);
    throw error;
  }
}
```

#### Verify Code
```typescript
async function verifyCode(phoneNumber: string, code: string) {
  try {
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks
      .create({
        to: phoneNumber,
        code: code,
      });

    return {
      success: verificationCheck.status === 'approved',
      status: verificationCheck.status,
    };
  } catch (error: any) {
    console.error('Verification check error:', error);
    return { success: false, error: error.message };
  }
}
```

### API Routes

#### Send SMS Route
```typescript
// src/app/api/sms/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  const { to, message, userId } = await request.json();

  // Verify user is authenticated
  const user = await verifyUser(userId);
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Verify phone number belongs to user
  if (user.phoneNumber !== to) {
    return NextResponse.json(
      { error: 'Phone number mismatch' },
      { status: 403 }
    );
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    // Log SMS in Firestore
    await logSMS({
      userId,
      to,
      message,
      sid: result.sid,
      status: result.status,
    });

    return NextResponse.json({
      success: true,
      sid: result.sid,
    });
  } catch (error: any) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

#### Phone Verification Route
```typescript
// src/app/api/phone/verify/route.ts
export async function POST(request: NextRequest) {
  const { phoneNumber, code } = await request.json();

  if (!phoneNumber || !code) {
    return NextResponse.json(
      { error: 'Phone number and code required' },
      { status: 400 }
    );
  }

  const result = await verifyCode(phoneNumber, code);

  if (result.success) {
    // Update user's phone verification status
    await updateUserPhoneVerification(phoneNumber);

    return NextResponse.json({
      success: true,
      message: 'Phone verified successfully',
    });
  } else {
    return NextResponse.json(
      { error: 'Invalid verification code' },
      { status: 400 }
    );
  }
}
```

## Rate Limits

### SMS Messaging
- **Throughput**: 10 messages/second (default)
- **Long Code**: 1 message/second per number
- **Short Code**: 100 messages/second

### Twilio Verify
- **Verification Attempts**: 5 per phone number per day (configurable)
- **Code Validity**: 10 minutes (default)
- **Rate Limiting**: 1 request per 5 seconds per phone number

## Error Handling

### Common Errors

```typescript
try {
  await client.messages.create(messageData);
} catch (error: any) {
  switch (error.code) {
    case 21211:
      // Invalid phone number
      return { error: 'Invalid phone number format' };
      
    case 21614:
      // Phone number is not a mobile number
      return { error: 'Number must be a mobile phone' };
      
    case 21610:
      // Unsubscribed recipient
      return { error: 'User has unsubscribed from SMS' };
      
    case 20003:
      // Authentication failed
      console.error('Twilio auth failed - check credentials');
      return { error: 'SMS service unavailable' };
      
    case 20429:
      // Rate limit exceeded
      return { error: 'Too many requests. Try again later.' };
      
    default:
      console.error('Twilio error:', error);
      return { error: 'Failed to send SMS' };
  }
}
```

## Use Cases

### 1. Win Notifications
Send SMS when user wins a quarter

### 2. Deposit Confirmations
Confirm successful deposits via SMS

### 3. Phone Verification
Verify user phone numbers for account security

### 4. Game Reminders
Send reminders before game starts

### 5. Withdrawal Confirmations
Confirm withdrawal requests

### 6. Two-Factor Authentication
Add extra security layer for sensitive operations

## Phone Number Validation

### Format Phone Numbers
```typescript
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if missing (assume US)
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }
  
  return `+${digits}`;
}
```

### Validate Phone Number
```typescript
import { PhoneNumberUtil } from 'google-libphonenumber';

function isValidPhoneNumber(phone: string): boolean {
  try {
    const phoneUtil = PhoneNumberUtil.getInstance();
    const number = phoneUtil.parseAndKeepRawInput(phone, 'US');
    return phoneUtil.isValidNumber(number);
  } catch (error) {
    return false;
  }
}
```

## SMS Tracking

### Store SMS Records
```typescript
interface SMSRecord {
  id: string;              // Firestore document ID
  userId: string;
  phoneNumber: string;
  message: string;
  sid: string;             // Twilio message SID
  type: string;            // 'win', 'deposit', 'reminder', etc.
  status: string;          // 'queued', 'sent', 'delivered', 'failed'
  sentAt: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  errorCode?: number;
  errorMessage?: string;
}

async function logSMS(data: Partial<SMSRecord>) {
  await setDoc(doc(collection(db, 'sms')), {
    ...data,
    sentAt: new Date(),
  });
}
```

### Check Message Status
```typescript
async function checkMessageStatus(messageSid: string) {
  const message = await client.messages(messageSid).fetch();
  
  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    from: message.from,
    body: message.body,
    dateCreated: message.dateCreated,
    dateSent: message.dateSent,
    errorCode: message.errorCode,
    errorMessage: message.errorMessage,
  };
}
```

## Webhooks

### Status Callbacks
```typescript
// src/app/api/sms/webhook/route.ts
export async function POST(request: NextRequest) {
  const data = await request.formData();
  
  const messageSid = data.get('MessageSid') as string;
  const messageStatus = data.get('MessageStatus') as string;
  const errorCode = data.get('ErrorCode') as string;
  
  // Update SMS record in Firestore
  await updateSMSStatus(messageSid, messageStatus, errorCode);
  
  return NextResponse.json({ received: true });
}
```

### Webhook Events
- `queued`: Message queued for delivery
- `sent`: Message sent to carrier
- `delivered`: Message delivered to recipient
- `undelivered`: Message failed to deliver
- `failed`: Message failed to send

## Security Considerations

1. **Number Verification**: Always verify phone numbers before sending
2. **Rate Limiting**: Implement app-level rate limits
3. **User Consent**: Get explicit consent for SMS notifications
4. **Opt-Out**: Provide easy way to unsubscribe
5. **PII Protection**: Don't send sensitive info via SMS
6. **Credentials**: Secure Twilio credentials server-side

### Opt-Out Keywords
Automatically handle unsubscribe keywords:
- STOP
- UNSUBSCRIBE
- CANCEL
- END
- QUIT

## Costs

### SMS Pricing (US)
- **Outbound**: $0.0079 per message
- **Inbound**: $0.0079 per message

### Twilio Verify
- **Verification**: $0.05 per verification

### Phone Numbers
- **Local**: $1.00/month
- **Toll-Free**: $2.00/month

## Testing

### Test Credentials
Twilio provides test credentials:
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (test)
TWILIO_AUTH_TOKEN=your_test_auth_token
```

### Test Phone Numbers
```
+15005550006  # Valid, SMS capable
+15005550007  # Invalid number
+15005550009  # Non-mobile number
```

### Test Verification
```typescript
// Test mode - auto-approve any 6-digit code
if (process.env.NODE_ENV === 'development') {
  if (code.length === 6 && /^\d+$/.test(code)) {
    return { success: true, status: 'approved' };
  }
}
```

## Best Practices

1. **Use Templates**: Create reusable message templates
2. **Keep Messages Short**: 160 characters = 1 SMS
3. **Include Branding**: Start with company name
4. **Clear Call-to-Action**: Include link if needed
5. **Timing**: Avoid late night/early morning
6. **Opt-In**: Require explicit consent
7. **Monitor Deliverability**: Track delivery rates

## Integration with Cloud Functions

```typescript
// functions/src/sms/sendSMS.ts
import * as functions from 'firebase-functions';
import twilio from 'twilio';

const client = twilio(
  functions.config().twilio.account_sid,
  functions.config().twilio.auth_token
);

export const sendWinNotificationSMS = functions.firestore
  .document('winners/{winnerId}')
  .onCreate(async (snap) => {
    const winner = snap.data();
    
    // Get user's phone number
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(winner.userId)
      .get();
    
    const phone = userDoc.data()?.phoneNumber;
    if (!phone) return;
    
    // Send SMS
    await client.messages.create({
      body: `🎉 You won ${winner.quarter}! $${winner.amount} added to your wallet.`,
      from: functions.config().twilio.phone_number,
      to: phone,
    });
  });
```

## Related Documentation

- [Twilio API Reference](https://www.twilio.com/docs/sms)
- [Twilio Verify](https://www.twilio.com/docs/verify/api)
- [Node.js SDK](https://www.twilio.com/docs/libraries/node)

## Troubleshooting

### Messages not delivered
- Verify phone number format
- Check carrier restrictions
- Verify Twilio account status
- Review error logs

### Verification codes not working
- Check code expiration (10 min default)
- Verify service SID is correct
- Check rate limits

### High costs
- Implement message batching
- Use Verify API instead of custom codes
- Monitor usage dashboard
- Set spending alerts

## Future Enhancements

- Implement two-way SMS conversations
- Add MMS support for images
- Implement SMS scheduling
- Create SMS templates library
- Add international SMS support
- Implement WhatsApp messaging
- Add voice call notifications
- Create SMS analytics dashboard

