# Profile Page: Notifications

**Route:** `/profile/notifications`

**Purpose:** Allows users to manage their notification preferences, specifically enabling or disabling push notifications for game updates and winnings.

---

## Components Used

### UI Components
- `Button`, `Label`, `Switch` - Form controls
- `Alert`, `AlertDescription` - Alert messages
- `BellRing`, `Loader2` - Icons from lucide-react

### Custom Components
- `HeroText` - Animated text for heading
- `Breadcrumbs` - Navigation breadcrumbs
- `AuthGuard` - Route protection

### Animation
- `motion` from `framer-motion` - Page animations

### Context/Hooks
- `useAuthGuard` - Provides `user`, `loading`, `isAuthenticated`

---

## APIs Called

### Firebase Firestore
1. **`getDoc(doc(db, 'users', user.uid, 'preferences', 'notifications'))`**
   - Fetches user's notification preferences
   - Returns `pushNotifications` boolean

2. **`setDoc(doc(db, 'users', user.uid, 'preferences', 'notifications'), prefs, { merge: true })`**
   - Saves notification preferences
   - Creates default preferences if they don't exist
   - Merges with existing data

### Browser APIs
1. **`Notification.permission`**
   - Checks current browser notification permission
   - Values: `'default'`, `'granted'`, `'denied'`

2. **`Notification.requestPermission()`**
   - Requests browser notification permission from user
   - Returns promise resolving to permission status

---

## Data Flow

### 1. **Initial Load**
```
Page Load
↓
Check if push notifications supported:
  - 'Notification' in window
  - 'serviceWorker' in navigator
  - 'PushManager' in window
↓
If not supported → Set isPushSupported = false
↓
Get current device permission (Notification.permission)
↓
If user authenticated → Load preferences from Firestore
```

### 2. **Load Preferences**
```
User authenticated
↓
Fetch preferences document from Firestore
↓
If exists → Load saved preferences
If not exists → Create default preferences (pushNotifications: false)
↓
Display current state in UI
```

### 3. **Enable Push Notifications**
```
User toggles switch to ON
↓
Check if push supported
↓
Check device permission:
  - If 'default' → Request permission
  - If 'granted' → Proceed
  - If 'denied' → Show error
↓
If permission granted:
  - Update local state
  - Save to Firestore
  - Show success message
↓
If permission denied:
  - Show error with instructions
```

### 4. **Disable Push Notifications**
```
User toggles switch to OFF
↓
Update local state (pushNotifications: false)
↓
Save to Firestore
↓
Show success message
```

---

## Key Features

### 1. **Push Notification Support Detection**
- Checks for browser support
- Checks for Service Worker support
- Checks for Push Manager support
- Shows alert if not supported

### 2. **Permission States**

**Default (Not Asked):**
- Show alert explaining benefits
- Show "Enable Device Notifications" button
- Clicking requests browser permission

**Granted:**
- Show toggle switch
- Allow enable/disable of push notifications

**Denied:**
- Show alert explaining notifications are blocked
- Instruct user to enable in browser settings

### 3. **Preference Saving**
- Automatically saves on toggle
- Shows "Saving..." message during save
- Shows success/error feedback

### 4. **Error Handling**
- Failed to load preferences
- Failed to save preferences
- Permission denied
- Browser not supported

---

## State Management

### Local State
```typescript
const [saving, setSaving] = useState(false);
const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);
const [devicePermission, setDevicePermission] = useState<NotificationPermission>('default');
const [isEnabling, setIsEnabling] = useState(false);
const [isPushSupported, setIsPushSupported] = useState(true);
```

### Auth State (via useAuthGuard)
```typescript
const { user, loading, isAuthenticated } = useAuthGuard(true);
```

---

## Notification Preferences Type

```typescript
type NotificationPrefs = {
  pushNotifications: boolean;
}

const defaultPrefs: NotificationPrefs = {
  pushNotifications: false;
};
```

---

## UI States

### Loading State
- Full-page spinner
- "Loading notifications..." message

### Push Not Supported
- Alert message
- No toggle switch shown

### Permission Default
- Info alert explaining benefits
- "Enable Device Notifications" button
- No toggle switch

### Permission Denied
- Alert message explaining blocked status
- Instructions to enable in settings
- No toggle switch

### Permission Granted
- Toggle switch enabled
- Description text
- Save indicator when saving

---

## Permission Request Flow

```
User clicks "Enable Device Notifications"
↓
setIsEnabling(true)
↓
Call Notification.requestPermission()
↓
Browser shows permission dialog
↓
User grants/denies
↓
Update devicePermission state
↓
If granted:
  - Set pushNotifications = true
  - Save to Firestore
  - Show success message
If denied:
  - Show error with instructions
↓
setIsEnabling(false)
```

---

## Breadcrumbs

- Back href: `/profile`
- Ellipsis only mode
- No history navigation

---

## Security Considerations

- Preferences stored in subcollection: `users/{userId}/preferences/notifications`
- Only user can read/write their own preferences
- Firestore rules must enforce access control
- Email verification required

---

## Browser Compatibility

### Required Features
- `Notification` API
- `ServiceWorker` API
- `PushManager` API

### Fallback
- If not supported, shows alert
- Disables all notification features
- User cannot enable notifications

---

## Animations

- Page fade-in with framer-motion
- Duration: 0.3s
- Opacity transition

---

## Messages

### Errors
- "Push notifications are not supported on this device."
- "Please enable notifications in your browser settings."
- "Notifications are blocked. Enable them in your browser settings to receive updates."
- "Could not enable notifications. Please try again."
- "Unable to load your preferences. Please try refreshing the page."
- "Failed to save preferences"

### Success
- "Preferences saved"
- "Notifications enabled successfully"

