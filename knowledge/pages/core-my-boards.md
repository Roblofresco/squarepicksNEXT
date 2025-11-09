# My Boards Page

## Route
`/my-boards`

## Purpose
Personal dashboard showing user's active and historical board entries. Users can view their picks, track game progress, check winning status, and navigate to specific boards.

## Components Used
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` - Tab navigation
- `SquareCard` - Board display card component
- `BottomNav` - Bottom navigation bar
- `Button`, `Input`, `Select`, `ToggleGroup` - UI controls
- `Dialog` components - Info dialogs
- `Loader2`, `Info`, `Trophy`, `ListChecks` icons (Lucide)
- `Image` (Next.js) - Logo display

## APIs Called
### Route Handler API:
- `GET /api/my-boards`
  - Headers: `Authorization: Bearer {idToken}`
  - Returns: All user's boards (active + history combined)
  - Response format:
    ```typescript
    {
      success: boolean;
      boards: AppBoard[];
      timestamp: number;
    }
    ```

### Authentication:
- `user.getIdToken()` - Firebase ID token for API auth

## Data Flow
1. **Authentication Check**:
   - Wait for auth loading to complete
   - Verify user is logged in
   - Get Firebase ID token

2. **Fetch All Boards**:
   - Single API call to `/api/my-boards`
   - No tab parameter (fetch everything at once)
   - Returns comprehensive board list

3. **Client-side Separation**:
   - Filter boards by status:
     - **Active**: 'open', 'in_play' statuses
     - **History**: 'closed', 'completed', 'cancelled' statuses
   - Store in separate state arrays

4. **Display & Filtering**:
   - Show boards based on active tab
   - Apply client-side search filter
   - Apply status filter (optional)
   - Apply sort preference

5. **Board Click**:
   - Navigate to `/game/{gameId}?boardId={boardId}`
   - Passes boardId as query param for specific board view

6. **Auto-refresh**:
   - Refresh every 30 seconds
   - Refresh on window focus
   - Manual refresh on error retry

## State Management
### Authentication:
- `user` - Firebase User object from AuthContext
- `authLoading` - Auth loading state from context

### Data:
- `activeBoards` - Array of active board entries
- `historicalBoards` - Array of completed/closed boards
- `loading` - Initial data fetch loading state
- `error` - Error message if fetch fails

### UI State:
- `activeTab` - 'active' or 'history'
- `searchTerm` - Search input value
- `statusFilter` - Filter by specific status ('all' or status value)
- `sortBy` - Sort preference ('date', 'amount', 'status')
- `viewMode` - Display mode ('grid' or 'list')

## Effects
### Initial Fetch:
- Triggers when user becomes available and auth loading completes
- Calls `fetchBoards()`
- Only runs once per user session

### Auto-refresh:
- Sets up 30-second interval
- Adds window focus listener
- Cleans up on unmount or user change
- Prevents memory leaks

## Filtering & Sorting
### Search Filter:
Searches across:
- Home team name
- Away team name
- Sport type

Case-insensitive substring match

### Status Filter:
- 'all' - Show all boards (no filter)
- Specific status - Show only matching boards

### Sorting Options:
- **date** (default): Most recent first
- **amount**: Highest entry fee first
- **status**: Alphabetical by status

Implemented via `useMemo` for performance

## Board Card Display
### Active Boards:
Shows boards with statuses:
- **open**: Squares available for entry
- **in_play**: Game in progress, user has entries

### Historical Boards:
Shows boards with statuses:
- **closed**: Game finished, results available
- **completed**: Fully processed, payouts distributed
- **cancelled**: Game cancelled, refunds processed

### Card Information:
- Team logos and names
- Game date/time or status
- Entry amount
- Number of user's squares
- Win indicators (if applicable)
- Board status badge

## Empty States
### No Active Boards:
- Icon: ListChecks
- Message: "No Active Boards"
- Description: "You don't have any boards currently in play or open for picks."
- Action: "Find a Game" → `/lobby`

### No History:
- Icon: Trophy
- Message: "No Board History"
- Description: "Your completed boards will appear here once games finish."
- No action (informational only)

### Sign In Required:
- Icon: Trophy
- Message: "Sign In Required"
- Description: "Please sign in to view your boards and track your picks."
- Action: "Sign In" → `/login`

## Loading States
### Initial Load:
- Center-aligned loader
- Spinner with "Loading your boards..." message
- Shows until data fetch completes

### Error State:
- Icon: Info (red)
- Message: "Error Loading Boards"
- Error details displayed
- Action: "Try Again" button (retries fetch)

## Navigation
### Header:
- Logo + "My Boards" title
- Branded identity

### Tabs:
- Active / History toggle
- Border separator
- Animated state transitions

### Board Click:
- Navigates to `/game/{gameId}?boardId={boardId}`
- Opens specific board view
- Preserves board context

### Bottom Navigation:
- BottomNav component
- Shows active indicator on My Boards tab
- Allows navigation to other sections

## Board Constants
From `@/constants/boardStatuses`:
- `ACTIVE_BOARD_STATUSES`: ['open', 'in_play']
- `HISTORY_BOARD_STATUSES`: ['closed', 'completed', 'cancelled']

## AppBoard Type
Interface from `@/types/myBoards`:
```typescript
interface AppBoard {
  id: string;
  gameId: string;
  status: 'open' | 'in_play' | 'closed' | 'completed' | 'cancelled';
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  sport: string;
  gameDateTime: string; // ISO timestamp
  amount: number; // Entry fee
  userSquares?: number[]; // User's square indexes
  winningSquares?: {
    q1?: string;
    q2?: string;
    q3?: string;
    final?: string;
  };
  // ... additional fields
}
```

## API Integration
### Request:
```typescript
GET /api/my-boards
Headers: {
  'Authorization': 'Bearer {firebaseIdToken}',
  'Content-Type': 'application/json'
}
```

### Response:
```typescript
{
  success: true,
  boards: [/* AppBoard[] */],
  timestamp: 1699123456789
}
```

### Error Handling:
- HTTP errors: Caught and displayed
- Network errors: Retry available
- Auth errors: Handled by middleware
- Data errors: Safe fallbacks

## Performance Optimizations
- **Single API call**: Fetches all boards at once
- **Client-side filtering**: No server round-trips for filters
- **Memoized filtering**: `useMemo` prevents unnecessary recalculations
- **Auto-refresh**: Keeps data current without manual refresh
- **Focus refresh**: Updates on tab return
- **Debounced callbacks**: Prevents excessive re-renders

## Responsive Design
- Grid layout adapts to screen size:
  - Mobile: 1 column
  - Tablet: 2 columns
  - Desktop: 3 columns
- Touch-friendly card targets
- Responsive spacing and padding
- Mobile-optimized tab navigation

## Accessibility
- Semantic tab navigation
- Focus management on state changes
- Loading announcements
- Error announcements
- Keyboard navigation support
- ARIA labels on interactive elements

## Security
- Firebase ID token authentication
- Server-side authorization
- User can only see their own boards
- API route protected by middleware

## User Experience
- Instant tab switching (client-side)
- Live filtering without delays
- Clear empty states with guidance
- Helpful error messages
- Auto-refresh keeps data fresh
- Quick navigation to boards
- Visual feedback on interactions

## Future Enhancements (noted in code):
- Search implementation (UI present, not fully wired)
- Status filter dropdown (UI present, not fully wired)
- Sort options (UI present, not fully wired)
- View mode toggle (grid/list)

