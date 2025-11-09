# Lobby Page

## Route
`/lobby`

## Purpose
Main hub for viewing games and boards. Users can browse upcoming/live/completed games, select entry amounts, and enter boards. Includes sweepstakes view and regular sports views.

## Runtime
`edge` - Optimized edge runtime

## Components Used
- `InAppHeader` - Top navigation with balance pill
- `SportSelector` / `TourSportSelector` - Sport switching interface
- `GamesList` / `TourGamesList` - Horizontal scrolling game cards
- `BoardsList` - Vertical list of boards for selected game
- `TourBoardCard` - Board card for tour mode
- `SweepstakesScoreboard` - Live scores for sweepstakes
- `SweepstakesBoardCard` - Entry interface for sweepstakes
- `SweepstakesWinnersScoreboard` - Winners display for sweepstakes
- `TourSweepstakesBoardCard` - Sweepstakes card for tour
- `BottomNav` - Bottom navigation bar
- `Footer` - Page footer
- `StarfieldBackground` - Animated background for modals
- `TourOverlay` - Interactive tour system
- `Dialog` components - Login, wallet setup, deposit prompts
- `Skeleton` - Loading state placeholders
- `Button`, `motion` (Framer Motion) - UI elements

## APIs Called
### Firestore Real-time Listeners:
- **Games Collection**:
  - Query: `where('sport', '==', selectedSport)`, `where('status', 'in', ['scheduled', 'in_progress', 'final'])`
  - Order: `orderBy('startTime')`
  - Client-side filter by NFL week range
  - Real-time updates for scores, status, time remaining

- **Sweepstakes Collection**:
  - Query: `where('status', '==', 'active')`, `where('week', '==', currentWeekNumber)`
  - Limit: 1 document
  - Gets current week's active sweepstakes

- **Boards Sub-Listener** (for sweepstakes):
  - Real-time updates to `selected_indexes` (occupied squares)
  - Board status changes
  - Axis numbers when assigned

- **Game Sub-Listener** (for sweepstakes):
  - Real-time score updates
  - Quarter/period updates
  - Time remaining
  - Winning squares (q1, q2, q3, final)

### Cloud Functions:
- `getBoardUserSelections` - Fetches user's squares for a board (via BoardsList)
- `enterBoard` - Processes board entry (via BoardsList)
- `createBoardIfMissing` - Ensures board exists for entry amount

### Utility Functions:
- `getNFLWeekRange()` - Calculates current NFL week number
- `getFirestoreTimestampRange()` - Gets timestamp range for week
- `formatDateRange()` - Formats date range string
- `fetchMultipleTeams()` - Batch fetches team documents

## Data Flow
### Initial Load:
1. Check authentication via `useWallet` hook
2. Redirect if:
   - User not verified: → `/verify-email`
   - Guest on non-sweepstakes: → `/login`
3. Parse URL query param `?sport=...` for initial sport selection
4. Determine sport selector view (sweepstakes vs regular sports)

### Sport Selection:
1. User clicks sport button
2. `handleSelectSport()` called
3. Update URL with new sport query param
4. Trigger data fetch for new sport

### Sweepstakes Flow:
1. Query sweepstakes collection for active entry
2. Extract `boardIDs[0]` and `gameID` references
3. Set up real-time board listener:
   - Monitors `selected_indexes` changes
   - Captures `home_numbers` and `away_numbers` when assigned
4. Set up real-time game listener:
   - Monitors score changes
   - Updates winning squares
   - Tracks game status (scheduled/live/final)
5. Fetch team data for display
6. Render appropriate component based on game status:
   - Scheduled: Entry interface
   - Live/Over: Winners scoreboard

### Regular Sports Flow:
1. Calculate current NFL week range
2. Query games collection filtered by sport and status
3. Client-side filter games within week window
4. Extract team references from game documents
5. Batch fetch all team data
6. Enrich games with team information
7. Set up real-time listener for live updates
8. For each game, BoardsList queries boards

### Entry Interaction:
1. User selects sport/game
2. Clicks on board or sweepstakes entry
3. System checks:
   - Authentication status
   - Email verification
   - Wallet setup
   - Sufficient balance
4. If checks pass: Show entry interface
5. User selects square(s)
6. Confirms entry
7. Entry processed via Cloud Function
8. Real-time update reflects new selection

## State Management
### Authentication & Wallet:
- `user` - Firebase User object (local state)
- `userId` - User ID from useWallet hook
- `emailVerified` - Verification status from useWallet
- `hasWallet` - Wallet setup status from useWallet
- `balance` - User's current balance from useWallet
- `isWalletLoading` - Wallet loading state

### Data Loading:
- `isLoadingGamesAndTeams` - Loading games/teams for regular sports
- `isLoadingSweepstakesData` - Loading sweepstakes data
- `gamesAndTeamsError` - Error message for games
- `sweepstakesDataError` - Error message for sweepstakes
- `isTransitioning` - Transition state between sports

