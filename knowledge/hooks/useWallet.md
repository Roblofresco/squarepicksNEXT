# useWallet Hook

## Overview
Comprehensive wallet management hook that provides real-time wallet balance tracking, initialization, and email verification management for authenticated users.

## Location
`src/hooks/useWallet.ts`

## Purpose
Manages user wallet state including balance, wallet initialization status, and email verification. Provides real-time updates from Firestore and utility functions for wallet operations.

## Interface

### Return Type
```typescript
interface WalletState {
  hasWallet: boolean | null;        // null = loading, true/false = wallet status
  balance: number;                  // Current wallet balance in dollars
  isLoading: boolean;               // True while initial data loads
  error: string | null;             // Error message if operation fails
  userId: string | null;            // Current user's Firebase UID
  emailVerified: boolean | null;    // User's email verification status
  
  // Methods
  initializeWallet: () => Promise<void>;
  resendVerificationEmail: () => Promise<{ success: boolean; message: string }>;
}
```

## Usage

### Basic Wallet Display
```typescript
import { useWallet } from '@/hooks/useWallet';

function WalletDisplay() {
  const { balance, hasWallet, isLoading, emailVerified } = useWallet();

  if (isLoading) return <Spinner />;
  if (!emailVerified) return <VerifyEmailBanner />;
  if (!hasWallet) return <SetupWalletButton />;

  return <div>Balance: ${balance.toFixed(2)}</div>;
}
```

### Wallet Initialization
```typescript
function WalletSetup() {
  const { initializeWallet, isLoading, error } = useWallet();

  const handleSetup = async () => {
    await initializeWallet();
    // Wallet state updates automatically via real-time listener
  };

  return (
    <button onClick={handleSetup} disabled={isLoading}>
      {isLoading ? 'Setting up...' : 'Setup Wallet'}
    </button>
  );
}
```

### Email Verification
```typescript
function VerificationSection() {
  const { emailVerified, resendVerificationEmail } = useWallet();
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    const result = await resendVerificationEmail();
    setMessage(result.message);
  };

  if (emailVerified) return null;

  return (
    <div>
      <p>Please verify your email</p>
      <button onClick={handleResend}>Resend Email</button>
      {message && <p>{message}</p>}
    </div>
  );
}
```

## Features

### Real-time Balance Updates
- Uses Firestore `onSnapshot` for live balance changes
- Automatically reflects deposits, withdrawals, and winnings
- No manual refresh needed

### Wallet Initialization
- Creates user document in Firestore if missing
- Sets `hasWallet: true` and `balance: 0`
- Includes creation timestamp
- Uses merge strategy to preserve existing data
- Idempotent: safe to call multiple times

### Email Verification Management
- Tracks email verification status in real-time
- Provides method to resend verification emails
- Updates user's displayName before sending email
- Handles rate limiting gracefully

### Automatic Cleanup
- Properly unsubscribes from auth listener
- Cleans up Firestore snapshot listener
- Prevents memory leaks and unnecessary updates

## Firestore Structure

```
users/
  {userId}/
    - hasWallet: boolean
    - balance: number
    - createdAt: Timestamp
    - email: string
    - display_name: string
    - emailVerified: boolean
```

## Implementation Details

### Dual Listener Pattern
```typescript
// Auth listener for user state
const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
  // Firestore listener for wallet data
  const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
    // Update wallet state
  });
});
```

### Wallet Initialization Logic
```typescript
const initializeWallet = async () => {
  const userDocRef = doc(db, 'users', userId);
  const docSnap = await getDoc(userDocRef);
  
  if (!docSnap.exists()) {
    await setDoc(userDocRef, {
      hasWallet: true,
      balance: 0,
      createdAt: new Date(),
    }, { merge: true });
  } else if (!docSnap.data()?.hasWallet) {
    await setDoc(userDocRef, { 
      hasWallet: true, 
      balance: docSnap.data()?.balance ?? 0 
    }, { merge: true });
  }
};
```

### DisplayName Resolution
```typescript
// Fallback chain for displayName
const displayName = 
  userData.display_name || 
  userData.firstName || 
  auth.currentUser.email?.split('@')[0] || 
  'User';
```

