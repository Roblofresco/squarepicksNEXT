# Game Page

## Route
`/game/[gameId]`

## Purpose
Detailed game view with interactive board for square selection. Allows users to select squares, view their entries, and track live game progress with winning squares.

## Runtime
`edge` - Optimized edge runtime

## Components Used
- `Image` (Next.js) - Team logos with optimization
- `WalletPill` - Balance display (header and docked variants)
- `Button`, `Separator` - UI components
- `Dialog` components - Wallet setup, insufficient funds prompts
- `motion` (Framer Motion) - Animations
- `Loader2`, `AlertTriangle`, `Info`, `ArrowLeft` icons (Lucide)
- Custom 10x10 grid with interactive squares
- `Toaster` - Toast notifications

## APIs Called
### Firestore Real-time Listeners:
- **Game Document**:
  - Real-time updates for:
    - Score changes (awayScore, homeScore)
    - Game status (scheduled/live/final)
    - Time remaining
    - Quarter/period
    - Winning squares (q1, q2, q3, final)
  - Fetches team data on initial load
  - Uses cached team data for subsequent updates

- **Board Document**:
  - Query: Find open board matching gameID and entry amount
  - Or: Specific board by ID (from My Boards)
  - Real-time updates for:
    - `selected_indexes` (occupied squares)
    - Board status changes
    - Axis numbers (home_numbers, away_numbers)
  - Triggers on entry amount change or entry success

### Cloud Functions:
- `getBoardUserSelections({ boardID })` - Fetches user's purchased squares for current board
- `enterBoard({ boardId, selectedSquareIndexes })` - Processes square entry/purchase
- `createBoardIfMissing({ gameId, amount })` - Ensures board exists for entry amount

### Firestore Queries:
- **User Wins Collection**: `users/{userId}/wins/{boardId}_{period}`
  - Queries for q1, q2, q3, final documents
  - Determines if user won any quarter
- **Team Documents**: Fetches via DocumentReferences

## Data Flow
### Page Load:
1. Extract gameId from URL params
2. Extract optional params:
   - `entry` - Initial entry amount (default: 1)
   - `view` - Force view mode (scheduled/live/final)
   - `boardId` - Specific board from My Boards
3. Check authentication and wallet status via `useWallet`
4. Redirect if email not verified

### Game Data (Real-time):
1. Set up onSnapshot listener on game document
2. On initial snapshot:
   - Fetch and cache team data for both teams
   - Extract game details, scores, status
3. On subsequent snapshots:
   - Use cached team data (no re-fetch)
   - Update scores, status, winning squares in real-time
   - Keep UI synchronized with game progress

### Board Data (Real-time):
1. If boardId provided (My Boards flow):
   - Listen to specific board document
   - Display read-only or interactive based on status
2. If no boardId (Lobby flow):
   - Query for open board matching game and entry amount
   - Listen to found board for real-time updates
3. On board updates:
   - Update selected_indexes (occupied squares)
   - Capture axis numbers when revealed
   - Handle status changes (open → closed)
   - Show delayed loader if board fetch takes >400ms

### User Squares:
1. Fetch on board change or entry success
2. Call Cloud Function `getBoardUserSelections`
3. Store in Set for O(1) lookup
4. Used to highlight user's squares in grid

### User Wins:
1. Query private wins subcollection
2. Check for documents: `{boardId}_q1`, `_q2`, `_q3`, `_final`
3. Store winning periods in Set
4. Display golden styling for user's winning squares

### Square Selection Flow:
1. User clicks available square
2. Pre-checks:
   - Board must be open
   - Game must not have started
   - Square must be available
3. Auth checks:
   - User must be logged in
   - Email must be verified
4. Wallet checks:
   - Wallet must be set up
   - Balance must be sufficient
5. If all checks pass:
   - Toggle square in selection Set
   - Update UI immediately (optimistic)
   - Show confirm button when selections > 0

### Entry Confirmation:
1. User clicks "Confirm X Squares"
2. Validates:
   - At least one square selected
   - Board still open
   - Game hasn't started
   - User authenticated
   - Wallet set up
   - Sufficient balance
3. Calls `enterBoard` Cloud Function
4. On success:
   - Show success toast
   - Clear selections
   - Increment entrySuccessCount (triggers refetch)
   - Board and user squares update via real-time listeners
