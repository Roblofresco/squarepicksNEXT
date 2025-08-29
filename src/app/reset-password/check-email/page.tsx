'use client'

export const runtime = 'edge';

import React, { Suspense } from 'react'
import AuthBackground from '@/components/layout/AuthBackground'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FiArrowLeft } from 'react-icons/fi'
import { motion } from 'framer-motion'

export default function CheckEmailPage() {
  return (
    <Suspense fallback={<AuthBackground canvasId="reset-password-check-email-canvas"><div className="text-gray-300">Loading…</div></AuthBackground>}>
      <CheckEmailContent />
    </Suspense>
  )
}

function CheckEmailContent() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get('email')
  return (
    <AuthBackground canvasId="reset-password-check-email-canvas">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-bold">Check your email</h1>
        <p className="text-sm text-gray-300">We sent a password reset link to <span className="text-white font-medium">{email || 'your email'}</span>. Check your inbox and follow the link to set a new password.</p>
        <div className="text-center space-y-2">
          <Link href="/reset-password" className="block text-sm text-gray-300 hover:text-white">Resend reset link</Link>
          <Link href="/login" className="inline-flex items-center justify-center text-sm text-gray-300 hover:text-white">
            <FiArrowLeft className="mr-2" /> Back to login
          </Link>
        </div>
      </motion.div>
    </AuthBackground>
  )
} 