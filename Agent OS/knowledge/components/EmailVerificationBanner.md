# Knowledge: EmailVerificationBanner Component (`@/components/ui/EmailVerificationBanner.tsx`)

## 1. Overview & Purpose
- Sitewide banner prompting users with unverified emails to verify/resend.

## 2. Key Responsibilities & Functionality
- Uses `useWallet` to read `emailVerified`.
- Exposes a button to trigger `resendVerificationEmail`.

## 3. Where Used
- Global layout: `src/app/layout.tsx`. 