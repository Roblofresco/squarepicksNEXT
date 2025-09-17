# Function: verifyLocationFromCoords (Callable)

## Purpose
Verifies a user's geolocation eligibility based on provided coordinates during wallet setup.

## Trigger / Access
- Firebase Callable Function: `httpsCallable(functions, 'verifyLocationFromCoords')`
- Region: `us-east1`

## Caller (UI)
- `src/app/wallet-setup/location/page.tsx`

## Payload
```json
{ "lat": 33.749, "lng": -84.388 }
```

## Returns
```json
{ "eligible": true, "state": "GA" }
```

## Notes
- Used to gate wallet setup flows by state.

