# Story: Implement Password Reset Flow

## Goal
Allow users to reset forgotten passwords via email using Firebase Auth.

## Scope
- Routes: `/reset-password` (request), `/reset-password/confirm` (apply code)
- Emails: send reset link via Firebase Auth

## Tasks
- UI: Build forms with shadcn/ui (email input; new password + confirm)
- Logic: `sendPasswordResetEmail(email)`; `verifyPasswordResetCode(oobCode)`; `confirmPasswordReset(oobCode, newPassword)`
- Routing: Read `oobCode` from search params on confirm page
- Feedback: toasts for success/errors; redirect to `/login` after success
- Knowledge: add docs under `knowledge/pages/*`

## Acceptance Criteria
- Submitting email shows success toast and does not leak user existence
- Visiting confirm page with valid `oobCode` allows setting a new password
- Invalid/expired code shows error and link to request page
- Lint/build pass 