# Reset Password: Check Email

- Route: `/reset-password/check-email`
- Purpose: Inform user that a password reset link was sent; shows target email from query param
- UI:
  - Uses `AuthBackground`
  - Text-only confirmation and links to login/reset start
- Notes:
  - Arrives after successful `sendPasswordResetEmail`
  - Email template branding handled in Firebase Console 