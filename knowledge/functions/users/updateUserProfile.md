# updateUserProfile Function

## Overview
Updates user profile information including personal details (KYC data), PayPal email for withdrawals, and other account settings. Validates input data and ensures data consistency in Firestore.

## Location
Expected: Firebase Cloud Function or Next.js API Route
Path: `functions/src/users/updateUserProfile` or similar

## Function Type
Firebase Cloud Function (Callable) or Next.js API Route

## Authentication
Requires authenticated user (Firebase Auth)

## Purpose
- Update user personal information
- Store KYC data for compliance
- Update PayPal email for withdrawals
- Update phone number and address
- Maintain updated_time timestamp
- Validate input data

## Request Parameters

### Input Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User ID (from auth context) |
| `fullName` | string | No | User's legal full name |
| `dateOfBirth` | string | No | Date of birth (YYYY-MM-DD) |
| `phone` | string | No | Phone number with country code |
| `address` | object | No | Address object |
| `address.street` | string | No | Street address |
| `address.city` | string | No | City |
| `address.state` | string | No | State/province code (2 letters) |
| `address.zip` | string | No | ZIP/postal code |
| `address.country` | string | No | Country code (default: 'US') |
| `paypalEmail` | string | No | PayPal email for withdrawals |

### Example Request
```json
{
  "fullName": "John Doe",
  "dateOfBirth": "1990-05-15",
  "phone": "+15551234567",
  "address": {
    "street": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "country": "US"
  },
  "paypalEmail": "john.doe@example.com"
}
```

## Response

### Success Response
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "updated": {
    "fullName": true,
    "dateOfBirth": true,
    "phone": true,
    "address": true,
    "paypalEmail": true
  }
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether update succeeded |
| `message` | string | Success message |
| `updated` | object | Map of fields that were updated |

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

#### 400 Bad Request - Invalid Date of Birth
```json
{
  "error": "Invalid date of birth format. Use YYYY-MM-DD"
}
```

#### 400 Bad Request - Underage
```json
{
  "error": "User must be 18 years or older"
}
```

#### 400 Bad Request - Invalid Phone
```json
{
  "error": "Invalid phone number format. Use E.164 format (e.g., +15551234567)"
}
```

#### 400 Bad Request - Invalid State
```json
{
  "error": "Invalid state code. Use 2-letter state abbreviation"
}
```

#### 400 Bad Request - Invalid PayPal Email
```json
{
  "error": "Invalid PayPal email format"
}
```

#### 403 Forbidden - User Not Found
```json
{
  "error": "User not found"
}
```

## Process Flow

### Step 1: Authentication
- Verify user is authenticated
- Extract user ID from auth context

### Step 2: Input Validation

**Full Name:**
- Must be non-empty string if provided
- Length between 2-100 characters
- Allowed characters: letters, spaces, hyphens, apostrophes

**Date of Birth:**
- Format: YYYY-MM-DD
- Must be valid date
- User must be 18+ years old
- Not in the future

**Phone:**
- E.164 format recommended: `+15551234567`
- Length validation
- Optional format: `+[country code][number]`

**Address:**
- Street: 5-200 characters
- City: 2-100 characters
- State: 2-letter US state code
- ZIP: 5 or 9 digits (US format)
- Country: 2-letter ISO code (default 'US')

**PayPal Email:**
- Valid email format
- Max 254 characters
- Lowercase recommended

### Step 3: Fetch User Document
- Get user document from Firestore
- Verify user exists

### Step 4: Prepare Update Object
Build update object with only provided fields:
```javascript
const updateData = {
  updated_time: FieldValue.serverTimestamp()
};

if (fullName !== undefined) {
  updateData.fullName = fullName.trim();
}
if (dateOfBirth !== undefined) {
  updateData.dateOfBirth = dateOfBirth;
}
if (phone !== undefined) {
  updateData.phone = phone;
}
if (address !== undefined) {
  updateData.address = {
    street: address.street,
    city: address.city,
    state: address.state.toUpperCase(),
    zip: address.zip,
    country: address.country || 'US'
  };
}
if (paypalEmail !== undefined) {
  updateData.paypalEmail = paypalEmail.toLowerCase();
}
```

### Step 5: Update User Document
```javascript
await db.collection('users').doc(userId).update(updateData);
```

### Step 6: Check KYC Completion
If all KYC fields now provided:
- Set `kycVerified: true`
- Set `kycVerifiedAt: serverTimestamp()`
- Enable wallet features

KYC fields required:
- fullName
- dateOfBirth (18+)
- phone
- address (complete)

### Step 7: Create Notification
Optional: Notify user of profile update:
```
Title: "Profile Updated"
Message: "Your profile information has been updated successfully."
```

### Step 8: Return Success Response
Return updated field list

## Validation Rules

### Full Name Validation
```javascript
function validateFullName(name) {
  if (!name || name.trim().length < 2) {
    throw new Error('Name must be at least 2 characters');
  }
  if (name.length > 100) {
    throw new Error('Name must be less than 100 characters');
  }
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    throw new Error('Name contains invalid characters');
  }
  return name.trim();
}
```

