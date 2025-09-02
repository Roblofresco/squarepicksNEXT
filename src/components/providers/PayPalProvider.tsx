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
  
  // For demonstration, use sandbox client ID if no real client ID is configured
  const effectiveClientId = clientId && clientId !== 'your_paypal_client_id' ? clientId : 'sb'
  
  if (!clientId || clientId === 'your_paypal_client_id') {
    console.warn('PayPal client ID not properly configured. Using sandbox mode for demonstration.')
  }

  return (
    <PayPalScriptProvider 
      options={{
        ...paypalOptions,
        clientId: effectiveClientId
      }}
      deferLoading={false}
    >
      {children}
    </PayPalScriptProvider>
  )
}
