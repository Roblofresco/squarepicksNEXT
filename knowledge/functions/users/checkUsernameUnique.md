# checkUsernameUnique Function

## Overview
Validates whether a username is available (unique) in the system. Used during signup and username change flows to ensure usernames are unique across all users.

## Location
Expected: Firebase Cloud Function or Next.js API Route
Path: `functions/src/users/checkUsernameUnique` or `/api/users/check-username`

## Function Type
Firebase Cloud Function (Callable) or Next.js API Route

## Authentication
Optional (can be called during signup before auth)

## Purpose
- Check if username is available
- Prevent duplicate usernames
- Validate username format
- Provide real-time feedback during signup
- Support username change validation

## Request Parameters

### Input Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Username to check (3-20 characters) |

### Example Request
```json
{
  "username": "player123"
}
```

## Response

### Success Response (Available)
```json
{
  "available": true,
  "username": "player123",
  "message": "Username is available"
}
```

### Success Response (Taken)
```json
{
  "available": false,
  "username": "player123",
  "message": "Username is already taken"
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `available` | boolean | Whether username is available |
| `username` | string | Normalized username checked |
| `message` | string | Human-readable result message |

### Error Responses

#### 400 Bad Request - Missing Username
```json
{
  "error": "Username is required"
}
```

#### 400 Bad Request - Invalid Format
```json
{
  "error": "Username must be 3-20 characters and contain only letters, numbers, and underscores"
}
```

#### 400 Bad Request - Invalid Characters
```json
{
  "error": "Username contains invalid characters"
}
```

#### 400 Bad Request - Reserved Username
```json
{
  "error": "This username is reserved and cannot be used"
}
```

## Process Flow

### Step 1: Input Validation
- Verify username is provided
- Check length (3-20 characters)
- Validate character set
- Check against reserved words

### Step 2: Normalize Username
```javascript
const normalizedUsername = username.toLowerCase().trim();
```

### Step 3: Check Reserved Words
```javascript
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'mod', 'moderator',
  'support', 'help', 'official', 'squarepicks',
  'system', 'bot', 'api', 'test', 'demo'
];

if (RESERVED_USERNAMES.includes(normalizedUsername)) {
  throw new Error('This username is reserved');
}
```

### Step 4: Query Firestore
```javascript
const userSnapshot = await db.collection('users')
  .where('username', '==', normalizedUsername)
  .limit(1)
  .get();

const available = userSnapshot.empty;
```

### Step 5: Return Availability
- Return true if no matches found
- Return false if username exists

## Username Validation Rules

### Length Requirements
- Minimum: 3 characters
- Maximum: 20 characters

### Character Requirements
- Allowed: letters (a-z, A-Z)
- Allowed: numbers (0-9)
- Allowed: underscores (_)
- Not allowed: spaces, special characters, emojis

### Format Regex
```javascript
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
```

### Case Sensitivity
- Usernames stored in lowercase
- Case-insensitive uniqueness check
- "Player123" and "player123" considered same

### Reserved Usernames
Cannot use:
- `admin`, `administrator`
- `mod`, `moderator`
- `support`, `help`
- `official`, `squarepicks`
- `system`, `bot`
- `api`, `test`, `demo`
- Company-related terms

### Profanity Filter
Optional: Check against profanity list
```javascript
const PROFANITY_LIST = ['badword1', 'badword2', /* ... */];

function containsProfanity(username) {
  return PROFANITY_LIST.some(word => 
    username.toLowerCase().includes(word)
  );
}
```

## Validation Function

### Complete Validation
```javascript
function validateUsername(username) {
  // Check presence
  if (!username || username.trim().length === 0) {
    throw new Error('Username is required');
  }
  
  // Normalize
  const normalized = username.toLowerCase().trim();
  
  // Check length
  if (normalized.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  if (normalized.length > 20) {
    throw new Error('Username must be 20 characters or less');
  }
  
  // Check format
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(normalized)) {
    throw new Error('Username can only contain letters, numbers, and underscores');
  }
  
  // Check reserved
  const RESERVED = ['admin', 'support', 'help', 'official', 'moderator'];
  if (RESERVED.includes(normalized)) {
    throw new Error('This username is reserved');
  }
  
  // Check profanity (optional)
  if (containsProfanity(normalized)) {
    throw new Error('Username contains inappropriate content');
  }
  
  return normalized;
}
```

## Firestore Query

### Query Structure
```javascript
const query = db.collection('users')
  .where('username', '==', normalizedUsername)
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
- Field: `username`
- Order: Ascending