### Date of Birth Validation
```javascript
function validateDateOfBirth(dob) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dob)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD');
  }
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  if (birthDate > today) {
    throw new Error('Date of birth cannot be in the future');
  }
  
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  
  const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) 
    ? age - 1 
    : age;
  
  if (actualAge < 18) {
    throw new Error('User must be 18 years or older');
  }
  
  return dob;
}
```

### Phone Validation
```javascript
function validatePhone(phone) {
  // E.164 format: +[country code][number]
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    throw new Error('Invalid phone number format');
  }
  
  // Remove formatting, keep digits and leading +
  return phone.replace(/[\s\-\(\)]/g, '');
}
```

### Address Validation
```javascript
function validateAddress(address) {
  if (!address.street || address.street.length < 5) {
    throw new Error('Street address must be at least 5 characters');
  }
  if (!address.city || address.city.length < 2) {
    throw new Error('City must be at least 2 characters');
  }
  
  // US state codes
  const validStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 
    'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 
    'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 
    'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];
  
  const stateUpper = address.state.toUpperCase();
  if (!validStates.includes(stateUpper)) {
    throw new Error('Invalid US state code');
  }
  
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (!zipRegex.test(address.zip)) {
    throw new Error('Invalid ZIP code format. Use 12345 or 12345-6789');
  }
  
  return {
    ...address,
    state: stateUpper,
    country: address.country || 'US'
  };
}
```

### PayPal Email Validation
```javascript
function validatePayPalEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  if (email.length > 254) {
    throw new Error('Email too long');
  }
  return email.toLowerCase();
}
```

## KYC Verification

### Required Fields for KYC
- Full name
- Date of birth (18+)
- Phone number
- Complete address (street, city, state, zip, country)

### KYC Completion Check
```javascript
function checkKycCompletion(userData) {
  const hasFullName = !!userData.fullName;
  const hasDateOfBirth = !!userData.dateOfBirth;
  const hasPhone = !!userData.phone;
  const hasAddress = !!(
    userData.address?.street &&
    userData.address?.city &&
    userData.address?.state &&
    userData.address?.zip &&
    userData.address?.country
  );
  
  return hasFullName && hasDateOfBirth && hasPhone && hasAddress;
}
```

### Auto-Verify KYC
```javascript
if (checkKycCompletion(userData)) {
  await db.collection('users').doc(userId).update({
    kycVerified: true,
    kycVerifiedAt: FieldValue.serverTimestamp()
  });
}
```

## Business Rules

### Age Restriction
- Users must be 18 years or older
- Enforced at date of birth validation
- Required for legal compliance

### State Restrictions
- Only US states supported
- Some states may be restricted for gaming
- State verification separate from profile update

### Data Immutability
- Some fields may be locked after initial KYC
- Date of birth typically cannot be changed after verification
- Contact support for corrections

### PayPal Email
- Can be updated anytime
- Used for withdrawals
- No verification required (verified during payout)

## Security Considerations

### Authorization
- Users can only update their own profile
- Admin may have override capability
- User ID verified against auth token

### Data Validation
- All inputs validated
- SQL injection prevention (Firestore NoSQL)
- XSS prevention through sanitization

### PII Protection
- Personal data encrypted at rest (Firebase default)
- Access restricted by Firestore rules
- Only user and admin can read

### Audit Trail
- `updated_time` timestamp tracks changes
- Could add changelog for KYC fields
- Admin actions logged separately

## Error Handling

### Validation Errors
- Return specific field error
- Don't update if any validation fails
- Client can display field-specific errors

### Firestore Errors
- Handle document not found
- Handle permission denied
- Retry transient errors

## Logging

### Logged Information
- User ID
- Updated fields (names, not values)
- Timestamp
- KYC completion status

### Not Logged
- Actual PII values (name, address, etc.)
- Full user document

## Notifications

### Profile Updated
```
Title: "Profile Updated"
Message: "Your profile has been updated successfully."
```

### KYC Completed
```
Title: "Account Verified"
Message: "Your account has been verified. You can now access all features including deposits and withdrawals."
```

## Used By
- Profile settings page (`src/app/profile/settings/personal-details/page.tsx`)
- Wallet setup flow (`src/app/wallet-setup/personal-info/page.tsx`)
- Mobile app profile screens

## Related Functions
- `verifyLocationFromCoords`: Location verification for KYC
- `requestWithdrawal`: Requires PayPal email from profile

## Related Documentation
- [Data Model: Users](../../data-models/users.md)
- [Function: verifyLocationFromCoords](./verifyLocationFromCoords.md)

## Implementation Notes

### Partial Updates
```javascript
// Only update fields that are provided
const updateData = {};
if (fullName !== undefined) updateData.fullName = fullName;
if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
// ... etc
await userRef.update(updateData);
```

### State Code Normalization
```javascript
// Always uppercase state codes
if (address?.state) {
  address.state = address.state.toUpperCase();
}
```

### Email Normalization
```javascript
// Always lowercase emails
if (paypalEmail) {
  paypalEmail = paypalEmail.toLowerCase().trim();
}
```

### Testing
- Test with valid and invalid data for each field
- Test age validation edge cases
- Test state code validation
- Test partial updates (only some fields)
- Verify KYC auto-completion
- Test authorization (user can't update other users)

