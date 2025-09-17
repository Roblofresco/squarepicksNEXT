# Function: requestWithdrawal (Callable)

## Purpose
Submits a withdrawal request for review and processing.

## Trigger / Access
- Firebase Callable Function: `httpsCallable(functions, 'requestWithdrawal')`
- Region: `us-east1`

## Caller (UI)
- `src/app/withdraw/page.tsx`

## Payload
```json
{
  "amount": 25.0,
  "method": "paypal",
  "details": { "paypalEmail": "you@example.com" }
}
```

## Returns
```json
{ "success": true, "message": "pending" }
```

## Side Effects
- Validates eligibility and balance
- Creates `transactions` record (type: withdrawal, status: pending)
- Emits `notifications` record

## Notes
- Actual disbursement processing occurs server-side (e.g., PayPal Payouts) during backoffice review.

