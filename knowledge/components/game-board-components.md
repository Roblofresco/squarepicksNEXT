# Game/Board Components (My Boards)

## BoardGridDisplay.tsx
**Purpose**: Full 10x10 board grid display with axis numbers and team bars.
**Props**:
- `board` (BoardForGridDisplay): Board data including:
  - `squares` (BoardSquare[][]): 10x10 array of square data
  - `rowNumbers` (string[]): Y-axis numbers (10 values)
  - `colNumbers` (string[]): X-axis numbers (10 values)
  - `homeTeam` (TeamInfo): Home team data
  - `awayTeam` (TeamInfo): Away team data
  - `status` (string): Board status
  - `quarters` (QuarterScore[]): Quarter results
  - `numbersAssigned` (boolean): Whether numbers are finalized

**User Interactions**: Read-only display (grid visualization).

**APIs Called**: None.

**Used in**:
- `/game/:id` page
- Board detail views
- My Boards page

**Key Features**:
- 11x11 grid layout (10x10 data + 1 row/col for axis numbers)
- Team name bars:
  - Home team: Blue background, horizontal top bar
  - Away team: Green background, vertical left bar
- Axis numbers in team colors
- Color-coded squares:
  - User's squares: Blue gradient with star icon
  - Other squares: Gray background
- Custom fonts (Allerta Stencil for team names, Big Shoulders Stencil Display for numbers)
- Rounded corners on outer edges
- Displays placeholder message if numbers not assigned

---

## QuarterScoreboard.tsx
**Purpose**: Displays scores for each quarter with team logos and winning indicators.
**Props**:
- `board` (BoardForScoreboard): Board data including:
  - `quarters` (QuarterScore[]): Array of 4 quarters with scores
  - `homeTeam` (TeamInfo): Home team data
  - `awayTeam` (TeamInfo): Away team data
  - `status` (string): Board status

**User Interactions**: Read-only display.

**APIs Called**: None.

**Used in**:
- Board detail views
- My Boards page
- Game results pages

**Key Features**:
- 4-column grid (Q1, Q2, Q3, Q4/Final)
- Quarter labels at top
- Scores displayed above team logos
- Team logos (or initials fallback) for each team
- Win indication:
  - Background "W" in green (subtle)
  - Win amount displayed below (e.g., "+$25.00")
- Displays "-" for null scores (game not started/in progress)
- Maps "F" (Final) to "Q4" for display
- Dark slate background with borders
- Rounded top corners

---

## SquareCard.tsx
**Purpose**: Comprehensive card showing user's board participation with all details.
**Props**:
- `board` (AppBoard): Full board data including:
  - Game info (teams, date, status)
  - User's picked squares
  - Quarter winners
  - Entry fee, pot, stake
  - Sport type
  - Sweepstakes info
- `onClick` (fn): Card click handler

**User Interactions**:
- Toggle between "Squares" view (0-99) and "Picks" view (square coordinates)
- Click "View" button to navigate to full board
- View winning indicators (gold crown icons)
- Scroll through user's squares if many selected

**APIs Called**: None (displays data passed as props).

**Used in**:
- My Boards page
- User's board history
- Board portfolio view

**Key Features**:
- **Status Ribbons**: Top corners show sport and status
  - Sweepstakes: Gold gradient ribbon
  - Sport: White badge
  - Status: Color-coded badge (blue=open, yellow=full, green=final, etc.)
- **Team Display**:
  - Team logos with glow effects
  - Team names and records
  - "@" separator for away vs home
  - Live indicator if game is live
- **Summary Info**:
  - Entry fee, number of picks, total pot
  - Broadcast provider (if not live)
  - "View" button to see full board
- **User Selections**:
  - Toggle between squares (indices) and picks (coordinates)
  - Flip animation on toggle
  - Gold highlight for winning squares
  - Special treatment for "all 100 squares" scenario
  - Scrollable grid for many selections
- **Quarter Winners**:
  - Shows winning square for each quarter
  - Gold crown icon for user wins
  - Displays "--" if winner not determined
  - Color-coded text for user wins
- **Visual Effects**:
  - Glass morphism background
  - Radial glow gradients
  - Hover shadow effects
  - Ring highlight for "full" status boards
  - Responsive sizing (max-w-sm)

**Status Indicators**:
- Open: Blue
- Full: Yellow/Orange with ring
- In Progress: Yellow
- Final (Won): Green
- Final (Lost): Gray
- Cancelled: Red

**Key Data Points Displayed**:
1. Sport/Sweepstakes type
2. Board status
3. Team matchup with logos
4. Game date/time or "Live" indicator
5. Entry fee and picks count
6. Total pot
7. User's selected squares (with win highlights)
8. Quarter winners (with user win indicators)

---

## Related Types

### BoardSquare
```typescript
{
  number?: string | null;
  x: number;
  y: number;
  isUserSquare: boolean;
}
```

### QuarterScore
```typescript
{
  period: string; // 'Q1', 'Q2', 'Q3', 'F'
  homeScore: number | null;
  awayScore: number | null;
  isWinner?: boolean;
  winAmountForPeriod?: number;
}
```

### TeamInfo
```typescript
{
  name: string;
  color: string;
  textColor?: string;
  logo?: string;
  initials?: string;
  record?: string;
  seccolor?: string;
  fullName?: string;
}
```

