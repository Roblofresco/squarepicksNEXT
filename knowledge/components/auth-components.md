# Auth Components

## AuthGuard.tsx
**Purpose**: Protects routes requiring authentication and email verification.
**Props**: 
- `children` (React.ReactNode): Protected content
- `requireEmailVerification` (boolean, default: true): Whether to enforce email verification
- `redirectTo` (string, default: '/login'): Redirect destination if not authenticated

**User Interactions**:
- Displays loading spinner during auth check
- Shows error screen if email not verified
- Redirects to login if not authenticated
- Provides "Go to Email Verification" and "Back to Profile" buttons on error

**APIs Called**:
- Firebase Auth `onAuthStateChanged` listener
- Firebase Auth `user.reload()` to get latest verification status

**Used in**:
- `/my-boards` page
- `/profile` page
- `/wallet` page
- Any protected routes requiring authentication

**Key Features**:
- Real-time auth state monitoring
- Email verification enforcement
- Graceful error handling
- Automatic redirect for unauthenticated users

---

## LoginForm.tsx
**Purpose**: Reusable login form component with email/password fields.
**Props**:
- `email` (string): Current email value
- `password` (string): Current password value
- `isLoading` (boolean): Loading state
- `error` (string): Error message to display
- `onEmailChange` (fn): Email input change handler
- `onPasswordChange` (fn): Password input change handler
- `onSubmit` (fn): Form submission handler
- `onTogglePassword` (fn, optional): Toggle password visibility
- `showPassword` (boolean, optional): Password visibility state

**User Interactions**:
- Enter email/username
- Enter password
- Toggle password visibility (show/hide)
- Submit form with button or Enter key

**APIs Called**: None (callbacks handled by parent).

**Used in**:
- `/login` page
- Any login modal/dialog

**Key Features**:
- Email validation
- Password visibility toggle
- Keyboard submit support (Enter key)
- Disabled state during loading
- Error message display

