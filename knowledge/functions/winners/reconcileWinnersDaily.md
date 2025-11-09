# reconcileWinnersDaily

## Status
**Not Currently Implemented**

This function is referenced in requirements but does not exist in the current codebase.

## Proposed Implementation

A scheduled Cloud Function that runs daily to reconcile winners for games that may have been missed by the automatic `onGameUpdatedAssignWinners` trigger.

## Suggested Function Type
`onSchedule` (Scheduled Cloud Function)

## Suggested Schedule
Daily (e.g., 2:00 AM ET) to process previous day's games

## Proposed Logic

1. **Query Games Needing Reconciliation**
   - Find games with status "final" or `isOver === true`
   - Games from previous 24-48 hours
   - Games with scores but missing winner assignments

2. **Process Each Game**
   - Call `reconcileGameWinners()` for each game
   - Or replicate reconciliation logic inline

3. **Error Handling**
   - Log errors per game
   - Continue processing other games
   - Report summary of processed games

## Alternative Approaches

### Option 1: Scheduled Function
```javascript
exports.reconcileWinnersDaily = onSchedule({
  schedule: 'every day 02:00',
  timeZone: 'America/New_York'
}, async (event) => {
  // Query games needing reconciliation
  // Process each game
});
```

### Option 2: HTTP Endpoint
```javascript
exports.reconcileWinnersDaily = onRequest(async (req, res) => {
  // Can be called manually or via cron
});
```

### Option 3: Use Existing reconcileGameWinners
- Call `reconcileGameWinners` for multiple games
- Batch processing wrapper function

## Related Functions
- `reconcileGameWinners`: Manual reconciliation for single game
- `onGameUpdatedAssignWinners`: Automatic winner assignment (primary method)

## Implementation Considerations

### Query Strategy
- Find games with scores but missing winner assignments
- Check `board.winners.{period}.assigned` flags
- Process games from recent time window

### Performance
- Process games in batches
- Use parallel processing where possible
- Limit query scope to recent games

### Idempotency
- Safe to run multiple times
- Skips already-assigned periods
- Won't duplicate assignments

### Monitoring
- Log processed game count
- Report errors per game
- Track reconciliation success rate

## When to Implement

Consider implementing if:
- Automatic triggers occasionally miss assignments
- Need backup reconciliation process
- Want scheduled batch processing
- Manual reconciliation becomes frequent

## Current Workaround

Use `reconcileGameWinners` manually for individual games as needed.

