# Function: enterBoard (Callable)

## Purpose
Processes an entry for a board: validates user, balance, square availability, writes the square, updates the board, and creates transactions/notifications.

## Trigger / Access
- Firebase Callable Function: `httpsCallable(functions, 'enterBoard')`
- Region: `us-east1`

## Callers (UI)
- `src/app/game/[gameId]/page.tsx` – confirm selection flow
- `src/components/lobby/QuickEntrySelector.tsx` – quick entry confirm
- `src/components/lobby/sweepstakes/SweepstakesBoardCard.tsx` – sweepstakes entry

## Payload
```json
{
  "boardId": "string",
  "selectedNumber": 42,
  "selectedSquareIndexes": [0,1,2]
}
```

Note: Only one of `selectedNumber` or `selectedSquareIndexes` is used depending on UI path.

## Returns
```json
{ "success": true, "message": "ok" }
```

## Side Effects
- Writes document in `boards/{boardId}/squares`
- Updates `boards.selected_indexes`
- Creates `transactions` record (type: purchase or promo)
- Creates `notifications` record

## Notes
- For sweepstakes, enforces free-entry rule and participant checks.

