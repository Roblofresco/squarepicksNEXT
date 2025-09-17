# Knowledge: SweepstakesBoardCard Component (`@/components/lobby/sweepstakes/SweepstakesBoardCard.tsx`)

## 1. Overview & Purpose
- Primary card for the weekly free-entry sweepstakes board on the Lobby.
- Shows teams, status, and the quick-entry controls for the free board.

## 2. Key Responsibilities & Functionality
- Accepts the sweepstakes `board` with `teamA`/`teamB` resolved by parent.
- Integrates `QuickEntrySelector` for single free entry.
- Uses wallet state to enforce entry limits and auth prompts.
- Calls callable functions:
  - [`getBoardUserSelections`](../functions/getBoardUserSelections.md) to hydrate current user's taken squares
  - [`checkSweepstakesParticipation`](../functions/checkSweepstakesParticipation.md) to gate free-entry
  - [`enterBoard`](../functions/enterBoard.md) to submit the entry

## 3. Props (as used)
- `board: BoardType & { teamA: TeamInfo; teamB: TeamInfo }`
- `user: FirebaseUser | null`
- `entryInteraction`
- `handleBoardAction`
- `openWalletDialog`
- Wallet state: `walletHasWallet`, `walletBalance`, `walletIsLoading`

## 4. Where Used
- Lobby Page sweepstakes view: `src/app/lobby/page.tsx`. 