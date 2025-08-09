'use client'

import React, { useEffect, useState } from 'react'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthBackground from '@/components/layout/AuthBackground'

export default function ResetPasswordConfirmPage() {
  const router = useRouter()
  const search = useSearchParams()
  const oobCode = search.get('oobCode') || search.get('oobcode') || ''
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    async function verify() {
      if (!oobCode) {
        setIsVerifying(false)
        toast.error('Invalid or missing reset code')
        return
      }
      try {
        const mail = await verifyPasswordResetCode(auth, oobCode)
        setEmail(mail)
      } catch (e) {
        console.error('verifyPasswordResetCode error:', e)
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
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
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
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isVerifying) {
    return <AuthBackground canvasId="reset-password-confirm-canvas"><div className="text-gray-300">Verifying link…</div></AuthBackground>
  }

  return (
    <AuthBackground canvasId="reset-password-confirm-canvas">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold">Set a new password</h1>
          {email && <p className="text-sm text-gray-300">Account: {email}</p>}
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
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </AuthBackground>
  )
} 