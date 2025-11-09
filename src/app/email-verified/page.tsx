'use client'

import React, { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { applyActionCode } from 'firebase/auth'
import AuthBackground from '@/components/layout/AuthBackground'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function EmailVerifiedPage() {
  return (
    <Suspense fallback={<AuthBackground canvasId="email-verified-canvas"><div className="text-gray-300">Loading…</div></AuthBackground>}>
      <EmailVerifiedContent />
    </Suspense>
  )
}

function EmailVerifiedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const mode = searchParams.get('mode')
    const oobCode = searchParams.get('oobCode') || searchParams.get('oobcode')

    // Handle password reset - redirect immediately
    if (mode === 'resetPassword' && oobCode) {
      router.replace(`/reset-password/confirm?oobCode=${encodeURIComponent(oobCode)}`)
      return
    }

    // Handle email verification
    if (mode === 'verifyEmail' && oobCode) {
      setIsVerifying(true)
      applyActionCode(auth, oobCode)
        .then(() => {
          setIsSuccess(true)
          headingRef.current?.focus()
          setTimeout(() => router.push('/login'), 1500)
        })
        .catch((error) => {
          console.error('Email verification error:', error)
          setIsSuccess(false)
          headingRef.current?.focus()
        })
        .finally(() => setIsVerifying(false))
    } else {
      // Invalid or missing parameters
      setIsVerifying(false)
      setIsSuccess(false)
      headingRef.current?.focus()
    }
  }, [searchParams, router])

  if (isVerifying) {
    return <AuthBackground canvasId="email-verified-canvas"><div className="text-gray-300">Verifying link…</div></AuthBackground>
  }

  return (
    <AuthBackground canvasId="email-verified-canvas">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6 text-center">
        {isSuccess ? (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold">Email verified</h1>
            <p className="text-sm text-gray-300" role="status" aria-live="polite">Redirecting to login…</p>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button onClick={() => router.push('/login')} className="w-full bg-gradient-accent1-accent4 hover:bg-gradient-accent2-accent3">
                Go to login
              </Button>
            </motion.div>
          </>
                ) : (
                  <>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold">Invalid or expired link</h1>
            <p className="text-sm text-gray-300" role="alert" aria-live="assertive">Please request a new verification email.</p>
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button onClick={() => router.push('/login')} variant="outline" className="w-full">Back to login</Button>
            </motion.div>
                  </>
                )}
      </motion.div>
    </AuthBackground>
  )
} 