5. On error:
   - Display error toast
   - Keep selections for retry

### Entry Amount Change:
1. User clicks different entry amount button
2. Clear current selections
3. Check balance for new amount
4. If insufficient: Show deposit dialog
5. If sufficient: Proactively call `createBoardIfMissing`
6. Trigger board refetch for new amount

## State Management
### Game & Board:
- `gameDetails` - Full game object with teams, scores, status
- `currentBoard` - Active board object
- `selectedEntryAmount` - Current entry amount selection
- `homeAxisNumbers`, `awayAxisNumbers` - Number assignments (0-9)
- `q1WinningSquare`, `q2WinningSquare`, `q3WinningSquare`, `finalWinningSquare`

### Loading States:
- `isLoadingGame` - Initial game data fetch
- `isLoadingBoard` - Board data fetch
- `isLoadingUserSquares` - User's squares fetch
- `isConfirming` - Entry submission in progress
- `isDisplayingDelayedLoader` - 400ms delayed loader for board switches

### Selections & UI:
- `selectedSquares` - Set of square indexes user is selecting
- `currentUserPurchasedSquaresSet` - Set of user's owned squares
- `userWins` - Set of periods user won ('q1', 'q2', 'q3', 'final')
- `shakeEntryFee` - Shake animation trigger
- `showWinnerAnimation` - Delayed animation trigger
- `error` - Error message display

### Wallet & Modals:
- `displayedBalance` - Balance minus pending selections cost
- `isPromptOpen` - Wallet/deposit dialog state
- `promptType` - 'setup' or 'deposit'
- `isDepositDialogOpen` - Specific deposit dialog
- `requiredDepositAmount` - Amount needed

### Refs:
- `entryFeeRef` - Entry fee section element
- `confirmRef` - Confirm button element
- `gridRef` - Grid container element
- `cachedTeamARef`, `cachedTeamBRef` - Cached team data
- `loaderTimerId` - Delayed loader timer

## Effects
### Real-time Game Listener:
- Triggers on gameId change
- Sets up onSnapshot listener
- Caches team data on first load
- Cleans up on unmount or gameId change

### Real-time Board Listener:
- Triggers on gameId, selectedEntryAmount, or entrySuccessCount change
- Delayed loader after 400ms
- Two branches:
  1. Specific board (boardId param)
  2. Query for open board (lobby flow)
- Cleans up timer and listener on unmount

### User Squares Fetch:
- Triggers on board change or entry success
- Calls Cloud Function
- Updates purchased squares Set

### User Wins Fetch:
- Triggers on userId or boardId change
- Queries wins subcollection
- Updates wins Set

### Email Verification Check:
- Monitors userId, emailVerified, walletIsLoading
- Redirects to `/verify-email` if not verified

### Selection Auto-scroll:
- When selections go from 0 → >0:
  - Scroll to bottom (150ms delay for button render)
- When selections go from >0 → 0:
  - Scroll to top immediately
- Cleans up timers on unmount

### Click Outside to Clear:
- Listens for clicks outside grid and confirm button
- Clears selections if clicked elsewhere
- Only active when selections > 0

### Winner Animation:
- Triggers 300ms after mount
- Used for trophy/winner reveal animations

## Square Click Handler
Comprehensive validation flow:
1. **Pre-checks** (no interaction):
   - Board must be open
   - Game must not have started
   - Square must be available (not taken)
   
2. **Auth checks** (show login):
   - User must be logged in

3. **Wallet checks** (show dialogs):
   - Wallet loading: Show "verifying" toast
   - No wallet: Show setup dialog
   - Insufficient balance: Show deposit dialog

4. **UI state checks** (prevent action):
   - Cannot select during confirmation
   - Cannot select while loading

5. **Success path**:
   - Toggle square in/out of selection
   - Enforce max selection limit (20 squares)
   - Update UI optimistically

## Grid Rendering
Three view modes based on game status:

### 1. Scheduled (Entry Mode):
Entry fee selector + Interactive grid
- **Entry fee buttons**: $1, $5, $10, $20
- **Grid squares** (100 total):
  - **User's purchased**: Blue gradient, cursor disabled
  - **Others' purchased**: Gray gradient, shows "X"
  - **User's selection**: Magenta gradient, ring effect
  - **Available**: Gray, hover cyan effect
