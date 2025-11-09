# Reset Password Request Page

## Route
`/reset-password`

## Purpose
Allows users to request a password reset email. Validates email exists in Firebase Auth before sending reset link.

## Components Used
- `AuthBackground` - Shared auth page background with constellation canvas
- `Input` - UI input component
- `Label` - UI label component
- `Button` - UI button component
- `motion` (Framer Motion) - Page transition animations
- `FiArrowLeft` icon - Back button icon

## APIs Called
### Client-Side API:
- `POST {FUNCTIONS_BASE_URL}/checkAuthEmailExists`
  - Validates if email exists in Firebase Auth
  - Checks if user has password provider (not OAuth only)
  - Request: `{ email: string }`
  - Response: `{ data: { exists: boolean, hasPasswordProvider: boolean } }`
  - Base URL from `NEXT_PUBLIC_FUNCTIONS_BASE_URL` env var
  - Default: `https://us-east1-square-picks-vpbb8d.cloudfunctions.net`

### Firebase Auth:
- `sendPasswordResetEmail()` - Sends password reset email
  - Uses `useDeviceLanguage()` for localized email
  - Includes actionCodeSettings with continuation URL
  - Action URL: `{origin}/reset-password/confirm`

## Data Flow
1. User enters email address
2. On submit:
   - Validate email is not empty
   - Call server function to check if email exists and has password provider
   - If email not found or no password provider: Show error
   - If email exists with password:
     - Send password reset email via Firebase
     - Show success toast
     - Redirect to `/reset-password/check-email?email={email}`
3. On error:
   - Display error message
   - Focus heading for accessibility
   - Keep user on page to retry

## State Management
- `email` - Email input value
- `isSubmitting` - Loading state during API calls
- `errorMessage` - Validation/API error message
- `emailInputRef` - Input focus management
- `headingRef` - Heading focus management

## Effects
- On mount: Focus email input for better UX

## Validation
- Email field required
- Server-side check:
  - Email must exist in Firebase Auth
  - User must have password provider (not OAuth-only account)
- Errors display: "No account found for that email."

## Server-Side Email Check
Function: `serverCheckEmailExists()`
- Makes CORS-enabled POST request to Cloud Function
- Uses environment variable for base URL
- Logs URL in development
- Returns: `{ exists: boolean, hasPasswordProvider: boolean }`
- Handles network errors gracefully
- Returns `false` values on error

## Action Code Settings
```typescript
{
  url: `${window.location.origin}/reset-password/confirm`
}
```
- Specifies where user lands after clicking email link
- Firebase adds the `oobCode` parameter automatically

## UI Features
- Clean form with email input
- Loading state on submit button ("Sending…")
- Error message displays below email field
- Back to login link with arrow icon
- Animated entry and button interactions
- Focus management for accessibility

## Error Handling
- Empty email: "Please enter your email" + toast
- Email not found: "No account found for that email."
- No password provider: Same error as not found (for security)
- Network/API errors: "No account found for that email."
- All errors focus heading and update error state

## Accessibility
- ARIA labels on input
- Error message connected via `aria-describedby`
- Focus management (input on mount, heading on error)
- ARIA live regions:
  - Error: `role="alert"` and `aria-live="assertive"`
- Toast notifications for user feedback

## Navigation
- Link to `/login` (back arrow)
- Redirect to `/reset-password/check-email` on success
- Email passed as query parameter for display

## Background
Uses `AuthBackground` component with:
- Canvas ID: "reset-password-canvas"
- Constellation animation
- Consistent auth page styling

## Environment Variables
- `NEXT_PUBLIC_FUNCTIONS_BASE_URL` - Base URL for Cloud Functions
  - Used to construct email check endpoint
  - Falls back to hardcoded URL if not set

