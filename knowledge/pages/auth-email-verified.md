# Email Verified Page

## Route
`/email-verified`

## Purpose
Landing page for email verification links from Firebase. Processes the verification action code and confirms the user's email address or handles password reset redirects.

## Runtime
`edge` - Runs on edge runtime for faster response

## Components Used
- `AuthBackground` - Shared auth page background with constellation canvas
- `Button` - UI button component
- `motion` (Framer Motion) - Page transition animations
- `Suspense` - React suspense boundary for search params

## APIs Called
- **Firebase Auth**:
  - `applyActionCode()` - Applies the email verification action code
  - Processes `oobCode` from URL query parameters

## Data Flow
1. Page loads with URL query parameters
2. Extracts `mode` and `oobCode` from search params
3. Three possible modes:
   - **resetPassword mode**: Redirects to password reset confirmation
   - **verifyEmail mode**: Applies verification code
   - **Invalid/missing params**: Show error
4. For verifyEmail mode:
   - Shows "Verifying link…" while processing
   - Calls `applyActionCode()` with the oobCode
   - On success:
     - Show success message
     - Auto-redirect to `/login` after 1.5 seconds
   - On failure:
     - Show error message
     - Provide manual link back to login

## Query Parameters
- `mode` - Action type: `verifyEmail` or `resetPassword`
- `oobCode` - One-time action code from Firebase email

## UI States
### Verifying:
- Display: "Verifying link…"

### Success (Email Verified):
- Heading: "Email verified"
- Message: "Redirecting to login…"
- Action: "Go to login" button → `/login`
- Auto-redirect after 1.5 seconds

### Error (Invalid/Expired):
- Heading: "Invalid or expired link"
- Message: "Please request a new verification email."
- Action: "Back to login" button (outline) → `/login`

## State Management
- `isVerifying` - Tracks verification API call
- `isSuccess` - Verification result (true/false)
- `headingRef` - Focus management for accessibility

## Effects
- Runs verification on mount
- Handles redirect for password reset mode
- Processes verification code
- Manages auto-redirect timing
- Focuses heading after state changes

## Special Handling
### Password Reset Redirect:
If `mode=resetPassword`:
- Extracts `oobCode`
- Redirects to `/reset-password/confirm?oobCode={code}`
- Does not process as email verification

### Email Verification:
If `mode=verifyEmail`:
- Processes action code via Firebase
- Updates email verification status
- Provides feedback and redirect

## Error Scenarios
- Missing `oobCode`: Show invalid link error
- Invalid `oobCode`: Firebase throws error, caught and displayed
- Expired `oobCode`: Firebase throws error, caught and displayed
- Network errors: Caught and displayed as invalid link

## Accessibility
- Focus management with heading ref
- ARIA live regions for status updates:
  - `role="status"` and `aria-live="polite"` for success
  - `role="alert"` and `aria-live="assertive"` for errors
- Tab index on heading for programmatic focus
- Immediate focus on heading after state changes

## Navigation
- Manual: "Go to login" or "Back to login" button
- Automatic: Redirect to `/login` 1.5s after success
- Redirect: To `/reset-password/confirm` if password reset mode

## Background
Uses `AuthBackground` component with:
- Canvas ID: "email-verified-canvas"
- Constellation animation
- Consistent auth page styling

## User Journey
1. User receives verification email
2. Clicks verification link
3. Redirected to this page with action code
4. Page verifies the code automatically
5. Shows success/error message
6. Auto-redirects to login (success) or provides retry option (error)

