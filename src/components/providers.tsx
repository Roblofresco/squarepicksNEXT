'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { PayPalProvider } from './providers/PayPalProvider'
import { StripeProvider } from './providers/StripeProvider'
import BodyScrollManager from './BodyScrollManager'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => {})
    }
  }, [])

  return (
    <LazyMotion features={domAnimation}>
      <AuthProvider>
        <NotificationProvider>
          <PayPalProvider>
            <StripeProvider>
              <BodyScrollManager>
                {children}
              </BodyScrollManager>
            </StripeProvider>
          </PayPalProvider>
        </NotificationProvider>
      </AuthProvider>
    </LazyMotion>
  )
}
