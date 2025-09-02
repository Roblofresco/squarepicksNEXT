'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { PayPalProvider } from './providers/PayPalProvider'
import { StripeProvider } from './providers/StripeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <AuthProvider>
        <NotificationProvider>
          <PayPalProvider>
            <StripeProvider>
              {children}
            </StripeProvider>
          </PayPalProvider>
        </NotificationProvider>
      </AuthProvider>
    </LazyMotion>
  )
}
