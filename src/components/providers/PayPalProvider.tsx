'use client'

import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { ReactNode } from 'react'

// PayPal configuration
const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb', // Default to sandbox for development
  currency: 'USD',
  intent: 'capture',
  components: 'buttons',
  enableFunding: 'paylater,venmo,card',
  disableFunding: 'paypalcredit',
  dataPageType: 'checkout',
  dataClientToken: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_TOKEN || '',
  // Additional security and UX options
  vault: false,
  buyNow: false,
  commit: true,
}

interface PayPalProviderProps {
  children: ReactNode
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  // Only render PayPal provider if client ID is configured and not a placeholder
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  if (!clientId || clientId === 'your_paypal_client_id' || clientId === 'sb') {
    console.warn('PayPal client ID not properly configured. PayPal functionality will be disabled.')
    return <>{children}</>
  }

  return (
    <PayPalScriptProvider 
      options={paypalOptions}
      deferLoading={false}
    >
      {children}
    </PayPalScriptProvider>
  )
}
