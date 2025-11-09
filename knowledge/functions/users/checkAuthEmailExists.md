# checkAuthEmailExists Function

## Overview
Checks whether an email address already exists in Firebase Authentication. Used during signup to prevent duplicate accounts and provide user-friendly error messages before attempting account creation.

## Location
Expected: Firebase Cloud Function or Next.js API Route
Path: `functions/src/users/checkAuthEmailExists` or `/api/users/check-auth-email`

## Function Type
Firebase Cloud Function (Callable) or Next.js API Route

## Authentication
Optional (can be called during signup before auth)

## Purpose
- Check if email exists in Firebase Auth
- Prevent duplicate Firebase Auth accounts
- Provide pre-validation before signup
- Complement Firestore email uniqueness check
- Improve user experience with early feedback

## Request Parameters

### Input Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Email address to check |

### Example Request
```json
{
  "email": "user@example.com"
}
```

## Response

### Success Response (Exists)
```json
{
  "exists": true,
  "email": "user@example.com",
  "message": "Email is already registered"
}
```

### Success Response (Available)
```json
{
  "exists": false,
  "email": "user@example.com",
  "message": "Email is available"
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `exists` | boolean | Whether email exists in Firebase Auth |
| `email` | string | Normalized email checked |
| `message` | string | Human-readable result message |

### Error Responses

#### 400 Bad Request - Missing Email
```json
{
  "error": "Email is required"
}
```

#### 400 Bad Request - Invalid Format
```json
{
  "error": "Invalid email format"
}
```

#### 500 Internal Server Error - Auth Error
```json
{
  "error": "Failed to check email availability"
}
```

## Process Flow

### Step 1: Input Validation
- Verify email is provided
- Validate email format
- Normalize email (lowercase, trim)

### Step 2: Normalize Email
```javascript
const normalizedEmail = email.toLowerCase().trim();
```

### Step 3: Validate Email Format
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(normalizedEmail)) {
  throw new Error('Invalid email format');
}
```

### Step 4: Query Firebase Auth
```javascript
try {
  const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
  // User exists
  return { exists: true };
} catch (error) {
  if (error.code === 'auth/user-not-found') {
    // User does not exist
    return { exists: false };
  }
  // Other error
  throw error;
}
```

### Step 5: Return Existence Status
- Return true if user found
- Return false if user not found
- Throw error for other failures

## Firebase Admin Auth API

### Get User By Email
```javascript
import { getAuth } from 'firebase-admin/auth';

const auth = getAuth();

try {
  const userRecord = await auth.getUserByEmail(email);
  console.log('User found:', userRecord.uid);
  return true;
} catch (error) {
  if (error.code === 'auth/user-not-found') {
    console.log('User not found');
    return false;
  }
  console.error('Error checking email:', error);
  throw error;
}
```

### User Record Structure
If user exists, Firebase returns:
```javascript
{
  uid: 'abc123xyz456',
  email: 'user@example.com',
  emailVerified: false,
  displayName: null,
  photoURL: null,
  disabled: false,
  metadata: {
    creationTime: '2025-01-01T00:00:00.000Z',
    lastSignInTime: '2025-01-15T12:00:00.000Z'
  },
  providerData: [...]
}
```

## Email Validation Rules

### Format Requirements
Same as `checkEmailUnique`:
- Must contain exactly one @ symbol
- Must have domain with TLD
- No leading/trailing whitespace
- Valid characters only

### Format Regex
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

### Normalization
```javascript
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}
```

## Error Handling

### Firebase Auth Error Codes
| Error Code | Description | Handling |
|------------|-------------|----------|
| `auth/user-not-found` | Email not registered | Return false (available) |
| `auth/invalid-email` | Invalid email format | Return validation error |
| `auth/too-many-requests` | Rate limited | Return error, ask to retry |
| `auth/internal-error` | Firebase service error | Return error, retry |

### Error Handler
```javascript
async function checkAuthEmailExists(email) {
  try {
    await admin.auth().getUserByEmail(email);
    return { exists: true, email };
  } catch (error) {
    // Expected error: user not found
    if (error.code === 'auth/user-not-found') {
      return { exists: false, email };
    }
    
    // Invalid email format
    if (error.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'Invalid email format');
    }
    
    // Rate limiting
    if (error.code === 'auth/too-many-requests') {
      throw new HttpsError('resource-exhausted', 'Too many requests. Please try again later.');
    }
    
    // Other errors
    console.error('Error checking email:', error);
    throw new HttpsError('internal', 'Failed to check email availability');
  }
}
```

## Firestore vs Firebase Auth

### Difference from checkEmailUnique
| Function | Checks | Use Case |
|----------|--------|----------|
| `checkEmailUnique` | Firestore users collection | User profile data |
| `checkAuthEmailExists` | Firebase Auth | Authentication system |

