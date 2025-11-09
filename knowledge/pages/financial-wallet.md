# Financial Page: Wallet

**Route:** `/wallet`

**Purpose:** Main wallet dashboard displaying the user's balance, recent transactions, and quick access to deposit/withdraw actions. Serves as the central hub for all financial operations.

---

## Components Used

### UI Components
- `Button` - Action buttons
- `Loader2` - Loading indicators
- `ArrowDownCircle`, `ArrowUpCircle`, `History`, `ArrowLeft`, `Home`, `DollarSign` - Icons from lucide-react
- `RiWallet3Fill` - Wallet icon from react-icons

### Custom Components
- `WalletMoneyContainer` - Styled container for recent activity section
- `Breadcrumbs` - Navigation breadcrumbs

### Context/Hooks
- `useWallet` - Provides wallet state: `hasWallet`, `balance`, `isLoading`, `error`, `initializeWallet`, `userId`, `emailVerified`
- `useRouter` - Navigation
- `useSearchParams` - URL parameter handling

---

## APIs Called

### Firebase Firestore
1. **`getDoc(doc(db, 'users', userId))`**
   - Fetches user document to retrieve `firstName` for greeting
   - Used in initial load effect

2. **`getDocs(query(collection(db, 'transactions'), where('userID', '==', userId), orderBy('timestamp', 'desc'), limit(5)))`**
   - Fetches the 5 most recent transactions for the user
   - Includes timestamp ordering and user filtering

---

## Data Flow

### 1. **Authentication & Authorization**
```
Load → Check userId & emailVerified
↓
If !userId → Prompt login
If emailVerified === false → Redirect to /verify-email
If userId && hasWallet === false → Show wallet setup prompt
If userId && hasWallet === true → Display wallet dashboard
```

### 2. **Initial Data Loading**
```
Page Load → useEffect triggers
↓
Fetch user firstName from Firestore (for greeting)
↓
If hasWallet → Fetch recent transactions (5 most recent)
↓
Parse & format transaction data
↓
Display in Recent Activity section
```

### 3. **Balance Display**
```
useWallet provides real-time balance
↓
Display as "$XXX.XX" in large text
↓
Balance updates automatically via useWallet context
```

### 4. **Transaction Display**
```
Fetch transactions → Parse timestamps
↓
Format each transaction:
  - Amount (positive = green, negative = red)
  - Description (type or custom description)
  - Timestamp (formatted as "MMM d, p")
  - Status badge (completed/pending/failed)
↓
Render in scrollable list with styled cards
```

### 5. **Navigation Actions**
```
User clicks Deposit → Navigate to /deposit
User clicks Withdraw → Navigate to /withdraw
User clicks "View All Transactions" → Navigate to /transactions
User clicks "Setup Wallet Now" → Call initializeWallet()
```

### 6. **Error Handling**
```
If walletError → Display error message
If transactionError → Display "Could not load recent activity"
If !userId after load → Show login prompt
```

---

## Key Features

1. **Wallet Status Detection**
   - Displays different UI based on wallet setup status
   - Prompts setup if `hasWallet === false`

2. **Recent Activity Section**
   - Shows 5 most recent transactions
   - Each transaction displays:
     - Type (uppercase badge)
     - Amount (colored by sign)
     - Description
     - Timestamp
     - Status badge (styled by status)

3. **Quick Actions**
   - Circular gradient buttons for Deposit & Withdraw
   - Visual feedback on click (scale animation)

4. **Footer Links**
   - Terms of Service
   - Privacy Policy
   - Support link

5. **Email Verification Guard**
   - Automatically redirects to `/verify-email` if email not verified
   - Prevents wallet access for unverified users

6. **Loading States**
   - Skeleton loaders for transactions while fetching
   - Full-page spinner during wallet initialization

---

## State Management

### Local State
```typescript
const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
const [loadingTransactions, setLoadingTransactions] = useState(false);
const [transactionError, setTransactionError] = useState<string | null>(null);
const [firstName, setFirstName] = useState<string>('');
```

### Context State (via useWallet)
```typescript
const { hasWallet, balance, isLoading, error, initializeWallet, userId, emailVerified } = useWallet();
```

---

## Security Considerations

- Firestore rules must enforce `where('userID', '==', userId)` for transactions query
- Email verification check prevents unverified users from accessing wallet
- All transaction queries scoped to authenticated user only

