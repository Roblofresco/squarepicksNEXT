# Email Verified Page

- Route: `/email-verified`
- Modes:
  - `mode=verifyEmail`: applies action code and shows success then redirects to login
  - `mode=resetPassword`: redirects to `/reset-password/confirm?oobCode=...`
- UI:
  - Uses `AuthBackground`
  - Minimal states: verifying, success, invalid/expired 