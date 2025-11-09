# Users Collection

## Overview
Core user accounts with wallet functionality, identity verification, and role-based access control.

## Collection Path
`users/{userId}`

## Document Structure

### Core Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string | Yes | Firebase Auth UID, matches document ID |
| `username` | string | Yes | Unique username, lowercase |
| `email` | string | Yes | User email address |
| `created_time` | Timestamp | Yes | Account creation timestamp |
| `updated_time` | Timestamp | Yes | Last update timestamp |

### Wallet Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hasWallet` | boolean | No | True if wallet is initialized |
| `balance` | number | No | Current wallet balance in USD (default: 0) |
| `walletCreatedAt` | Timestamp | No | Wallet initialization timestamp |

### Personal Information (KYC)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fullName` | string | No | User's legal full name |
| `dateOfBirth` | string | No | Date of birth (YYYY-MM-DD) |
| `phone` | string | No | Phone number with country code |
| `address` | map | No | Physical address object |
| `address.street` | string | No | Street address |
| `address.city` | string | No | City |
| `address.state` | string | No | State/province code |
| `address.zip` | string | No | Postal code |
| `address.country` | string | No | Country code (e.g., 'US') |
| `kycVerified` | boolean | No | KYC verification status |
| `kycVerifiedAt` | Timestamp | No | KYC verification timestamp |

### Location Verification
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `locationVerified` | boolean | No | Location verification status |
| `verifiedState` | string | No | Verified state code from geolocation |
| `lastLocationCheck` | Timestamp | No | Last location verification timestamp |

### Authorization & Notifications
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `role` | string | No | User role ('admin', 'user') |
| `isAdmin` | boolean | No | Admin flag for authorization checks |
| `fcmToken` | string | No | Firebase Cloud Messaging token for push notifications |

### Payment Information
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `paypalEmail` | string | No | PayPal email for withdrawals |

## Subcollections

### wins
Path: `users/{userId}/wins/{winDocId}`

Tracks winning squares per board and period.

**Document ID Format**: `{boardId}_{period}` (e.g., `abc123_q1`)

**Fields**:
- `boardId` (string): Reference to board
- `gameId` (string): Game ID
- `period` (string): Period identifier (Q1, Q2, Q3, FINAL)
- `winningIndex` (number): Winning square index (0-99)
- `winningSquare` (string): Winning square coordinates (e.g., "47")
- `squareID` (string): Square document ID
- `assignedAt` (Timestamp): Win assignment timestamp

## Indexes Required
- `username` (ascending) - Unique constraint
- `email` (ascending) - Unique constraint via Firebase Auth
- `role` (ascending) - Admin queries
- `locationVerified` + `verifiedState` (composite) - Location filtering

## Business Rules

### Balance Management
- Balance can never go negative (enforced via transactions)
- All balance changes must be accompanied by transaction records
- Balance updates use `FieldValue.increment()` for atomic operations

### Wallet Initialization
- `hasWallet` must be true before deposits/withdrawals
- Wallet setup requires KYC completion
- Location verification required for regulated states

### Role Management
- Default role: 'user'
- Admin role grants access to admin functions
- Role changes require manual database update

## Related Collections
- **transactions**: All financial transactions for this user
- **notifications**: User-specific notifications
- **squares**: Squares owned by this user
- **boards** (via squares): Boards user has entered

## Implementation Notes

### Transaction Safety
All wallet operations use Firestore transactions:
```javascript
await db.runTransaction(async (tx) => {
  tx.update(userRef, {
    balance: admin.firestore.FieldValue.increment(amount),
    updated_time: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

### Location Verification
Uses Google Geocoding API to verify user is in approved state:
- Checks coordinates against state boundaries
- Updates `verifiedState` and `locationVerified` flags
- Required before first deposit/entry

### Username Constraints
- Must be unique (enforced via Firestore rules)
- Stored in lowercase
- Validated client-side and server-side

## Security Considerations
- User documents readable only by the user (Firestore rules)
- Balance updates only via Cloud Functions
- Admin access requires role verification
- PII fields encrypted at rest (Firebase default)

