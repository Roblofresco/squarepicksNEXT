# Story: Finalize Numbers Reveal on Boards

## Goal
Ensure number assignment appears on board grid when boards close and during game.

## Scope
- Game page grid
- My Boards displays

## Tasks
- Backend: confirm field(s) where column/row numbers are stored upon close
- Frontend: render X/Y labels from board document when present
- Realtime: subscribe to board doc updates to show numbers as soon as available
- Knowledge: update game-page doc with reveal flow

## Acceptance Criteria
- On a full board after close, X/Y numbers appear without refresh
- My Boards cards show assigned numbers for closed boards
- No numbers shown for incomplete boards 