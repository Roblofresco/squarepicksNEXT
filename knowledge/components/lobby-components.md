# Lobby Components

## BoardCard.tsx
**Purpose**: Main card displaying a game board with team matchup, mini grid, and quick entry selector.
**Props**:
- `game` (GameType): Game data with resolved team info
- `user` (FirebaseUser | null): Current authenticated user
- `currentUserId` (string | null): User ID for fetching user squares
- `onProtectedAction` (fn): Handler for unauthorized actions
- `entryInteraction` (EntryInteractionState): Current entry flow state
- `handleBoardAction` (fn): Handler for entry actions
- `walletHasWallet` (boolean | null): Whether user has wallet setup
- `walletBalance` (number): User's wallet balance
- `walletIsLoading` (boolean): Wallet loading state
- `openWalletDialog` (fn): Handler to open wallet setup/deposit

**User Interactions**:
- View team matchup with logos and records
- Click mini grid to view full board
- Use QuickEntrySelector to enter board
- Hover for scale animation

**APIs Called**:
- Firestore listener for active board: `query(boards, where("gameID", "==", ...), where("status", "==", "open"))`
- `getBoardUserSelections` cloud function to fetch user's squares
- Board data syncs in real-time via Firestore snapshot

**Used in**:
- Lobby page (via BoardsList)
- Main board browsing interface

**Key Features**:
- Real-time board status updates
- "Free Entry!" badge for sweepstakes
- Live game indicator with animation
- Team logos with glow effects
- Integrated QuickEntrySelector for rapid entry
- Responsive card with hover effects
- Purchase success dialog

---

## BoardCardExpanded.tsx
**Purpose**: Expanded card view with detailed board information and progress bar.
**Props**:
- `board` (Board): Board data including entry fee, pot, squares filled

**User Interactions**:
- View progress bar of squares filled
- Click "View Board" or "Claim Free Square" button
- Navigate to board detail page

**APIs Called**: None (displays data passed as props).

**Used in**:
- Board listings with detailed view
- Featured board sections

**Key Features**:
- Entry fee display (FREE for $0)
- Total pot display
- Progress bar showing fill percentage
- Premium board highlighting with special styling
- Free entry badge for weekly promotions

---

## BoardMiniGrid.tsx
**Purpose**: Compact 10x10 grid visualization showing square availability and user selections.
**Props**:
- `boardData` (BoardType | null): Board data
- `currentUserSelectedSquares` (Set<number>): User's owned squares
- `highlightedNumber` (number | string): Currently selected square
- `showCurrentUserSquares` (boolean, default: true): Show user squares
- `showHighlightedSquare` (boolean, default: true): Show highlighted square
- `legendSquares` (number[]): Legend indicators [available, taken, owned]
- `forcedCurrentUserSquares` (Set<number>): Override user squares

**User Interactions**: None (read-only visualization).

**APIs Called**: None.

**Used in**:
- BoardCard (clickable link to full board)
- Board preview modals
- Game detail views

**Key Features**:
- Color-coded squares:
  - Blue gradient with glow: User's squares
  - Purple gradient with glow: Pre-selected square
  - Dark green with X: Taken by others
  - Green gradient: Available
- Responsive sizing
- Grid background with NFL theme

---

## BoardsList.tsx
**Purpose**: Container rendering list of BoardCard components with stagger animation.
**Props**:
- `games` (GameType[]): Array of games to display
- `teams` (Record<string, TeamInfo>): Team data lookup
- `user` (FirebaseUser | null): Current user
- `currentUserId` (string | null): User ID
- `onProtectedAction` (fn): Protected action handler
- `entryInteraction` (EntryInteractionState): Entry state
- `handleBoardAction` (fn): Board action handler
- `openWalletDialog` (fn): Wallet dialog handler
- `walletHasWallet` (boolean | null): Wallet status
- `walletBalance` (number): Wallet balance
- `walletIsLoading` (boolean): Wallet loading state

**User Interactions**: None directly (container for BoardCards).

**APIs Called**: None (passes data to child components).

**Used in**:
- Lobby page
- Main game browsing interface

**Key Features**:
- Framer Motion stagger animations
- Scroll margin for smooth anchor navigation
- Warning logging for missing team data
- Empty state message

---

## BottomNav.tsx
**Purpose**: Fixed bottom navigation bar with three main tabs.
**Props**:
- `user` (User | null): Current user
- `onProtectedAction` (fn): Handler for protected routes

**User Interactions**:
- Click tabs to navigate: My Boards, Lobby, Profile
- Visual feedback for active tab
- Restricted access redirects for protected routes

