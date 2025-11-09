# Financial Page: Deposit

**Route:** `/deposit`

**Purpose:** Allows users to add funds to their wallet using PayPal. Users enter an amount, confirm payment method, and complete the transaction via PayPal integration.

---

## Components Used

### UI Components
- `Button`, `Input`, `Label` - Form components
- `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` - Card layout
- `Skeleton` - Loading skeletons
- `ArrowLeft`, `DollarSign`, `CheckCircle`, `AlertCircle` - Icons from lucide-react

### Custom Components
- `WalletMoneyContainer` - Styled container for deposit UI
- `PayPalDepositButton` - PayPal integration component
- `Breadcrumbs` - Navigation breadcrumbs

### Form Management
- `useForm` from `react-hook-form` - Form state management
- `zodResolver` from `@hookform/resolvers/zod` - Form validation
- `zod` - Schema validation

### Context/Hooks
- `useWallet` - Provides `hasWallet`, `isLoading`, `userId`
- `useRouter` - Navigation

---

## APIs Called

### Firebase Firestore (via PayPalDepositButton)
The `PayPalDepositButton` component handles:
1. PayPal order creation
2. PayPal order capture
3. Transaction recording in Firestore

No direct API calls from this page - all payment processing delegated to `PayPalDepositButton` component.

---

## Data Flow

### 1. **Initial Load & Validation**
```
Page Load
↓
Check userId & hasWallet from useWallet
↓
If !userId → Redirect to /login?redirect=/deposit
If !hasWallet → Redirect to /wallet (setup required)
↓
Display amount entry form
```

### 2. **Amount Entry Flow**
```
User enters amount in input field
↓
Validate with Zod schema:
  - Must be between $5 and $1000
  - Must be valid number
↓
User clicks "Continue to Payment"
↓
setSelectedAmount(amount)
setSelectedPaymentMethod('paypal')
↓
Display PayPal payment UI
```

### 3. **Payment Flow**
```
User sees PayPal button
↓
User clicks PayPal button
↓
PayPal modal opens (handled by PayPalDepositButton)
↓
User completes payment in PayPal modal
↓
On Success:
  - PayPalDepositButton calls onSuccess(amount)
  - setSuccessAmount(amount)
  - setSuccess(true)
  - Display success screen
On Error:
  - PayPalDepositButton calls onError(errorMessage)
  - setError(errorMessage)
  - Display error message
```

### 4. **Success Screen**
```
Payment successful
↓
Display green checkmark with success message
↓
Show options:
  - "View Wallet" → Navigate to /wallet
  - "Make Another Deposit" → Reset form
```

---

## Key Features

1. **Amount Validation**
   - Minimum: $5.00
   - Maximum: $1,000.00
   - Client-side validation with Zod schema

2. **Three-Stage UI**
   - **Stage 1:** Enter amount
   - **Stage 2:** Complete payment with PayPal
   - **Stage 3:** Success confirmation

3. **PayPal Integration**
   - Delegated to `PayPalDepositButton` component
   - Handles order creation, capture, and transaction recording

4. **Success Actions**
   - View Wallet button → `/wallet`
   - Make Another Deposit button → Reset form to stage 1

5. **Error Handling**
   - Form validation errors (amount out of range)
   - PayPal payment errors (handled by PayPalDepositButton)

6. **Navigation Controls**
   - Back arrow button (stage 2) → Return to amount entry
   - Breadcrumbs for global navigation

---

## State Management

### Local State
```typescript
const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'paypal' | null>(null);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
const [successAmount, setSuccessAmount] = useState<string>('');
```

### Form State (react-hook-form)
```typescript
const form = useForm<DepositFormData>({
  resolver: zodResolver(depositSchema),
  defaultValues: {
    amount: '',
  },
});
```

### Context State (via useWallet)
```typescript
const { hasWallet, isLoading, userId } = useWallet();
```

---

## Validation Schema

```typescript
const depositSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 5 && num <= 1000;
  }, 'Amount must be between $5 and $1000'),
});
```

---

## Security Considerations

- User must be authenticated (redirects to login if not)
- User must have completed wallet setup (redirects to wallet if not)
- Amount validation enforced client-side and server-side (in PayPal functions)
- PayPal handles all payment processing securely
- Transaction recording managed by PayPalDepositButton component

---

## UI States

### Loading State
- Skeleton placeholders
- Displayed while `walletLoading === true`

### Form State (Default)
- Amount input field with dollar sign icon
- "Continue to Payment" button
- Card description with min/max amounts

### Payment State
- Selected amount displayed in badge
- PayPal button rendered
- Back arrow to return to form
- Error message display area

### Success State
- Green checkmark icon
- Success message
- Confirmation text about funds added
- "View Wallet" and "Make Another Deposit" buttons

---

## Footer

- Copyright notice
- Links to:
  - Terms of Service
  - Privacy Policy
  - Support

---

## Constants

```typescript
const MIN_DEPOSIT = 5;
const MAX_DEPOSIT = 1000;
```

