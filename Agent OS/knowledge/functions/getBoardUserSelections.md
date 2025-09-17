# Function: getBoardUserSelections (Callable)

## Purpose
Fetches the set of square indexes selected by the authenticated user on a given board.

## Trigger / Access
- Firebase Callable Function: `httpsCallable(functions, 'getBoardUserSelections')`
- Region: `us-east1`

## Caller (UI)
- `src/components/lobby/sweepstakes/SweepstakesBoardCard.tsx`

## Payload
```json
{ "boardID": "string" }
```

## Returns
```json
{ "selectedIndexes": [0, 3, 75] }
```

## Notes
- Uses auth context of the callable; no explicit userId required.

