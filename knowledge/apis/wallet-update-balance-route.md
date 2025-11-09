# API: Wallet - Update Balance

## Endpoint

`POST /api/wallet/update-balance`

## Purpose

Atomically updates user wallet balance after successful payment capture and creates transaction/notification records.

## Authentication

**Not enforced at API level** - Assumes internal call from capture-order route (should be secured in production)

## Input

- **Body**:

```json
{
  "userId": "string (required)",
  "amount": "number (required)",
  "orderId": "string (required)",
  "currency": "string (default: USD)"
}
```

## Output

**Success:**

```json
{
  "message": "Wallet balance updated successfully",
  "success": true,
  "newBalance": "number",
  "previousBalance": "number",
  "transactionId": "string",
  "notificationId": "string"
}
```

**Error:**

```json
{
  "error": "string"
}
```

## Error Codes

- **400**: Invalid input
  - Valid user ID is required
  - Valid amount is required (must be > 0)
  - Valid order ID is required
- **500**: Firebase not configured or transaction failed
  - Firebase not configured
  - User not found
  - User data not found
  - User wallet not initialized

## Implementation Details

### Atomic Transaction

Uses Firestore `runTransaction()` to ensure atomicity:

1. **Read** user document
2. **Validate** user exists and has wallet enabled (`hasWallet: true`)
3. **Calculate** new balance (`currentBalance + depositAmount`)
4. **Update** user balance and `updated_time`
5. **Create** transaction record
6. **Create** notification record

### Transaction Record

Stored in `transactions` collection:

```typescript
{
  userID: string,
  type: 'deposit',
  amount: number,
  currency: string,
  description: string,
  orderId: string,
  newBalance: number,
  previousBalance: number,
  timestamp: Date,
  status: 'completed'
}
```

### Notification Record

Stored in `notifications` collection:

```typescript
{
  userID: string,
  title: 'Deposit Successful',
  message: string,
  type: 'deposit_success',
  relatedID: string (transactionId),
  isRead: false,
  timestamp: Date
}
```

## Used By

- `api/paypal/capture-order` - After successful PayPal capture
- Future payment integrations (Stripe, etc.)

## Related Functions

### Firestore Collections

- `users/{userId}` - User document with `balance` and `hasWallet` fields
- `transactions` - Transaction records
- `notifications` - User notifications

### Dependencies

- `firebase-admin/app` - Firebase Admin initialization
- `firebase-admin/firestore` - Firestore transactions

## Security Considerations

⚠️ **WARNING**: This endpoint currently has no authentication. In production:

1. Require Firebase Auth token
2. Verify user ID matches authenticated user OR
3. Make this endpoint internal-only (not exposed to client)
4. Use Cloud Functions with admin privileges instead

## Notes

- All amounts stored as floating-point numbers
- Currency defaults to 'USD' if not provided
- Creates audit trail via transaction records
- Notifies user of successful deposit
- Transaction rolls back completely on any error

