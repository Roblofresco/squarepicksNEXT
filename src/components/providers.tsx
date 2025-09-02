'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { NotificationProvider } from '@/context/NotificationContext'
import { PayPalProvider } from './providers/PayPalProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <NotificationProvider>
        <PayPalProvider>
          {children}
        </PayPalProvider>
      </NotificationProvider>
    </LazyMotion>
  )
}
