'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import AuthBackground from '@/components/layout/AuthBackground'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

const VerifyEmailPage = () => {
  const router = useRouter()
  const { userId, emailVerified, resendVerificationEmail, isLoading: walletLoading } = useWallet()
  const [isResending, setIsResending] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (emailVerified === true) {
      router.push('/lobby')
    }
    const timer = setTimeout(() => {
      if (!walletLoading && !userId) router.push('/login')
      headingRef.current?.focus()
    }, 200)
    return () => clearTimeout(timer)
  }, [emailVerified, userId, router, walletLoading])

  const handleResendEmail = async () => {
    if (!resendVerificationEmail) return
    setIsResending(true)
    setStatus(null)
    const result = await resendVerificationEmail()
    setIsResending(false)
    setStatus(result.success ? 'Verification email sent' : 'Failed to send verification email')
    headingRef.current?.focus()
  }

  if (walletLoading) {
    return (
      <AuthBackground canvasId="verify-email-canvas">
        <div className="w-full max-w-md text-center text-gray-300">Loading your details…</div>
      </AuthBackground>
    )
  }

  if (!userId) {
     return (
      <AuthBackground canvasId="verify-email-canvas">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6 text-center">
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold">Not authenticated</h1>
          <p className="text-sm text-gray-300">You need to be logged in to see this page.</p>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button onClick={() => router.push('/login')} className="w-full bg-gradient-accent1-accent4 hover:bg-gradient-accent2-accent3">Go to login</Button>
          </motion.div>
        </motion.div>
      </AuthBackground>
    )
  }

  if (emailVerified === true) {
    return (
      <AuthBackground canvasId="verify-email-canvas">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6 text-center">
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold">Email verified</h1>
          <p className="text-sm text-gray-300" role="status" aria-live="polite">Redirecting…</p>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button onClick={() => router.push('/lobby')} variant="outline" className="w-full">Go to Lobby</Button>
          </motion.div>
        </motion.div>
      </AuthBackground>
    )
  }

  return (
    <AuthBackground canvasId="verify-email-canvas">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6 text-center">
        <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold">Verify your email</h1>
        {status && (
          <p className="text-sm text-gray-300" role={status.includes('Failed') ? 'alert' : 'status'} aria-live={status.includes('Failed') ? 'assertive' : 'polite'}>
            {status}
          </p>
        )}
        <p className="text-sm text-gray-300">We sent a verification link to your email. Click the link to activate your account.</p>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button onClick={handleResendEmail} disabled={isResending} className="w-full bg-gradient-accent1-accent4 hover:bg-gradient-accent2-accent3">
            {isResending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : 'Resend verification email'}
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button onClick={() => router.push('/login')} variant="outline" className="w-full">Back to login</Button>
        </motion.div>
      </motion.div>
    </AuthBackground>
  )
}

export default VerifyEmailPage
