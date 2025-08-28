# Reset Password: Confirm

- Route: `/reset-password/confirm`
- Purpose: Verify `oobCode`, allow user to set a new password, then navigate to `/login`.
- Key behaviors:
  - Suspense boundary to avoid SSR bailout with `useSearchParams`
  - `verifyPasswordResetCode` to fetch email, show inline error on failure
  - `confirmPasswordReset` on submit; success toast and redirect
- UI:
  - Uses `AuthBackground`
  - Fields: New password, Confirm password; single submit button
- Errors:
  - Invalid/expired code shows inline error and toast
- Tests:
  - Playwright: negative path `/reset-password/confirm?oobCode=invalid` asserts inline error 