'use client'

import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { ReactNode } from 'react'

interface PayPalProviderProps {
  children: ReactNode
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  // Always render children - let PayPal components handle their own error states
  if (!clientId || clientId === 'your_paypal_client_id' || clientId.trim() === '') {
    console.warn('PayPal client ID not configured. PayPal buttons will show error state.')
    return <>{children}</>
  }

  return (
    <PayPalScriptProvider 
      options={{
        clientId: clientId,
        currency: 'USD',
        intent: 'capture',
        components: 'buttons'
      }}
    >
      {children}
    </PayPalScriptProvider>
  )
}