### Games & Boards:
- `selectedSport` - Currently selected sport ID
- `games` - Array of game objects with team data
- `teams` - Map of team ID → team info
- `weekNumber` - Current NFL week
- `dateRange` - Start/end timestamps for week
- `sweepstakesBoard` - Current sweepstakes board
- `sweepstakesGame` - Current sweepstakes game
- `sweepstakesTeams` - Teams for sweepstakes game
- `sweepstakesStartTime` - Game start time (Date)

### UI State:
- `sportSelectorView` - 'sweepstakes' or 'allRegularSports'
- `entryInteraction` - Board entry state: `{ boardId, stage, selectedNumber }`
  - Stages: 'idle', 'selecting', 'confirming'
- `agreeToSweepstakes` - Sweepstakes terms acceptance

### Modal States:
- `isLoginModalOpen` - Login prompt dialog
- `isWalletSetupDialogOpen` - Wallet setup prompt
- `isDepositDialogOpen` - Insufficient funds prompt
- `requiredDepositAmount` - Amount needed for entry

### Tour System:
- `tourOpen` - Tour overlay active
- `tourStep` - Current step index
- `tourPhase` - 'A' or 'B' (for multi-phase steps)
- `activeTour` - 'sweepstakes' or 'sports'
- `sweepstakesTourSeen` - User's tour completion status
- `sportsTourSeen` - User's tour completion status
- `tourContentReady` - Tour content loaded
- `moreClicked`, `sweepstakesClicked` - Tour interaction flags

## Effects
### Data Fetching:
- Main effect triggers on `selectedSport` change
- Cleans up previous listeners
- Sets up appropriate listeners for sport type
- Handles transition states

### Auth Redirection:
- Monitors auth state changes
- Redirects unverified users
- Redirects guests from protected content

### Tour Management:
- Loads tour status from Firestore user document
- Auto-triggers tour on first visit
- Marks tour complete on close
- Prevents re-triggering

### URL Sync:
- Syncs selected sport with URL query param
- Allows deep linking to specific sport
- Preserves sport selection on refresh

## Navigation Handlers
- `handleSelectSport()` - Switches sport, updates URL
- `handleProtectedAction()` - Shows login modal
- `handleBoardAction()` - Manages board entry interactions
- `openWalletDialog()` - Shows wallet-related dialogs

## Real-time Updates
### Games:
- Score changes during live games
- Status transitions (scheduled → live → final)
- Time remaining updates
- Winning squares assignment

### Boards:
- Square occupation updates
- Board status changes (open → closed)
- Axis numbers reveal
- User's squares across all boards

### Sweepstakes:
- Same as regular boards
- Plus: Dedicated winning squares display
- Real-time payout status

## Dialogs
### Login Required:
- Shown when guest attempts protected action
- Options: Login or Sign Up

### Wallet Setup Required:
- Triggered for:
  - Regular entries without wallet
  - Sweepstakes entries without verification
- Button: "Go to Wallet Setup" → `/wallet-setup/location`

### Insufficient Funds:
- Shows required amount
- Displays current balance
- Button: "Add Funds" → `/wallet`

## Tour System
### Sweepstakes Tour (7 steps):
1. Sport selector navigation
2. Number input
3. Grid selection
4. Enter button
5. Confirmation dialog
6. Response message
7. Info icon (how to replay)

### Sports Tour (14 steps):
1. Upcoming games view
2. Tap to view boards
3. Live games display
4. Final games display
5. Board card overview
6. Grid legend
7. Quick entry intro
8. Type number
9. Random selection
10. Confirm pick
11. Entry response
12. Track your squares
13. Info icon

### Tour Features:
- Conditional step rendering based on user actions
- Allow-list for clickable elements during tour
- Phase-based progression (A/B phases for complex steps)
- Persists completion status to Firestore
- Replay option via header info icon

## Accessibility
- Focus management for dialogs
- ARIA labels on interactive elements
- Loading states announced
- Error messages with role="alert"
- Keyboard navigation support

## Performance
- Edge runtime for faster response
- Real-time listeners with cleanup
- Debounced data fetching
- Skeleton loaders for perceived performance
- Optimistic UI updates
- Memoized filtered/sorted data

## Responsive Design
- Mobile-first layout
- Horizontal scrolling games list
- Vertical stacking boards
- Touch-friendly targets
- Adapted spacing for mobile

## Data Schema Normalization
Handles both camelCase and snake_case field names from Firestore:
- `startTime` / `start_time`
- `awayScore` / `away_score`
- `homeScore` / `home_score`
- `isLive` / `is_live`
- `isOver` / `is_over`
- `broadcastProvider` / `broadcast_provider`
- `awayTeam` / `away_team_id`
- `homeTeam` / `home_team_id`

## Error Handling
- Network errors: Display error message with retry
- Missing data: Show appropriate empty states
- Auth errors: Redirect to login
- Board errors: Toast notifications

