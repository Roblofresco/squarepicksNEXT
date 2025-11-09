# Firebase Integration

## Overview
Comprehensive Firebase integration providing authentication, database, cloud messaging, analytics, and security features for the SquarePicks application.

## Services Used

### 1. Firebase Authentication
- User sign up and login
- Email verification
- Password reset
- Session management

### 2. Cloud Firestore
- Real-time database
- User data storage
- Game and board data
- Transactions and notifications

### 3. Firebase Cloud Messaging (FCM)
- Push notifications
- Foreground message handling
- Token management

### 4. Firebase Analytics
- User behavior tracking
- Event logging

### 5. Firebase App Check
- reCAPTCHA v3 integration
- Bot protection
- Request validation

## Implementation

### Client-Side Configuration

#### Location
`src/lib/firebase.ts`

#### Firebase Configuration
```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

#### App Initialization
```typescript
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
```

**Why**: Prevents multiple app initializations during hot-reload in development

#### Service Exports
```typescript
export const db = getFirestore(app);
export const auth = getAuth(app);
export let messaging: Messaging | null = null;

// Messaging initialized only in browser
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}
```

### Server-Side Configuration

#### Location
`src/lib/firebase-admin.ts`

#### Admin SDK Initialization
```typescript
export const initAdmin = (): admin.app.App => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Try environment variable first (Vercel)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  // Fallback to file path (local)
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8')
  );
  
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
};
```

## Environment Variables

### Client-Side (Public)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BN...
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=6Lc...
```

### Server-Side (Secret)
```bash
# Option 1: JSON string (Vercel)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Option 2: File path (Local)
GOOGLE_APPLICATION_CREDENTIALS=./path/to/serviceAccountKey.json
```

## Firebase Authentication

### Sign Up Flow
```typescript
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

async function signUp(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  
  await sendEmailVerification(userCredential.user);
  
  return userCredential.user;
}
```

### Sign In Flow
```typescript
import { signInWithEmailAndPassword } from 'firebase/auth';

async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  
  return userCredential.user;
}
```

### Password Reset
```typescript
import { sendPasswordResetEmail } from 'firebase/auth';

async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}
```

### Auth State Listener
```typescript
import { onAuthStateChanged } from 'firebase/auth';

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User logged in:', user.uid);
  } else {
    console.log('User logged out');
  }
});
```

## Cloud Firestore

### Data Structure
```
/users/{userId}
  - email: string
  - display_name: string
  - emailVerified: boolean
  - hasWallet: boolean
  - balance: number
  - createdAt: Timestamp
  
  /fcmTokens/{tokenId}
    - createdAt: Timestamp
    - lastSeenAt: Timestamp
    - userAgent: string

/games/{gameId}
  - sport: string
  - homeTeam: string
  - awayTeam: string
  - scheduledDate: Timestamp
  - status: string

/boards/{boardId}
  - gameId: string
  - status: string
  - entryFee: number
  - totalPot: number
  
/squares/{squareId}
  - boardId: string
  - userID: string
  - position: number
  
/notifications/{notificationId}
  - userID: string
  - title: string
  - body: string
  - isRead: boolean
  - createdAt: Timestamp

/transactions/{transactionId}
  - userID: string
  - amount: number
  - type: string
  - status: string
  - createdAt: Timestamp
```

### Real-time Queries
```typescript
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// Listen to user's boards
const q = query(
  collection(db, 'boards'),
  where('userId', '==', userId),
  where('status', '==', 'open')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const boards = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log('Boards updated:', boards);
});
```

### Transactions
```typescript
import { runTransaction, doc } from 'firebase/firestore';

async function updateWalletBalance(userId: string, amount: number) {
  const userRef = doc(db, 'users', userId);
  
  await runTransaction(db, async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const currentBalance = userDoc.data().balance || 0;
    const newBalance = currentBalance + amount;
    
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }
    
    transaction.update(userRef, { balance: newBalance });
  });
}
```

### Batch Writes
```typescript
import { writeBatch, doc } from 'firebase/firestore';

async function assignSquares(boardId: string, squares: Square[]) {
  const batch = writeBatch(db);
  
  squares.forEach(square => {
    const squareRef = doc(collection(db, 'squares'));
    batch.set(squareRef, {
      ...square,
      boardId,
      createdAt: new Date(),
    });
  });
  
  await batch.commit();
}
```

