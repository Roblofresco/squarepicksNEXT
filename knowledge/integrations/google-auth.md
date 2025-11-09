# Google Authentication Integration

## Overview
Google authentication is integrated through Firebase Authentication, providing secure OAuth 2.0 sign-in functionality.

## Implementation

### Via Firebase Authentication

Firebase Authentication handles all Google OAuth flows, token management, and user profile synchronization.

#### Configuration

Google Sign-In is configured in the Firebase Console:
1. Navigate to Firebase Console → Authentication → Sign-in method
2. Enable Google provider
3. Configure OAuth consent screen
4. Add authorized domains

#### Environment Variables

No additional environment variables required beyond Firebase configuration:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

## Implementation

### Google Sign-In Button

```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';

async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  
  // Optional: Request additional scopes
  provider.addScope('profile');
  provider.addScope('email');
  
  try {
    const result = await signInWithPopup(auth, provider);
    
    // User info
    const user = result.user;
    console.log('Signed in:', user.displayName, user.email);
    
    // Google Access Token (if needed)
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
    return user;
  } catch (error: any) {
    console.error('Google sign-in error:', error.code, error.message);
    throw error;
  }
}
```

### Sign-In Component

```typescript
import { FcGoogle } from 'react-icons/fc';

function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  
  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.push('/lobby');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('User closed popup');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Please allow popups for sign-in');
      } else {
        toast.error('Sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 border rounded-lg"
    >
      <FcGoogle className="w-5 h-5" />
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </button>
  );
}
```

### Redirect Flow (Alternative)

For mobile or popup-blocked scenarios:

```typescript
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';

// Initiate sign-in
async function signInWithGoogleRedirect() {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
}

// Handle redirect result (call on page load)
useEffect(() => {
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const user = result.user;
        console.log('User signed in:', user);
      }
    })
    .catch((error) => {
      console.error('Redirect sign-in error:', error);
    });
}, []);
```

## User Profile Data

### Available Fields

```typescript
interface GoogleUser {
  uid: string;                  // Firebase UID
  email: string;                // Google email
  displayName: string;          // Full name
  photoURL: string;             // Profile picture URL
  emailVerified: boolean;       // Always true for Google
  providerId: string;           // 'google.com'
}
```

### Syncing to Firestore

```typescript
import { doc, setDoc } from 'firebase/firestore';

async function syncGoogleUser(user: User) {
  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email,
      display_name: user.displayName,
      photoURL: user.photoURL,
      emailVerified: true, // Google emails are pre-verified
      provider: 'google',
      lastLogin: new Date(),
    },
    { merge: true }
  );
}
```

## Account Linking

### Link Google to Existing Account

```typescript
import { linkWithPopup } from 'firebase/auth';

async function linkGoogleAccount() {
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await linkWithPopup(auth.currentUser!, provider);
    console.log('Account linked:', result.user);
  } catch (error: any) {
    if (error.code === 'auth/credential-already-in-use') {
      console.error('This Google account is already linked to another user');
    }
  }
}
```

### Check Linked Providers

```typescript
const user = auth.currentUser;
const providers = user?.providerData.map(p => p.providerId);

if (providers?.includes('google.com')) {
  console.log('Google account is linked');
}
```

## Error Handling

### Common Errors

```typescript
switch (error.code) {
  case 'auth/popup-closed-by-user':
    // User closed the popup without completing sign-in
    break;
    
  case 'auth/popup-blocked':
    // Browser blocked the popup
    // Suggest enabling popups or use redirect flow
    break;
    
  case 'auth/cancelled-popup-request':
    // Another popup was already open
    break;
    
  case 'auth/account-exists-with-different-credential':
    // Email already used with different provider
    // Prompt user to sign in with original provider first
    break;
    
  case 'auth/operation-not-allowed':
    // Google sign-in not enabled in Firebase Console
    break;
    
  case 'auth/unauthorized-domain':
    // Domain not authorized in Firebase Console
    break;
}
```

## Security Considerations

1. **Email Verification**: Google emails are pre-verified
2. **Provider Trust**: Users trust Google's OAuth security
3. **No Password**: No password to manage or reset
4. **Token Management**: Firebase handles token refresh
5. **Scope Limitations**: Only request necessary scopes

## Best Practices

1. **Always Handle Errors**: Popups can fail or be blocked
2. **Provide Fallback**: Offer email/password alternative
3. **Sync User Data**: Update Firestore on each login
4. **Profile Pictures**: Cache Google profile photos
5. **Account Linking**: Allow users to link multiple providers
6. **Testing**: Test in incognito mode

## Rate Limits

Google OAuth via Firebase:
- **Sign-in requests**: Generous limits, no explicit quota
- **Token refresh**: Automatic, handled by Firebase
- **API calls**: Subject to Firebase Auth quotas

## Testing

### Test Accounts

Use real Google accounts for testing (Firebase doesn't provide test accounts).

For automated testing:
```typescript
// Use Firebase Auth Emulator in tests
if (process.env.NODE_ENV === 'test') {
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

## Mobile Considerations

### Deep Linking

Configure for mobile apps:
```typescript
provider.setCustomParameters({
  prompt: 'select_account' // Always show account picker
});
```

### Redirect vs Popup

Mobile browsers work better with redirect:
```typescript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

if (isMobile) {
  await signInWithRedirect(auth, provider);
} else {
  await signInWithPopup(auth, provider);
}
```

## Advanced Features

### One-Tap Sign-In

Google One Tap (separate from Firebase):
```typescript
// Requires Google Identity Services SDK
<script src="https://accounts.google.com/gsi/client" async defer></script>

function initializeOneTap() {
  google.accounts.id.initialize({
    client_id: 'YOUR_GOOGLE_CLIENT_ID',
    callback: handleCredentialResponse
  });
  
  google.accounts.id.prompt();
}
```

### Custom Scopes

Request additional Google API access:
```typescript
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
```

Access the token:
```typescript
const credential = GoogleAuthProvider.credentialFromResult(result);
const accessToken = credential?.accessToken;

// Use token with Google APIs
const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## Firebase Configuration

### OAuth Client Setup

Firebase automatically creates OAuth clients. Manual setup:

1. **Google Cloud Console**
   - Enable Google+ API
   - Configure OAuth consent screen
   - Create OAuth 2.0 Client ID

2. **Firebase Console**
   - Add OAuth client ID and secret (optional)
   - Configure authorized domains

3. **Authorized Domains**
   - `localhost` (dev)
   - `your-domain.com` (prod)
   - `your-app.firebaseapp.com` (Firebase hosting)

## Related Documentation

- [Firebase Google Auth](https://firebase.google.com/docs/auth/web/google-signin)
- [Google Identity](https://developers.google.com/identity)
- [OAuth 2.0](https://oauth.net/2/)

## Troubleshooting

### Popup blocked
- Ensure sign-in triggered by user action
- Use redirect flow as fallback
- Show instructions to enable popups

### Unauthorized domain
- Add domain to Firebase Console
- Check protocol (http vs https)
- Verify domain spelling

### Account linking issues
- Check if email already exists
- Verify provider configuration
- Handle edge cases gracefully

## Future Enhancements

- Implement Google One-Tap sign-in
- Add Google Calendar integration
- Support Google Workspace accounts
- Implement sign-in with Google button (official design)

