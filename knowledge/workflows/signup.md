# Signup Workflow

## Overview
New user registration with email verification, identity collection, and wallet setup.

## Workflow Steps

### 1. Email Entry (`/signup/email`)
```
User enters email
  ↓
Validate format
  ↓
Check if email already exists (Firebase Auth)
  ↓
Store in signup context
  ↓
Navigate to /signup/username
```

### 2. Username Entry (`/signup/username`)
```
User enters desired username
  ↓
Validate format (lowercase, alphanumeric, no spaces)
  ↓
Check availability (Firestore query)
  ↓
Store in signup context
  ↓
Navigate to /signup/password
```

### 3. Password Entry (`/signup/password`)
```
User enters password
  ↓
Validate strength (min 8 chars)
  ↓
Confirm password match
  ↓
Store in signup context
  ↓
Navigate to /signup/identity
```

### 4. Identity Verification (`/signup/identity`)
```
User enters:
  - Full name
  - Date of birth
  - Phone number
  ↓
Validate age (18+)
  ↓
Validate phone format
  ↓
Store in signup context
  ↓
Create Firebase Auth user
  ↓
Create Firestore user document
  ↓
Send email verification
  ↓
Navigate to /verify-email
```

### 5. Email Verification (`/verify-email`)
```
Display: Check your email for verification link
  ↓
User clicks link in email
  ↓
Firebase Auth marks email as verified
  ↓
User returns to app
  ↓
Redirect to /wallet-setup/location
```

### 6. Location Verification (`/wallet-setup/location`)
```
Request geolocation permission
  ↓
Get coordinates
  ↓
Call verifyLocationFromCoords function
  ↓
Google Geocoding API validates state
  ↓
Update user.verifiedState, user.locationVerified
  ↓
Navigate to /wallet-setup/personal-info
```

### 7. Personal Info (`/wallet-setup/personal-info`)
```
User enters address:
  - Street
  - City
  - State
  - Zip code
  ↓
Validate completeness
  ↓
Update user document
  ↓
Set user.hasWallet = true
  ↓
Redirect to /lobby (signup complete)
```

## User Document Creation

```javascript
await setDoc(doc(db, 'users', userId), {
  userId: userId,
  email: email,
  username: username.toLowerCase(),
  fullName: fullName,
  dateOfBirth: dob,
  phone: phone,
  created_time: serverTimestamp(),
  updated_time: serverTimestamp(),
  balance: 0,
  hasWallet: false,
  locationVerified: false,
  verifiedState: null
});
```

## Validations

### Email
- Valid email format
- Not already registered
- Must be verified before wallet setup

### Username
- 3-20 characters
- Lowercase letters, numbers, underscores only
- Unique (Firestore query)

### Password
- Minimum 8 characters
- At least one number (recommended)
- At least one special character (recommended)

### Identity
- Age 18+ (calculated from DOB)
- Valid phone number format
- Full name provided

### Location
- GPS coordinates obtained
- State verified via Google Geocoding
- Must be in approved state

## Error Handling

### Email Already Exists
```
Error: This email is already registered
Action: Redirect to /login
```

### Username Taken
```
Error: Username not available
Action: Suggest alternatives
```

### Age Restriction
```
Error: You must be 18+ to use SquarePicks
Action: Block signup
```

### Location Restricted
```
Error: SquarePicks not available in your state
Action: Block wallet setup, allow browsing only
```

## Progress Tracking

### Signup Context
```javascript
{
  email: 'user@example.com',
  username: 'johndoe',
  password: '********',
  fullName: 'John Doe',
  dateOfBirth: '1990-01-01',
  phone: '+1234567890',
  currentStep: 4
}
```

### Progress Indicators
- Step 1/4: Email
- Step 2/4: Username
- Step 3/4: Password
- Step 4/4: Identity

## Post-Signup Flow

```
Signup complete
  ↓
Email verification
  ↓
Location verification
  ↓
Personal info / KYC
  ↓
Wallet enabled
  ↓
Ready to play
```

