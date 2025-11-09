# useAuth Hook

## Overview
Custom React hook for managing Firebase authentication state with real-time updates.

## Location
`src/hooks/useAuth.ts`

## Purpose
Provides a simple interface to track authentication state, user information, and loading/error states throughout the application.

## Interface

### Return Type
```typescript
interface AuthState {
  user: User | null;          // Firebase User object or null
  loading: boolean;            // True while auth state is initializing
  error: Error | null;         // Error object if auth fails
}
```

## Usage

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading, error } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Please log in</div>;

  return <div>Welcome, {user.email}</div>;
}
```

## Features

### Real-time Authentication State
- Automatically subscribes to Firebase auth state changes via `onAuthStateChanged`
- Updates component when user logs in/out
- Cleans up subscription on component unmount

### Loading State Management
- Starts with `loading: true` during initialization
- Sets `loading: false` once auth state is determined
- Prevents flash of unauthenticated content

### Error Handling
- Captures and exposes authentication errors
- Logs errors to console for debugging
- Maintains app stability on auth failures

## Dependencies

- `firebase/auth`: Firebase Authentication SDK
- `@/lib/firebase`: Firebase app instance

## Implementation Details

### State Initialization
```typescript
const [authState, setAuthState] = useState<AuthState>({
  user: null,
  loading: true,
  error: null,
});
```

### Auth Listener
- Uses `onAuthStateChanged` with Firebase auth instance
- Handles both success and error callbacks
- Returns unsubscribe function for cleanup

## Best Practices

1. **Use for Read-Only Auth State**: This hook is for observing auth state, not modifying it
2. **Combine with AuthGuard**: Use with `useAuthGuard` for protected routes
3. **Check Loading State**: Always handle the loading state to prevent UI issues
4. **Single Instance**: Firebase manages a single auth instance across the app

## Related Hooks

- `useAuthGuard`: Enhanced auth hook with email verification and auto-redirect
- `useFcmToken`: Requires authenticated user for push notifications
- `useWallet`: Depends on authenticated user for wallet operations

## Performance Considerations

- Minimal re-renders: Only updates when auth state actually changes
- Efficient cleanup: Unsubscribes from Firebase listener on unmount
- Shared auth instance: No duplicate subscriptions across components

## Common Use Cases

1. **Display User Info**: Show logged-in user's email or display name
2. **Conditional Rendering**: Show different UI for authenticated vs. anonymous users
3. **Auth Context**: Provide auth state to Context API for global access
4. **Route Protection**: Determine if user can access certain pages

## Troubleshooting

### User is null after login
- Wait for `loading` to be `false` before checking user
- Ensure Firebase is properly initialized in `@/lib/firebase`

### Infinite loading state
- Check Firebase configuration in environment variables
- Verify network connection to Firebase servers

### Auth state not updating
- Ensure component is not unmounting immediately after login
- Check for multiple Firebase app initializations

