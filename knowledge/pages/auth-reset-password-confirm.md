# Reset Password - Confirm Page

## Route
`/reset-password/confirm`

## Purpose
Allows users to set a new password after clicking the reset link from their email. Verifies the action code and processes the password reset.

## Runtime
`edge` - Runs on edge runtime for faster response

## Components Used
- `AuthBackground` - Shared auth page background with constellation canvas
- `Input` - UI input component
- `Label` - UI label component
- `Button` - UI button component
- `motion` (Framer Motion) - Page transition animations
- `Suspense` - React suspense boundary for search params

## APIs Called
- **Firebase Auth**:
  - `verifyPasswordResetCode()` - Validates the oobCode and retrieves associated email
  - `confirmPasswordReset()` - Applies the new password using the oobCode

## Query Parameters
- `oobCode` (or `oobcode`) - One-time action code from password reset email

## Data Flow
1. Page loads with `oobCode` from URL
2. Immediately verifies code via `verifyPasswordResetCode()`:
   - On success: Retrieves email, shows password form
   - On failure: Shows error message
3. User enters new password and confirmation
4. On submit:
   - Validates password (min 8 chars, passwords match)
   - Calls `confirmPasswordReset()` with oobCode and new password
   - On success:
     - Shows success toast
     - Redirects to `/login`
   - On failure:
     - Shows error toast
     - Keeps user on page to retry

## UI States
### Verifying:
- Display: "Verifying link…"

### Valid Link:
- Heading: "Set a new password"
- Email displayed: "Account: {email}"
- Form with:
  - New password input
  - Confirm password input
  - Submit button

### Invalid Link:
- Heading: "Set a new password"
- Error message: "Invalid or expired reset link"
- No form displayed

## State Management
- `isVerifying` - Tracks initial code verification
- `isSubmitting` - Tracks password update submission
- `newPassword` - New password input
- `confirmPassword` - Password confirmation input
- `email` - Email associated with reset code
- `verificationError` - Error from code verification
- `headingRef` - Focus management for accessibility

## Effects
- On mount: Verify oobCode automatically
- After verification: Focus heading
- After submit error: Focus heading

## Validation
### Client-Side:
- Password minimum 8 characters
- Password and confirmation must match

### Server-Side:
- Firebase validates password strength
- Firebase validates oobCode hasn't been used or expired

## Password Reset Flow
1. Extract `oobCode` from URL
2. Call `verifyPasswordResetCode()`:
   - Returns associated email
   - Validates code hasn't expired
   - Validates code hasn't been used
3. User fills password form
4. Call `confirmPasswordReset()` with code and new password
5. Success: Update applied, redirect to login
6. Failure: Show error, allow retry

## Error Scenarios
- Missing `oobCode`: Show invalid link error
- Invalid/expired `oobCode`: Firebase error caught and displayed
- Used `oobCode`: Firebase error caught and displayed
- Network errors: Caught and displayed
- Password too short: Client-side validation prevents submit
- Passwords don't match: Client-side validation prevents submit

## Accessibility
- Focus management with heading ref
- ARIA live regions for error messages:
  - `role="alert"` and `aria-live="assertive"`
- Tab index on heading for programmatic focus
- Label associations for form inputs
- Disabled state on submit button during processing

## Toast Notifications
- Success: "Password updated. Please log in."
- Validation error: "Password must be at least 8 characters" or "Passwords do not match"
- Server error: "Could not reset password. The link may be invalid or expired."

## Navigation
- Automatic redirect to `/login` on success
- No back button (flow should complete here)

## Background
Uses `AuthBackground` component with:
- Canvas ID: "reset-password-confirm-canvas"
- Constellation animation
- Consistent auth page styling

## Suspense Boundary
Wraps content that uses `useSearchParams()` to prevent errors and provide loading state during SSR/edge rendering.

## User Journey
1. User receives password reset email
2. Clicks link in email
3. May land on `/email-verified` first (which redirects here with oobCode)
4. Arrives at this page with oobCode
5. Code verified automatically
6. Fills new password form
7. Submits password
8. Redirected to login to sign in with new password

