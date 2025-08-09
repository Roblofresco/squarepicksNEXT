'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useState, useEffect, Suspense } from 'react'
import { FiLogIn, FiAlertCircle } from 'react-icons/fi'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { applyActionCode } from 'firebase/auth'
import AuthScreenShell from '@/components/auth/AuthScreenShell'

const LogoCube = dynamic(() => import('@/components/LogoCube'), { ssr: false })

export default function EmailVerifiedPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <EmailVerifiedContent />
    </Suspense>
  )
}

function EmailVerifiedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const [isValidVerificationFlow, setIsValidVerificationFlow] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    const mode = searchParams.get('mode')
    const oobCode = searchParams.get('oobCode')

    if (mode === 'verifyEmail' && oobCode) {
      setIsVerifying(true)
      applyActionCode(auth, oobCode)
        .then(async () => {
          setIsValidVerificationFlow(true)
          const currentUser = auth.currentUser
          if (currentUser) await currentUser.reload()
          setTimeout(() => router.push('/login'), 2000)
        })
        .catch(() => setIsValidVerificationFlow(false))
        .finally(() => setIsVerifying(false))
    } else {
      setIsValidVerificationFlow(false)
    }
  }, [searchParams, router])

  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )

  const handleNavClick = (href: string) => {
    setNavigatingTo(href)
    if (href === '/login') router.push(href)
  }

  return (
    <AuthScreenShell canvasId="email-verified-constellation-canvas">
      <div className="mb-4 flex justify-center">
        <LogoCube rotationX={0} rotationY={0} />
      </div>
      {isVerifying ? (
        <div className="flex items-center justify-center text-gray-300">
          <LoadingSpinner />
          <p className="ml-2">Verifying your email, please wait...</p>
        </div>
      ) : isValidVerificationFlow ? (
        <>
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-accent-1 to-accent-2">
            Email Verified!
          </h1>
          <p className="text-center text-gray-300">Your email address has been successfully verified. Redirecting to login...</p>
          <button
            onClick={() => handleNavClick('/login')}
            disabled={navigatingTo === '/login'}
            className={`w-full mt-4 flex items-center justify-center px-6 py-3 rounded-lg transition-all duration-300 ease-in-out font-semibold ${
              navigatingTo === '/login'
                ? 'bg-accent-1/80 text-background-primary cursor-not-allowed'
                : 'bg-gradient-to-r from-accent-1 to-accent-2 hover:shadow-accent-1/50 hover:shadow-lg text-white'
            }`}
          >
            {navigatingTo === '/login' ? (
              <LoadingSpinner />
            ) : (
              <>
                <FiLogIn className="mr-2" /> Login
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <FiAlertCircle className="text-accent-warning text-5xl mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-center text-gray-100">Invalid or Expired Link</h1>
          <p className="text-center text-gray-300">This verification link is invalid or may have expired.</p>
          <div className="text-center text-sm text-gray-400 mt-2">
            <Link href="/login" className="hover:text-white transition-colors">Back to login</Link>
          </div>
        </>
      )}
    </AuthScreenShell>
  )
} 