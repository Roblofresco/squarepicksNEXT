# Function: checkSweepstakesParticipation (Callable)

## Purpose
Determines whether the authenticated user has already participated in a given sweepstakes.

## Trigger / Access
- Firebase Callable Function: `httpsCallable(functions, 'checkSweepstakesParticipation')`
- Region: `us-east1`

## Caller (UI)
- `src/components/lobby/sweepstakes/SweepstakesBoardCard.tsx`

## Payload
```json
{ "sweepstakesID": "string" }
```

## Returns
```json
{ "isParticipant": true }
```

## Notes
- Prevents duplicate free entries.

