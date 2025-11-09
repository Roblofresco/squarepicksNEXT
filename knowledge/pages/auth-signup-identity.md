# Signup - Identity Page

## Route
`/signup/identity`

## Purpose
Third step of the 4-step signup flow. Collects user's legal name and date of birth for identity verification and age validation.

## Components Used
- `Input` - UI input component
- `Button` - UI button component
- `SignupProgressDots` - Shows current step (3 of 4)
- `motion` (Framer Motion) - Page transition animations
- `FiUser` icon - Name field icon
- `FiCalendar` icon - Date of birth field icon
- `FiArrowRight` icon - Next button icon

## APIs Called
None (client-side validation only)

## Data Flow
1. User enters first name, last name, and date of birth
2. Date of birth auto-formats to MM/DD/YYYY as user types:
   - Strips non-numeric characters
   - Inserts slashes at positions 2 and 4
   - Limits to 10 characters total
3. On submit validation:
   - All fields required
   - Date format must be MM/DD/YYYY
   - Date must be valid (not invalid month/day combination)
   - User must be at least 18 years old
4. If validation passes:
   - Store firstName, lastName, dob in SignupContext
   - Navigate to `/signup/username`

## Context Usage
- **SignupContext**:
  - Reads `signupData.firstName`, `lastName`, `dob` to pre-fill if user returns
  - Updates these fields on successful validation

## Libraries Used
- **date-fns**:
  - `parse()` - Parses MM/DD/YYYY string to Date object
  - `isValid()` - Validates the parsed date
  - `isBefore()` - Compares dates for age check
  - `subYears()` - Calculates date 18 years ago

## UI Features
- Auto-formatting date input (MM/DD/YYYY)
- Icon-prefixed input fields
- Progress dots showing step 3/4
- Animated entry and button interactions
- Back link to previous step
- Form auto-submit on Enter key
- Instructional text: "Please make sure your details match exactly what's on your photo I.D. or passport."

## State Management
- Local state for firstName, lastName, dob inputs
- Local state for validation error
- Shared context for signup data persistence

## Validation
### First Name:
- Required
- Must not be empty after trimming

### Last Name:
- Required
- Must not be empty after trimming

### Date of Birth:
- Required
- Must match format MM/DD/YYYY
- Must be a valid calendar date
- User must be 18+ years old

## Step Navigation
- Current: Step 3 of 4
- Previous: `/signup/password`
- Next: `/signup/username`

## Age Verification
Calculates if user is 18+ by:
1. Getting current date
2. Subtracting 18 years
3. Checking if birth date is before that threshold
4. Displays error if under 18

## Parent Layout
Inherits from `/signup/layout.tsx`

