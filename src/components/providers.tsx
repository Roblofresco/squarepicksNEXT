'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { NotificationProvider } from '@/context/NotificationContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </LazyMotion>
  )
}
