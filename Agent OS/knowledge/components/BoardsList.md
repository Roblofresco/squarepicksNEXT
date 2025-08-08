# Knowledge: BoardsList Component (`@/components/lobby/BoardsList.tsx`)

## 1. Overview & Purpose
- Renders the vertical list of active $1 boards for the currently selected sport in the Lobby.
- Composes one `BoardCard` per game.

## 2. Key Responsibilities & Functionality
- Receives `games` and a `teams` map to enrich each board card with team info.
- Wires quick-entry handlers and wallet state down to `BoardCard`.
- Gatekeeps actions via `onProtectedAction` when user is unauthenticated.

## 3. Props (shape as used)
- `games: GameType[]`
- `teams: Record<string, TeamInfo>`
- `user: FirebaseUser | null`
- `currentUserId?: string | null`
- `onProtectedAction: () => void`
- `entryInteraction`
- `handleBoardAction`
- `openWalletDialog`
- `walletHasWallet: boolean | null`
- `walletBalance: number`
- `walletIsLoading: boolean`

## 4. Core Components Used
- `./BoardCard`

## 5. Where Used
- Lobby Page regular sports view: `src/app/lobby/page.tsx`. 