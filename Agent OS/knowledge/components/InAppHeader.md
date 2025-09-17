# Knowledge: InAppHeader Component (`@/components/InAppHeader.tsx`)

## 1. Overview & Purpose
- Top header for authenticated in-app views. Provides quick access to wallet, notifications, and contextual help.

## 2. Key Responsibilities & Functionality
- **Branding**: Renders the app logo; links to `/login` when unauthenticated.
- **Notifications**: Displays `NotificationIcon`.
- **Wallet entry**: Toggles between a compact wallet icon and a balance pill when a page is in an entry flow; clicking routes to `/wallet` or `/wallet-setup/location` based on Firestore `users/{uid}.hasWallet`.
- **Help**: Question-mark button opens `LobbyHelpDrawer`; the drawer includes a "Replay tour" that clears `localStorage` flag and triggers `window.__startLobbyTour()`.
- **Sticky usage**: Used as a sticky header in `lobby/page.tsx` with elevated z-index during entry interactions.

## 3. Core Components Used
- `@/components/notifications/NotificationIcon`
- `@/components/info/LobbyHelpDrawer`

## 4. Where Used
- `src/app/lobby/page.tsx` (sticky at top)