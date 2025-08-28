# Verify Email Page

- Route: `/verify-email`
- Purpose: Guide user to check their email, with ability to resend verification
- UI:
  - Uses `AuthBackground`
  - Primary CTA: Resend verification email
  - Secondary: Back to login
- Behavior:
  - If `emailVerified === true`, redirect to lobby
  - If unauthenticated, redirect/login CTA 