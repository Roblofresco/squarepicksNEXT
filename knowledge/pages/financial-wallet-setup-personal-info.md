# Financial Page: Wallet Setup - Personal Info

**Route:** `/wallet-setup/personal-info?state={STATE_CODE}`

**Purpose:** Second and final step of wallet setup. Collects user's personal information (name, phone, address) and saves it to Firestore. Completes wallet setup by setting `hasWallet: true`.

---

## Components Used

### UI Components
- `Button`, `Input` - Form components
- `Loader2` - Loading spinner from lucide-react
- `ProgressBar` - Step indicator (2 of 2)
- `PersonalInfoForm` - Custom form component for personal information

### Firebase
- `onAuthStateChanged` - Auth state listener
- `doc`, `setDoc`, `getDoc`, `serverTimestamp` - Firestore operations

### Navigation
- `useRouter` - Next.js navigation
- `useSearchParams` - URL search params (for state parameter)
- `Suspense` - React suspense for loading

---

## APIs Called

### Firebase Auth
1. **`onAuthStateChanged(auth, callback)`**
   - Monitors authentication state
   - Redirects to `/login` if not authenticated
   - Redirects to `/verify-email` if email not verified

### Firebase Firestore
1. **`getDoc(doc(db, 'users', currentUser.uid))`**
   - Fetches existing user document to pre-fill form
   - Used during initial load

2. **`setDoc(doc(db, 'users', user.uid), { ... }, { merge: true })`**
   - Updates top-level user document with:
     - `firstName`
     - `lastName`
     - `email`
     - `state` (from URL param)
     - `hasWallet: true`
     - `updated_at: serverTimestamp()`

3. **`setDoc(doc(db, 'users', user.uid, 'address', 'primary'), { ... }, { merge: true })`**
   - Creates/updates address subdocument with:
     - `street`
     - `city`
     - `postalCode`
     - `state`
     - `phone`
     - `updated_at: serverTimestamp()`

---

## Data Flow

### 1. **Pre-Submit Validation**
```
Page Load
↓
Extract state from URL query param (?state=XX)
↓
If !state || state.length !== 2 → Redirect to /wallet-setup/location
↓
Check auth state
↓
If !user → Redirect to /login
If emailVerified === false → Redirect to /verify-email
↓
Fetch existing user data to pre-fill form
↓
Display form
```

### 2. **Form Pre-fill**
```
Fetch user document from Firestore
↓
Extract existing fields:
- email (from Auth or Firestore)
- firstName, lastName
- phone, street, city, postalCode
↓
Pre-populate form fields with existing data
```

### 3. **Phone Number Formatting**
```
User types phone number
↓
Strip non-digit characters
↓
Limit to 10 digits
↓
Format as (XXX) XXX-XXXX
↓
Display formatted value in input
```

### 4. **Form Submission**
```
User clicks Submit
↓
Validate all fields are filled
↓
Check state parameter exists
↓
Check user session exists
↓
Write to Firestore:
  1. Update user document (top-level)
  2. Create/update address subdocument
↓
On success → Navigate to /wallet
On error → Display error message
```

---

## Key Features

1. **Two-Collection Write Strategy**
   - Top-level user document: Public fields accessible by Firestore rules
   - Address subcollection: Private fields only accessible by owner

2. **Phone Number Auto-Formatting**
   - Automatically formats as user types
   - Enforces (XXX) XXX-XXXX format
   - Limits to 10 digits

3. **State Verification**
   - State must be passed via URL parameter
   - If missing, redirects to location step
   - State is saved to both user document and address document

4. **Email Verification Guard**
   - Requires verified email before allowing wallet setup
   - Redirects to `/verify-email` if not verified

5. **Progress Indicator**
   - Shows "Step 2 of 2: Personal Information"
   - Visual progress bar

6. **Form Pre-fill**
   - Loads existing user data if available
   - Allows users to update information

7. **Merge Strategy**
   - Uses `{ merge: true }` to preserve existing fields
   - Safely updates only specified fields

---

## State Management

### Local State
```typescript
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
const [formData, setFormData] = useState<FormData>({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  street: '',
  city: '',
  postalCode: '',
});
const [verifiedState, setVerifiedState] = useState<string | null>(null);
```

---

## Security Considerations

- Firestore rules must allow owner to write to:
  - `users/{userId}` (specific fields only: firstName, lastName, email, state, hasWallet, updated_at)
  - `users/{userId}/address/primary` (full access for owner)

- Email verification required before wallet setup
- State parameter validated before submission
- User session verified at submission time

---

## Form Fields

### Top-Level User Document
- `firstName` (string)
- `lastName` (string)
- `email` (string, pre-filled from auth)
- `state` (string, from URL param)
- `hasWallet` (boolean, set to true)
- `updated_at` (timestamp)

### Address Subdocument
- `street` (string)
- `city` (string)
- `postalCode` (string)
- `state` (string, from URL param)
- `phone` (string, formatted)
- `updated_at` (timestamp)

---

## Validation Rules

1. All fields required (checked before submit)
2. State must be 2-character code from URL
3. Phone number auto-formatted to 10 digits
4. User must be authenticated
5. Email must be verified

---

## Success Flow

```
Form submitted successfully
↓
hasWallet set to true in Firestore
↓
Navigate to /wallet
↓
User sees wallet dashboard with balance
```

