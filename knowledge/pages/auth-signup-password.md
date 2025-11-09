# Signup - Password Page

## Route
`/signup/password`

## Purpose
Second step of the 4-step signup flow. User creates a secure password meeting Firebase security requirements.

## Components Used
- `Input` - UI input component
- `Button` - UI button component
- `SignupProgressDots` - Shows current step (2 of 4)
- `motion` (Framer Motion) - Page transition animations
- `FiEye`, `FiEyeOff` icons - Password visibility toggles
- `FiArrowRight` icon - Next button icon

## APIs Called
- **Firebase Auth**
  - `validatePassword()` - Server-side password validation against Firebase security policies

## Data Flow
1. User enters password and confirmation
2. Real-time client-side validation checks:
   - Minimum 8 characters
   - At least 1 lowercase letter
   - At least 1 uppercase letter
   - At least 1 number
   - At least 1 special character
   - Password and confirmation match
3. On submit:
   - First: Client-side validation
   - Then: Firebase `validatePassword()` for server-side policy consistency
   - If Firebase validation fails: parse and display specific policy violations
   - If Firebase validation succeeds or network error: proceed
4. If all validation passes:
   - Store password in SignupContext
   - Navigate to `/signup/identity`

## Context Usage
- **SignupContext**:
  - Updates `signupData.password` on successful validation

## UI Features
- Live validation feedback with color-coded criteria list (green when met)
- Password visibility toggles for both fields
- Progress dots showing step 2/4
- Animated entry and button interactions
- Back link to previous step
- Form auto-submit on Enter key

## State Management
- Local state for password and confirm password inputs
- Local state for show/hide password toggles
- Local state for validation errors
- Local state for validation loading
- Real-time validation state for each criteria

## Validation
### Client-Side Checks:
- ✓ 8 characters minimum
- ✓ 1 lowercase character
- ✓ 1 uppercase character
- ✓ 1 special character
- ✓ 1 number character
- ✓ Passwords match

### Server-Side Checks (Firebase):
- Password policy compliance
- Length requirements
- Character requirements
- Fallback to client validation on network error

## Step Navigation
- Current: Step 2 of 4
- Previous: `/signup/email`
- Next: `/signup/identity`

## Error Handling
- Client-side validation errors displayed immediately
- Firebase validation errors parsed and displayed as readable messages
- Network errors gracefully handled with fallback to client validation

## Parent Layout
Inherits from `/signup/layout.tsx`

