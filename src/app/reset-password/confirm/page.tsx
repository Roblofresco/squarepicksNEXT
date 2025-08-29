'use client'

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useRef, useState } from 'react'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthBackground from '@/components/layout/AuthBackground'
import { motion } from 'framer-motion'

export default function Page() {
  return (
    <Suspense fallback={<AuthBackground canvasId="reset-password-confirm-canvas"><div className="text-gray-300">Verifying link…</div></AuthBackground>}>
      <ResetPasswordConfirmContent />
    </Suspense>
  )
}

function ResetPasswordConfirmContent() {
  const router = useRouter()
  const search = useSearchParams()
  const oobCode = search.get('oobCode') || search.get('oobcode') || ''
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState<string | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    async function verify() {
      if (!oobCode) {
        setIsVerifying(false)
        setVerificationError('Invalid or expired reset link')
        toast.error('Invalid or missing reset code')
        headingRef.current?.focus()
        return
      }
      try {
        const mail = await verifyPasswordResetCode(auth, oobCode)
        setEmail(mail)
        setVerificationError(null)
      } catch (e) {
        console.error('verifyPasswordResetCode error:', e)
        setVerificationError('Invalid or expired reset link')
        toast.error('This reset link is invalid or expired')
      } finally {
        setIsVerifying(false)
      }
    }
    verify()
  }, [oobCode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!oobCode) return
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      headingRef.current?.focus()
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      headingRef.current?.focus()
      return
    }
    setIsSubmitting(true)
    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      toast.success('Password updated. Please log in.')
      router.push('/login')
    } catch (e) {
      console.error('confirmPasswordReset error:', e)
      toast.error('Could not reset password. The link may be invalid or expired.')
      headingRef.current?.focus()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isVerifying) {
    return <AuthBackground canvasId="reset-password-confirm-canvas"><div className="text-gray-300">Verifying link…</div></AuthBackground>
  }

  return (
    <AuthBackground canvasId="reset-password-confirm-canvas">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold">Set a new password</h1>
          {email && <p className="text-sm text-gray-300">Account: {email}</p>}
          {verificationError && (
            <p className="text-sm text-red-400" role="alert" aria-live="assertive">{verificationError}</p>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-accent1-accent4 hover:bg-gradient-accent2-accent3 text-white transition-all duration-300 shadow-lg ring-1 ring-white/10 hover:ring-white/20 disabled:opacity-60">
              {isSubmitting ? 'Updating…' : 'Update password'}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </AuthBackground>
  )
} 