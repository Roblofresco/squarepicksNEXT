'use client'

import React, { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { HeroText } from '@/components/ui/hero-text'
import Breadcrumbs from '@/components/navigation/Breadcrumbs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BellRing, Loader2 } from 'lucide-react'
import AuthGuard from '@/components/auth/AuthGuard'
import { useAuthGuard } from '@/hooks/useAuthGuard'

type NotificationPrefs = {
  pushNotifications: boolean
}

const defaultPrefs: NotificationPrefs = {
  pushNotifications: false
}

export default function ProfileNotificationsPage() {
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [devicePermission, setDevicePermission] = useState<NotificationPermission>('default')
  const [isEnabling, setIsEnabling] = useState(false)
  const [isPushSupported, setIsPushSupported] = useState(true)
  
  // Use the new auth guard hook
  const { user, loading, isAuthenticated } = useAuthGuard(true)

  // Check device notification permission & support
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsPushSupported(false)
      return
    }

    setDevicePermission(Notification.permission)
  }, [])

  // Load notification preferences when user is authenticated
  useEffect(() => {
    if (user && isAuthenticated) {
      const loadPreferences = async () => {
        try {
          // Now try to get notification preferences
          const prefsRef = doc(db, 'users', user.uid, 'preferences', 'notifications')
          const snap = await getDoc(prefsRef)
          if (snap.exists()) {
            const data = snap.data() as Partial<NotificationPrefs>
            setPrefs({ ...defaultPrefs, ...data })
          } else {
            // Create default preferences if they don't exist
            await setDoc(prefsRef, defaultPrefs, { merge: true })
            setPrefs(defaultPrefs)
          }
        } catch (e) {
          console.error('load prefs error', e)
          setError('Unable to load your preferences. Please try refreshing the page.')
        }
      }
      
      loadPreferences()
    }
  }, [user, isAuthenticated])

  const savePreferences = async (next: NotificationPrefs) => {
    if (!user) return
    setSaving(true)
    try {
      const prefsRef = doc(db, 'users', user.uid, 'preferences', 'notifications')
      await setDoc(prefsRef, next, { merge: true })
      setSuccess('Preferences saved')
    } catch (e) {
      console.error('save prefs error', e)
      setError('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handlePushToggle = async (checked: boolean) => {
    if (saving || isEnabling) return
    setError(null)
    setSuccess(null)

    if (!isPushSupported) {
      setError('Push notifications are not supported on this device.')
      return
    }

    if (checked) {
      setIsEnabling(true)
      try {
        if (typeof Notification.requestPermission !== 'function') {
          setError('Please enable notifications in your browser settings.')
          setIsEnabling(false)
          return
        }

        let permission = devicePermission
        if (permission !== 'granted') {
          permission = await Notification.requestPermission()
          setDevicePermission(permission)
        }

        if (permission !== 'granted') {
          setError('Notifications are blocked. Enable them in your browser settings to receive updates.')
          setIsEnabling(false)
          return
        }
      } catch (err) {
        console.error('Error requesting notification permission:', err)
        setError('Could not enable notifications. Please try again.')
        setIsEnabling(false)
        return
      }
      setIsEnabling(false)
    }

    const nextPrefs = { ...prefs, pushNotifications: checked }
    setPrefs(nextPrefs)
    await savePreferences(nextPrefs)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-1 mb-4" />
        <p className="text-text-primary">Loading notifications...</p>
      </div>
    )
  }

  return (
    <AuthGuard requireEmailVerification={true}>
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
          {(!isPushSupported || devicePermission === 'denied') && (
            <div className="p-4">
              <Alert className="bg-muted/20 border-muted/30">
                <AlertDescription>
                  Push notifications are not available on this device or have been blocked in your browser settings.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {isPushSupported && devicePermission === 'default' && (
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
                    const permission = await Notification.requestPermission()
                    setDevicePermission(permission)

                    if (permission === 'granted') {
                      const nextPrefs = { ...prefs, pushNotifications: true }
                      setPrefs(nextPrefs)
                      setSuccess('Notifications enabled successfully')
                      await savePreferences(nextPrefs)
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
          )}

          {isPushSupported && devicePermission === 'granted' && (
            <div className="p-4 flex items-center justify-between">
              <div className="pr-4">
                  <Label htmlFor="pushNotifications" className="text-base">Push notifications</Label>
                  <p className="text-sm text-gray-400 mt-1">Get notified about game updates and wins.</p>
              </div>
                <Switch
                  id="pushNotifications"
                  checked={prefs.pushNotifications}
                  onCheckedChange={(checked: boolean) => {
                    handlePushToggle(checked)
                  }}
                  className="mt-1"
                  disabled={saving || isEnabling}
                />
            </div>
              {saving && (
                <div className="px-4 pb-4 text-sm text-gray-400">Saving your preferences…</div>
              )}
          )}
        </div>
      </div>
        </div>
      </motion.div>
      </div>
    </AuthGuard>
  )
} 