# Financial Page: Transactions

**Route:** `/transactions`

**Purpose:** Displays a comprehensive history of all user transactions with filtering, sorting, and pagination capabilities. Shows deposits, withdrawals, entry fees, sweepstakes entries, winnings, and refunds.

---

## Components Used

### UI Components
- `Button`, `Loader2` - UI components from lucide-react
- `Tabs`, `TabsList`, `TabsTrigger` - Tab navigation for filters
- `motion` from `framer-motion` - Page animations

### Custom Components
- `Breadcrumbs` - Navigation breadcrumbs

### Context/Hooks
- `useAuth` - Provides `user`, `loading`
- `useRouter` - Navigation
- `useSearchParams` - URL parameters

---

## APIs Called

### Firebase Firestore
1. **`getDocs(query(collection(db, 'transactions'), where('userID', '==', user.uid), orderBy(sortBy, sortOrder)))`**
   - Fetches all transactions for authenticated user
   - Ordered by timestamp (desc by default) or amount
   - Returns full transaction history

2. **`getDoc(doc(db, 'games', gameId))`**
   - Fetches game document to retrieve team references
   - Used to format transaction titles for game-related transactions

3. **`getDoc(homeTeam)` & `getDoc(awayTeam)`**
   - Fetches team documents to get team names
   - Used for displaying game matchups in transaction titles

---

## Data Flow

### 1. **Initial Load**
```
Page Load
↓
Check auth state from useAuth
↓
If !user → Redirect to /login?redirect=/transactions
↓
Fetch all transactions for user
↓
Extract unique gameIds from transactions
↓
Fetch game & team data for all unique games (parallel)
↓
Build gameDataMap for quick lookups
↓
Display transactions
```

### 2. **Transaction Fetching**
```
User authenticated
↓
Query Firestore:
  - collection: 'transactions'
  - where: userID == user.uid
  - orderBy: sortBy (timestamp or amount)
  - order: sortOrder (asc or desc)
↓
Parse all transaction documents
↓
Store in transactions state array
```

### 3. **Game Data Enrichment**
```
Extract unique gameIds from transactions
↓
For each gameId:
  - Fetch game document
  - Get homeTeam & awayTeam refs
  - Fetch both team documents
  - Extract team names (full_name or city)
  - Store in gameDataMap
↓
Use gameDataMap to format transaction titles
```

### 4. **Filtering & Sorting**
```
Apply filters (client-side):
  - Type filter (all, deposit, withdrawal, entry, etc.)
  - Status filter (all, completed, pending, failed)
  - Date range filter
↓
Sort by timestamp or amount (via Firestore query)
↓
Toggle asc/desc order
↓
Paginate results (10 per page)
↓
Group by date (e.g., "8 JANUARY 2023")
↓
Display grouped transactions
```

### 5. **Transaction Display**
```
For each transaction:
  1. Format title (if game-related)
  2. Display type badge
  3. Show amount (color-coded by sign)
  4. Display description
  5. Show timestamp
↓
Group by date in collapsible sections
↓
Render with animations (framer-motion)
```

---

## Key Features

1. **Transaction Types**
   - Deposit
   - Withdrawal Request
   - Entry Fee
   - Sweepstakes Entry
   - Winnings
   - Refund

2. **Filtering System**
   - Tab-based type filter (ALL, DEPOSIT, WITHDRAW, ENTRY, SWEEPSTAKES, WINNINGS)
   - Gradient background for active tab
   - Horizontal scrolling for mobile
   - Instant client-side filtering

3. **Sorting Options**
   - Sort by: Timestamp or Amount
   - Order: Ascending or Descending
   - Sort glyph icon button in header

4. **Pagination**
   - 10 transactions per page
   - "Prev" and "Next" buttons
   - Current page indicator
   - Disabled state for first/last pages

5. **Date Grouping**
   - Transactions grouped by date
   - Format: "8 JANUARY 2023"
   - Separator lines between groups

