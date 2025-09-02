'use client'

import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { ReactNode } from 'react'

// PayPal configuration
const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb', // Default to sandbox for development
  currency: 'USD',
  intent: 'capture',
  'enable-funding': 'paylater,venmo,card',
  'disable-funding': 'paypalcredit',
  'data-client-token': 'abc123xyz==',
  'data-page-type': 'checkout',
  'data-order-id': '',
  'data-amount': '',
  'data-currency': 'USD',
}

interface PayPalProviderProps {
  children: ReactNode
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  // Only render PayPal provider if client ID is configured
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    console.warn('PayPal client ID not configured. PayPal functionality will be disabled.')
    return <>{children}</>
  }

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  )
}
