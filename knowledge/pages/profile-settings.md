# Profile Page: Account Settings

**Route:** `/profile/settings`

**Purpose:** Main account settings page allowing users to update display name, phone number, and view email. Provides navigation to change password and edit personal details.

---

## Components Used

### UI Components
- `Button`, `Input`, `Label` - Form components
- `Loader2`, `AlertCircle`, `Save`, `KeyRound`, `User`, `Shield`, `ArrowRight`, `X` - Icons from lucide-react
- `Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage` - Form components

### Custom Components
- `Breadcrumbs` - Navigation breadcrumbs
- `AuthGuard` - Route protection

### Form Management
- `useForm` from `react-hook-form` - Form state
- `zodResolver` from `@hookform/resolvers/zod` - Validation
- `zod` - Schema validation

### Context/Hooks
- `useAuth` - Provides `user`, `loading`, `reauthenticate`, `updateEmailAddress`

---

## APIs Called

### Firebase Firestore
1. **`getDoc(doc(db, 'users', user.uid))`**
   - Fetches user profile data
   - Returns `display_name`, `phone`, `email`

2. **`setDoc(doc(db, 'users', user.uid), { display_name, phone }, { merge: true })`**
   - Updates display name and phone
   - Merges with existing data

3. **`setDoc(doc(db, 'users', user.uid), { email: newEmail }, { merge: true })`**
   - Updates email in Firestore after successful email change

### Firebase Auth (via useAuth context)
1. **`updateEmailAddress(newEmail, currentPassword)`**
   - Context method that:
     - Reauthenticates user with current password
     - Updates email in Firebase Auth
     - May send verification email

---

## Data Flow

### 1. **Initial Load**
```
Page Load
↓
Check auth state from useAuth
↓
If !user → Component handles internally (loading state)
↓
Fetch user profile data from Firestore
↓
Pre-fill form with:
  - display_name → displayName field
  - phone → phone field
  - email → read-only display
↓
Reset form with fetched values
```

### 2. **Update Display Name/Phone**
```
User modifies displayName or phone
↓
Form validates in real-time (onChange mode)
↓
User clicks "Save Changes"
↓
Validate form (displayName: 3-30 chars)
↓
Update Firestore user document
↓
Update local profileData state
↓
Show success message
↓
Reset form dirty state
```

### 3. **Change Email Flow**
```
User clicks "Change Email" button
↓
Open change email modal
↓
User enters:
  - New email address
  - Current password (for verification)
↓
User clicks "Update Email"
↓
Call updateEmailAddress(newEmail, currentPassword)
  - Reauthenticates with password
  - Updates email in Firebase Auth
  - Updates email in Firestore
↓
Show success message
↓
Close modal
↓
Update local profileData
```

---

## Key Features

### 1. **Editable Fields**
- **Display Name:**
  - Minimum 3 characters
  - Maximum 30 characters
  - Real-time validation

- **Phone Number:**
  - Optional field
  - Format validation can be added

### 2. **Read-Only Email**
- Email displayed but not editable inline
- Lock icon indicator
- "Email changes are handled separately for security" note

### 3. **Change Email Modal**
- Requires new email and current password
- Validates password before allowing change
- Handles errors:
  - Wrong password
  - Email already in use
  - Invalid email format

### 4. **Security Section**
- Links to:
  - Change Password (`/profile/settings/change-password`)
  - Edit Personal Details (`/wallet-setup/personal-info`)

### 5. **Save Button State**
- Disabled if:
  - Form is saving
  - No changes made
  - Form validation fails

### 6. **Form Dirty Detection**
- Tracks if display name or phone changed
- Only enables save if changes detected
- Uses `useMemo` for performance

---

## State Management

### Local State
```typescript
const [profileData, setProfileData] = useState<ProfileData | null>(null);
const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);
const [error, setError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);

// Change Email Modal State
const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
const [newEmail, setNewEmail] = useState('');
const [currentPassword, setCurrentPassword] = useState('');
const [isChangingEmail, setIsChangingEmail] = useState(false);
const [changeEmailError, setChangeEmailError] = useState<string | null>(null);
const [changeEmailSuccess, setChangeEmailSuccess] = useState<string | null>(null);
```

### Form State (react-hook-form)
```typescript
const form = useForm<AccountFormValues>({
  resolver: zodResolver(accountFormSchema),
  mode: "onChange",
});
```

### Context State (via useAuth)
```typescript
const { user, loading, reauthenticate, updateEmailAddress } = useAuth();
```

---

## Validation Schema

```typescript
const accountFormSchema = z.object({
  displayName: z.string()
    .min(3, { message: "Display name must be at least 3 characters." })
    .max(30, { message: "Display name must not be longer than 30 characters." }),
  phone: z.string().optional(),
});
```

---

## Visual Design

### Form Fields
- Gradient underline (accent-2 → accent-1)
- Glow effect on focus
- Transparent background
- White text
- Minimal borders

### Save Button
- Gradient background (accent-2/60 → accent-1/45)
- Hover opacity change
- Disabled state styling
- Loading spinner when saving

### Security Section
- Gradient background overlay
- Backdrop blur
- Rounded top corners
- Border with accent color
- Card-style links with hover effects

### Modal
- Fixed overlay with backdrop blur
- Dark background
- Centered modal
- Close button (X) in header
- Form inputs with validation
- Error/success alerts

---

## Error Handling

### Load Errors
- Failed to fetch profile data
- Shows error alert
- Falls back to empty form

### Save Errors
- Failed to update profile
- Shows error alert in red

### Email Change Errors
- `auth/wrong-password` → "Incorrect password"
- `auth/email-already-in-use` → "Email already in use"
- `auth/invalid-email` → "Email is invalid"
- Generic fallback message

---

## Success Messages

- "Your changes have been saved successfully." (display name/phone)
- "Email updated successfully! A verification link may be sent to your new address." (email change)

---

## Loading States

1. **Initial Page Load**
   - Full-page spinner

2. **Saving Changes**
   - Button shows spinner
   - Button text: "Saving..."
   - Button disabled

3. **Changing Email**
   - Modal button shows spinner
   - Button text: "Updating Email..."
   - Form inputs disabled

---

## Breadcrumbs

- Back href: `/profile`
- Ellipsis only mode

---

## Footer Links

- Terms of Service (`/terms`)
- Privacy Policy (`/privacy`)

---

## Security Considerations

- Email changes require password reauthentication
- Firestore rules must enforce user document access
- Email verification required for page access
- Password never stored or logged
- Email change handled securely through Firebase Auth

---

## Accessibility

- Form labels for screen readers
- Error messages announced (form validation)
- Focus management in modal
- Keyboard navigation support
- aria-labels where appropriate

