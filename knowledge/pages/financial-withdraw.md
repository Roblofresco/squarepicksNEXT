# Financial Page: Withdraw

**Route:** `/withdraw`

**Purpose:** Allows users to request a withdrawal from their wallet balance to their PayPal account. Users enter an amount, provide PayPal email, and submit a withdrawal request for review.

---

## Components Used

### UI Components
- `Button`, `Input`, `Label` - Form components
- `Loader2`, `Send` - Icons from lucide-react

### Custom Components
- `WalletMoneyContainer` - Styled container for withdrawal UI
- `Breadcrumbs` - Navigation breadcrumbs

### Form Management
- `useForm` from `react-hook-form` - Form state management
- `zodResolver` from `@hookform/resolvers/zod` - Form validation
- `zod` - Schema validation

### Context/Hooks
- `useWallet` - Provides `hasWallet`, `balance`, `isLoading`, `userId`
- `useRouter` - Navigation
- `toast` from `react-hot-toast` - Toast notifications

---

## APIs Called

### Firebase Cloud Functions
1. **`requestWithdrawal({ amount, method, details })`**
   - Cloud Function: Processes withdrawal request
   - Region: `us-east1`
   - Input:
     ```typescript
     {
       amount: number,
       method: 'paypal',
       details: {
         paypalEmail: string
       }
     }
     ```
   - Output:
     ```typescript
     {
       success: boolean,
       message?: string
     }
     ```
   - Creates a withdrawal request document in Firestore
   - Sets status to 'pending' for admin review

---

## Data Flow

### 1. **Initial Load & Validation**
```
Page Load
↓
Check userId & hasWallet from useWallet
↓
If !userId → Redirect to /login?redirect=/withdraw
If !hasWallet → 
  - Show toast error: "You must set up your wallet before making a withdrawal"
  - Redirect to /wallet
↓
Display withdrawal form
```

### 2. **Form Validation**
```
User enters amount and PayPal email
↓
Validate with Zod schema:
  - Amount must be positive
  - Amount >= $5.00 (minimum)
  - Amount <= $10,000.00 (maximum)
  - PayPal email must be valid email format
  - Email domain must be from common providers or contain "."
↓
Additional validation on submit:
  - Amount must not exceed current balance
```

### 3. **Submission Flow**
```
User clicks "Submit Request"
↓
Check if amount > balance
  - If yes: Show error "Withdrawal amount cannot exceed your current balance"
  - If no: Continue
↓
Show loading toast: "Submitting withdrawal request..."
↓
Call Cloud Function: requestWithdrawal()
↓
On Success:
  - Show success toast: "Withdrawal request submitted successfully! It is now pending review."
  - Navigate to /wallet
On Error:
  - Show error toast with error message
  - Stay on page
```

---

## Key Features

1. **Amount Validation**
   - Minimum: $5.00
   - Maximum: $10,000.00
   - Cannot exceed current balance
   - Real-time validation with error messages

2. **PayPal Email Validation**
   - Must be valid email format
   - Domain validation (common providers: gmail, yahoo, hotmail, outlook, paypal)
   - Or any domain containing "."

3. **Balance Display**
   - Shows current balance below amount input
   - Helps user see available funds

4. **Processing Information**
   - Displays withdrawal processing timeline:
     - Reviewed within 3-5 business days
     - May vary during holidays/weekends
     - Email confirmation sent when processed
     - Funds sent to PayPal account

5. **Warning Notice**
   - Yellow warning about PayPal email accuracy
   - Emphasizes importance of correct email

---

## State Management

### Local State
```typescript
const [isSubmitting, setIsSubmitting] = useState(false);
```

### Form State (react-hook-form)
```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  setError,
} = useForm<WithdrawalFormValues>({
  resolver: zodResolver(withdrawalSchema),
});
```

### Context State (via useWallet)
```typescript
const { hasWallet, balance, isLoading, userId } = useWallet();
```

---

## Validation Schema

```typescript
const withdrawalSchema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .positive({ message: 'Amount must be positive.' })
    .min(5, { message: 'Minimum withdrawal amount is $5.00.' })
    .max(10000, { message: 'Maximum withdrawal amount is $10,000.00.' }),
  paypalEmail: z.string()
    .email({ message: 'Please enter a valid PayPal email address.' })
    .min(1, { message: 'PayPal email is required.' })
    .refine((email) => {
      const validDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'paypal.com'];
      const domain = email.split('@')[1]?.toLowerCase();
      return validDomains.includes(domain) || domain?.includes('.');
    }, { message: 'Please enter a valid email address.' }),
});
```

---

## Security Considerations

- User must be authenticated (redirects to login if not)
- User must have completed wallet setup (redirects to wallet if not)
- Amount cannot exceed balance (enforced client-side and server-side)
- Cloud Function validates:
  - User authentication
  - Sufficient balance
  - Valid amount range
  - Valid PayPal email format
- Withdrawal requests set to 'pending' status
- Requires admin approval before processing

---

## Form Fields

1. **Amount (USD)**
   - Type: number
   - Min: $5.00
   - Max: $10,000.00
   - Input mode: decimal
   - Step: 0.01
   - Current balance displayed below input

2. **PayPal Email**
   - Type: email
   - Placeholder: "you@example.com"
   - Validation: Valid email with approved domain

---

## UI States

### Loading State
- Full-page spinner
- Message: "Loading wallet status..."
- Displayed while `walletLoading === true`

### Form State (Default)
- Amount input with dollar sign
- PayPal email input
- Submit button enabled
- Processing information displayed
- Warning notice about email accuracy

### Submitting State
- Submit button disabled
- Button shows spinner and "Submitting..." text
- Form inputs disabled

---

## Processing Timeline

The UI displays this information to users:
- Withdrawal requests reviewed within 3-5 business days
- Processing time may vary during holidays/weekends
- Email confirmation sent once processed
- Funds sent to PayPal account

**Warning:** Incorrect PayPal emails may delay processing

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
const MIN_WITHDRAWAL = 5;
const MAX_WITHDRAWAL = 10000;
```

---

## Error Handling

1. **Form Validation Errors**
   - Displayed below each input field
   - Red text with specific error message

2. **Balance Exceeded Error**
   - Set via `setError('amount', { ... })`
   - Displayed below amount input

3. **Cloud Function Errors**
   - Caught in try/catch
   - Displayed via error toast
   - Error message from function or generic fallback

4. **Toast Notifications**
   - Loading toast during submission
   - Success toast on completion
   - Error toast on failure
   - Toast ID reused for seamless updates

