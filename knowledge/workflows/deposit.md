# Deposit Workflow

## User Journey

### 1. Navigate to Deposit
```
User clicks "Deposit" (from wallet/lobby)
  ↓
Navigate to /deposit
  ↓
Display deposit page with amount input
```

### 2. Enter Amount
```
User enters desired deposit amount
  ↓
Validate:
  - Minimum: $1.00
  - Maximum: $10,000.00
  - Format: 2 decimal places
  ↓
Display PayPal fee estimate (2.9% + $0.30)
  ↓
Show total amount user will pay
```

### 3. PayPal Checkout
```
User clicks "Deposit with PayPal"
  ↓
PayPal SDK loads
  ↓
PayPal popup/modal appears
  ↓
User logs into PayPal
  ↓
User selects payment method
  ↓
User approves payment
```

### 4. Payment Capture
```
PayPal returns to app with orderID
  ↓
Call capturePayPalOrder function
  ↓
Function captures payment from PayPal
  ↓
Verify payment status = COMPLETED
  ↓
Firestore Transaction:
  - Create transaction record (deposit)
  - Increment user.balance
  - Create notification
  ↓
Return success to client
```

### 5. Confirmation
```
Display success message
  ↓
Show new balance
  ↓
Option to:
  - Return to lobby
  - View transactions
  - Enter boards
```

## Technical Flow

### Client-Side
```javascript
<PayPalScriptProvider options={{ "client-id": clientId }}>
  <PayPalButtons
    createOrder={(data, actions) => {
      return actions.order.create({
        purchase_units: [{
          amount: { value: depositAmount.toFixed(2) }
        }]
      });
    }}
    onApprove={async (data, actions) => {
      setLoading(true);
      
      const result = await capturePayPalOrder({ orderID: data.orderID });
      
      if (result.success) {
        showSuccess(`Deposit successful! Added $${result.amount} to your wallet.`);
        navigate('/wallet');
      } else {
        showError('Deposit failed. Please try again.');
      }
      
      setLoading(false);
    }}
    onError={(err) => {
      showError('Payment error. Please try again.');
    }}
  />
</PayPalScriptProvider>
```

### Server-Side
```javascript
exports.capturePayPalOrder = onCall(async (request) => {
  const { orderID } = request.data;
  const userId = request.auth.uid;
  
  // Get PayPal access token
  const accessToken = await getPayPalAccessToken();
  
  // Capture order
  const response = await axios.post(
    `${payPalApiUrl}/v2/checkout/orders/${orderID}/capture`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  if (response.data.status !== 'COMPLETED') {
    throw new HttpsError('internal', 'Payment capture failed');
  }
  
  const amountCaptured = parseFloat(
    response.data.purchase_units[0].payments.captures[0].amount.value
  );
  
  // Credit wallet (atomic)
  const txRef = db.collection('transactions').doc(`paypal_${orderID}`);
  
  await db.runTransaction(async (tx) => {
    // Idempotency check
    const existing = await tx.get(txRef);
    if (existing.exists) {
      throw new HttpsError('already-exists', 'Already credited');
    }
    
    // Update balance
    tx.update(userRef, {
      balance: FieldValue.increment(amountCaptured)
    });
    
    // Record transaction
    tx.set(txRef, {
      userID: userId,
      type: 'deposit',
      amount: amountCaptured,
      currency: 'USD',
      status: 'completed',
      orderId: orderID,
      timestamp: FieldValue.serverTimestamp()
    });
    
    // Notify user
    tx.set(notifRef, {
      userID: userId,
      tag: 'deposit',
      title: `Deposit Successful: $${amountCaptured.toFixed(2)}`,
      message: `Your deposit of $${amountCaptured.toFixed(2)} has been successfully added to wallet!`,
      type: 'deposit_success',
      timestamp: FieldValue.serverTimestamp(),
      isRead: false
    });
  });
  
  return { success: true, amount: amountCaptured };
});
```

## UI Components

### Deposit Form
```
Enter Amount to Deposit
[Input: $____.__]

PayPal Fee: $0.30 + 2.9%
You Pay: $20.88
You Receive: $20.00

[PayPal Deposit Button]
```

### Loading State
```
Processing your deposit...
Please do not close this window.
[Spinner]
```

### Success State
```
✅ Deposit Successful!

Deposited: $20.00
New Balance: $120.00

[View Wallet] [Enter Boards]
```

## Error Handling

### PayPal Errors

**User Cancels**:
```
User closes PayPal window
  ↓
onCancel callback
  ↓
Display: "Deposit cancelled"
  ↓
Return to deposit form
```

**Payment Declined**:
```
PayPal declines payment
  ↓
onError callback
  ↓
Display: "Payment failed. Please try a different payment method."
```

**Capture Failed**:
```
capturePayPalOrder function fails
  ↓
Display: "We couldn't process your deposit. Please contact support."
  ↓
No balance change (transaction rolled back)
```

### Duplicate Handling
```
User tries to capture same order twice
  ↓
Idempotency check catches it
  ↓
Return error: "This deposit has already been processed"
  ↓
No duplicate credit
```

## Security Measures

### Client-Side
- PayPal SDK handles sensitive data
- No credit card info stored
- HTTPS only

### Server-Side
- Verify payment status = COMPLETED
- Idempotency via deterministic transaction IDs
- PayPal API credentials in Secret Manager
- User authentication required

## Fee Transparency

### PayPal Fees (User Pays)
```
Deposit: $20.00
PayPal Fee: $0.88 (2.9% + $0.30)
Total Charged: $20.88

User receives: $20.00 in wallet
```

### Display Calculation
```javascript
const depositAmount = 20.00;
const paypalFee = (depositAmount * 0.029) + 0.30;
const totalCharged = depositAmount + paypalFee;

// Display:
// You Pay: $20.88
// You Receive: $20.00
```

## Testing

### Sandbox Mode
```
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com
NEXT_PUBLIC_PAYPAL_CLIENT_ID=<sandbox_client_id>
```

### Test Accounts
- Create buyer account in PayPal Developer Dashboard
- Use sandbox credentials
- Test full flow

### Test Scenarios
- Successful deposit
- User cancels
- Payment declined
- Duplicate capture attempt
- Network error

## Post-Deposit Flow

```
Deposit successful
  ↓
Balance updated
  ↓
Notification sent
  ↓
User can:
  ├─ Enter boards
  ├─ View transactions
  └─ Make another deposit
```

## User Experience

### Quick Deposit Amounts
```
[+$10] [+$25] [+$50] [+$100]
Or enter custom amount: [____]
```

### Balance Context
```
Current Balance: $5.00
After $20 deposit: $25.00
Enough for 5 entries on $5 boards!
```

### First Deposit Bonus (Future)
```
🎉 First Deposit Bonus!
Deposit $20, get $5 free!
```

