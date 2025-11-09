# checkEmailUnique Function

## Overview
Validates whether an email address is available (unique) in the Firestore users collection. Used during signup and email change flows to ensure emails are unique. Works in conjunction with Firebase Auth email uniqueness.

## Location
Expected: Firebase Cloud Function or Next.js API Route
Path: `functions/src/users/checkEmailUnique` or `/api/users/check-email`

## Function Type
Firebase Cloud Function (Callable) or Next.js API Route

## Authentication
Optional (can be called during signup before auth)

## Purpose
- Check if email is available in Firestore
- Complement Firebase Auth email uniqueness
- Validate email format
- Provide real-time feedback during signup
- Support email change validation

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

### Success Response (Available)
```json
{
  "available": true,
  "email": "user@example.com",
  "message": "Email is available"
}
```

### Success Response (Taken)
```json
{
  "available": false,
  "email": "user@example.com",
  "message": "Email is already registered"
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `available` | boolean | Whether email is available |
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

### Step 4: Query Firestore
```javascript
const userSnapshot = await db.collection('users')
  .where('email', '==', normalizedEmail)
  .limit(1)
  .get();

const available = userSnapshot.empty;
```

### Step 5: Return Availability
- Return true if no matches found
- Return false if email exists in Firestore

**Note:** This does NOT check Firebase Auth. Use `checkAuthEmailExists` for that.

## Email Validation Rules

### Format Requirements
- Must contain exactly one @ symbol
- Must have domain with TLD
- No leading/trailing whitespace
- Valid characters only

### Format Regex
```javascript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// More comprehensive regex (optional)
const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
```

### Length Requirements
- Maximum 254 characters (RFC 5321)
- Minimum practical length: 6 characters (a@b.co)

### Case Sensitivity
- Email addresses case-insensitive (RFC 5321)
- Store in lowercase for consistency
- "User@Example.com" and "user@example.com" are same

### Normalization
```javascript
function normalizeEmail(email) {
  return email.toLowerCase().trim();
}
```

## Validation Function

### Complete Validation
```javascript
function validateEmail(email) {
  // Check presence
  if (!email || email.trim().length === 0) {
    throw new Error('Email is required');
  }
  
  // Normalize
  const normalized = email.toLowerCase().trim();
  
  // Check length
  if (normalized.length > 254) {
    throw new Error('Email address is too long');
  }
  
  // Check format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new Error('Invalid email format');
  }
  
  return normalized;
}
```

## Firestore Query

### Query Structure
```javascript
const query = db.collection('users')
  .where('email', '==', normalizedEmail)
  .limit(1);

const snapshot = await query.get();
const available = snapshot.empty;
```

### Query Optimization
- Limit to 1 result (existence check only)
- Indexed field for fast lookup
- No need to fetch full documents

### Index Required
Firestore index on:
- Collection: `users`
- Field: `email`
- Order: Ascending

## Firebase Auth vs Firestore

### Two Sources of Truth
1. **Firebase Auth**: Primary email storage, auth system
2. **Firestore users**: Secondary storage, user profile

### Why Check Both?
- Firebase Auth: Handles authentication
- Firestore: Stores additional user data
- Both should be in sync
- This function checks Firestore only

### Complete Email Check
To check both sources:
```javascript
// 1. Check Firestore (this function)
const firestoreAvailable = await checkEmailUnique(email);

// 2. Check Firebase Auth
const authAvailable = await checkAuthEmailExists(email);

// Email available only if both are available
const fullyAvailable = firestoreAvailable && !authAvailable;
```

## Business Rules

### Uniqueness Enforcement
- Email must be unique in Firestore
- Email must be unique in Firebase Auth
- Both enforced independently
- Sync required during user creation

### Email Changes
- Users can change email (with verification)
- Old email released
- New email checked for availability
- Both Auth and Firestore updated

### Verification Status
- Unverified emails may still occupy slot
- No automatic cleanup of unverified accounts
- Consider email verification before finalizing

## Security Considerations

### Rate Limiting
- Limit check requests per IP
- Prevent email enumeration
- Throttle during signup process

### Information Disclosure
- Don't reveal if email belongs to specific user
- Simply state "taken" or "available"
- Prevent account enumeration attacks

### Privacy
- Don't log full email addresses
- Hash or partial mask in logs
- Comply with privacy regulations

### Input Sanitization
- Validate format strictly
- Prevent injection attempts
- Strip HTML/script tags

## Error Handling

### Database Errors
- Connection failures: Retry with backoff
- Permission errors: Log and return generic error
- Timeout: Return error, ask user to retry

### Race Conditions
If email taken between check and creation:
- User creation will fail
- Return error to user
- Ask user to use different email

## Logging

### Logged Information
- Email check requests (count)
- Validation failures
- Partial email (e.g., "u***@example.com")

### Not Logged
- Full email address
- User's IP address (unless rate limiting)

## Client-Side Integration

### Real-Time Validation
```javascript
// Debounced email check
let checkTimeout;
function checkEmail(email) {
  clearTimeout(checkTimeout);
  checkTimeout = setTimeout(async () => {
    const result = await fetch('/api/users/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await result.json();
    displayAvailability(data.available);
  }, 500); // Wait 500ms after user stops typing
}
```

### Visual Feedback
- Green checkmark for available
- Red X for taken
- Gray for checking/invalid
- Error message for validation failures

## Performance Considerations

### Query Performance
- Indexed query is fast
- Limit to 1 result minimizes data transfer
- Consider caching results briefly

### Rate Limiting
- Implement request throttling
- Prevent abuse/DoS
- Use exponential backoff on client

### Debouncing
- Debounce client-side requests
- Wait for user to stop typing
- Reduce unnecessary API calls

## Used By
- Signup email step (`src/app/signup/email/page.tsx`)
- Profile settings (email change)
- Mobile app signup flow

## Related Functions
- `checkUsernameUnique`: Similar for username
- `checkAuthEmailExists`: Firebase Auth email check

## Related Documentation
- [Data Model: Users](../../data-models/users.md)
- [Function: checkAuthEmailExists](./checkAuthEmailExists.md)
- [Page: Signup Email](../../pages/signup-email.md)

## Implementation Notes

### Email Normalization
```javascript
// Always lowercase for storage and comparison
email = email.toLowerCase().trim();
```

### Firestore Rules
Enforce uniqueness in Firestore rules:
```javascript
match /users/{userId} {
  allow create: if 
    request.resource.data.email is string &&
    request.resource.data.email.matches('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
}
```

### Plus Addressing
Consider Gmail plus addressing:
- user+test@gmail.com → user@gmail.com
- Optional: Normalize by removing +suffix
- May prevent abuse but also limits legitimate use

```javascript
// Optional: Remove plus addressing
function removePlusAddressing(email) {
  const [local, domain] = email.split('@');
  const cleanLocal = local.split('+')[0];
  return `${cleanLocal}@${domain}`;
}
```

### Testing
- Test with valid email formats
- Test with invalid formats
- Test with existing emails
- Test with various TLDs
- Test with Unicode domains (IDN)
- Test with plus addressing
- Test with very long emails (254 chars)
- Test case sensitivity ("User@Example.com")

### Future Enhancements
- Disposable email detection
- Corporate email validation
- Email reputation checking
- Typo suggestions ("Did you mean gmail.com?")

