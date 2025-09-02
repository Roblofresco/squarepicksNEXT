# Knowledge: /deposit

## Overview
The deposit page allows users to add funds to their wallet using PayPal. This page implements the complete payment flow as documented in [wallet-flow](./wallet-flow.md).

## Implementation Status
✅ **COMPLETED** - PayPal integration fully implemented

## Capabilities

### 1. PayPal SDK Integration
- **PayPal Provider**: Wraps the app with PayPalScriptProvider
- **PayPal Buttons**: Renders PayPal payment buttons with proper styling
- **Script Loading**: Handles PayPal script initialization and loading states

### 2. Payment Flow
- **Amount Selection**: Users enter deposit amount ($5-$1000 range)
- **Order Creation**: Creates PayPal order via Firebase Cloud Function
- **Payment Processing**: Handles PayPal approval and payment capture
- **Transaction Recording**: Updates wallet balance and creates transaction records

### 3. User Experience
- **Multi-step Flow**: Amount selection → Payment → Success confirmation
- **Loading States**: Shows progress during payment processing
- **Error Handling**: Comprehensive error handling with retry options
- **Success Feedback**: Clear confirmation and navigation options

## Technical Implementation

### Components
- `PayPalProvider`: Wraps app with PayPal SDK configuration
- `PayPalDepositButton`: Handles complete payment flow
- `DepositPage`: Main page with amount selection and payment flow

### Integration Points
- **Firebase Functions**: `createPayPalOrder`, `capturePayPalOrder`
- **PayPal API**: Order creation and payment capture
- **Firestore**: Transaction recording and wallet balance updates

### Environment Configuration
```bash
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
```

## User Flow
1. User navigates to `/deposit`
2. User enters deposit amount ($5-$1000)
3. User clicks "Continue to Payment"
4. PayPal buttons render for payment completion
5. User completes PayPal payment
6. Payment is captured and wallet updated
7. Success confirmation with navigation options

## Error Handling
- PayPal script loading failures
- Order creation errors
- Payment capture failures
- Network/API errors
- User cancellation

## Testing
- PayPal sandbox integration
- Firebase function validation
- Error scenario coverage
- Cross-browser compatibility 