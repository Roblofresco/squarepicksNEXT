# Knowledge: SweepstakesScoreboard Component (`@/components/lobby/sweepstakes/SweepstakesScoreboard.tsx`)

## 1. Overview & Purpose
- Displays matchup and live/upcoming score status for the featured sweepstakes game.

## 2. Key Responsibilities & Functionality
- Renders team logos/names, scores, and status text (live/upcoming/final).
- Lightweight, purely presentational.

## 3. Props (as used)
- `awayTeam: TeamInfo`
- `homeTeam: TeamInfo`
- `status: string`
- `quarter?: string`
- `gameTime?: string`
- `awayScore?: number`
- `homeScore?: number`

## 4. Where Used
- Lobby Page sweepstakes view: `src/app/lobby/page.tsx`. 