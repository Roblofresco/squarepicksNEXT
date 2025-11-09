# Profile Page: Change Password

**Route:** `/profile/settings/change-password`

**Purpose:** Allows users to change their account password by providing their current password and setting a new one that meets security requirements.

---

## Components Used

### UI Components
- `ArrowLeft`, `AlertCircle`, `KeyRound`, `CheckCircle`, `XCircle` - Icons from lucide-react
- `FiEye`, `FiEyeOff` - Password visibility toggle icons from react-icons

### Custom Components
- `PasswordToggle` - Toggle password visibility button
- `CriteriaItem` - Password criteria checklist item

---

## APIs Called

### Firebase Auth
1. **`reauthenticateWithCredential(user, credential)`**
   - Reauthenticates user with current password
   - Required before changing password for security
   - Uses `EmailAuthProvider.credential(email, password)`

2. **`updatePassword(user, newPassword)`**
   - Updates user's password in Firebase Auth
   - Called after successful reauthentication

---

## Data Flow

### 1. **Form Input**
```
User enters:
  - Current password
  - New password
  - Confirm new password
↓
Real-time validation of new password:
  - ✓ At least 8 characters
  - ✓ Contains lowercase letter
  - ✓ Contains uppercase letter
  - ✓ Contains number
  - ✓ Contains special character
↓
Visual feedback (green checkmarks) for met criteria
```

### 2. **Validation**
```
User clicks "Update Password"
↓
Validate new password:
  - Check all criteria met
  - Verify passwords match
↓
If validation fails → Show error message
If validation passes → Proceed to authentication
```

### 3. **Reauthentication & Update**
```
Get current user from Firebase Auth
↓
Create credential with email + current password
↓
Call reauthenticateWithCredential()
↓
If reauthentication fails:
  - Show error (wrong password, too many attempts, etc.)
↓
If reauthentication succeeds:
  - Call updatePassword() with new password
  - Show success message
  - Clear all form fields
```

---

## Key Features

### 1. **Password Visibility Toggles**
- Each password field has show/hide toggle
- Eye icon indicates current state
- Accessible with keyboard (tabIndex: -1 to skip in tab order)

### 2. **Real-Time Password Criteria**
- Visual checklist of requirements
- Updates as user types
- Green checkmark = criteria met
- Red X = criteria not met

### 3. **Password Requirements**
```typescript
const checks = {
  minLength: newPassword.length >= 8,
  lowercase: /[a-z]/.test(newPassword),
  uppercase: /[A-Z]/.test(newPassword),
  number: /[0-9]/.test(newPassword),
  special: /[^A-Za-z0-9]/.test(newPassword),
};
```

### 4. **Validation Messages**
- "New password must be at least 8 characters long."
- "New password must include a lowercase letter."
- "New password must include an uppercase letter."
- "New password must include a number."
- "New password must include a special character."
- "New passwords do not match."

### 5. **Error Handling**
- `auth/wrong-password` → "Incorrect current password."
- `auth/too-many-requests` → "Too many attempts. Please try again later."
- `auth/weak-password` → "The new password is too weak."
- Generic fallback → "Failed to change password. An unexpected error occurred."

---

## State Management

### Local State
```typescript
const [currentPassword, setCurrentPassword] = useState('');
const [newPassword, setNewPassword] = useState('');
const [confirmNewPassword, setConfirmNewPassword] = useState('');
const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
const [error, setError] = useState<string | null>(null);
const [successMessage, setSuccessMessage] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);
```

---

## Visual Design

### Form Layout
- White background cards for inputs
- Rounded corners
- Border with focus ring
- Gradient background for page

### Password Criteria
- Underlined header
- List without bullets
- Icons for status (check/x)
- Color-coded (green/gray)

### Buttons
- Accent-1 background
- Hover effect (opacity)
- Loading spinner when submitting
- Disabled state with reduced opacity

### Back Button
- Accent-1 color
- Arrow icon
- Hover effect
- Top-left positioning

---

## Security Considerations

### 1. **Reauthentication Required**
- User must provide current password
- Prevents unauthorized password changes
- Follows Firebase security best practices

### 2. **Strong Password Enforcement**
- Client-side validation
- Server-side validation (Firebase)
- Multiple criteria required

### 3. **Password Visibility**
- Masked by default
- Toggle available for user convenience
- Doesn't compromise security

### 4. **Error Messages**
- Specific but not overly revealing
- Guides user without exposing system details

---

## Form Validation

### Client-Side Checks
1. Minimum 8 characters
2. At least one lowercase letter
3. At least one uppercase letter
4. At least one number
5. At least one special character
6. Passwords match

### Server-Side Checks (Firebase)
- Password strength
- Rate limiting (too many attempts)
- Authentication validity

---

## Success Flow

```
Password changed successfully
↓
Show success message:
  "Password updated successfully!"
↓
Clear all form fields:
  - currentPassword = ''
  - newPassword = ''
  - confirmNewPassword = ''
↓
User can:
  - Change password again
  - Navigate back to settings
```

---

## Loading States

### Submitting State
```
isLoading = true
↓
Button disabled
Button shows spinner
Button text: "Updating..."
↓
On completion:
  isLoading = false
```

---

## Accessibility

- Screen reader labels for password fields
- aria-label on toggle buttons
- Keyboard navigation support
- Focus management
- Error announcements via alerts
- Semantic HTML (form, inputs, labels)

---

## Navigation

### Back to Settings
- Arrow left icon
- Text: "Back to Settings"
- Routes to: `/profile/settings`
- Top-left corner

---

## Form Submission

```typescript
handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError(null);
  setSuccessMessage(null);
  
  // Validate
  const validationError = validateNewPassword();
  if (validationError) {
    setError(validationError);
    return;
  }
  
  // Get user
  const user = auth.currentUser;
  if (!user || !user.email) {
    setError("No user is currently signed in...");
    return;
  }
  
  // Reauthenticate & Update
  setIsLoading(true);
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
    setSuccessMessage("Password updated successfully!");
    // Clear fields
  } catch (err) {
    // Handle errors
  }
  setIsLoading(false);
};
```

---

## Password Criteria Component

```typescript
const CriteriaItem = ({ text, met }: { text: string, met: boolean }) => (
  <li className={`flex items-center text-sm ${met ? 'text-green-600' : 'text-gray-700'}`}>
    {met ? <CheckCircle size={14} className="mr-2" /> : <LucideXCircle size={14} className="mr-2" />}
    {text}
  </li>
);
```

---

## Password Toggle Component

```typescript
const PasswordToggle = ({ visible, setVisible }: { visible: boolean, setVisible: (vis: boolean) => void }) => (
  <button 
    type="button" 
    onClick={() => setVisible(!visible)} 
    className="absolute right-3 top-1/2 transform -translate-y-1/2..."
    aria-label={visible ? 'Hide password' : 'Show password'}
    tabIndex={-1}
  >
    {visible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
  </button>
);
```

