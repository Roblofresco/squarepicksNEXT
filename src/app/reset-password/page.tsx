'use client'

import React, { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import AuthBackground from '@/components/layout/AuthBackground'

export default function ResetPasswordRequestPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }
    setIsSubmitting(true)
    try {
      const actionCodeSettings = { url: `${window.location.origin}/reset-password/confirm` }
      await sendPasswordResetEmail(auth, email, actionCodeSettings)
      toast.success('If an account exists for that email, a reset link has been sent.')
      router.push('/login')
    } catch (err: any) {
      console.error('sendPasswordResetEmail error:', err?.code || err)
      toast.success('If an account exists for that email, a reset link has been sent.')
      router.push('/login')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthBackground canvasId="reset-password-canvas">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold">Reset your password</h1>
          <p className="text-sm text-gray-300">Enter your email and we'll send you a reset link.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      </div>
    </AuthBackground>
  )
} 