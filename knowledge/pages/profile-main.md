# Profile Page: Main Profile

**Route:** `/profile`

**Purpose:** Main user profile dashboard displaying user information, balance, quick actions, and navigation to account settings and support resources. Acts as the central hub for user account management.

---

## Components Used

### UI Components
- `Button` - Action buttons
- `Dialog`, `DialogContent`, `DialogDescription`, `DialogHeader`, `DialogTitle` - Login modal
- `User`, `Mail`, `DollarSign`, `Settings`, `ShieldCheck`, `Scale`, `LogOut`, `Info`, `HelpCircle`, `BookOpen`, `FileText`, `ArrowRight`, `Edit2`, `Loader2` - Icons from lucide-react

### Custom Components
- `AuthGuard` - Protects route with authentication check
- `BottomNav` - Bottom navigation bar
- `HeroText` - Animated text component for menu items

### Animation
- `motion`, `AnimatePresence` from `framer-motion` - Page animations

### Context/Hooks
- `useWallet` - Provides `userId`, `emailVerified`, `isLoading`
- `useRouter` - Navigation
- `Image` (from next/image) - Profile photo display

---

## APIs Called

### Firebase Auth
1. **`signOut(auth)`**
   - Logs out the current user
   - Called when user clicks "Logout" button

### Firebase Firestore
1. **`getDoc(doc(db, 'users', userId))`**
   - Fetches user profile data
   - Returns:
     - `display_name`
     - `email`
     - `balance`
     - `totalWinnings`
     - `gamesPlayed`
     - `photoURL` (profile picture)

---

## Data Flow

### 1. **Initial Load & Auth Check**
```
Page Load
↓
Check userId & emailVerified from useWallet
↓
If !userId → Redirect to /login
If emailVerified === false → Redirect to /verify-email
↓
If userId && emailVerified === true → Fetch user profile
```

### 2. **Profile Data Loading**
```
User authenticated
↓
Fetch user document from Firestore
↓
Extract profile fields:
  - username (display_name)
  - email
  - balance
  - totalWinnings
  - gamesPlayed
  - photoURL
↓
Display profile card with user info
```

### 3. **Navigation Actions**
```
User clicks menu item → Navigate to target page
User clicks Wallet → Show loading state → Navigate to /wallet
User clicks Logout → Sign out → Redirect to /
User clicks Account Settings → Navigate to /profile/settings
User clicks support/info link → Navigate to respective page
```

### 4. **Profile Photo Edit**
```
User hovers over profile photo → Show edit overlay
User clicks edit button → Open file picker
User selects image → Preview locally (not yet uploaded)
```

---

## Key Features

### 1. **Profile Card**
- Profile photo (or placeholder if none)
- Username display
- Email display
- Balance with "Wallet" quick link
- Edit profile photo overlay on hover

### 2. **Menu Sections**

**Account Section:**
- Account Settings link
- Logout button (red, destructive style)

**Information & Support Section:**
- How to Play
- Account Guide
- FAQ
- Terms & Conditions
- Privacy Policy
- Responsible Gaming
- Contact Support

### 3. **Auth Guards**
- Wrapped in `AuthGuard` with email verification requirement
- Redirects to login if not authenticated
- Redirects to verify-email if email not verified

### 4. **Bottom Navigation**
- `BottomNav` component rendered at bottom
- Handles protected actions (shows login modal if not authenticated)

### 5. **Login Modal**
- Opens for protected actions when not authenticated
- Provides options to:
  - Login
  - Sign Up

### 6. **Wallet Loading State**
- Shows spinner when navigating to wallet
- 900ms delay before navigation (for smooth transition)

---

## State Management

### Local State
```typescript
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
const [profileLoading, setProfileLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
const [isWalletLoadingState, setIsWalletLoadingState] = useState(false);
```

### Context State (via useWallet)
```typescript
const { userId, emailVerified, isLoading } = useWallet();
```

---

## Menu Configuration

### Account Menu
```typescript
const accountMenuItems = [
  { href: "/profile/settings", icon: Settings, label: "Account Settings" },
];
```

### Support Menu
```typescript
const supportMenuItems = [
  { href: "/information-and-support/how-to-play", icon: HelpCircle, label: "How to Play" },
  { href: "/information-and-support/account-guide", icon: BookOpen, label: "Account Guide" },
  { href: "/information-and-support/faq", icon: Info, label: "FAQ" },
  { href: "/information-and-support/terms", icon: FileText, label: "Terms & Conditions" },
  { href: "/information-and-support/privacy", icon: ShieldCheck, label: "Privacy Policy" },
  { href: "/information-and-support/responsible-gaming", icon: Scale, label: "Responsible Gaming" },
  { href: "/contact-support", icon: Mail, label: "Contact Support" },
];
```

---

## Visual Design

### Profile Card
- Gradient background
- Border with white/opacity
- Backdrop blur effect
- Glassmorphic design
- Box shadow for depth

### Menu Items
- Gradient card containers
- Dividers between items
- Hover scale effect
- Active scale-down effect
- Icon color transitions on hover
- Underline on hover/focus
- Arrow indicators on right

### Profile Photo
- Circular (20px / 24px on small screens)
- Edit overlay on hover
- "Edit Photo" text with icon
- File input hidden (triggered by button)

---

## Error Handling

1. **User Data Not Found**
   - Display error message
   - Fallback to basic data from Auth
   - Show "Go to Homepage" button

2. **Failed to Load Profile**
   - Log error to console
   - Display error message
   - Fallback to basic profile data

3. **Not Authenticated**
   - Redirect to login

4. **Email Not Verified**
   - Redirect to verify-email

---

## Loading States

1. **Initial Auth Load**
   - Full-page spinner
   - "Redirecting..." message

2. **Profile Data Load**
   - Full-page spinner
   - "Loading profile..." message

3. **Wallet Navigation Load**
   - Button shows spinner
   - Button text hidden during load

---

## Accessibility

- Profile photo edit button has aria-label
- File input has aria-label
- Hidden file input (uses ref for triggering)
- Keyboard navigation support for all menu items
- Focus ring on interactive elements
- Screen reader-friendly structure

---

## Security Considerations

- User can only view their own profile (enforced by userId check)
- Firestore rules must enforce user document access
- Email verification required for access
- Authentication required for all actions
- Logout properly clears auth state

