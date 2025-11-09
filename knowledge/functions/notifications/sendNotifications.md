# sendNotifications

## Overview
Cloud Function that automatically sends multi-channel notifications (Email, SMS, Push) when a notification document is created in Firestore.

## Trigger
- **Type**: `onDocumentWritten`
- **Path**: `notifications/{notificationId}`
- **Region**: Default (us-central1)

## Flow

### 1. Initialization
- Initializes Resend email client using `functions.config().resend.api_key`
- Initializes Twilio SMS client if credentials are available
- Handles missing Twilio config gracefully (logs warning, continues)

### 2. Document Validation
- Checks if notification document exists (returns null if deleted)
- Validates `userID` field exists in notification data
- Fetches user document from `users/{userId}` collection

### 3. Email Notification (Resend)
- **Condition**: User has `email` field
- **From**: `SquarePicks <noreply@squarepicks.com>`
- **To**: User's email address
- **Subject**: Notification `title`
- **Body**: HTML formatted `message`
- **Error Handling**: Logs error, continues to other channels

### 4. SMS Notification (Twilio)
- **Condition**: User has `phoneNumber` AND Twilio client initialized
- **Requires**: `functions.config().twilio.phone_number` configured
- **Body**: `{title}: {message}`
- **Error Handling**: Logs error, continues to other channels

### 5. Push Notification (FCM)
- **Condition**: User has FCM tokens in `users/{userId}/fcmTokens` subcollection
- **Method**: `sendEachForMulticast` for batch delivery
- **Payload**:
  - `notification.title`: Notification title
  - `notification.body`: Notification message
  - `data.type`: Notification type
  - `data.relatedID`: Related entity ID
- **Token Cleanup**: Automatically deletes invalid/expired tokens after failed sends

## Notification Document Structure
```typescript
{
  userID: string,           // Required: User document ID
  tag: string,              // Notification category tag
  title: string,            // Notification title
  message: string,          // Notification message body
  type: string,            // Notification type (e.g., "winnings", "refund")
  relatedID: string,       // Related entity ID (transaction, board, etc.)
  boardId?: string,        // Optional: Board ID
  gameId?: string,         // Optional: Game ID
  isRead: boolean,         // Read status
  timestamp: Timestamp     // Server timestamp
}
```

## Error Handling
- Missing user: Logs error, returns null
- Email send failure: Logs error, continues
- SMS send failure: Logs error, continues
- FCM send failure: Logs error, cleans up invalid tokens
- All channels operate independently (failures don't block others)

## Dependencies
- **Resend**: Email delivery service
- **Twilio**: SMS delivery service
- **Firebase Admin SDK**: FCM push notifications
- **Firestore**: User data and FCM tokens

## Configuration
- `functions.config().resend.api_key`: Resend API key
- `functions.config().twilio.account_sid`: Twilio account SID
- `functions.config().twilio.auth_token`: Twilio auth token
- `functions.config().twilio.phone_number`: Twilio phone number

## Related Functions
- Creates notification documents: `handleBoardFull`, `onGameLiveCloseBoardsAndRefund`, `processQuarterPayoutsInTransaction`, `processWithdrawalReview`

