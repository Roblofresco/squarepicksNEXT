# Financial Page: Wallet Setup - Location

**Route:** `/wallet-setup/location`

**Purpose:** First step of wallet setup. Verifies user's location via geolocation API and checks if they are in an eligible state. Users in ineligible states are blocked from proceeding.

---

## Components Used

### UI Components
- `Loader2`, `AlertTriangle` - Icons from lucide-react
- `AlertDialog`, `AlertDialogAction`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` - Alert dialog components
- `StarfieldBackground` - Animated background for modal
- `ProgressBar` - Step indicator (1 of 2)
- `Image` (from next/image) - US map outline

### Firebase
- `getFunctions`, `httpsCallable` - Firebase Cloud Functions SDK
- `onAuthStateChanged` - Auth state listener

---

## APIs Called

### Firebase Auth
1. **`onAuthStateChanged(auth, callback)`**
   - Monitors authentication state
   - Redirects to `/login` if not authenticated

### Firebase Cloud Functions
1. **`verifyLocationFromCoords(latitude, longitude)`**
   - Cloud Function: Takes coordinates and returns US state code
   - Region: `us-east1`
   - Input: `{ latitude: number, longitude: number }`
   - Output: `{ state: string }` (2-letter state code)

### Browser Geolocation API
1. **`navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options)`**
   - Requests user's device location
   - Options: `{ timeout: 10000, enableHighAccuracy: true }`
   - Triggers permission prompt in browser

---

## Data Flow

### 1. **Initial Load**
```
Page Load → Check auth state
↓
If !user → Redirect to /login
If user → Display location verification page
↓
Wait for user to click "Verify My Location"
```

### 2. **Location Verification Flow**
```
User clicks "Verify My Location"
↓
Call navigator.geolocation.getCurrentPosition()
↓
Browser prompts for location permission
↓
User grants permission → Receive coordinates
↓
Call Cloud Function: verifyLocationFromCoords({ latitude, longitude })
↓
Function returns state code (e.g., "NY")
↓
Check if state is in INELIGIBLE_STATES array
```

### 3. **Eligible State**
```
State is eligible (not in INELIGIBLE_STATES)
↓
setDeterminedState(state)
↓
Navigate to /wallet-setup/personal-info?state={state}
```

### 4. **Ineligible State**
```
State is ineligible (in INELIGIBLE_STATES)
↓
setIneligibleStateDetected(state)
↓
setShowIneligibleDialog(true)
↓
Display modal with ineligible message
↓
After 5 seconds: auto sign out and redirect to /
```

### 5. **Error Handling**
```
Geolocation Error Cases:
- PERMISSION_DENIED → Prompt to grant permission
- POSITION_UNAVAILABLE → Check GPS/location services
- TIMEOUT → Try again
- Cloud Function Error → Display error message
```

---

## Key Features

1. **Ineligible States List**
   ```typescript
   const INELIGIBLE_STATES: string[] = ['CO', 'MD', 'NE', 'ND', 'VT'];
   ```

2. **Manual Trigger**
   - User must click "Verify My Location" to initiate geolocation
   - No automatic geolocation on page load (commented out)

3. **Automatic Logout**
   - If ineligible state detected, user is automatically logged out after 5 seconds
   - Redirects to `/` after logout

4. **Progress Indicator**
   - Shows "Step 1 of 2: Location" with visual progress bar

5. **Visual Feedback**
   - Spinner during verification
   - Success message with state code when verified
   - Error messages for various failure scenarios

6. **State Passed via URL**
   - Verified state is passed as query parameter to next step
   - Example: `/wallet-setup/personal-info?state=NY`

---

## State Management

### Local State
```typescript
const [user, setUser] = useState<User | null>(null);
const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);
const [isAuthLoading, setIsAuthLoading] = useState(true);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
const [determinedState, setDeterminedState] = useState<string | null>(null);
const [ineligibleStateDetected, setIneligibleStateDetected] = useState<string | null>(null);
const [showIneligibleDialog, setShowIneligibleDialog] = useState(false);
```

---

## Security Considerations

- Cloud Function must validate coordinates and return accurate state
- Ineligible state check happens client-side and should also be enforced server-side
- User is logged out if ineligible, preventing further access
- Email verification not required at this step (checked in personal-info step)

---

## Edge Cases Handled

1. **Browser doesn't support geolocation** → Error message
2. **User denies location permission** → Prompt to enable in settings
3. **Location unavailable** → Check GPS/services
4. **Timeout** → Retry message
5. **Invalid state returned** → Error handling
6. **User closes permission prompt** → No action, can retry

