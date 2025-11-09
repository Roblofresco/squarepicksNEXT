# Admin & Testing Functions

This directory contains documentation for administrative and testing Cloud Functions.

## Functions

### 1. [processWithdrawalReview](./processWithdrawalReview.md)
Admin-only function for reviewing and processing withdrawal requests. Supports approval (PayPal payout) or rejection (balance refund).

**Key Features:**
- Admin authentication required
- PayPal payout processing
- Balance refund on rejection
- User notifications

### 2. [stageGamesForLiveView](./stageGamesForLiveView.md)
HTTP testing function that stages specific games with live status and scores for UI testing.

**Key Features:**
- Hardcoded game IDs and scores
- Simulates live game states
- Updates board statuses
- No authentication required (testing only)

### 3. [fillBoardSquaresForTesting](./fillBoardSquaresForTesting.md)
HTTP testing function that fills board squares for UI testing. Updates board selected_indexes and creates square documents.

**Key Features:**
- Fills all 100 squares
- Creates square documents for test user
- Batch operations for efficiency
- No authentication required (testing only)

### 4. [resetAndTriggerWinnersHttp](./resetAndTriggerWinnersHttp.md)
HTTP testing function that resets quarter score fields and re-triggers winner assignment.

**Key Features:**
- Re-triggers winner assignment without changing scores
- Useful for testing and debugging
- Idempotent operation
- No authentication required (testing only)

### 5. [reconcileGameWinners](./reconcileGameWinners.md)
Callable function that manually reconciles winners for a single game. Processes all boards and assigns winners for unassigned periods.

**Key Features:**
- Manual reconciliation
- Handles all periods (Q1, Q2, Q3, Final)
- Idempotent (skips already-assigned periods)
- Useful for data recovery

### 6. [liveUpdateGameOnce](./liveUpdateGameOnce.md)
Callable function that performs a single-cycle live update for one game from ESPN API.

**Key Features:**
- Updates game status and scores
- Fetches quarter scores
- Error-tolerant (continues on partial failures)
- Manual game updates

## Function Categories

### Admin Functions
- **processWithdrawalReview**: Admin-only, production use
- **reconcileGameWinners**: Admin/operator use, production use
- **liveUpdateGameOnce**: Admin/operator use, production use

### Testing Functions
- **stageGamesForLiveView**: Testing only, should not be used in production
- **fillBoardSquaresForTesting**: Testing only, should not be used in production
- **resetAndTriggerWinnersHttp**: Testing only, should not be used in production

## Security Notes

- **Admin Functions**: Require authentication; `processWithdrawalReview` requires admin role
- **Testing Functions**: No authentication; should be disabled in production
- **Hardcoded Values**: Testing functions use hardcoded IDs/values

## Use Cases

### Production
- Review and process withdrawals
- Manually reconcile winners
- Force update game data

### Development/Testing
- Stage games for UI testing
- Fill boards for testing
- Re-trigger winner assignment
- Test game update logic

## Related Documentation

- [Winner Assignment Functions](../winners/)
- [Game Update Functions](../game/)
- [Transaction Data Model](../../data-models/transactions.md)

