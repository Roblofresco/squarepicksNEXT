# SquarePicks React Components Documentation

Complete documentation of all React components used in the SquarePicks application.

## Documentation Structure

### [UI Components](./ui-components.md)
shadcn/ui wrappers and application-specific UI components (~30 components).

**Core shadcn/ui Components**:
- `alert-dialog`, `alert`, `badge`, `button`, `card`
- `carousel`, `dialog`, `drawer`, `form`
- `hover-card`, `input`, `label`, `progress`
- `radio-group`, `select`, `separator`, `sheet`
- `skeleton`, `switch`, `table`, `tabs`
- `toggle`, `toggle-group`

**Application-Specific UI**:
- `EmailVerificationBanner` - Email verification prompt
- `PayPalDepositButton` - PayPal payment integration
- `StripeDepositButton` - Stripe payment integration
- `PersonalInfoForm` - User info collection form
- `ProgressBar` - Step progress indicator
- `WalletMoneyContainer` - Decorative wallet container with visual effects

### [Auth Components](./auth-components.md)
Authentication and authorization components (2 components).

- `AuthGuard` - Route protection with email verification
- `LoginForm` - Reusable login form with validation

### [Wallet Components](./wallet-components.md)
Wallet and payment-related components (3 components).

- `WalletPill` - Animated balance display with transitions
- `WalletMoneyContainer` - Visual container with dollar bill effects
- Payment buttons (see UI Components)

### [Lobby Components](./lobby-components.md)
Game lobby and board browsing components (10 components).

- `BoardCard` - Main board display with mini grid and quick entry
- `BoardCardExpanded` - Detailed board card with progress bar
- `BoardMiniGrid` - Compact 10x10 grid visualization
- `BoardsList` - Container for board cards with animations
- `BottomNav` - Fixed bottom navigation bar
- `GamesList` - Horizontal scrollable game cards
- `LobbyHeader` - Top header with logo and user info
- `QuickEntrySelector` - Three-state rapid entry widget
- `SportSelector` - Sport tabs with sweepstakes countdown

### [Game/Board Components](./game-board-components.md)
Board gameplay and visualization components (3 components).

- `BoardGridDisplay` - Full 10x10 board grid with team bars
- `QuarterScoreboard` - Quarter-by-quarter score display
- `SquareCard` - User's board participation card

### [Notification Components](./notification-components.md)
Notification system components (3 components).

- `NotificationIcon` - Bell icon with unread badge
- `NotificationItem` - Swipeable notification card
- `NotificationList` - Dropdown notification panel

---

## Component Count Summary

- **UI Components**: ~30 (shadcn/ui wrappers + custom)
- **Auth Components**: 2
- **Wallet Components**: 3 (+ payment buttons in UI)
- **Lobby Components**: 10
- **Game/Board Components**: 3
- **Notification Components**: 3

**Total**: ~51 documented components

---

## Common Patterns

### State Management
- Most components use React hooks (`useState`, `useEffect`)
- Context used for: Notifications, Wallet data
- Props drilling for parent-child communication

### Styling
- Tailwind CSS for all styling
- Custom CSS for complex animations
- Color variants: accent-1 (blue), accent-2 (purple), accent-3 (pink)
- Glass morphism effects (backdrop-blur)

### Animations
- Framer Motion for complex transitions
- CSS transitions for simple effects
- Layout animations with `layoutId`
- Stagger animations for lists

### API Integration
- Firebase Auth for authentication
- Firestore for real-time data
- Cloud Functions for backend operations
- Next.js API routes for payments

### Protected Actions
- `onProtectedAction` callback pattern
- AuthGuard for route protection
- Wallet checks before purchases
- Email verification enforcement

### Responsive Design
- Mobile-first approach
- Breakpoint: `sm:` (640px)
- Touch and mouse event support
- Swipe gestures for mobile

---

## Key Technologies

- **React 18+** - UI framework
- **Next.js 14+** - App framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **shadcn/ui** - Component library
- **Radix UI** - Primitives
- **Firebase** - Backend services
- **Stripe/PayPal** - Payment processing

---

## Component Location

All components located in `src/components/` with the following structure:

```
src/components/
├── ui/                 # shadcn/ui components
├── auth/               # Authentication components
├── wallet/             # Wallet components
├── lobby/              # Lobby/game browsing
├── my-boards/          # Board gameplay
├── notifications/      # Notification system
├── providers/          # Context providers
├── navigation/         # Navigation components
└── [other]/           # Misc components
```

---

## Usage Notes

### For Developers
- Check individual component files for full prop definitions
- All components are TypeScript with proper type safety
- Most components are memoized with `React.memo`
- Follow existing patterns when adding new components

### For AI/LLM Context
- Use this documentation to understand component relationships
- Reference specific files when making changes
- Consider prop dependencies and data flow
- Check "Used in" sections to understand impact of changes

---

Last Updated: 2025-01-08
Documentation generated from component source code.

