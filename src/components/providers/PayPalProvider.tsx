'use client'

import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { ReactNode } from 'react'

interface PayPalProviderProps {
  children: ReactNode
}

export function PayPalProvider({ children }: PayPalProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

  // Check if PayPal client ID is properly configured
  if (!clientId || clientId === 'your_paypal_client_id' || clientId.trim() === '') {
    console.error('PayPal client ID not configured. Please set NEXT_PUBLIC_PAYPAL_CLIENT_ID in your environment variables.')
    console.error('For development, you can get sandbox credentials from: https://developer.paypal.com/developer/applications/')
    
    // Still render children but PayPal components will show error states
    return <>{children}</>
  }

  return (
    <PayPalScriptProvider 
      options={{
        clientId: clientId,
        currency: 'USD',
        intent: 'capture',
        components: 'buttons',
        enableFunding: 'paypal,venmo,card',
        disableFunding: '',
        dataSdkIntegrationSource: 'integrationbuilder_ac'
      }}
    >
      {children}
    </PayPalScriptProvider>
  )
}
