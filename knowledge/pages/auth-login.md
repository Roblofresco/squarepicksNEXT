# Login Page

## Route
`/login`

## Purpose
Allows existing users to authenticate using email and password. Handles email verification checks and redirects verified users to the loading screen.

## Components Used
- `LogoCube` - 3D animated logo cube (dynamic import, client-side only)
- `LoginForm` - Form component for email/password inputs
- `Button` - UI button component
- `Input` - UI input component
- Background canvas with constellation/star animation
- Loading spinner (inline SVG)

## APIs Called
- **Firebase Auth**
  - `signInWithEmailAndPassword()` - Authenticates user credentials
  - `auth.currentUser.reload()` - Refreshes user data to check email verification status
  - `signOut()` - Signs out user if email not verified (optional)

## Data Flow
1. User enters email and password
2. Submit triggers `handleLogin()`
3. Firebase authentication attempt via `signInWithEmailAndPassword()`
4. On success:
   - Check email verification status (3 attempts with delays: immediate, +2s, +3s)
   - Each attempt calls `currentUser.reload()` to refresh verification status
   - If verified: wait 500ms for wallet hook, then redirect to `/loading`
   - If not verified after 3 attempts: show error, keep user signed in (optional signout)
5. On error:
   - Handle specific Firebase error codes:
     - `auth/user-not-found`, `auth/wrong-password`, `auth/invalid-credential`: "Invalid email or password"
     - `auth/invalid-email`: "Please enter a valid email address"
     - `auth/too-many-requests`: Rate limit message with password reset suggestion
     - `auth/network-request-failed`: Network error message
   - Display appropriate error message

## UI Features
- Interactive background (constellation canvas with pointer tracking)
- Mouse/touch position affects logo cube rotation and background gradient
- Warp effect on pointer press
- Navigation buttons to home (`/`) and lobby (`/lobby`)
- Password visibility toggle
- Link to signup page (`/signup/email`)
- Link to password reset (via LoginForm)

## State Management
- Local state for form inputs (email, password)
- Loading state during authentication
- Error state for validation/auth errors
- Navigation state for header buttons
- Mouse position tracking for visual effects

## Validation
- Client-side: Email and password required
- Server-side: Firebase handles credential validation

## Accessibility
- ARIA labels and descriptions
- Focus management
- Loading indicators
- Error announcements

