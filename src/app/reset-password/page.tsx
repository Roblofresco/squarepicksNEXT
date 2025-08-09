'use client'

import React, { useState } from 'react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

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
      // Optional: provide a continue URL back to the app
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password/confirm`,
      }
      await sendPasswordResetEmail(auth, email, actionCodeSettings)
      toast.success('If an account exists for that email, a reset link has been sent.')
      router.push('/login')
    } catch (err: any) {
      // Do not leak account existence; show generic message
      console.error('sendPasswordResetEmail error:', err?.code || err)
      toast.success('If an account exists for that email, a reset link has been sent.')
      router.push('/login')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 bg-background/40 p-6 rounded-md border border-gray-700">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reset your password</h1>
          <p className="text-sm text-gray-400 mt-1">Enter your email and we'll send you a reset link.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </div>
  )
} 