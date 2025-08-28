'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { HeroText } from '@/components/ui/hero-text'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BellRing, Loader2 } from 'lucide-react'

type NotificationPrefs = {
  pushNotifications: boolean
}

const defaultPrefs: NotificationPrefs = {
  pushNotifications: true
}

export default function ProfileNotificationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [devicePermission, setDevicePermission] = useState<NotificationPermission>('default')
  const [isEnabling, setIsEnabling] = useState(false)

  // Check device notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setDevicePermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push('/login')
        return
      }
      setUser(u)
      try {
        const prefsRef = doc(db, 'users', u.uid, 'preferences', 'notifications')
        const snap = await getDoc(prefsRef)
        if (snap.exists()) {
          const data = snap.data() as Partial<NotificationPrefs>
          setPrefs({ ...defaultPrefs, ...data })
        }
      } catch (e) {
        console.error('load prefs error', e)
        setError('Unable to load your preferences')
      } finally {
        setLoading(false)
        headingRef.current?.focus()
      }
    })
    return () => unsub()
  }, [router])

  const handleChange = (key: keyof NotificationPrefs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrefs((prev) => ({ ...prev, [key]: e.target.checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const prefsRef = doc(db, 'users', user.uid, 'preferences', 'notifications')
      await setDoc(prefsRef, prefs, { merge: true })
      setSuccess('Preferences saved')
      headingRef.current?.focus()
    } catch (e) {
      console.error('save prefs error', e)
      setError('Failed to save preferences')
      headingRef.current?.focus()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-300">Loading…</div>
      </div>
    )
  }

  return (
    <div className="bg-background-primary text-text-primary">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full flex flex-col">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          className="mb-3 pl-4 sm:pl-6 mt-2 sm:mt-3"
          ellipsisOnly
          backHref="/profile"
          ellipsisUseHistory={false}
        />

        {/* Title and description */}
        <div className="mb-4 pl-4 sm:pl-6">
          <div className="relative">
            <HeroText id="notifications" className="text-3xl font-bold text-text-primary">
              <h1 ref={headingRef} tabIndex={-1}>Notifications</h1>
            </HeroText>
          </div>
          <p className="mt-3 text-sm text-gray-300">Choose which notifications you want to receive.</p>
          {error && <p role="alert" aria-live="assertive" className="text-sm text-red-400 mt-2">{error}</p>}
          {success && <p role="status" aria-live="polite" className="text-sm text-green-400 mt-2">{success}</p>}
        </div>

        <div className="flex justify-center mt-16">
          <div className="w-full max-w-lg">

        <div className="rounded-xl overflow-hidden bg-gradient-to-b from-background-primary via-background-primary via-5% to-background-secondary divide-y divide-gray-700/50 shadow-md">
          {devicePermission === 'default' ? (
            <div className="p-4">
              <Alert className="bg-accent-1/10 border-accent-1/20">
                <BellRing className="h-4 w-4" />
                <AlertDescription>
                  To receive notifications about your games and winnings, you'll need to allow notifications on your device.
                </AlertDescription>
              </Alert>
              <Button 
                className="w-full mt-4 bg-accent-1 hover:bg-accent-1/90"
                onClick={async () => {
                  setIsEnabling(true)
                  setError(null)
                  try {
                    // Check if the browser supports the notifications API
                    if (!('Notification' in window)) {
                      setError('Your browser does not support notifications')
                      return
                    }

                    // For mobile Safari, we need to check if we can request permission
                    if (typeof Notification.requestPermission !== 'function') {
                      setError('Please enable notifications in your browser settings')
                      return
                    }

                    // Request permission
                    const permission = await Notification.requestPermission()
                    setDevicePermission(permission)

                    if (permission === 'granted') {
                      setPrefs(prev => ({ ...prev, pushNotifications: true }))
                      setSuccess('Notifications enabled successfully')
                      // Auto-save the preference
                      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                    } else if (permission === 'denied') {
                      setError('Please allow notifications in your browser settings to receive updates')
                    }
                  } catch (err) {
                    console.error('Error requesting notification permission:', err)
                    setError('Could not enable notifications. Please try again.')
                  } finally {
                    setIsEnabling(false)
                  }
                }}
                disabled={isEnabling}
              >
                {isEnabling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  'Enable Device Notifications'
                )}
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-4 flex items-center justify-between">
              <div className="pr-4">
                  <Label htmlFor="pushNotifications" className="text-base">Push notifications</Label>
                  <p className="text-sm text-gray-400 mt-1">Get notified about game updates and wins.</p>
              </div>
                <Switch
                  id="pushNotifications"
                  checked={prefs.pushNotifications}
                  onCheckedChange={(checked: boolean) => {
                    setPrefs(prev => ({ ...prev, pushNotifications: checked }))
                    handleSubmit({ preventDefault: () => {} } as React.FormEvent)
                  }}
                  className="mt-1"
                  disabled={devicePermission === 'denied' || saving}
                />
            </div>
              {devicePermission === 'denied' && (
                <div className="px-4 pb-4">
                  <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                    <AlertDescription>
                      Notifications are blocked. Please enable them in your browser settings to receive updates.
                    </AlertDescription>
                  </Alert>
              </div>
              )}
          </form>
          )}
        </div>
      </div>
        </div>
      </motion.div>
    </div>
  )
} 