# Knowledge: `useWallet` Hook (`@/hooks/useWallet.ts`)

## 1. Overview & Purpose

The `useWallet` hook is a centralized, application-wide hook responsible for providing real-time information about the current user's authentication state, wallet status, and balance. It abstracts away the complexity of interacting with Firebase Auth and Firestore for these core pieces of data.

## 2. Key Responsibilities & Functionality

-   **Authentication State:** It wraps Firebase's `onAuthStateChanged` listener to provide:
    -   `userId`: The current user's UID, or `null` if not logged in.
    -   `emailVerified`: A boolean indicating if the user's email has been verified, or `null` during loading.
    -   `isLoading`: A boolean that is `true` while the initial authentication state is being determined.
-   **Wallet & Balance Listening:**
    -   Once a user is authenticated (`userId` is available), it sets up a real-time Firestore listener (`onSnapshot`) on the user's specific document in the `users` collection (`/users/{userId}`).
    -   It listens for changes to the `hasWallet` and `balance` fields in that document.
-   **State Provided:** The hook returns a single object containing the combined state from both Auth and Firestore:
    -   `hasWallet`: `true` or `false` based on the Firestore document. `null` if loading or no user.
    -   `balance`: The user's current balance from Firestore. Defaults to `0`.
    -   `userId`: The Firebase Auth UID.
    -   `emailVerified`: The verification status from the Firebase Auth user object.
    -   `isLoading`: A consolidated loading state that is `true` until *both* the initial auth check and the initial wallet data fetch are complete.
    -   `error`: Any error that occurs during the wallet data fetch.
-   **Actions:** The hook also exposes functions to modify user state:
    -   `initializeWallet`: A function that can be called to set the `hasWallet` flag to `true` in the user's Firestore document.
    -   `resendVerificationEmail`: A function that sends a new verification email to the current user.

## 3. How It's Used

This hook is imported and used in nearly every page that requires a user to be logged in or that displays user-specific data.

**Example Usage (`LobbyPage`):**
```typescript
const { userId, emailVerified, isLoading, balance, hasWallet } = useWallet();

useEffect(() => {
  if (!isLoading) {
    if (userId && !emailVerified) {
      router.push('/verify-email'); // Redirect if email isn't verified
    }
  }
}, [userId, emailVerified, isLoading]);
```
This pattern allows pages to easily react to changes in authentication or wallet status and handle loading states or redirection gracefully. 