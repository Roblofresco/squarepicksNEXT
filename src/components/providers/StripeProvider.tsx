'use client'

import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

interface StripeProviderProps {
  children: React.ReactNode
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

export function StripeProvider({ children }: StripeProviderProps) {
  // Only render Stripe provider if publishable key is configured
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!publishableKey || publishableKey === 'pk_test_placeholder') {
    console.warn('Stripe publishable key not configured. Stripe functionality will be disabled.')
    return <>{children}</>
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  )
}
