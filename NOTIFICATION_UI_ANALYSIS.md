# Notification UI Component Analysis & Revision Plan

## Current State Analysis

### Files Involved:
1. `src/components/notifications/NotificationItem.tsx` - Individual notification display
2. `src/components/notifications/NotificationList.tsx` - Notification list container
3. `src/context/NotificationContext.tsx` - Data fetching and state management
4. `src/components/notifications/NotificationIcon.tsx` - Notification trigger/icon

---

## What's Currently in Place

### NotificationItem.tsx (Lines 38-109)
**Currently Displays:**
- ✅ Icon (based on `notification.type`)
- ✅ Message text only (`notification.message`) - Line 96
- ✅ Timestamp (formatted relatively)
- ✅ Unread indicator (dot)
- ✅ Click handler (marks as read, navigates via `notification.link`)

**Missing:**
- ❌ **Title display** - `notification.title` exists in data but not shown
- ❌ **Type/Tag display** - `notification.type` used for icon only, not shown as text
- ❌ **See more/expandable** - No handling for long content
- ❌ **Slide-to-reveal actions** - No swipe functionality
- ❌ **View button** - No navigation button to My Boards/Wallet
- ❌ **Delete button** - No delete functionality

### NotificationContext.tsx (Lines 14-82)
**Currently Fetches:**
- ✅ `message` (Line 75)
- ✅ `title` (Line 76) - **FETCHED but NOT USED in display**
- ✅ `type` (Line 80) - **FETCHED but only used for icon selection**
- ✅ `isRead`, `timestamp`, `link`, `relatedID`

**Missing from Interface:**
- ❌ `tag` field (not fetched, but exists in Firestore)
- ❌ `boardId` field (not fetched, but exists in Firestore)
- ❌ `gameId` field (not fetched, but exists in Firestore)

**Notification Interface (Lines 14-24):**
```typescript
export interface Notification {
  id: string;
  message: string;
  title?: string; // ✅ Optional, exists
  timestamp: Date;
  isRead: boolean;
  link?: string;
  type?: string; // ✅ Exists but not used for display
  relatedID?: string;
  // Missing: tag, boardId, gameId
}
```

### NotificationList.tsx
**Currently Has:**
- ✅ Header with "Mark all as read" and close button
- ✅ Loading state
- ✅ Empty state
- ✅ Scrollable list container

**Missing:**
- ❌ No per-item delete action (needs slide-to-reveal)

---

## What Needs to Be Implemented

### 1. Update Notification Interface & Context
**File:** `src/context/NotificationContext.tsx`

**Changes:**
- Add `tag`, `boardId`, `gameId` to Notification interface
- Fetch `tag`, `boardId`, `gameId` from Firestore in mapping (Lines 71-82)
- Add `deleteNotification` function to context

### 2. Enhanced NotificationItem Component
**File:** `src/components/notifications/NotificationItem.tsx`

**Required Features:**

#### A. Display Structure
```
┌─────────────────────────────────────┐
│ [Icon] TYPE: "Board Entry"          │ ← New: Show type/tag
│       Title: "$5 - Texans @ Colts"   │ ← New: Show title
│                                     │
│       Message: "Your square entry..."│ ← Existing (enhanced)
│       [See more...]                 │ ← New: Expandable
│                                     │
│       8s ago                        │ ← Existing
└─────────────────────────────────────┘
         ↓ Slide Left
┌─────────────────────────────────────┐
│ [Icon] TYPE: "Board Entry"          │
│       Title: "$5 - Texans @ Colts"   │
│       Message: "Your square entry..."│
│       8s ago                        │
│                                     │
│ [VIEW]        [DELETE]              │ ← New: Slide actions
└─────────────────────────────────────┘
```

#### B. Display Type/Tag
- Show `notification.tag` or `notification.type` as a label/badge
- Format: "TYPE: [tag/type]" or badge style

#### C. Display Title
- Show `notification.title` prominently above message
- Style: Bold or larger font, distinct from message

#### D. Expandable Message ("See More")
- If message exceeds ~2-3 lines, truncate with ellipsis
- Add "See more" / "See less" toggle button
- Expand to show full message

