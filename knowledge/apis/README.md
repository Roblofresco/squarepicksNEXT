# Next.js API Routes Documentation

## Overview
Documentation for all Next.js API routes in `/src/app/api/`. These are server-side endpoints that handle authentication, data fetching, and payment processing.

## API Routes

### Configuration & Diagnostics
- **[env-check](./env-check.md)** - Environment configuration status (read-only diagnostics)

### User Boards
- **[my-boards](./my-boards.md)** - Fetch all boards for authenticated user (production endpoint)
- **[my-boards/all](./my-boards-all.md)** - Diagnostic endpoint testing all square query variants
- **[my-boards/board](./my-boards-board.md)** - Fetch single board for authenticated user

### Payment Processing

#### PayPal
- **[paypal/create-order](./paypal-create-order.md)** - Create PayPal order for deposits
- **[paypal/capture-order](./paypal-capture-order.md)** - Capture PayPal order and update wallet

#### Stripe (Placeholder)
- **[stripe/create-checkout-session](./stripe-create-checkout-session.md)** - Placeholder for Stripe Checkout
- **[stripe/create-payment-intent](./stripe-create-payment-intent.md)** - Placeholder for Stripe Elements

### Wallet Management
- **[wallet/update-balance](./wallet-update-balance.md)** - Internal API for atomic wallet updates

## Authentication

### Firebase ID Token
Most routes require Firebase authentication via Bearer token:
```http
Authorization: Bearer <firebase-id-token>
```

### Exceptions (No Auth Required)
- `env-check` - Public diagnostic endpoint
- PayPal routes - Use X-User-ID header instead
- Stripe routes - Placeholder (not implemented)

## Common Response Patterns

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": 1702656000000
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Soft Fail (My Boards)
```json
{
  "success": true,
  "boards": [],
  "timestamp": 1702656000000
}
```
Returns empty array instead of error to prevent page crashes.

## HTTP Status Codes

- **200 OK** - Successful request
- **302 Redirect** - Redirect to external service (Stripe)
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Missing or invalid auth token
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

## Rate Limiting

No explicit rate limiting implemented. CloudFlare provides DDoS protection at CDN level.

## Caching

### My Boards Routes
```http
Cache-Control: private, max-age=60, stale-while-revalidate=120
```
- 60 second cache
- Allow stale for 120 seconds while revalidating

### Other Routes
No caching (dynamic data)

## Environment Variables

### Required for Production
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`

### Optional
- `PAYPAL_ENV` - "sandbox" or "live" (default: auto-detect from NODE_ENV)
- `PAYPAL_API_BASE_URL` - Custom PayPal endpoint
- `MY_BOARDS_FALLBACK` - Enable minimal response mode
- `NEXT_PUBLIC_BASE_URL` - Public base URL

## Security Considerations

### Input Validation
- All user inputs validated before processing
- Type checking on all parameters
- Amount precision validation (max 2 decimals)

### SQL Injection
Not applicable (NoSQL Firestore database)

### Authentication
- Firebase Admin SDK verifies ID tokens server-side
- No client-side token trust

### Sensitive Data
- PayPal credentials never exposed to client
- Firebase service account in environment only
- No credentials in response bodies

## Performance

### Parallel Fetching
My Boards route uses parallel fetching:
- Games fetched in batch (single getAll call)
- Teams fetched in batch
- Sweepstakes fetched in batch
- User wins queried in parallel

### Diff Checking
Payment routes use diff checking to avoid unnecessary Firestore writes.

## Error Handling

### Graceful Degradation
- My Boards: Returns empty array on error
- PayPal Capture: Returns partial success if wallet update fails
- Logs errors but doesn't expose internal details to client

### Retry Logic
- Not implemented at API route level
- Client responsible for retries
- PayPal capture uses idempotency for safe retries

## Related Documentation

- [Data Models](../data-models/) - Firestore collection structures
- [Business Rules](../business-rules/) - Business logic documentation
- [Cloud Functions](../functions/) - Firebase Cloud Functions (separate from API routes)

## Migration Notes

### Square Collection Migration
The `my-boards/all` endpoint exists to support migration from subcollection to top-level squares collection. See [Square Migration Guide](../migrations/square-userID-migration.md) for details.

### Payment Provider Migration
System currently uses PayPal. Stripe endpoints are placeholders for future migration. Both can coexist.
