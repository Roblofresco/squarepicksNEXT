# useFcmToken Hook

## Overview
Custom React hook for managing Firebase Cloud Messaging (FCM) tokens, push notification permissions, and foreground message handling.

## Location
`src/hooks/useFcmToken.ts`

## Purpose
Handles the complete lifecycle of push notification setup including permission requests, FCM token generation, token storage in Firestore, and foreground message listening.

## Interface

### Return Type
```typescript
{
  permission: NotificationPermission,  // 'default' | 'granted' | 'denied'
  token: string | null,                // FCM token or null if not available
  error: string | null                 // Error message if registration fails
}
```

### NotificationPermission Types
- `'default'`: User hasn't been asked yet
- `'granted'`: User allowed notifications
- `'denied'`: User blocked notifications

## Usage

```typescript
import { useFcmToken } from '@/hooks/useFcmToken';

function NotificationSetup() {
  const { permission, token, error } = useFcmToken();

  if (error) {
    return <div>Notification setup failed: {error}</div>;
  }

  if (permission === 'denied') {
    return <div>Notifications are blocked. Please enable in browser settings.</div>;
  }

  if (permission === 'granted' && token) {
    return <div>✓ Notifications enabled</div>;
  }

  return <div>Setting up notifications...</div>;
}
```

## Features

### Permission Request Flow
1. Checks if user is authenticated
2. Verifies browser supports notifications
3. Checks current permission status
4. Requests permission if status is 'default'
5. Only proceeds if permission is 'granted'

### FCM Token Management
- Generates FCM token using Firebase Messaging SDK
- Requires VAPID key from environment variables
- Waits for service worker registration
- Stores token in Firestore for server-side use

### Token Storage in Firestore
```typescript
// Token stored at: users/{userId}/fcmTokens/{token}
{
  createdAt: serverTimestamp(),
  lastSeenAt: serverTimestamp(),
  userAgent: navigator.userAgent
}
```

### Foreground Message Handling
- Registers listener for messages while app is open
- Delegates to `NotificationContext` for UI updates
- Prevents duplicate notifications (browser + custom UI)

## Environment Variables

```bash
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-here
```

## Implementation Details

### Browser Compatibility Check
```typescript
if (typeof window === 'undefined' || !messaging) return;
if (!('Notification' in window)) return;
```

### Token Generation
```typescript
const token = await getToken(messaging, { 
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  serviceWorkerRegistration: await navigator.serviceWorker.ready 
});
```

### Firestore Token Storage
- Uses `merge: true` to update existing token documents
- Tracks creation time and last seen time
- Stores user agent for debugging/analytics

## Dependencies

- `firebase/messaging`: FCM SDK
- `firebase/firestore`: Token storage
- `@/lib/firebase`: Firebase app instance
- `@/context/AuthContext`: User authentication state

## Best Practices

1. **Require Authentication**: Hook exits early if no user is logged in
2. **Handle All Permission States**: Display appropriate UI for each permission state
3. **Show Clear Instructions**: Help users enable notifications if denied
4. **Store Token Securely**: Never expose FCM tokens in client-side logs
5. **Clean Up Old Tokens**: Remove tokens when user logs out (handled by Firestore rules)

## Common Use Cases

### Notification Settings Page
```typescript
function NotificationSettings() {
  const { permission, token, error } = useFcmToken();

  return (
    <div>
      <h2>Push Notifications</h2>
      <Status permission={permission} />
      {error && <ErrorMessage error={error} />}
      {permission === 'denied' && <EnableInstructions />}
    </div>
  );
}
```

### Onboarding Flow
```typescript
function OnboardingNotifications() {
  const { permission } = useFcmToken();

  if (permission === 'granted') {
    return <NextStepButton />;
  }

  return (
    <div>
      <h3>Enable Notifications</h3>
      <p>Stay updated on your game results</p>
      <button onClick={() => Notification.requestPermission()}>
        Enable Notifications
      </button>
    </div>
  );
}
```

## Error Handling

### Missing VAPID Key
```typescript
error: 'Missing VAPID key'
```

### Permission Denied
```typescript
permission: 'denied'
// User must manually enable in browser settings
```

### Service Worker Not Ready
```typescript
error: 'Failed to register for notifications'
// Check service worker configuration
```

### Token Generation Failed
```typescript
error: 'Failed to register for notifications'
// Check Firebase configuration and network
```

## Security Considerations

1. **User Authentication Required**: Only authenticated users can register tokens
2. **Firestore Rules**: Ensure rules protect FCM tokens collection
3. **VAPID Key**: Public key can be exposed; secret key must stay server-side
4. **Token Rotation**: Tokens may change; always use most recent
5. **User Agent Logging**: Helps identify suspicious activity

## Service Worker Requirements

### File Location
`public/firebase-messaging-sw.js`

### Registration
Service worker must be registered before token generation:
```javascript
navigator.serviceWorker.register('/firebase-messaging-sw.js')
```

### Background Messages
Service worker handles notifications when app is closed

## Firestore Structure

```
users/
  {userId}/
    fcmTokens/
      {tokenId}/
        - createdAt: Timestamp
        - lastSeenAt: Timestamp
        - userAgent: string
```

## Rate Limiting

Firebase Cloud Messaging has rate limits:
- **Upstream messages**: 1,500,000 per minute
- **Downstream messages**: Project-specific quotas
- **Token refresh**: Automatic, transparent to users

## Troubleshooting

### Token is null after permission granted
- Check VAPID key is correctly set in environment
- Ensure service worker is registered
- Verify Firebase Messaging is initialized
- Check browser console for errors

### Permission stuck on 'default'
- User may have closed permission popup
- Try prompting again after user interaction
- Check if browser supports notifications

### Tokens not stored in Firestore
- Verify Firestore rules allow token creation
- Check user is authenticated
- Ensure Firebase is properly initialized

### Foreground messages not received
- Check `onMessage` listener is registered
- Verify notification payload structure
- Test with Firebase Console test message

## Integration with NotificationContext

```typescript
// Hook registers listener but delegates handling
onMessage(messaging!, (payload) => {
  // NotificationContext displays UI
  // Prevents duplicate browser notifications
});
```

## Related Hooks

- `useAuth`: Required for user authentication
- `useAuthGuard`: Often used together for protected pages

## Related Components

- `NotificationContext`: Handles message display
- `NotificationIcon`: Shows notification badge
- `NotificationList`: Lists received notifications

## Server-Side Usage

FCM tokens stored in Firestore can be used by Cloud Functions to send targeted notifications:

```typescript
// Cloud Function example
await admin.messaging().send({
  token: fcmToken,
  notification: {
    title: 'Game Update',
    body: 'Your square won Q1!'
  }
});
```

