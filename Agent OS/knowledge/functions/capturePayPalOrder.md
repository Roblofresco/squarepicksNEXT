# Function: capturePayPalOrder (Callable)

## Purpose
Captures an approved PayPal order and updates the user's wallet and transactions.

## Trigger / Access
- Firebase Callable Function: `httpsCallable(functions, 'capturePayPalOrder')`
- Region: `us-east1`

## Caller (UI)
- `src/components/ui/PayPalDepositButton.tsx`

## Payload
```json
{ "orderID": "string" }
```

## Returns
```json
{ "success": true, "message": "captured" }
```

## Side Effects
- Verifies PayPal capture via PayPal API
- Updates `users/{uid}.balance`
- Writes `transactions` record (type: deposit)
- Emits `notifications` record

## Notes
- Frontend creates the order via Next.js API route; capture is via this callable.

