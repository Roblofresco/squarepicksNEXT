# Profile Page: Personal Details

**Route:** `/profile/settings/personal-details` (also available at `/wallet-setup/personal-info`)

**Purpose:** Allows users to view and edit their personal information including name, date of birth, and address details.

---

## Components Used

### UI Components
- `Input` - Form inputs
- `ArrowLeft`, `User`, `Calendar`, `Home`, `Save`, `Loader2`, `AlertCircle` - Icons from lucide-react

---

## APIs Called

### Firebase Auth
1. **`onAuthStateChanged(auth, callback)`**
   - Monitors authentication state
   - Redirects to login if not authenticated

2. **`signOut(auth)`**
   - Called if user's age < 21
   - Automatically logs out underage users

### Firebase Firestore
1. **`getDoc(doc(db, 'users', user.uid))`**
   - Fetches user's personal details
   - Returns: `firstName`, `lastName`, `dob`, `street`, `city`, `state`, `postalCode`

2. **`updateDoc(doc(db, 'users', user.uid), dataToUpdate)`**
   - Updates only changed fields
   - Uses partial update (not merge)

---

## Data Flow

### 1. **Initial Load**
```
Page Load
↓
Check auth state
↓
If !user → Redirect to /login
↓
Fetch user document from Firestore
↓
Extract personal details:
  - firstName, lastName
  - dob (date of birth)
  - street, city, state, postalCode
↓
Pre-fill form inputs with existing data
```

### 2. **Form Input**
```
User modifies any field
↓
Update corresponding input state
↓
Clear success/error messages
↓
Track changes from original data
```

### 3. **Form Submission**
```
User clicks "Save Changes"
↓
Trim all input values
↓
Validate required fields (firstName, lastName)
↓
Validate age (must be 21+):
  - Calculate age from DOB
  - If < 21 → Sign out user & redirect to login
↓
Compare with original data
↓
If no changes → Do nothing
If changes detected:
  - Build partial update object
  - Call updateDoc() with only changed fields
  - Update local details state
  - Show success message
```

---

## Key Features

### 1. **Age Validation**
- Enforces minimum age of 21
- Calculates age from date of birth
- Considers month and day for accurate age
- **Automatic logout if underage:**
  - Signs out user
  - Redirects to login
  - Silent operation (no error shown)

### 2. **Partial Updates**
- Only sends changed fields to Firestore
- Compares current inputs with original data
- Builds `dataToUpdate` object with only differences
- Efficient database operations

### 3. **Form Pre-fill**
- Loads existing data on mount
- Falls back to empty strings if no data exists
- Allows creation of new personal details

### 4. **Required Fields**
- First Name (required)
- Last Name (required)
- Other fields optional

### 5. **Address Fields**
- Street Address
- City
- State / Province
- Postal / Zip Code

---

## State Management

### Local State
```typescript
const [user, setUser] = useState<FirebaseUser | null>(null);
const [details, setDetails] = useState<PersonalDetailsData | null>(null);

// Individual input states
const [firstNameInput, setFirstNameInput] = useState('');
const [lastNameInput, setLastNameInput] = useState('');
const [dobInput, setDobInput] = useState('');
const [streetInput, setStreetInput] = useState('');
const [cityInput, setCityInput] = useState('');
const [stateInput, setStateInput] = useState('');
const [postalCodeInput, setPostalCodeInput] = useState('');

const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);
```

---

## Personal Details Type

```typescript
interface PersonalDetailsData {
  firstName: string;
  lastName: string;
  dob: string; // Date of Birth
  street: string;
  city: string;
  state: string;
  postalCode: string;
}
```

---

## Age Calculation Logic

```typescript
if (currentInputs.dob) {
  const birthDate = new Date(currentInputs.dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 21) {
    await auth.signOut();
    return; // Stop processing
  }
}
```

---

## Validation Rules

1. **Required Fields:**
   - First Name (cannot be empty)
   - Last Name (cannot be empty)

2. **Age Requirement:**
   - Must be 21 or older
   - Calculated from DOB field
   - Enforced on save

3. **Optional Fields:**
   - DOB
   - Street, City, State, Postal Code

---

## Visual Design

### Form Layout
- 2-column grid (responsive)
- First/Last Name side-by-side
- DOB full width
- Street Address full width
- City/State side-by-side
- Postal Code full width

### Input Styling
- White background
- Gray borders
- Focus ring (accent-1)
- Icons in inputs (User, Calendar, Home)
- Placeholder text

### Page Background
- Gradient: background-primary → #eeeeee

### Save Button
- Accent-1 background
- Hover effect
- Loading spinner
- Active/focus scale effects

---

## Error Handling

### Load Errors
- "Failed to load your personal details..."
- Logs to console
- Falls back to empty form

### Save Errors
- "Failed to update details. Please try again."
- Logs to console
- Shows error alert

### Validation Errors
- "First name and last name are required."
- Shown in red alert

### Age Restriction
- Silent sign out
- No error message shown
- User redirected to login

---

## Success Messages

- "Personal details updated successfully!"
- Shown in green alert
- Appears after successful save

---

## Loading States

1. **Initial Page Load**
   - Full-page spinner

2. **Saving Changes**
   - Button disabled
   - Button shows spinner
   - Button text: "Saving..."

---

## Navigation

### Back to Settings
- Arrow left icon
- Text: "Back to Settings"
- Routes to: `/profile/settings`
- Top-left corner

### Symmetry Placeholder
- Empty div on right side
- Matches back button width
- Centers page title

---

## Security Considerations

- Only user can edit their own details
- Firestore rules must enforce user access
- Age validation enforced before save
- Automatic logout for underage users
- No personal data exposed in URLs

---

## Change Detection

```typescript
const dataToUpdate: Partial<PersonalDetailsData> = {};
let hasChanges = false;

(Object.keys(currentInputs) as Array<keyof PersonalDetailsData>).forEach(key => {
  if (currentInputs[key] !== details[key]) {
    dataToUpdate[key] = currentInputs[key];
    hasChanges = true;
  }
});

if (!hasChanges) {
  return; // No need to save
}
```

---

## Form Submission Flow

```
User clicks "Save Changes"
↓
Validate required fields
↓
Validate age (21+)
↓
Trim all inputs
↓
Compare with original data
↓
Build partial update object
↓
Call updateDoc() with changes
↓
Update local state
↓
Show success message
```

---

## Input Icons

- **User Icon:** First Name, Last Name
- **Calendar Icon:** Date of Birth
- **Home Icon:** Street Address
- **No Icon:** City, State, Postal Code (cleaner look)

---

## Accessibility

- Labels for all form fields
- Error messages announced
- Screen reader-friendly structure
- Keyboard navigation support
- Focus management

---

## Field Specifications

1. **First Name**
   - Type: text
   - Icon: User
   - Required: Yes

2. **Last Name**
   - Type: text
   - Icon: User
   - Required: Yes

3. **Date of Birth**
   - Type: date
   - Icon: Calendar
   - Required: No
   - Used for age validation

4. **Street Address**
   - Type: text
   - Icon: Home
   - Required: No

5. **City**
   - Type: text
   - Icon: None
   - Required: No

6. **State / Province**
   - Type: text
   - Icon: None
   - Required: No

7. **Postal / Zip Code**
   - Type: text
   - Icon: None
   - Required: No