## Dependencies

- `firebase/auth`: User authentication
- `firebase/firestore`: Wallet data storage
- `@/lib/firebase`: Firebase app instance
- `@/context/AuthContext`: Auth context provider

## State Transitions

### Initial Load
```
isLoading: true → false
hasWallet: null → true/false
```

### User Logout
```
All values reset to initial state
Listeners cleaned up
```

### Wallet Setup
```
hasWallet: false → true
balance: 0 (initialized)
```

## Best Practices

1. **Check Loading State**: Always handle `isLoading` before rendering wallet data
2. **Verify Email**: Check `emailVerified` before allowing financial operations
3. **Handle No Wallet**: Show setup flow when `hasWallet` is `false`
4. **Error Handling**: Display `error` messages to users
5. **Idempotent Operations**: Safe to call `initializeWallet` multiple times

## Common Use Cases

### Conditional Deposit Button
```typescript
function DepositButton() {
  const { hasWallet, emailVerified, initializeWallet } = useWallet();

  if (!emailVerified) return <VerifyEmailFirst />;
  if (!hasWallet) return <button onClick={initializeWallet}>Setup Wallet</button>;
  return <button onClick={openDepositModal}>Deposit</button>;
}
```

### Balance Display with Formatting
```typescript
function WalletBalance() {
  const { balance, isLoading } = useWallet();

  return (
    <div>
      ${isLoading ? '...' : balance.toFixed(2)}
    </div>
  );
}
```

### Wallet Status Badge
```typescript
function WalletStatus() {
  const { hasWallet, emailVerified } = useWallet();

  if (!emailVerified) return <Badge color="yellow">Verify Email</Badge>;
  if (!hasWallet) return <Badge color="red">Setup Required</Badge>;
  return <Badge color="green">Active</Badge>;
}
```

## Error Handling

### No User ID
```typescript
error: 'Login required to initialize wallet.'
```

### Wallet Already Exists
```typescript
// Silently skips re-initialization
console.log("Wallet already initialized.");
```

### Email Rate Limiting
```typescript
{
  success: false,
  message: 'Verification email already sent recently. Please wait a few minutes.'
}
```

## Security Considerations

1. **Client-Side Balance**: Balance displayed is cached; always verify server-side
2. **Firestore Rules**: Ensure rules protect wallet data
3. **Email Verification**: Critical for financial operations
4. **Transaction Atomic Operations**: Use Firestore transactions for balance updates
5. **User Document Access**: Only user can read/write their own wallet

## Performance Considerations

- **Real-time Updates**: Only subscribes when user is logged in
- **Automatic Cleanup**: Prevents memory leaks
- **Merge Strategy**: Preserves other user data fields
- **Single Listener**: One snapshot listener per user

## Troubleshooting

### Balance not updating
- Check Firestore rules allow read access
- Verify network connection
- Ensure user is authenticated
- Check browser console for errors

### Email verification not reflecting
- User may need to reload page
- Check email verification was completed
- Verify Firebase email templates are configured

### Wallet initialization fails
- Check Firestore rules allow document creation
- Verify user is authenticated
- Ensure Firebase is initialized correctly

### Memory leaks
- Ensure component using hook unmounts properly
- Check cleanup functions are being called
- Verify no duplicate listeners

## Related Hooks

- `useAuth`: Provides authentication state
- `useAuthGuard`: Guards routes and provides auth context
- `useFcmToken`: Requires authenticated user

## Related API Routes

- `/api/wallet/update-balance`: Server-side balance updates
- `/api/paypal/capture-order`: Deposit via PayPal
- `/api/stripe/create-payment-intent`: Deposit via Stripe

## Integration with Payment Systems

```typescript
// After successful payment capture
const response = await fetch('/api/wallet/update-balance', {
  method: 'POST',
  body: JSON.stringify({
    userId: walletState.userId,
    amount: depositAmount,
    orderId: paymentId
  })
});

// Balance updates automatically via onSnapshot listener
```

## Console Logging

Hook includes detailed console logging for debugging:
- Auth state changes
- Email verification status
- Snapshot listener setup/cleanup
- Wallet initialization attempts

Can be removed in production or controlled via environment variable.

