# Notification Components

## NotificationIcon.tsx
**Purpose**: Bell icon with unread count badge that opens notification list.
**Props**: None (uses NotificationContext).

**User Interactions**:
- Click bell icon to toggle notification list
- View unread count badge (shows "9+" if more than 9)
- Loading spinner during initial data fetch

**APIs Called**: 
- Uses `useNotifications` hook which queries Firestore for user notifications

**Used in**:
- App header
- Main navigation bar
- Any location needing quick notification access

**Key Features**:
- Unread count badge with glow effect
- Disabled state during loading
- Loading spinner animation
- Dropdown notification list on click
- Click-outside-to-close behavior
- Responsive positioning (right-aligned)
- Z-index layering for dropdown

---

## NotificationItem.tsx
**Purpose**: Individual notification card with swipe-to-action functionality.
**Props**:
- `notification` (Notification): Notification data including:
  - `id` (string): Unique identifier
  - `title` (string): Notification title
  - `message` (string): Notification body
  - `type` (string): Notification type
  - `tag` (string): Category tag
  - `timestamp` (Date | string): Creation time
  - `isRead` (boolean): Read status
  - `link` (string): Navigation link
  - `boardId` (string): Associated board ID

**User Interactions**:
1. **Swipe/Drag**: 
   - Swipe left to reveal action buttons (View, Delete)
   - Swipe right to close actions and mark as read
   - Mouse drag support for desktop
2. **Click**: Mark as read (when actions not open)
3. **See more/less**: Expand/collapse long messages
4. **View**: Navigate to relevant page
5. **Delete**: Remove notification

**APIs Called**:
- `markAsRead(id)` from NotificationContext
- `deleteNotification(id)` from NotificationContext
- Navigation via Next.js router

**Used in**:
- NotificationList component
- Individual notification display

**Key Features**:
- **Smart Navigation**:
  - Board-related tags → `/my-boards`
  - Wallet tags → `/wallet`
  - Falls back to notification link or boardId
- **Icon Selection**: 
  - Different icons for game alerts, wallet, achievements, messages, etc.
  - Error notifications use red color
- **Swipe Actions**:
  - Left swipe: Reveals View + Delete buttons
  - Right swipe: Closes actions, marks as read
  - Threshold-based snapping (50px)
  - Maximum slide distances (160px left, 30px right)
- **Visual States**:
  - Unread: Bright colors, blue dot indicator
  - Read: Muted colors, no indicator
  - Sweepstakes: Gold accent color instead of blue
- **Message Truncation**: 
  - Truncates at 120 characters
  - "See more/less" toggle for long messages
- **Relative Timestamps**: 
  - "just now", "5s ago", "3m ago", "2h ago", "yesterday", "7d ago"
- **Tag Formatting**: 
  - Converts snake_case to Title Case
  - Displays as colored badge
- **Drag Behavior**:
  - Touch and mouse support
  - Prevents body scroll during drag
  - Smooth transitions when not dragging

**Notification Types & Icons**:
- `board_*`: Calendar icon
- `deposit/withdrawal/refund`: Wallet icon
- `winnings`: Award icon
- `game_alert/game_start`: Calendar icon
- `new_message`: Message icon
- `account_update`: Settings icon
- `social/friend_request`: Users icon
- `error`: Alert circle (red)
- Default: Circle dot

---

## NotificationList.tsx
**Purpose**: Dropdown container listing all notifications with header and empty state.
**Props**:
- `onClose` (fn): Close handler for dropdown

**User Interactions**:
- Scroll through notifications
- Click "Mark all as read" button
- Click X to close dropdown
- Click outside to close dropdown

**APIs Called**:
- `markAllAsRead()` from NotificationContext
- Uses notification data from context

**Used in**:
- Opened by NotificationIcon
- Notification dropdown panel

**Key Features**:
- **Header**:
  - "Notifications" title
  - "Mark all as read" link (only shown if unread notifications exist)
  - Close button (X icon)
- **Loading State**:
  - Spinner with "Loading notifications..." message
  - 3 skeleton placeholders (animated pulse)
- **Empty State**:
  - Inbox icon
  - "No new notifications" heading
  - "You're all caught up!" message
- **Notification List**:
  - Scrollable area with custom scrollbar
  - Max height: 80vh
  - Renders NotificationItem components
- **Styling**:
  - Glass morphism background (bg-slate-800, backdrop-blur)
  - Border with accent color
  - Shadow with accent glow
  - Rounded corners
- **Click-Outside-to-Close**:
  - Automatically closes when clicking outside
  - Uses document event listener
- **Responsive**:
  - Mobile: 92vw width
  - Desktop: 96px max width (sm:w-96)
  - Max height adapts to viewport

---

## NotificationContext Integration

All notification components rely on the `NotificationContext` which provides:

**State**:
- `notifications` (Notification[]): Array of all notifications
- `unreadCount` (number): Count of unread notifications
- `isLoading` (boolean): Loading state

**Methods**:
- `markAsRead(id: string)`: Mark single notification as read
- `markAllAsRead()`: Mark all notifications as read
- `deleteNotification(id: string)`: Delete a notification

**Firestore Structure**:
```
/users/{userId}/notifications/{notificationId}
{
  title: string
  message: string
  type: string
  tag: string
  timestamp: Timestamp
  isRead: boolean
  link?: string
  boardId?: string
}
```

**Real-time Updates**:
- Uses Firestore `onSnapshot` listener
- Automatically updates when notifications change
- Sorted by timestamp descending (newest first)

