# Payment Architecture

## Overview
SquarePicks uses PayPal for both deposits (PayPal Checkout) and withdrawals (PayPal Payouts API).

## Deposit Flow (PayPal Checkout)

### Client-Side Integration
```javascript
// PayPal SDK loaded
<PayPalScriptProvider options={{ "client-id": clientId }}>
  <PayPalButtons
    createOrder={(data, actions) => {
      return actions.order.create({
        purchase_units: [{
          amount: { value: amount.toFixed(2) }
        }]
      });
    }}
    onApprove={(data, actions) => {
      // Call Cloud Function to capture
      const result = await capturePayPalOrder({ orderID: data.orderID });
      if (result.success) {
        navigate('/wallet');
      }
    }}
  />
</PayPalScriptProvider>
```

### Server-Side Capture
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
  
  // Verify completion
  if (response.data.status !== 'COMPLETED') {
    throw new HttpsError('internal', 'Payment capture failed');
  }
  
  const amountCaptured = parseFloat(response.data.purchase_units[0].payments.captures[0].amount.value);
  
  // Credit user's wallet (atomic)
  const txRef = db.collection('transactions').doc(`paypal_${orderID}`);
  
  await db.runTransaction(async (tx) => {
    // Idempotency check
    const existingTx = await tx.get(txRef);
    if (existingTx.exists) {
      throw new HttpsError('already-exists', 'Order already credited');
    }
    
    // Credit balance
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
    tx.set(notifRef, {...});
  });
  
  return { success: true, amount: amountCaptured };
});
```

## Withdrawal Flow (PayPal Payouts)

### Request Submission
```javascript
exports.requestWithdrawal = onCall(async (request) => {
  const { amount, method, details } = request.data;
  const userId = request.auth.uid;
  
  // Validate
  if (amount < 5 || amount > 10000) {
    throw new HttpsError('invalid-argument', 'Amount out of range');
  }
  
  // Risk assessment
  const riskAssessment = await assessWithdrawalRisk(db, userId, amount, userData);
  
  // Determine status
  const initialStatus = riskAssessment.shouldFlag ? 'pending_review' : 'processing';
  
  // Deduct balance immediately (atomic)
  await db.runTransaction(async (tx) => {
    tx.update(userRef, {
      balance: FieldValue.increment(-amount)
    });
    
    tx.set(txRef, {
      type: 'withdrawal_request',
      status: initialStatus,
      amount: amount,
      method: 'paypal',
      details: { paypalEmail: details.paypalEmail },
      riskFactors: riskAssessment.riskFactors,
      riskScore: riskAssessment.riskScore
    });
  });
  
  // Low risk: Process immediately
  if (!riskAssessment.shouldFlag) {
    const payoutResult = await processPayPalPayout(txId, details.paypalEmail, amount);
    
    if (payoutResult.success) {
      await txRef.update({
        status: 'completed',
        paypalBatchId: payoutResult.batchId
      });
    } else {
      // Refund on failure
      await db.runTransaction(async (tx) => {
        tx.update(userRef, {
          balance: FieldValue.increment(amount)
        });
      });
      
      await txRef.update({
        status: 'failed',
        payoutError: payoutResult.error
      });
    }
  }
  
  return { success: true, status: initialStatus };
});
```

### PayPal Payout Processing
```javascript
async function processPayPalPayout(transactionId, paypalEmail, amount) {
  const accessToken = await getPayPalAccessToken();
  
  const payoutData = {
    sender_batch_header: {
      sender_batch_id: `SP-${transactionId}-${Date.now()}`,
      email_subject: "SquarePicks Withdrawal"
    },
    items: [{
      recipient_type: "EMAIL",
      amount: {
        value: amount.toFixed(2),
        currency: "USD"
      },
      receiver: paypalEmail,
      note: "Withdrawal from SquarePicks",
      sender_item_id: transactionId
    }]
  };
  
  try {
    const response = await axios.post(
      `${payPalApiUrl}/v1/payments/payouts`,
      payoutData,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    return {
      success: true,
      batchId: response.data.batch_header.payout_batch_id,
      payoutItemId: response.data.batch_header.payout_items[0].payout_item_id
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}
```

## PayPal Authentication

### Access Token
```javascript
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const payPalApiUrl = process.env.PAYPAL_API_BASE_URL;
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await axios.post(
    `${payPalApiUrl}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  
  return response.data.access_token;
}
```

### Environment Variables
```
PAYPAL_CLIENT_ID=<production_client_id>
PAYPAL_CLIENT_SECRET=<production_client_secret>
PAYPAL_API_BASE_URL=https://api-m.paypal.com  # Production
# PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com  # Sandbox
```

## Transaction Idempotency

### Deposit Idempotency
```javascript
// Use deterministic transaction ID
const txRef = db.collection('transactions').doc(`paypal_${orderID}`);

// Check if already exists
const existingTx = await tx.get(txRef);
if (existingTx.exists) {
  throw new HttpsError('already-exists', 'Order already credited');
}
```

### Withdrawal Idempotency
```javascript
// PayPal Payouts uses sender_batch_id for idempotency
sender_batch_id: `SP-${transactionId}-${Date.now()}`

// If same sender_batch_id sent twice:
// - First call processes
// - Second call returns existing batch result
```

## Fee Handling

### PayPal Fees (Deposits)
```javascript
// User pays fee (included in amount)
const gross = 100.00;        // What user pays
const paypalFee = 3.20;      // PayPal fee (2.9% + $0.30)
const net = 96.80;           // What platform receives

// Credit user full amount
await userRef.update({
  balance: FieldValue.increment(100.00)
});

// Record fee breakdown
await txRef.set({
  amount: 100.00,
  paypalFee: 3.20,
  paypalGross: 100.00,
  paypalNet: 96.80
});
```

### PayPal Fees (Withdrawals)
```javascript
// Platform pays fee
const withdrawalAmount = 100.00;  // What user gets
const paypalFee = 2.00;           // PayPal payout fee (~$2 flat)
const cost = 102.00;              // Total cost to platform

// User receives full amount
// Platform absorbs fee
```

## Error Handling

### Deposit Errors
- **Order not found**: User likely didn't complete checkout
- **Capture failed**: Payment declined or insufficient funds
- **Already credited**: Idempotency check caught duplicate

### Withdrawal Errors
- **Insufficient balance**: Balance check failed
- **Rate limit exceeded**: Too many withdrawals
- **PayPal error**: Invalid email, account restricted, etc.
- **Timeout**: PayPal API unresponsive

### Error Recovery
```javascript
// On failure, refund balance
if (!payoutResult.success) {
  await db.runTransaction(async (tx) => {
    tx.update(userRef, {
      balance: FieldValue.increment(amount)
    });
  });
  
  await txRef.update({
    status: 'failed',
    payoutError: payoutResult.error
  });
  
  // Notify user
  await notifRef.set({
    title: `Withdrawal Failed: $${amount.toFixed(2)}`,
    message: 'Your funds have been returned to your wallet.'
  });
}
```

## Security Measures

### Server-Side Validation
- All payment operations in Cloud Functions
- No client-side balance updates
- PayPal API credentials stored in Secret Manager

### Fraud Prevention
- Risk assessment on withdrawals
- Rate limiting (3 per day, $25K per 24h)
- Account age checks
- Deposit history verification

### Audit Trail
- All transactions logged
- PayPal batch IDs recorded
- Transaction status tracked
- Error details preserved

## Testing

### Sandbox Mode
```
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com
```

### Test Accounts
- Buyer account (deposit testing)
- Seller account (withdrawal testing)
- Create via PayPal Developer Dashboard

### Test Scenarios
- Successful deposit
- Failed capture
- Duplicate deposit attempt
- Successful withdrawal
- Failed payout
- Withdrawal refund