#### E. Slide-to-Reveal Actions (Swipe Left)
- Implement horizontal slide/swipe gesture
- **User swipes notification item LEFT** to reveal action buttons on the right side
- On slide left: Notification content moves left (translateX: -160px), action buttons become visible on right
- Touch events: `onTouchStart`, `onTouchMove`, `onTouchEnd` to track swipe distance
- Snap behavior: If swiped left >50px, snap to open (-160px). Otherwise, snap back to closed (0px)
- Actions (revealed when swiped left, positioned on right side):
  - **View Button** (leftmost when revealed): Navigate based on notification type:
    - `tag: "board_*"` or `boardId` exists → `/my-boards`
    - `tag: "deposit"`, `tag: "withdrawal"`, `tag: "refund"` → `/wallet`
    - Other types → No view button or use existing `link`
  - **Delete Button** (rightmost when revealed): Remove notification from Firestore

#### F. Navigation Logic
```javascript
const getViewDestination = (notification: Notification) => {
  if (notification.tag) {
    if (notification.tag.startsWith('board_') || notification.boardId) {
      return '/my-boards';
    }
    if (['deposit', 'withdrawal', 'refund'].includes(notification.tag)) {
      return '/wallet';
    }
  }
  return notification.link || null; // Fallback to existing link
};
```

### 3. Delete Notification Function
**File:** `src/context/NotificationContext.tsx`

**Add:**
```typescript
deleteNotification: (notificationId: string) => Promise<void>;
```

**Implementation:**
- Delete document from Firestore `notifications` collection
- Optimistic UI update
- Handle errors gracefully

---

## Implementation Approach

### Option A: React + CSS Transforms (Simpler)
- Use `transform: translateX()` for slide animation
- Touch event handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`)
- State: `translateX` value, `isExpanded` for message

### Option B: Framer Motion (Enhanced)
- Use `framer-motion` for smooth animations (already in project)
- `AnimatePresence` for enter/exit animations
- Gesture handlers for swipe detection

### Option C: Existing UI Library (if available)
- Check if project has swipe component library
- Use existing patterns if found

---

## Technical Requirements

### Gesture Handling
- Touch events for mobile
- Mouse drag for desktop (optional)
- Minimum swipe distance threshold (~50px)
- Snapping to open/closed positions

### Accessibility
- Keyboard navigation (Tab to focus, Enter to activate)
- ARIA labels for action buttons
- Screen reader announcements for actions

### Performance
- Virtual scrolling for long lists (if needed)
- Debounce on swipe gestures
- Optimistic UI updates for delete

---

## File Changes Summary

1. **`src/context/NotificationContext.tsx`**
   - Update `Notification` interface (add `tag`, `boardId`, `gameId`)
   - Update Firestore mapping to fetch new fields
   - Add `deleteNotification` function

2. **`src/components/notifications/NotificationItem.tsx`**
   - Add type/tag display
   - Add title display
   - Add expandable message ("See more")
   - Add slide-to-reveal functionality
   - Add View button with navigation logic
   - Add Delete button
   - Update click handler to prevent navigation on action button clicks

3. **`src/components/notifications/NotificationList.tsx`**
   - Minor styling adjustments if needed for new item layout
   - Ensure scroll behavior works with expanded items

---

## Navigation Mapping

### Notification Tags → Routes:
- `board_full` → `/my-boards`
- `board_active` → `/my-boards`
- `board_entry` → `/my-boards`
- `board_unfilled` → `/my-boards`
- `winnings` → `/my-boards` (winner notifications)
- `refund` → `/wallet`
- `deposit` → `/wallet`
- `withdrawal` → `/wallet`

---

## Design Considerations

### Message Expansion
- Default: ~2-3 lines (max ~120 characters visible)
- Expanded: Full message with scroll if very long
- Toggle text: "See more" / "See less"

### Slide Action
- Swipe left threshold: ~50px
- Action button width: ~80px each (160px total for both)
- Snap positions: 0px (closed), -160px (open)
- Animation duration: 200-300ms

### Visual Hierarchy
1. Type/Tag (small badge/label)
2. Title (bold, larger font)
3. Message (regular text, expandable)
4. Timestamp (small, muted)
5. Actions (hidden until slide)

