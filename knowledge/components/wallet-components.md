# Wallet Components

## WalletPill.tsx
**Purpose**: Animated pill displaying user's wallet balance with smooth transitions.
**Props**:
- `balance` (number | null): Current wallet balance
- `onClick` (fn): Handler for clicking the pill
- `variant` ('header' | 'docked'): Display variant (both currently have same styling)

**User Interactions**:
- Click to open wallet dialog/page
- Visual feedback on hover
- Animated transitions when moving between header and other locations

**APIs Called**: None (displays data from useWallet hook).

**Used in**:
- Lobby header
- Board confirmation dialogs
- Anywhere wallet balance needs to be displayed

**Key Features**:
- Uses Framer Motion `layoutId="wallet-pill"` for smooth position transitions
- Fade animation when switching variants
- Displays balance as formatted currency ($0.00)
- Disabled state when balance is null
- BiWallet icon with accent color

---

## WalletMoneyContainer.tsx
**Purpose**: Decorative container with visual "dollar bill" stack effect for wallet-related content.
**Props**:
- `title` (string, default: 'Recent Activities'): Header title
- `variant` ('blue' | 'green' | 'purple', default: 'blue'): Color theme
- `className` (string): Additional CSS classes
- `bottomless` (boolean, default: false): Whether to have rounded bottom corners
- `footer` (React.ReactNode): Footer content
- `headerActions` (React.ReactNode): Actions in header
- `children` (React.ReactNode): Main content

**User Interactions**: None directly (container component).

**APIs Called**: None.

**Used in**:
- Wallet page
- Transaction history
- Financial summary sections

**Key Features**:
- Three stacked "dollar bill" layers with rotation effects
- Color-coded variants for different contexts (deposit, withdrawal, balance)
- Gradient overlays for depth
- Responsive layout with pinned footer
- Customizable header with action buttons

---

## Related Wallet UI Components

### PayPalDepositButton.tsx
See UI Components documentation.

### StripeDepositButton.tsx
See UI Components documentation.

### PersonalInfoForm.tsx
Used in wallet setup/KYC flow. See UI Components documentation.

