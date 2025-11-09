# Signup - Username Page

## Route
`/signup/username`

## Purpose
Final step (4 of 4) of signup flow. User creates a unique username, accepts terms, and completes account creation with Firebase Auth and Firestore.

## Components Used
- `Input` - UI input component
- `Button` - UI button component
- `SignupProgressDots` - Shows current step (4 of 4)
- `motion` (Framer Motion) - Page transition animations
- `MailCheck` icon - Success screen icon
- `Loader2` icon - Loading spinner
- `CheckCircle` icon - Username available indicator
- `XCircle` icon - Username taken indicator
- `FiCheck` icon - Submit button icon

## APIs Called
### Client-Side API:
- `POST /api/check-username` - Checks if username is already taken
  - Request: `{ username: string }`
  - Response: `{ exists: boolean }`
  - Debounced by 500ms

### Firebase Services:
- **Firebase Auth**:
  - `createUserWithEmailAndPassword()` - Creates new auth account
  - `sendEmailVerification()` - Sends verification email with actionCodeSettings
  - `signOut()` - Signs user out immediately after creation
  
- **Firestore**:
  - `setDoc()` - Creates user document in `users` collection
  - Document structure:
    ```typescript
    {
      email: string (lowercase),
      display_name: string (username),
      created_at: serverTimestamp(),
      hasWallet: false,
      balance: 0
    }
    ```

## Data Flow
1. User enters username (3-20 characters, letters/numbers only)
2. Real-time username availability check (debounced):
   - After 500ms delay, calls `/api/check-username`
   - Shows checking indicator, then checkmark or X
3. User accepts terms and conditions checkbox
4. On submit:
   - Validates all signup data exists
   - Validates username length (3+ chars)
   - Validates terms accepted
   - Creates Firebase Auth user
   - Sends verification email pointing to `http://localhost:3000/email-verified`
   - Creates Firestore user document
   - Signs user out immediately
   - Shows success message for 4 seconds
   - Redirects to `/login`

## Context Usage
- **SignupContext**:
  - Reads `signupData.email`, `password` for account creation
  - Reads `signupData.username`, `termsAccepted` to pre-fill if user returns
  - Full signup data required at this step

## UI Features
- Real-time username availability checking with visual indicators
- Automatic space removal from username input
- Terms acceptance checkbox with links to terms and privacy pages
- Progress dots showing step 4/4
- Two-screen flow:
  1. Input screen with form
  2. Success screen with countdown to redirect
- Back link to previous step
- Form auto-submit on Enter key

## State Management
- Local state for username input
- Local state for termsAccepted checkbox
- Local state for validation errors
- Local state for submission loading
- Local state for success screen display
- Local state for username availability (null | true | false)
- Local state for checking username status

## Validation
### Username:
- Required
- 3-20 characters
- Letters and numbers only (no spaces)
- Must be unique (checked via API)

### Terms:
- Must be accepted

### Previous Steps:
- Email and password must exist in context
- All identity data should be present

## Success Flow
1. Account created successfully
2. Verification email sent
3. User signed out
4. Success screen displayed showing:
   - Success icon
   - Confirmation message
   - User's email address
   - Redirect countdown
5. After 4 seconds: Redirect to `/login`

## Error Handling
- `auth/email-already-in-use`: "This email is already registered. Please try logging in or use a different email."
- Generic errors: Display error message from Firebase
- Keep loading state active until error or redirect
- Username taken: Real-time feedback with X icon

## Step Navigation
- Current: Step 4 of 4 (Final)
- Previous: `/signup/identity`
- Next: `/login` (after success)

## Email Verification
- Sends verification email with actionCodeSettings:
  ```typescript
  {
    url: 'http://localhost:3000/email-verified',
    handleCodeInApp: true
  }
  ```
- User must verify email before being able to access protected pages
- Verification link handled by `/email-verified` page

## Parent Layout
Inherits from `/signup/layout.tsx`

## Toast Notifications
- Success: "Signup successful! Please check your email to verify your account before logging in."
- Duration: 4000ms