- **Axis numbers**: Display when board closed (numbers revealed)

### 2. Live (Read-only):
Message: "Board closed - game is live"
- Grid hidden or read-only display

### 3. Final (Read-only):
Message: "Board closed - game finished"
- Winners scoreboard displayed
- Grid shows winning squares highlighted

## Scoreboard Display
Billboard-style header showing:
- **Team logos** with glow effects (using team colors)
- **Team names**
- **Status-dependent center section**:
  - **Scheduled**: Time + Date
  - **Live**: "LIVE" badge, Score, Quarter, Time Remaining
  - **Final**: "FINAL" text, Final Score
- **Broadcast info**: Network + Week number

## Winners Display
Only shown for closed boards (live/final):
- 4 cards: Q1, Q2, Q3, FINAL
- **Unassigned state**:
  - Dashes at top
  - Label in gradient footer
- **Assigned state**:
  - Label at top
  - Winning square number (large, centered)
  - Separator line
- **User won**:
  - Golden gradient styling
  - "Winner" badge at bottom
  - Glow effects
- **Live indication**:
  - Ring effect on current quarter card

## Confirm Button
Appears when selections > 0:
- Displays: "Confirm X Square(s) ($Y.YY)"
- Green gradient glass morphism styling
- Shadow and ring effects
- Wallet pill docked to top-right corner
  - Shows optimistic balance (current - pending cost)
- Disabled states:
  - During confirmation
  - While loading
  - If game started
  - Wallet loading

## Navigation
- Back button (top-left): Returns to previous page
- Wallet pill click: 
  - No user: → `/login`
  - No wallet: → `/wallet-setup/location`
  - Has wallet: → `/wallet`

## Dialogs
### Wallet Setup Prompt:
- Title: "Wallet Setup Required"
- Message: "You need to set up your wallet before you can enter paid contests."
- Actions: Cancel / "Go to Wallet"

### Insufficient Funds:
- Title: "Insufficient Funds"
- Message: "You need $X.XX (current balance: $Y.YY) for this entry."
- Actions: Cancel / "Add Funds" → `/wallet`

### Deposit Dialog (Entry Amount):
- Appears when selecting entry amount without sufficient funds
- Shake animation on entry fee section
- Same content as insufficient funds dialog

## Optimistic Updates
- **Balance**: Shows balance minus cost of pending selections
- **Selections**: UI updates immediately on square click
- **Grid**: User's squares appear before confirmation
- **Real-time sync**: Firestore listeners correct any discrepancies

## Error Handling
- Game not found: Error screen with message
- Board not found: Toast + empty state
- Network errors: Toast with retry option
- Entry errors: Toast with error message
- Auth errors: Redirect or login prompt
- Wallet errors: Appropriate dialog

## Loading States
- **Initial**: Full-screen loader with spinner
- **Board switching**: Delayed loader (400ms threshold)
- **User squares**: Inline loader on grid
- **Confirmation**: Button shows "Processing..." with spinner

## Accessibility
- ARIA labels on interactive squares
- Focus management
- Keyboard navigation
- Toast announcements
- Loading announcements
- Error announcements with role="alert"

## Performance
- Edge runtime
- Cached team data (no re-fetch on every update)
- Debounced board loader (400ms)
- Optimistic UI updates
- Real-time listeners with cleanup
- Memoized square state calculations
- Single-frame renders for canvas

## Responsive Design
- Mobile-first grid layout
- Touch-friendly square sizes
- Adapted spacing
- Responsive scoreboard
- Flexible button layouts
- Bottom-docked confirm button on mobile

## Visual Effects
- Logo glow using team accent colors
- Billboard glow backdrop
- Team logo drop shadows
- Gradient overlays
- Glass morphism on buttons
- Ring effects for emphasis
- Winner animations (golden gradient)
- Shake animation for errors

## Constants
- `MAX_SQUARE_SELECTION_LIMIT`: 20
- `entryAmounts`: [1, 5, 10, 20]
- Delayed loader threshold: 400ms
- Auto-scroll delays: 150ms (down), immediate (up)

