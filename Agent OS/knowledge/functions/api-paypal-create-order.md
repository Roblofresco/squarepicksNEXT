# API Route: POST /api/paypal/create-order

## Purpose
Creates a PayPal order on behalf of the client. Secures PayPal credentials server-side.

## Caller (UI)
- `src/components/ui/PayPalDepositButton.tsx` (`createOrder`)

## Request
```http
POST /api/paypal/create-order
Content-Type: application/json
{
  "amount": "12.34",
  "currency": "USD",
  "intent": "CAPTURE"
}
```

## Response
```json
{ "id": "ORDER-ID", "status": "CREATED", "intent": "CAPTURE", "amount": "12.34", "currency": "USD" }
```

## Implementation Notes
- Uses env: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`/`NEXT_PUBLIC_PAYPAL_ENV` to choose base URL.
- Authenticates with PayPal, then calls `/v2/checkout/orders`.
- Logs diagnostic presence of envs without exposing secrets.