## Business Rules

### Uniqueness Enforcement
- Enforced at application level
- Firestore rules can also enforce
- Database unique constraint via index

### Username Changes
- Users may be allowed to change username
- Check availability before allowing change
- May limit frequency of changes
- Previous username may be released or reserved

### Display vs Storage
- Store in lowercase for consistency
- Display with original casing if desired
- Preserve user's preferred casing separately

### Username Reservation
- During signup process, username not reserved
- Race condition possible (two users trying same name)
- Final enforcement at user document creation

## Security Considerations

### Rate Limiting
- Limit check requests per IP
- Prevent username enumeration
- Throttle during signup process

### Information Disclosure
- Don't reveal if username belongs to specific user
- Simply state "taken" or "available"
- Prevent account enumeration attacks

### Input Sanitization
- Strip HTML/script tags
- Validate character set strictly
- Prevent injection attempts

## Error Handling

### Database Errors
- Connection failures: Retry with backoff
- Permission errors: Log and return generic error
- Timeout: Return error, ask user to retry

### Race Conditions
If username taken between check and creation:
- User creation will fail with unique constraint error
- Return error to user
- Ask user to choose different username

## Logging

### Logged Information
- Username check requests
- Validation failures
- Reserved username attempts

### Not Logged
- User's IP address (unless rate limiting)
- Personal information

## Client-Side Integration

### Real-Time Validation
```javascript
// Debounced username check
let checkTimeout;
function checkUsername(username) {
  clearTimeout(checkTimeout);
  checkTimeout = setTimeout(async () => {
    const result = await fetch('/api/users/check-username', {
      method: 'POST',
      body: JSON.stringify({ username }),
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
- Indexed query is fast (O(log n))
- Limit to 1 result minimizes data transfer
- Consider caching negative results briefly

### Rate Limiting
- Implement request throttling
- Prevent abuse/DoS
- Use exponential backoff on client

### Debouncing
- Debounce client-side requests
- Wait for user to stop typing
- Reduce unnecessary API calls

## Used By
- Signup username step (`src/app/signup/username/page.tsx`)
- Profile settings (username change)
- Mobile app signup flow

## Related Functions
- `checkEmailUnique`: Similar for email
- `checkAuthEmailExists`: Firebase Auth email check

## Related Documentation
- [Data Model: Users](../../data-models/users.md)
- [Page: Signup Username](../../pages/signup-username.md)

## Implementation Notes

### Firestore Rules
Enforce uniqueness in Firestore rules:
```javascript
match /users/{userId} {
  allow create: if 
    request.resource.data.username is string &&
    !exists(/databases/$(database)/documents/users/$(
      request.resource.data.username
    ));
}
```

### Case Sensitivity
```javascript
// Always lowercase for storage
username = username.toLowerCase();

// Optional: Store display name separately
displayName = username; // Preserves casing
```

### Reserved Username Check
```javascript
const RESERVED_USERNAMES = new Set([
  'admin', 'support', 'help', /* ... */
]);

function isReserved(username) {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}
```

### Testing
- Test with various valid usernames
- Test with invalid formats
- Test with reserved words
- Test with profanity
- Test with existing usernames
- Test with Unicode/emoji (should reject)
- Test length boundaries (2, 3, 20, 21 chars)

### Future Enhancements
- Username suggestions if taken
- Fuzzy search for similar usernames
- Username history/audit trail
- Allow special characters in display name

