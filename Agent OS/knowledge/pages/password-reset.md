# Password Reset

- Start: `/reset-password`
- Flow:
  1) Server checks email existence via Cloud Function
  2) Sends reset link with continue URL to `/reset-password/confirm`
  3) After submit, redirects to `/login`
- Pages:
  - [reset-password-check-email.md](./reset-password-check-email.md)
  - [reset-password-confirm.md](./reset-password-confirm.md) 