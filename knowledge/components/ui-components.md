# UI Components (shadcn/ui wrappers)

## alert-dialog.tsx
**Purpose**: Modal dialog for critical actions requiring confirmation.
**Props**: AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel components accept standard React props.
**User Interactions**: Click trigger to open, click action/cancel buttons to confirm/dismiss.
**APIs Called**: None (client-side only).
**Used in**: Various pages for confirmation dialogs.

## alert.tsx
**Purpose**: Display contextual feedback messages.
**Props**: `variant` (default | destructive), standard div props.
**User Interactions**: Read-only display.
**APIs Called**: None.
**Used in**: Throughout app for info/error messages.

## badge.tsx
**Purpose**: Display status indicators and tags.
**Props**: `variant` (default | secondary | destructive | outline), `asChild` boolean.
**User Interactions**: Read-only display, clickable if used as link.
**APIs Called**: None.
**Used in**: Status indicators, tags, labels.

## button.tsx
**Purpose**: Standard button component with variants.
**Props**: `variant` (default | destructive | outline | secondary | ghost | link), `size` (default | sm | lg | icon), `asChild` boolean.
**User Interactions**: Click to trigger actions.
**APIs Called**: None.
**Used in**: Throughout app for all button interactions.

## card.tsx
**Purpose**: Container component for grouped content.
**Props**: Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent components.
**User Interactions**: None directly.
**APIs Called**: None.
**Used in**: Board cards, game cards, content sections.

## carousel.tsx
**Purpose**: Scrollable carousel for displaying multiple items.
**Props**: `orientation` (horizontal | vertical), `opts` (EmblaCarouselOptions), `plugins`, `setApi`.
**User Interactions**: Swipe/drag to navigate, arrow key navigation.
**APIs Called**: None.
**Used in**: Game lists, image galleries.

## dialog.tsx
**Purpose**: Modal dialog overlay.
**Props**: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription components.
**User Interactions**: Click trigger to open, close button to dismiss, click outside to close.
**APIs Called**: None.
**Used in**: Settings, forms, confirmation flows.

## drawer.tsx
**Purpose**: Side drawer that slides in from edges.
**Props**: Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription components.
**User Interactions**: Click trigger to open, swipe/click to close.
**APIs Called**: None.
**Used in**: Mobile navigation, filters.

## form.tsx
**Purpose**: Form context and validation components.
**Props**: Form (FormProvider), FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage.
**User Interactions**: Input validation, error display.
**APIs Called**: None (uses react-hook-form).
**Used in**: All forms in the app.

## hero-text.tsx
**Purpose**: Animated text component with layout transitions.
**Props**: `id`, `children`, `className`, `animate`, `delay`.
**User Interactions**: None directly.
**APIs Called**: None.
**Used in**: Hero sections, animated headings.

## hover-card.tsx
**Purpose**: Popover card on hover.
**Props**: HoverCard, HoverCardTrigger, HoverCardContent.
**User Interactions**: Hover to display content.
**APIs Called**: None.
**Used in**: Tooltips, additional info displays.

## input.tsx
**Purpose**: Text input field.
**Props**: Standard input props, `type`.
**User Interactions**: Text entry.
**APIs Called**: None.
**Used in**: All text input forms.

## label.tsx
**Purpose**: Form field label.
**Props**: Standard label props.
**User Interactions**: None directly.
**APIs Called**: None.
**Used in**: Form fields.

## progress.tsx
**Purpose**: Progress bar indicator.
**Props**: `value` (0-100).
**User Interactions**: Read-only display.
**APIs Called**: None.
**Used in**: Loading states, board fill indicators.

## radio-group.tsx
**Purpose**: Radio button group selection.
**Props**: RadioGroup and RadioGroupItem components.
**User Interactions**: Click to select option.
**APIs Called**: None.
**Used in**: Single-choice selections.

