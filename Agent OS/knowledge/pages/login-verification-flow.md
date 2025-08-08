# Knowledge: Login & Email Verification Flow

## 1. Overview & Purpose

This flow handles how existing users sign in and how the application enforces email verification, which is a mandatory step before a user can access core features.

## 2. Page-by-Page Breakdown

### a. `/login`

-   **Responsibility:** To authenticate an existing user.
-   **Functionality:**
    -   Provides a standard email and password input form.
    -   On submission, it calls `signInWithEmailAndPassword` from the Firebase Auth SDK.
    -   **Verification Check:** This is a critical step. After a successful sign-in, the page does *not* immediately redirect. Instead, it explicitly calls `currentUser.reload()` to get the latest user state from Firebase, specifically to check the `emailVerified` property.
    -   It will attempt this check multiple times with a delay to account for the user verifying their email in a different tab and then coming back to log in.
    -   **Redirection (Success):** If `emailVerified` is `true`, it redirects the user to the `/loading` page, which then routes them to the lobby.
    -   **Redirection (Failure):** If the email is *not* verified after several checks, it displays an error message prompting the user to check their inbox and signs them out to prevent an unverified session.

### b. `/verify-email`

-   **Responsibility:** To act as a waiting/prompt page for users who have successfully logged in but whose email is not yet verified.
-   **Functionality:**
    -   Uses the `useWallet` hook to monitor the `emailVerified` status in real-time.
    -   If the user verifies their email in another tab, the `onAuthStateChanged` listener in `useWallet` will detect the change, `emailVerified` will become `true`, and this page's `useEffect` will automatically redirect them to the `/lobby`.
    -   Provides a "Resend Verification Email" button that calls the `resendVerificationEmail` function from the `useWallet` hook.
    -   Provides a "Log Out" button.

### c. `/email-verified`

-   **Responsibility:** This is the landing page that the user is directed to *from the link in their email*. It is not a page the user navigates to manually.
-   **Functionality:**
    -   It reads the `oobCode` (out-of-band code) from the URL search parameters.
    -   It calls `applyActionCode` from the Firebase Auth SDK, passing it this code. This is the action that actually flips the `emailVerified` flag to `true` on the Firebase backend.
    -   After successfully applying the code, it automatically redirects the user to the `/login` page so they can now sign in with their newly verified account.

## 3. Core Components & State Management

-   **`@/hooks/useWallet`:** Crucial for the `/verify-email` page to get the real-time `emailVerified` status.
-   **`@/components/ui/EmailVerificationBanner.tsx`:** A sitewide banner that also uses the `useWallet` hook. It displays a prominent message to unverified users, prompting them to check their email and offering a "Resend" button.

## 4. Key Data Dependencies & Hooks

-   **Firebase Auth:** This flow is almost entirely dependent on Firebase Authentication services (`signInWithEmailAndPassword`, `currentUser.reload()`, `sendEmailVerification`, `applyActionCode`, `signOut`).
-   **Next.js Hooks:** `useRouter` and `useSearchParams` are used heavily for redirection and for reading the verification code from the URL. 

## 5. Core Components Used

- `@/components/ui/EmailVerificationBanner`: Sitewide verification banner
- `@/components/ui/button`: Action buttons across pages 