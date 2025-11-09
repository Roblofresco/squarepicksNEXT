# User & Auth Functions Documentation

## Overview
This directory contains documentation for user management and authentication validation functions including profile updates, location verification, and uniqueness checks for usernames and emails.

## Functions

### 1. updateUserProfile
**File:** [updateUserProfile.md](./updateUserProfile.md)

Updates user profile information including personal details (KYC data) and PayPal email.

**Key Features:**
- Update personal information (name, DOB, phone, address)
- Store KYC data for compliance
- Update PayPal email for withdrawals
- Validate all input data
- Auto-complete KYC when all fields provided

**Status:** Expected implementation (Cloud Function or API Route)

---

### 2. verifyLocationFromCoords
**File:** [verifyLocationFromCoords.md](./verifyLocationFromCoords.md)

Verifies user's physical location using GPS coordinates and Google Geocoding API.

**Key Features:**
- Reverse geocode coordinates to state
- Validate against allowed jurisdictions
- Update user's verified location status
- Gaming compliance and state restrictions
- Store verified state for future reference

**Status:** Expected implementation (Cloud Function or API Route)

---

### 3. checkUsernameUnique
**File:** [checkUsernameUnique.md](./checkUsernameUnique.md)

Validates whether a username is available (unique) in Firestore.

**Key Features:**
- Check username availability
- Validate username format (3-20 chars, alphanumeric + underscore)
- Check against reserved usernames
- Optional profanity filter
- Real-time validation during signup

**Status:** Expected implementation (Cloud Function or API Route)

---

### 4. checkEmailUnique
**File:** [checkEmailUnique.md](./checkEmailUnique.md)

Validates whether an email is available (unique) in Firestore users collection.

**Key Features:**
- Check email availability in Firestore
- Validate email format
- Case-insensitive uniqueness
- Complement to Firebase Auth check
- Real-time validation during signup

**Status:** Expected implementation (Cloud Function or API Route)

---

### 5. checkAuthEmailExists
**File:** [checkAuthEmailExists.md](./checkAuthEmailExists.md)

Checks whether an email exists in Firebase Authentication.

**Key Features:**
- Check email availability in Firebase Auth
- Validate email format
- Handle Firebase Auth error codes
- Pre-validation before signup
- Complement to Firestore check

**Status:** Expected implementation (Cloud Function or API Route)

---

## Signup Flow

### Username/Email Validation
```
1. User enters username/email
   ↓
2. Client debounces input (500ms)
   ↓
3. Check uniqueness
   - checkUsernameUnique (for username)
   - checkEmailUnique + checkAuthEmailExists (for email)
   ↓
4. Display availability feedback
   ↓
5. User proceeds if available
```

## Profile Update Flow

### Update Personal Information
```
1. User updates profile fields
   ↓
2. updateUserProfile
   - Validate all inputs
   - Update Firestore user document
   - Check KYC completion
   ↓
3. If KYC complete:
   - Set kycVerified: true
   - Enable wallet features
```

## Location Verification Flow

### Initial Verification
```
1. User grants location permission
   ↓
2. Get GPS coordinates
   ↓
3. verifyLocationFromCoords
   - Reverse geocode to state
   - Check against allowed states
   - Update user document
   ↓
4. If allowed state:
   - Enable deposits/withdrawals
   
   If restricted state:
   - Display error message
```

## Validation Rules

### Username
- **Length:** 3-20 characters
- **Characters:** Letters, numbers, underscore only
- **Case:** Case-insensitive (stored lowercase)
- **Reserved:** admin, support, help, official, etc.

### Email
- **Format:** Standard email format (RFC 5321)
- **Length:** Max 254 characters
- **Case:** Case-insensitive (stored lowercase)
- **Uniqueness:** Must be unique in both Auth and Firestore

### Personal Information
- **Full Name:** 2-100 characters, letters/spaces/hyphens
- **Date of Birth:** YYYY-MM-DD format, must be 18+
- **Phone:** E.164 format recommended (+15551234567)
- **Address:** Complete US address required for KYC
- **PayPal Email:** Valid email format

### Location
- **Coordinates:** Valid latitude (-90 to 90) and longitude (-180 to 180)
- **Country:** Must be United States
- **State:** Must be in allowed states list

## KYC Requirements

### Required Fields
- Full name
- Date of birth (18+)
- Phone number
- Complete address (street, city, state, zip, country)

### Auto-Verification
When all KYC fields provided:
```javascript
{
  kycVerified: true,
  kycVerifiedAt: serverTimestamp()
}
```

### Benefits
- Required for wallet initialization
- Required for deposits and withdrawals
- Required for paid board entries

## State Restrictions

### Allowed States (Example)
Most US states allowed, excluding:
- States with restrictive gaming laws
- States without proper licensing

### Location Verification
- Required before first deposit
- Periodic re-verification (e.g., every 30 days)
- Re-verification if state changes

## Related Documentation

### Data Models
- [Users](../../data-models/users.md) - User document structure

### Other Functions
- [requestWithdrawal](../withdrawals/requestWithdrawal.md) - Requires PayPal email

### Pages
- Signup flow pages (`/signup/*`)
- Profile settings pages (`/profile/settings/*`)
- Wallet setup pages (`/wallet-setup/*`)

## Security Considerations

### Authorization
- Users can only update their own profiles
- Admin override capability
- User ID verified against auth token

### Input Validation
- All inputs validated server-side
- SQL injection prevention (Firestore NoSQL)
- XSS prevention through sanitization

### Privacy
- Personal data encrypted at rest
- Minimal logging of PII
- Access restricted by Firestore rules

### Rate Limiting
- Limit validation check requests
- Prevent account enumeration
- Throttle during signup

## Testing

### Username/Email Validation
- Test with valid and invalid formats
- Test with existing values
- Test reserved words
- Test profanity filter
- Test case sensitivity
- Test length boundaries

### Profile Updates
- Test with valid data
- Test age validation (17, 18, 19 years old)
- Test state code validation
- Test partial updates
- Test KYC auto-completion

### Location Verification
- Test with coordinates in various states
- Test with restricted states
- Test with invalid coordinates
- Test with coordinates outside US
- Test API failure scenarios

## Client-Side Integration

### Debounced Validation
```javascript
let checkTimeout;
function checkAvailability(value, checkFunction) {
  clearTimeout(checkTimeout);
  checkTimeout = setTimeout(async () => {
    const result = await checkFunction(value);
    displayFeedback(result);
  }, 500);
}
```

### Visual Feedback
- ✓ Green checkmark: Available
- ✗ Red X: Taken/Invalid
- ◯ Gray: Checking
- Error message: Specific validation error

## Environment Variables

### Google Maps (Location Verification)
- `GOOGLE_MAPS_API_KEY` - Geocoding API key

### Firebase Admin (Auth Checks)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Business Rules

### Age Restriction
- Must be 18+ years old
- Enforced at DOB validation
- Required for legal compliance

### Username Changes
- May be allowed (with limits)
- Check availability before change
- May limit frequency

### Email Changes
- Requires verification
- Old email released
- New email must be unique

### Location Updates
- Re-verification on location change
- Grace period for travel
- Admin override available

