# Wallet Update Balance API

## Endpoint
**POST** `/api/wallet/update-balance`

## Authentication
None (internal API - called by other API routes)

## Purpose
Internal API route that atomically updates a user's wallet balance using Firestore transactions. Creates transaction record and notification.

## Request
- **Method**: POST
- **Headers**: 
  - `Content-Type: application/json`
- **Body**:
```json
{
  "userId": "user123",
  "amount": 50.00,
  "orderId": "7XY12345ABC67890",
  "currency": "USD"
}
```

### Request Fields
- **userId** (required): Firebase user UID (string)
- **amount** (required): Deposit amount (positive number)
- **orderId** (required): Payment order ID for reference (string)
- **currency** (optional): Currency code (default: "USD")

## Response

### Success Response (200)
```json
{
  "message": "Wallet balance updated successfully",
  "success": true,
  "newBalance": 150.00,
  "previousBalance": 100.00,
  "transactionId": "tx_abc123",
  "notificationId": "notif_xyz789"
}
```

### Response Fields
- **message**: Success message
- **success**: Boolean operation status
- **newBalance**: User's balance after deposit
- **previousBalance**: User's balance before deposit
- **transactionId**: Created transaction document ID
- **notificationId**: Created notification document ID

## Error Responses

### 400 Bad Request - Invalid User ID
```json
{
  "error": "Valid user ID is required"
}
```

### 400 Bad Request - Invalid Amount
```json
{
  "error": "Valid amount is required"
}
```

### 400 Bad Request - Invalid Order ID
```json
{
  "error": "Valid order ID is required"
}
```

### 500 Internal Server Error - Firebase Not Configured
```json
{
  "error": "Firebase not configured. Please contact support."
}
```

### 500 Internal Server Error - User Not Found
```json
{
  "error": "User not found"
}
```

### 500 Internal Server Error - Wallet Not Initialized
```json
{
  "error": "User wallet not initialized"
}
```

## Process Flow

### Step 1: Validate Input
- Verify userId is non-empty string
- Verify amount is positive number
- Verify orderId is non-empty string

### Step 2: Check Firebase Initialization
- Ensure Firebase Admin SDK is initialized
- Initialize if needed using service account credentials

### Step 3: Run Firestore Transaction
Atomic transaction that:
1. Reads user document
2. Verifies user exists
3. Verifies wallet is initialized (`hasWallet: true`)
4. Calculates new balance
5. Updates user balance
6. Creates transaction record
7. Creates notification

### Step 4: Return Result
- Return new balance and transaction IDs

## Firestore Transaction Structure

### Operations (Atomic)
```javascript
await db.runTransaction(async (transaction) => {
  // 1. Read user data
  const userDoc = await transaction.get(userRef);
  const currentBalance = userDoc.data().balance || 0;
  
  // 2. Calculate new balance
  const newBalance = currentBalance + depositAmount;
  
  // 3. Update user balance
  transaction.update(userRef, {
    balance: newBalance,
    updated_time: new Date()
  });
  
  // 4. Create transaction record
  transaction.set(transactionRef, {
    userID: userId,
    type: 'deposit',
    amount: depositAmount,
    currency: 'USD',
    orderId: orderId,
    newBalance: newBalance,
    previousBalance: currentBalance,
    timestamp: new Date(),
    status: 'completed'
  });
  
  // 5. Create notification
  transaction.set(notificationRef, {
    userID: userId,
    title: 'Deposit Successful',
    message: `Your deposit of $${depositAmount} was successful.`,
    type: 'deposit_success',
    relatedID: transactionRef.id,
    isRead: false,
    timestamp: new Date()
  });
});
```

## Database Operations

### Collections Written
1. **users/{userId}**
   - Updates `balance` field (increment)
   - Updates `updated_time` timestamp

2. **transactions/{transactionId}**
   - Creates new transaction document
   - Type: "deposit"
   - Status: "completed"

3. **notifications/{notificationId}**
   - Creates deposit success notification
   - Type: "deposit_success"
   - Links to transaction document

## Transaction Document Structure
```json
{
  "userID": "user123",
  "type": "deposit",
  "amount": 50.00,
  "currency": "USD",
  "description": "PayPal Deposit of $50.00 - Order ID: 7XY12345ABC67890",
  "orderId": "7XY12345ABC67890",
  "newBalance": 150.00,
  "previousBalance": 100.00,
  "timestamp": "2024-12-15T18:30:00.000Z",
  "status": "completed"
}
```

## Notification Document Structure
```json
{
  "userID": "user123",
  "title": "Deposit Successful",
  "message": "Your deposit of $50.00 was successful.",
  "type": "deposit_success",
  "relatedID": "tx_abc123",
  "isRead": false,
  "timestamp": "2024-12-15T18:30:00.000Z"
}
```

## Business Rules
- Wallet must be initialized (`hasWallet: true`) before deposits
- All balance updates must use transactions (atomic operations)
- Transaction records created for audit trail
- Notifications created for user awareness
- Only positive amounts accepted (deposits only)
- Default balance is 0 if not set

## Atomicity Guarantees
- All 3 operations (balance update, transaction record, notification) succeed or all fail
- No partial updates possible
- Prevents race conditions from concurrent deposit attempts
- Ensures data consistency across collections

## Security Considerations
- Internal API only (not exposed publicly)
- Called by authenticated API routes
- No direct user access
- Validates wallet initialization before update
- Uses Firestore security rules as second layer

## Environment Variables Required
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Used By
- `/api/paypal/capture-order` - After successful PayPal capture
- Future Stripe integration endpoints
- Admin manual balance adjustments (future)

## Related Documentation
- [API: PayPal Capture Order](./paypal-capture-order.md)
- [Data Models: User](../data-models/user.md)
- [Data Models: Transaction](../data-models/transaction.md)
- [Data Models: Notification](../data-models/notification.md)
- [Business Rules: Payment Processing](../business-rules/payment-processing.md)

