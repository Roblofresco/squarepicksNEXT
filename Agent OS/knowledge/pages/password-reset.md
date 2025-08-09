# Knowledge: Password Reset (`/reset-password`, `/reset-password/confirm`)

## Overview & Purpose
- Allow users to request a password reset email and set a new password using Firebase Auth.

## Responsibilities & Functionality
- Request page: collects email and calls `sendPasswordResetEmail`
- Confirm page: reads `oobCode`, verifies with `verifyPasswordResetCode`, applies new password via `confirmPasswordReset`
- Generic success messaging to avoid leaking account existence

## Core Components Used
- `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/button`

## Data Dependencies & Hooks
- Firebase Auth client via `@/lib/firebase`
- Next.js `useSearchParams` for reading `oobCode`

## Files
- `src/app/reset-password/page.tsx`
- `src/app/reset-password/confirm/page.tsx` 