### Why Check Both?
- Firebase Auth: Handles authentication and email verification
- Firestore: Stores user profile data
- Both must be in sync
- Account creation requires both

### Complete Email Validation
```javascript
async function isEmailFullyAvailable(email) {
  // Check Firestore
  const firestoreAvailable = await checkEmailUnique(email);
  
  // Check Firebase Auth
  const authResult = await checkAuthEmailExists(email);
  const authAvailable = !authResult.exists;
  
  // Email available only if both are available
  return firestoreAvailable && authAvailable;
}
```

## Business Rules

### Uniqueness Enforcement
- Firebase Auth enforces email uniqueness automatically
- One email = one auth account
- Cannot create duplicate email accounts

### Disabled Accounts
- Disabled accounts still occupy email
- `getUserByEmail` returns disabled accounts
- May want to check `disabled` flag

```javascript
const userRecord = await admin.auth().getUserByEmail(email);
if (userRecord.disabled) {
  // Account exists but is disabled
  return { exists: true, disabled: true };
}
```

### Email Verification
- Unverified emails still occupy slot
- No automatic cleanup
- Consider verification status

```javascript
const userRecord = await admin.auth().getUserByEmail(email);
return {
  exists: true,
  verified: userRecord.emailVerified
};
```

## Security Considerations

### Rate Limiting
- Limit check requests per IP
- Prevent account enumeration
- Firebase Auth has built-in rate limiting

### Information Disclosure
- Don't reveal account details
- Simply state "exists" or "available"
- Prevent enumeration attacks

### Privacy
- Don't log full email addresses
- Hash or partial mask in logs
- Comply with privacy regulations

## Performance Considerations

### Caching
- Consider caching negative results briefly
- Positive results (exists) should not be cached long
- Cache invalidation on account creation

### Rate Limiting
- Firebase Admin SDK has quotas
- Implement application-level throttling
- Debounce client-side requests

## Client-Side Integration

### Real-Time Validation
```javascript
// Combined check (Auth + Firestore)
async function checkEmailAvailability(email) {
  // Check both sources
  const [authResult, firestoreResult] = await Promise.all([
    fetch('/api/users/check-auth-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' }
    }),
    fetch('/api/users/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' }
    })
  ]);
  
  const authData = await authResult.json();
  const firestoreData = await firestoreResult.json();
  
  const available = !authData.exists && firestoreData.available;
  return { available };
}
```

### Visual Feedback
- Show loading indicator while checking
- Display availability status
- Show specific error if email taken
- Suggest login if email exists

## Logging

### Logged Information
- Email check requests (count)
- Validation failures
- Rate limit errors
- Partial email (e.g., "u***@example.com")

### Not Logged
- Full email address
- User UID (if found)
- Full user record details

## Notifications

Generally no notifications for email checks, but if account exists:

### Account Exists Message
```
"An account with this email already exists. Please log in or use a different email."
```

### Disabled Account Message
```
"This account has been disabled. Please contact support for assistance."
```

## Used By
- Signup email step (`src/app/signup/email/page.tsx`)
- Email change flow
- Password reset validation
- Mobile app signup

## Related Functions
- `checkEmailUnique`: Checks Firestore users collection
- `checkUsernameUnique`: Checks username uniqueness

## Related Documentation
- [Data Model: Users](../../data-models/users.md)
- [Function: checkEmailUnique](./checkEmailUnique.md)
- [Firebase Admin Auth API](https://firebase.google.com/docs/auth/admin/manage-users)

## Implementation Notes

### Firebase Admin SDK Setup
```javascript
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const auth = getAuth();
```

### Environment Variables
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### Example Implementation
```javascript
export async function checkAuthEmailExists(email) {
  // Validate and normalize
  const normalizedEmail = email.toLowerCase().trim();
  
  if (!normalizedEmail) {
    throw new Error('Email is required');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error('Invalid email format');
  }
  
  // Check Firebase Auth
  try {
    const userRecord = await admin.auth().getUserByEmail(normalizedEmail);
    
    return {
      exists: true,
      email: normalizedEmail,
      message: 'Email is already registered',
      emailVerified: userRecord.emailVerified,
      disabled: userRecord.disabled
    };
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return {
        exists: false,
        email: normalizedEmail,
        message: 'Email is available'
      };
    }
    
    // Handle other errors
    console.error('Error checking email:', error);
    throw error;
  }
}
```

### Testing
- Test with existing Firebase Auth emails
- Test with non-existent emails
- Test with invalid email formats
- Test with disabled accounts
- Test rate limiting behavior
- Mock Firebase Admin SDK in tests

### Future Enhancements
- Return email verification status
- Check account disabled status
- Return account creation date
- Support bulk email checks
- Enhanced error messages with recovery options

