# Knowledge: QuickEntrySelector Component (`@/components/lobby/QuickEntrySelector.tsx`)

## 1. Overview & Purpose
- Provides the quick, single-square entry UX on a `BoardCard` in the Lobby.

## 2. Key Responsibilities & Functionality
- Inputs: random or manual square number (0–99).
- Stage control: selecting → confirming.
- Delegates purchase to parent via `handleBoardAction`.
- Triggers wallet/setup or deposit dialogs via `openWalletDialog`.

## 3. Props (as used)
- `entryInteraction`
- `handleBoardAction(action, boardId, value?)`
- `openWalletDialog(type, options)`
- Wallet state: `walletHasWallet`, `walletBalance`, `walletIsLoading`
- `onProtectedAction` when unauthenticated

## 4. Where Used
- `BoardCard` (Lobby regular sports view)
- `SweepstakesBoardCard` (Sweepstakes view) 