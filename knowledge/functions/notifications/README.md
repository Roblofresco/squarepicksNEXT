# Notification & Sweepstakes Functions

This directory contains documentation for notification and sweepstakes-related Cloud Functions.

## Functions

### 1. [sendNotifications](./sendNotifications.md)
Multi-channel notification delivery system. Automatically sends Email (Resend), SMS (Twilio), and Push (FCM) notifications when notification documents are created.

**Key Features:**
- Email delivery via Resend
- SMS delivery via Twilio
- Push notifications via Firebase Cloud Messaging
- Automatic token cleanup for invalid FCM tokens

### 2. [handleBoardFull](./handleBoardFull.md)
Processes boards when they reach 100 selected squares. Assigns random axis numbers, updates square documents, creates notifications, and optionally creates new open boards.

**Key Features:**
- Random number assignment for home/away axes
- Square document updates with X-Y coordinates
- Participant notifications
- Automatic new board creation (if game not live)

### 3. [onGameLiveCloseBoardsAndRefund](./onGameLiveCloseBoardsAndRefund.md)
Handles board lifecycle when games go live. Closes unfilled boards with refunds, activates full boards, and sends notifications.

**Key Features:**
- Unfilled board closure and refunds (paid boards)
- Sweepstakes board cancellation (free boards)
- Full board activation
- Participant notifications for all scenarios

### 4. [processQuarterPayoutsInTransaction](./processQuarterPayoutsInTransaction.md)
Helper function that processes per-quarter payouts within a Firestore transaction. Pays winners immediately and creates winnings notifications.

**Key Features:**
- Atomic payout processing
- Equal distribution among winners
- Transaction and balance updates
- Winnings notifications

### 5. [closeOldSweepstakesHttp](./closeOldSweepstakesHttp.md)
HTTP function that automatically closes sweepstakes when their associated games end. Checks active sweepstakes and closes those with finished games.

**Key Features:**
- Automatic sweepstakes closure
- Game status checking
- Batch updates for efficiency
- HTTP endpoint for manual/scheduled execution

## Notification Flow

1. **Board Fills** → `handleBoardFull` creates notifications
2. **Game Goes Live** → `onGameLiveCloseBoardsAndRefund` creates notifications
3. **Quarter Ends** → `processQuarterPayoutsInTransaction` creates notifications
4. **Sweepstakes Ends** → `closeOldSweepstakesHttp` closes sweepstakes
5. **All Notifications** → `sendNotifications` delivers via Email/SMS/Push

## Notification Types

- `board_full` / `sweepstakes_full`: Board filled, numbers assigned
- `board_active` / `sweepstakes_active`: Board activated, game live
- `refund`: Unfilled board refund
- `sweepstakes_unfilled`: Sweepstakes board canceled
- `winnings`: Quarter/final winnings paid
- `withdrawal`: Withdrawal approved/rejected

## Related Documentation

- [Notification Data Model](../../data-models/notifications.md)
- [Sweepstakes Data Model](../../data-models/sweepstakes.md)
- [Board Lifecycle](../../business-rules/board-lifecycle.md)

