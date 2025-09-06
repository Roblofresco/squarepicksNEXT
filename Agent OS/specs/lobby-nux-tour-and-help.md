# Spec: Lobby NUX Tour and Help System

## Goal
Help first-time and returning users quickly understand the Lobby: Sweepstakes vs Sports, how to enter, and why dialogs appear. Provide layered guidance: one-time coachmarks, inline hints, and an on-demand Help Drawer.

## Scope
- Pages: `src/app/lobby/page.tsx`
- Components: `InAppHeader`, `SportSelector`, `GamesList`, `BoardsList`, `SweepstakesScoreboard`, `SweepstakesBoardCard`, `BottomNav`

## UX Deliverables
- NUX Tour (first visit, skippable), 5–6 steps
- Help Drawer (shadcn/ui Sheet) with concise explanations + “Replay tour”
- Inline microcopy under Sweepstakes card and in entry confirm state
- Tooltips for actions that may be gated (login, wallet, deposit)

## Tour Steps (order)
1. SportSelector: Explain Sweepstakes vs Sports
2. SweepstakesScoreboard/SweepstakesBoardCard: Free weekly entry, numbers assigned later
3. GamesList: Pick a game context (for paid boards)
4. BoardsList: Choose a board; overview of entry fees and availability
5. Entry Interaction: Select number → Confirm
6. BottomNav: Wallet, profile, navigation shortcuts

## Technical Approach
- Library: Driver.js (coachmarks). Dynamic import (client-only) to avoid SSR issues
- Targeting: Stable `data-tour` attributes on key elements
- State: `localStorage['lobby:nux:v1']` to persist seen status; user-level override possible
- Accessibility: Focus management, ESC to close, keyboard nav, ARIA labels
- Mobile: 44px targets, non-blocking overlays, respect scroll

## Components/Changes
- Add `HelpButton` to `InAppHeader` that opens a `Sheet` (shadcn/ui)
- New `LobbyHelpDrawer` component with sections:
  - What is Sweepstakes?
  - How entries work (select → confirm)
  - Free weekly entry (one per week)
  - Why dialogs appear (login/wallet/deposit)
  - Replay tour (resets localStorage key and launches tour)
- Add `data-tour` attributes:
  - `data-tour="sport-selector"` on `SportSelector` root
  - `data-tour="sweepstakes"` on Sweepstakes card/scoreboard wrapper
  - `data-tour="games-list"` on `GamesList` container
  - `data-tour="boards-list"` on `BoardsList` container
  - `data-tour="entry"` on entry interaction area (confirm panel)
  - `data-tour="bottom-nav"` on `BottomNav` root
- Inline microcopy:
  - Under Sweepstakes card: “Free weekly entry. Numbers assigned at game time.”
  - In confirm step: “Confirm one number per entry.”
- Tooltips (shadcn/ui Tooltip or HoverCard) for buttons that can open login/wallet/deposit dialogs

## Driver.js Integration
- Install: `pnpm add driver.js`
- Dynamic import in `LobbyContent`:
  - `const { driver } = await import('driver.js')`
  - Steps configured with selectors for `data-tour` nodes
  - Start tour if `localStorage['lobby:nux:v1']` is not set; set after completion or skip

## Data/State
- `localStorage` key: `lobby:nux:v1`
- Add optional user-level persisted preference later; initial phase uses local only

## Tasks
1. Add `data-tour` attributes to target components
2. Create `LobbyHelpDrawer` (Sheet) and `HelpButton` in `InAppHeader`
3. Add inline microcopy to Sweepstakes and entry confirm
4. Add Tooltips/HoverCards to gated actions
5. Integrate Driver.js with dynamic import and steps + seen-state
6. QA mobile/desktop, a11y, and performance

## Acceptance Criteria
- Tour shows once per device (can be replayed). Dismiss and replay work
- Help Drawer available; copy is concise and accurate
- Inline hints visible; tooltips appear on relevant controls
- No layout shift; scroll/tap work on mobile; keyboard and screen readers supported

## References
- Context7: Driver.js (/kamranahmedse/driver.js), shadcn/ui Sheet/Tooltip
- shadcn/ui components already present in project