6. **Transaction Title Formatting**
   - Game-related transactions show matchup:
     - Entry Fee: "$10 - Team A @ Team B"
     - Sweepstakes: "Free Board - Team A @ Team B"
     - Winnings: "First Quarter - Team A @ Team B"
     - Refund: "Refund - Team A @ Team B"
   - Deposit/Withdrawal use description as-is

7. **Visual Design**
   - Gradient filter tabs (accent-2 → accent-4)
   - Rounded cards with backdrop blur
   - Amount color-coded (green = positive, red = negative)
   - Type badge uppercase
   - Timestamp in 12-hour format

---

## State Management

### Local State
```typescript
const [transactions, setTransactions] = useState<Transaction[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [gameDataMap, setGameDataMap] = useState<Record<string, { home: string; away: string }>>({});
const [filterType, setFilterType] = useState<string>('all');
const [filterStatus, setFilterStatus] = useState<string>('all');
const [searchTerm] = useState<string>('');
const [dateRange] = useState<DateRange | undefined>(undefined);
const [sortBy, setSortBy] = useState<'timestamp' | 'amount'>('timestamp');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
const [page, setPage] = useState(1);
const pageSize = 10;
```

---

## Helper Functions

### 1. **getGameTeamNames(db, gameId)**
```typescript
async function getGameTeamNames(db: any, gameId: string): Promise<{ home: string; away: string } | null>
```
- Fetches game document
- Retrieves homeTeam and awayTeam refs
- Fetches both team documents
- Returns team names or null

### 2. **formatTransactionTitle(tx, teamNames)**
```typescript
function formatTransactionTitle(tx: Transaction, teamNames: { home: string; away: string } | null): string | null
```
- Formats transaction title based on type
- For deposit/withdrawal: returns null (use description)
- For board-related: returns formatted matchup string
- Includes amount prefix for certain types

---

## Filtering Logic

### Type Filter
- All: Show all transactions
- Deposit: `type === 'deposit'`
- Withdrawal Request: `type === 'withdrawal_request'`
- Entry Fee: `type === 'entry_fee'`
- Sweepstakes Entry: `type === 'sweepstakes_entry'`
- Winnings: `type === 'winnings'`

### Status Filter (Not Currently Active in UI)
- All: Show all statuses
- Completed: `status === 'completed'`
- Pending: `status === 'pending'`
- Failed: `status === 'failed'`

### Date Range Filter (Placeholder, Not Active)
- From date: Inclusive start
- To date: Inclusive end (adjusted to 23:59:59.999)

---

## Pagination

- **Page Size:** 10 transactions
- **Total Pages:** `Math.ceil(filteredTransactions.length / pageSize)`
- **Current Slice:** `transactions.slice((page - 1) * pageSize, page * pageSize)`
- **Navigation:** Prev/Next buttons with disabled states

---

## Security Considerations

- Firestore rules must enforce `where('userID', '==', userId)`
- All transactions filtered by authenticated user
- No access to other users' transactions
- Game and team data is public (no security risk)

---

## Performance Optimizations

1. **Parallel Data Fetching**
   - All game data fetched in parallel with `Promise.all()`

2. **Client-Side Filtering**
   - No repeated Firestore queries for filters
   - All filtering done on cached data

3. **Memoized Filtering**
   - `useMemo` for filtered/sorted transactions
   - Prevents unnecessary recalculations

4. **Pagination**
   - Only renders 10 transactions at a time
   - Reduces DOM size for large transaction histories

5. **Game Data Caching**
   - Fetched once and stored in `gameDataMap`
   - Reused for all transactions with same gameId

---

## UI States

### Loading State
- Full-page spinner
- Message: "Loading transactions..."

### Error State
- Error message display
- "Back to Wallet" button

### Empty State
- Message: "No transactions match your current filters."
- Centered in content area

### Content State
- Grouped transactions by date
- Paginated results
- Filter tabs
- Sort button

---

## Footer

- Not explicitly rendered on this page
- Can be added if needed

---

## Constants

```typescript
const pageSize = 10; // Transactions per page
```

---

## Animations

- Page-level fade-in with `framer-motion`
- Initial: `{ opacity: 0, y: 8 }`
- Animate: `{ opacity: 1, y: 0 }`