**APIs Called**: None.

**Used in**:
- All main app pages
- Fixed at bottom of viewport

**Key Features**:
- Protected routes (My Boards, Profile) require auth
- Active state highlighting with different text colors
- Icons: Grid (My Boards), Home (Lobby), User (Profile)
- Rounded top corners
- Backdrop blur effect

---

## GamesList.tsx
**Purpose**: Horizontal scrollable list of game cards with smart sorting.
**Props**:
- `games` (GameType[]): Array of games
- `user` (FirebaseUser | null): Current user
- `onProtectedAction` (fn): Protected action handler

**User Interactions**:
- Horizontal scroll through games
- Mousewheel converts vertical scroll to horizontal
- Click game card to view details
- Hover for game info in HoverCard

**APIs Called**: None.

**Used in**:
- Lobby page
- Game browsing sections

**Key Features**:
- Smart sorting: Upcoming → Live → Final
- Live game pulse animation
- Broadcast provider display
- Team logos with glow effects
- Time remaining display for live games
- Responsive sizing (150px mobile, 240px desktop)
- Custom scrollbar on hover

---

## LobbyHeader.tsx
**Purpose**: Top header with logo and user info.
**Props**: None (uses useWallet hook).

**User Interactions**:
- Click logo to return to lobby
- View username and balance

**APIs Called**: useWallet hook for balance data.

**Used in**:
- Lobby page
- Main app header

**Key Features**:
- SquarePicks logo
- User icon with truncated ID
- Wallet icon with balance
- Sticky positioning
- Backdrop blur

---

## QuickEntrySelector.tsx
**Purpose**: Three-state widget for rapid square entry (idle → selecting → confirming).
**Props**:
- `entryFee` (number): Board entry fee
- `isActiveCard` (boolean): Whether this selector is active
- `stage` ('idle' | 'selecting' | 'confirming'): Current stage
- `selectedNumber` (number | null): Selected square number
- `handleBoardAction` (fn): Action handler
- `boardId` (string): Board ID
- `user` (FirebaseUser | null): Current user
- `onProtectedAction` (fn): Protected action handler
- `walletHasWallet` (boolean | null): Wallet status
- `walletBalance` (number): Balance
- `walletIsLoading` (boolean): Loading state
- `openWalletDialog` (fn): Wallet dialog handler
- `takenNumbers` (Set<number>): Unavailable squares
- `onPurchaseSuccess` (fn): Success callback

**User Interactions**:
1. **Idle State**: Click "Enter" button to start
2. **Selecting State**: 
   - Type or click "Random" to select square number (0-99)
   - Click "Confirm?" when number selected
3. **Confirming State**: 
   - Review selection and fee
   - Click ✓ (checkmark) to purchase
   - Click ✗ (X) to cancel
4. Click outside to close

**APIs Called**:
- Wallet balance check (via props)
- `enterBoard` cloud function to purchase square

**Used in**:
- BoardCard component
- Quick entry from lobby

**Key Features**:
- Three distinct visual states
- Wallet validation before purchase
- Real-time taken number validation
- Random number selection
- Animated transitions
- Loading spinner during purchase
- Success callback triggers parent dialog
- Gradient button styling with sheen effects
- Click-outside-to-close functionality

---

## SportSelector.tsx
**Purpose**: Sport/sweepstakes tab selector with countdown timer and view switching.
**Props**:
- `sports` (Sport[]): Available sports
- `selectedSportId` (string): Currently selected sport
- `onSelectSport` (fn): Sport selection handler
- `sweepstakesStartTime` (Date | null): Countdown target time
- `sweepstakesGame` (any): Sweepstakes game data
- `sportSelectorView` ('sweepstakes' | 'allRegularSports'): Current view
- `setSportSelectorView` (fn): View switch handler

**User Interactions**:
- Click sweepstakes button to view countdown
- Click "More" to see all sports
- Click "Back to Sweepstakes" to return
- Click sport tabs to filter games (NFL only active, others show "Coming Soon")

**APIs Called**: None.

**Used in**:
- Lobby page
- Sport filtering interface

**Key Features**:
- Two view modes: Sweepstakes-focused and all sports
- Countdown timer for sweepstakes (format: "Xd:XXh:XXm:XXs")
- Live indicator when sweepstakes game is live
- Gold gradient styling for sweepstakes
- Purple gradient for "More" button
- Coming Soon overlay for disabled sports
- Animated view transitions with Framer Motion
- Tour mode restrictions
- Sport icons with hover effects

