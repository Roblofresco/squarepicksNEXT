# Signup - Email Page

## Route
`/signup/email`

## Purpose
First step of the 4-step signup flow. Collects and validates user's email address.

## Components Used
- `Input` - UI input component
- `Button` - UI button component  
- `SignupProgressDots` - Shows current step (1 of 4)
- `motion` (Framer Motion) - Page transition animations

## APIs Called
None (client-side validation only)

## Data Flow
1. User enters email address
2. Client-side validation on submit:
   - Email format validation using regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
3. If valid:
   - Store email in SignupContext
   - Navigate to `/signup/password`
4. If invalid:
   - Display error: "Please enter a valid email address."

## Context Usage
- **SignupContext**: 
  - Reads `signupData.email` to pre-fill if user returns
  - Updates `signupData.email` on successful validation

## UI Features
- Animated entry with Framer Motion
- Progress dots showing step 1/4
- Next button with hover/tap animations
- Form auto-submit on Enter key

## State Management
- Local state for email input
- Local state for validation error
- Shared context for signup data persistence

## Validation
- Email format must match standard pattern
- Required field

## Step Navigation
- Current: Step 1 of 4
- Next: `/signup/password`
- Back: User can navigate away via browser back button

## Parent Layout
Inherits from `/signup/layout.tsx` which provides:
- Consistent signup page styling
- Background elements
- Container structure

