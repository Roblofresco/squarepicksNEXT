'use client'

import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { ReactNode } from 'react'

// PayPal configuration - simplified for better compatibility
const paypalOptions = {
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
  currency: 'USD',
  intent: 'capture',
  components: 'buttons',
  // Simplified funding options to avoid conflicts
  enableFunding: 'paylater,venmo',
  disableFunding: 'paypalcredit',
  // Remove potentially problematic options
  commit: true,
}

interface PayPalProviderProps {
  children: ReactNode
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  // Only render PayPal provider if client ID is configured and not a placeholder
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  
  if (!clientId || clientId === 'your_paypal_client_id' || clientId.trim() === '') {
    console.warn('PayPal client ID not properly configured. PayPal functionality will be disabled.')
    return <>{children}</>
  }

  // Log configuration for debugging (remove in production)
  console.log('PayPal SDK Configuration:', {
    clientId: clientId.substring(0, 10) + '...',
    currency: paypalOptions.currency,
    intent: paypalOptions.intent,
    components: paypalOptions.components
  })

  return (
    <PayPalScriptProvider 
      options={{
        ...paypalOptions,
        clientId: clientId
      }}
      deferLoading={false}
    >
      {children}
    </PayPalScriptProvider>
  )
}
