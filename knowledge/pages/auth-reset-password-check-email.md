# Reset Password - Check Email Page

## Route
`/reset-password/check-email`

## Purpose
Confirmation page shown after user requests a password reset. Informs user to check their email inbox for the reset link.

## Runtime
`edge` - Runs on edge runtime for faster response

## Components Used
- `AuthBackground` - Shared auth page background with constellation canvas
- `motion` (Framer Motion) - Page transition animations
- `Suspense` - React suspense boundary for search params
- `FiArrowLeft` icon - Back button icon

## APIs Called
None (static confirmation page)

## Query Parameters
- `email` - User's email address passed from previous page for display

## Data Flow
1. User arrives from `/reset-password` after successful reset request
2. Email parameter extracted from URL
3. Display confirmation message with email
4. User checks email inbox for reset link
5. User can resend if needed or return to login

## UI Content
### Heading
"Check your email"

### Message
"We sent a password reset link to **{email}** (or 'your email' if param missing). Check your inbox and follow the link to set a new password."

### Actions
- "Resend reset link" → `/reset-password` (resubmit form)
- "Back to login" → `/login` (with arrow icon)

## State Management
None (static display page)

## Effects
None

## Accessibility
- Clear hierarchy with heading
- Email displayed in contrasting color (white) for emphasis
- Link text clearly describes actions

## Navigation
- Link to `/reset-password` - Resend reset email
- Link to `/login` - Return to login page

## Background
Uses `AuthBackground` component with:
- Canvas ID: "reset-password-check-email-canvas"
- Constellation animation
- Consistent auth page styling

## User Journey
1. User requests password reset on previous page
2. Lands here with confirmation
3. Checks email inbox
4. Clicks reset link in email
5. Redirected to `/reset-password/confirm` (or `/email-verified` which redirects)
6. Sets new password
7. Returns to login

## Fallback Behavior
- If `email` param missing: Shows "your email" instead of specific address
- Page still functional without param

## Suspense Boundary
Wraps content that uses `useSearchParams()` to prevent errors and provide loading state during SSR/edge rendering.

