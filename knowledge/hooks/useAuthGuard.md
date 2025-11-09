# useAuthGuard Hook

## Overview
Enhanced authentication hook that provides auth state management with automatic redirection for unauthenticated users and optional email verification enforcement.

## Location
`src/hooks/useAuthGuard.ts`

## Purpose
Protects routes by ensuring users are authenticated and optionally email-verified before allowing access. Automatically creates Firestore user documents and redirects unauthenticated users to login.

## Interface

### Parameters
```typescript
requireEmailVerification?: boolean  // Default: true
```

### Return Type
```typescript
interface UseAuthGuardReturn {
  user: User | null;              // Firebase User object or null
  loading: boolean;                // True while auth state is loading
  error: string | null;            // Error message if verification fails
  isAuthenticated: boolean;        // True if user is logged in
  isEmailVerified: boolean;        // True if user's email is verified
}
```

## Usage

### Basic Protection (with email verification)
```typescript
import { useAuthGuard } from '@/hooks/useAuthGuard';

function ProtectedPage() {
  const { user, loading, error, isAuthenticated, isEmailVerified } = useAuthGuard();

  if (loading) return <div>Loading...</div>;
  
  if (!isEmailVerified) {
    return <div>Please verify your email to continue</div>;
  }

  return <div>Protected content for {user?.email}</div>;
}
```

### Without Email Verification
```typescript
function PartiallyProtectedPage() {
  const { user, loading } = useAuthGuard(false);

  if (loading) return <div>Loading...</div>;

  return <div>Welcome, {user?.email}</div>;
}
```

## Features

### Automatic Redirection
- Redirects to `/login` if user is not authenticated
- Uses Next.js router for seamless navigation
- Maintains security without manual checks

### Email Verification Enforcement
- Optionally requires email verification
- Reloads user state to get latest verification status
- Sets error state if verification is required but not completed

### Firestore User Document Management
- Automatically checks for user document existence
- Creates user document if missing with initial data:
  - `createdAt`: User creation timestamp
  - `email`: User's email address
  - `display_name`: User's display name or 'User'
  - `emailVerified`: Current verification status
  - `lastLogin`: Timestamp of last login
- Uses merge strategy to preserve existing data

### Real-time User Updates
- Reloads user data to get fresh verification status
- Handles reload errors gracefully
- Falls back to cached user data if reload fails

## Implementation Details

### User Reload Process
```typescript
await user.reload();
freshUser = auth.currentUser || user;
```

### Firestore Document Creation
```typescript
await setDoc(userDocRef, {
  createdAt: new Date(),
  email: freshUser.email,
  display_name: freshUser.displayName || 'User',
  emailVerified: freshUser.emailVerified,
  lastLogin: new Date()
}, { merge: true });
```

## Dependencies

- `firebase/auth`: Authentication state management
- `firebase/firestore`: User document operations
- `next/navigation`: Router for redirects
- `@/lib/firebase`: Firebase app instance

## Best Practices

1. **Use at Page Level**: Call in top-level page components for route protection
2. **Handle Loading State**: Always show loading UI while auth is being checked
3. **Check isEmailVerified**: Use for features requiring verified users
4. **Combine with UI Guards**: Add visual indicators for verification status

## Common Use Cases

### Protected Pages
```typescript
// app/dashboard/page.tsx
export default function Dashboard() {
  const { user, loading } = useAuthGuard();
  if (loading) return <Spinner />;
  return <DashboardContent user={user} />;
}
```

### Partial Protection (no email verification)
```typescript
// app/profile/page.tsx
export default function Profile() {
  const { user, loading, isEmailVerified } = useAuthGuard(false);
  
  return (
    <div>
      {!isEmailVerified && <EmailVerificationBanner />}
      <ProfileContent user={user} />
    </div>
  );
}
```

### Conditional Features
```typescript
function DepositButton() {
  const { isEmailVerified } = useAuthGuard();
  
  return (
    <button disabled={!isEmailVerified}>
      {isEmailVerified ? 'Deposit' : 'Verify Email to Deposit'}
    </button>
  );
}
```

## Error States

### Email Verification Required
```typescript
error: 'Email verification required'
isEmailVerified: false
```

### Firestore Document Creation Failed
- Non-critical error, logged to console
- Does not block authentication
- User can still access protected content

## Security Considerations

1. **Client-Side Only**: This is client-side protection; always verify on server
2. **Firestore Rules**: Ensure Firestore rules protect user documents
3. **Email Verification**: Can be bypassed on client; verify server-side for critical operations
4. **Redirect Loop Prevention**: Ensure login page doesn't use this hook

## Performance Considerations

- Efficient user reload: Only reloads when auth state changes
- Firestore optimization: Uses `merge: true` to avoid overwriting
- Single auth listener: Shared Firebase auth instance prevents duplicate listeners

## Troubleshooting

### Redirect loop to login
- Ensure login page doesn't use `useAuthGuard`
- Check that authenticated users aren't being redirected

### Email verified but hook shows unverified
- User may need to log out and back in
- Check email verification link was clicked
- Verify Firebase email verification is properly configured

### User document not created
- Check Firestore rules allow user document creation
- Verify Firebase Admin permissions
- Check network connectivity

## Related Hooks

- `useAuth`: Simpler auth hook without guards or verification checks
- `useWallet`: Often used together for wallet access
- `useFcmToken`: Requires authenticated user

