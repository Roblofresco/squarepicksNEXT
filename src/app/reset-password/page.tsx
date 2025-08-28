'use client'

import React, { useEffect, useRef, useState } from 'react'
import { sendPasswordResetEmail, useDeviceLanguage } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/layout/AuthBackground'
import Link from 'next/link'
import { FiArrowLeft } from 'react-icons/fi'
import { motion } from 'framer-motion'

export default function ResetPasswordRequestPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    // On mount, focus the email field for better keyboard UX
    emailInputRef.current?.focus()
  }, [])

  async function serverCheckEmailExists(targetEmail: string): Promise<{ exists: boolean; hasPasswordProvider: boolean }> {
    try {
      const envBase = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL
      const base = (typeof envBase === 'string' && envBase.trim().length > 0)
        ? envBase.trim().replace(/\/$/, '')
        : 'https://us-east1-square-picks-vpbb8d.cloudfunctions.net'
      const url = `${base}/checkAuthEmailExists`
      if (process.env.NODE_ENV !== 'production') {
        console.log('[reset-password] using functions URL:', url)
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
        mode: 'cors',
      })
      const json = await response.json().catch(() => ({}))
      if (response.ok && json && json.data) {
        return { exists: !!json.data.exists, hasPasswordProvider: !!json.data.hasPasswordProvider }
      }
      console.error('serverCheckEmailExists non-ok:', response.status, json)
      return { exists: false, hasPasswordProvider: false }
    } catch (e) {
      console.error('serverCheckEmailExists error:', e)
      return { exists: false, hasPasswordProvider: false }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      setErrorMessage('Please enter your email')
      emailInputRef.current?.focus()
      toast.error('Please enter your email')
      return
    }
    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const check = await serverCheckEmailExists(email)
      if (!check.exists || !check.hasPasswordProvider) {
        setErrorMessage('No account found for that email.')
        headingRef.current?.focus()
        return
      }

      const actionCodeSettings = { url: `${window.location.origin}/reset-password/confirm` }
      useDeviceLanguage(auth)
      await sendPasswordResetEmail(auth, email, actionCodeSettings)
      toast.success('Password reset link sent.')
      router.push(`/reset-password/check-email?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      console.error('reset-password submit error:', err?.code || err)
      setErrorMessage('No account found for that email.')
      headingRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthBackground canvasId="reset-password-canvas">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold">Reset your password</h1>
          <p className="text-sm text-gray-300">Enter your email and we'll send you a reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={errorMessage ? 'reset-error' : undefined}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input ref={emailInputRef} id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-required="true" />
            {errorMessage && (
              <p id="reset-error" className="text-sm text-red-400" role="alert" aria-live="assertive">{errorMessage}</p>
            )}
          </div>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-accent1-accent4 hover:bg-gradient-accent2-accent3 text-white transition-all duration-300 shadow-lg ring-1 ring-white/10 hover:ring-white/20 disabled:opacity-60">
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </motion.div>
          <div className="text-center">
            <Link href="/login" className="inline-flex items-center justify-center text-sm text-gray-300 hover:text-white">
              <FiArrowLeft className="mr-2" /> Back to login
            </Link>
          </div>
        </form>
      </motion.div>
    </AuthBackground>
  )
} 