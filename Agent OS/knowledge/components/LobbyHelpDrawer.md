# Knowledge: LobbyHelpDrawer (`@/components/info/LobbyHelpDrawer.tsx`)

## 1. Overview & Purpose
- Contextual help drawer for the Lobby. Implemented with `shadcn/ui` `Sheet`.

## 2. Key Responsibilities & Functionality
- Explains Sweepstakes and paid boards basics.
- Lists why dialogs appear (login, wallet setup, deposit prompts).
- Provides actions:
  - Close
  - Replay tour: clears `localStorage` key `lobby:nux:v1`, closes, then calls `window.__startLobbyTour()` with a slight delay.

## 3. Props
- `open: boolean`
- `onOpenChange: (open: boolean) => void`
- `onReplayTour?: () => void`

## 4. Where Used
- Opened from `InAppHeader` Help button on the Lobby page.




