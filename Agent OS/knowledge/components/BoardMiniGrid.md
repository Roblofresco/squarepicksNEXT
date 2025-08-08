# Knowledge: BoardMiniGrid Component (`@/components/lobby/BoardMiniGrid.tsx`)

## 1. Overview & Purpose
- Non-interactive 10x10 mini-grid used inside `BoardCard` to preview board state.

## 2. Key Responsibilities & Functionality
- Visually marks squares as: taken, owned by current user, or available.
- Derived from `selected_indexes` and current-user-owned indexes.

## 3. Inputs (as used)
- `selectedIndexes: number[]`
- `currentUserOwnedSquares?: Set<number>`

## 4. Where Used
- `BoardCard` within Lobby’s Boards list (regular sports view).
- May also be used by `SweepstakesBoardCard` if mini-grid is shown. 