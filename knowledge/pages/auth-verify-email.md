# Verify Email Page

## Route
`/verify-email`

## Purpose
Prompts authenticated but unverified users to check their email for verification link. Provides option to resend verification email.

## Runtime
`edge` - Runs on edge runtime for faster response

## Components Used
- `AuthBackground` - Shared auth page background with constellation canvas
- `Button` - UI button component
- `Loader2` icon - Loading spinner for resend action
- `motion` (Framer Motion) - Page transition animations

## APIs Called
- **useWallet Hook**:
  - `userId` - Current authenticated user ID
  - `emailVerified` - Current email verification status
  - `resendVerificationEmail()` - Function to resend verification email
  - `isLoading` - Wallet loading state

## Data Flow
1. Page checks authentication and verification status via `useWallet` hook
2. Three possible states:
   - Loading: Show "Loading your details…"
   - Not authenticated: Show error, redirect to `/login` after 200ms
   - Authenticated but not verified: Show verification prompt
   - Email verified: Redirect to `/lobby` immediately
3. User can click "Resend verification email":
   - Sets loading state
   - Calls `resendVerificationEmail()`
   - Shows success or failure status message
   - Refocuses heading for accessibility

## UI States
### Loading State:
- Display: "Loading your details…"
- Background active

### Not Authenticated:
- Heading: "Not authenticated"
- Message: "You need to be logged in to see this page."
- Action: "Go to login" button → `/login`

### Email Verified (Auto-redirect):
- Heading: "Email verified"
- Message: "Redirecting…"
- Action: "Go to Lobby" button → `/lobby`
- Auto-redirect occurs immediately

### Awaiting Verification (Main State):
- Heading: "Verify your email"
- Message: "We sent a verification link to your email. Click the link to activate your account."
- Status: Success/failure message after resend attempt
- Actions:
  - "Resend verification email" button (primary)
  - "Back to login" button (outline)

## State Management
- `isResending` - Tracks resend email operation
- `status` - Success/failure message from resend attempt
- `headingRef` - Focus management for accessibility

## Effects
- Monitors `emailVerified` status for auto-redirect
- Monitors `userId` and `walletLoading` for auth state
- Redirects to `/login` after 200ms if not authenticated
- Focuses heading after mount and after resend

## Accessibility
- Focus management with heading ref
- ARIA live regions for status messages:
  - `role="alert"` and `aria-live="assertive"` for failures
  - `role="status"` and `aria-live="polite"` for success
- Tab index on heading for programmatic focus

## Resend Verification Flow
1. User clicks "Resend verification email"
2. Button disabled, shows loading state with spinner
3. Calls `resendVerificationEmail()` from useWallet hook
4. Returns result: `{ success: boolean, message?: string }`
5. Updates status message:
   - Success: "Verification email sent"
   - Failure: "Failed to send verification email"
6. Re-enables button, focuses heading

## Navigation
- Back to `/login` - Available anytime
- Auto-redirect to `/lobby` - When email becomes verified
- Redirect to `/login` - If not authenticated

## Background
Uses `AuthBackground` component with:
- Canvas ID: "verify-email-canvas"
- Constellation animation
- Consistent auth page styling