## Firebase Cloud Messaging

### Token Registration
```typescript
import { getToken } from 'firebase/messaging';

async function registerFCMToken() {
  const permission = await Notification.requestPermission();
  
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }
  
  const token = await getToken(messaging!, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.ready,
  });
  
  // Store token in Firestore
  await setDoc(doc(db, `users/${userId}/fcmTokens/${token}`), {
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    userAgent: navigator.userAgent,
  });
  
  return token;
}
```

### Foreground Messages
```typescript
import { onMessage } from 'firebase/messaging';

onMessage(messaging!, (payload) => {
  console.log('Message received:', payload);
  
  // Display notification or update UI
  showNotification(payload.notification);
});
```

### Server-Side Notifications
```typescript
// Cloud Functions or API routes
import * as admin from 'firebase-admin';

await admin.messaging().send({
  token: fcmToken,
  notification: {
    title: 'Game Update',
    body: 'Your square won Q1!',
  },
  data: {
    boardId: board.id,
    gameId: game.id,
    type: 'quarter_win',
  },
  webpush: {
    fcmOptions: {
      link: `https://squarepicks.com/game/${game.id}`,
    },
  },
});
```

## Firebase App Check

### Initialization
```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

if (typeof window !== 'undefined') {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
  
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}
```

**Purpose**:
- Protects Firestore from bot abuse
- Validates requests are from legitimate clients
- Automatically refreshes tokens
- Works transparently with Firebase SDKs

## Security Rules

See [Firestore Security Rules](../security/firestore-rules.md) for detailed security configuration.

## Rate Limits

### Firestore
- **Writes**: 10,000/second per database
- **Reads**: 100,000/second per database
- **Deletes**: 20,000/second per collection

### Authentication
- **Email/Password**: 100 signups per hour per IP
- **Password Reset**: 5 emails per hour per account

### Cloud Messaging
- **Upstream**: 1,500,000 messages per minute
- **Downstream**: Project-specific quotas

## Error Handling

### Authentication Errors
```typescript
import { FirebaseError } from 'firebase/app';

try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Try again later.';
      default:
        return 'Authentication failed';
    }
  }
}
```

### Firestore Errors
```typescript
try {
  await setDoc(docRef, data);
} catch (error) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action';
      case 'unavailable':
        return 'Service temporarily unavailable. Please try again.';
      case 'deadline-exceeded':
        return 'Request timed out. Please try again.';
      default:
        return 'Operation failed';
    }
  }
}
```

## Best Practices

1. **Initialize Once**: Use singleton pattern for Firebase app
2. **Handle Offline**: Firestore caches data automatically
3. **Use Transactions**: For atomic operations (balance updates)
4. **Index Queries**: Create indexes for compound queries
5. **Security Rules**: Never trust client; always validate server-side
6. **Cleanup Listeners**: Always unsubscribe from real-time listeners
7. **Batch Operations**: Use batches for multiple writes
8. **Error Handling**: Handle all Firebase error codes

## Performance Optimization

### Query Optimization
```typescript
// Bad: Downloads entire collection
const allUsers = await getDocs(collection(db, 'users'));

// Good: Query only what you need
const activeUsers = await getDocs(
  query(
    collection(db, 'users'),
    where('status', '==', 'active'),
    limit(10)
  )
);
```

### Caching
```typescript
// Enable offline persistence
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser does not support persistence');
  }
});
```

## Dependencies

```json
{
  "firebase": "^11.6.0",
  "firebase-admin": "^12.0.0"
}
```

## Related Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

## Troubleshooting

### App initialization errors
- Verify all environment variables are set
- Check for typos in config values
- Ensure Firebase project is properly configured

### Permission denied errors
- Review Firestore security rules
- Verify user is authenticated
- Check document paths are correct

### Messaging not working
- Verify VAPID key is correct
- Check service worker is registered
- Ensure notifications are permitted
- Test in supported browser (Chrome, Firefox)

### Offline mode issues
- Clear IndexedDB cache
- Check network connectivity
- Verify persistence is enabled