## select.tsx
**Purpose**: Dropdown select component.
**Props**: Select, SelectTrigger, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectValue.
**User Interactions**: Click to open, select option.
**APIs Called**: None.
**Used in**: Dropdowns throughout app.

## separator.tsx
**Purpose**: Visual divider.
**Props**: `orientation` (horizontal | vertical), `decorative`.
**User Interactions**: None.
**APIs Called**: None.
**Used in**: Section dividers.

## sheet.tsx
**Purpose**: Side panel overlay.
**Props**: Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, `side` (top | right | bottom | left).
**User Interactions**: Open/close actions.
**APIs Called**: None.
**Used in**: Side panels, mobile menus.

## skeleton.tsx
**Purpose**: Loading placeholder.
**Props**: Standard div props.
**User Interactions**: None.
**APIs Called**: None.
**Used in**: Loading states.

## switch.tsx
**Purpose**: Toggle switch.
**Props**: Standard switch props.
**User Interactions**: Click to toggle on/off.
**APIs Called**: None.
**Used in**: Settings, binary choices.

## table.tsx
**Purpose**: Data table components.
**Props**: Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption.
**User Interactions**: Read-only display.
**APIs Called**: None.
**Used in**: Data displays, leaderboards.

## tabs.tsx
**Purpose**: Tabbed content interface.
**Props**: Tabs, TabsList, TabsTrigger, TabsContent.
**User Interactions**: Click tabs to switch content.
**APIs Called**: None.
**Used in**: Multi-section content areas.

## toggle.tsx
**Purpose**: Toggle button.
**Props**: `variant` (default | outline), `size` (default | sm | lg).
**User Interactions**: Click to toggle state.
**APIs Called**: None.
**Used in**: Filter toggles, view switches.

## toggle-group.tsx
**Purpose**: Group of toggle buttons.
**Props**: ToggleGroup, ToggleGroupItem, `variant`, `size`.
**User Interactions**: Click to toggle items.
**APIs Called**: None.
**Used in**: Multi-select filters.

---

## Application-Specific UI Components

## EmailVerificationBanner.tsx
**Purpose**: Banner prompting email verification.
**Props**: None (uses useWallet hook).
**User Interactions**: Click "Resend Email" button, close banner.
**APIs Called**: `resendVerificationEmail` from useWallet.
**Used in**: All pages when email not verified.

## PayPalDepositButton.tsx
**Purpose**: PayPal payment integration button.
**Props**: `amount`, `userId`, `onSuccess`, `onError`.
**User Interactions**: Click PayPal button, complete payment flow.
**APIs Called**: `/api/paypal/create-order`, `capturePayPalOrder` cloud function.
**Used in**: Wallet deposit page.

## StripeDepositButton.tsx
**Purpose**: Stripe payment integration.
**Props**: `amount`, `onSuccess`, `onError`.
**User Interactions**: Enter card details, submit payment.
**APIs Called**: `/api/stripe/create-payment-intent`.
**Used in**: Wallet deposit page.

## PersonalInfoForm.tsx
**Purpose**: User personal information form.
**Props**: `formData`, `onChange`, `onSubmit`, `isSubmitting`, `error`, `verifiedState`.
**User Interactions**: Input text fields, submit form.
**APIs Called**: Submission handled by parent component.
**Used in**: Signup flow, profile settings.

## ProgressBar.tsx
**Purpose**: Step progress indicator.
**Props**: `step`, `totalSteps`.
**User Interactions**: None (read-only display).
**APIs Called**: None.
**Used in**: Multi-step forms, signup flow.

## WalletMoneyContainer.tsx
**Purpose**: Decorative wallet-themed container with visual "money bills".
**Props**: `title`, `variant` (blue | green | purple), `className`, `bottomless`, `footer`, `headerActions`, `children`.
**User Interactions**: None directly (container component).
**APIs Called**: None.
**Used in**: Wallet page, financial displays.

