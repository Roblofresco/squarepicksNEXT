# Knowledge: BottomNav Component (`@/components/lobby/BottomNav.tsx`)

## 1. Overview & Purpose
- Persistent in-app bottom navigation bar for main sections (Lobby, Wallet, Profile).

## 2. Key Responsibilities & Functionality
- Triggers protected actions (login prompt) when `user` is null via `onProtectedAction`.
- Otherwise navigates to target routes.

## 3. Props (as used)
- `user?: FirebaseUser | null` or `currentUser?: FirebaseUser | null`
- `onProtectedAction?: () => void`
- Optional explicit callbacks: `onWalletClick`, `onLobbyClick`, `onProfileClick` (profile page usage)

## 4. Where Used
- `src/app/lobby/page.tsx`
- `src/app/profile/page.tsx`
- `src/app/my-boards/page.tsx` 