"use client";

import { useEffect, useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export function useFcmToken() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined' || !messaging) return;
    if (!('Notification' in window)) return;

    setPermission(Notification.permission);

    const register = async () => {
      try {
        if (Notification.permission === 'default') {
          const result = await Notification.requestPermission();
          setPermission(result);
          if (result !== 'granted') return;
        } else if (Notification.permission !== 'granted') {
          return;
        }
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          setError('Missing VAPID key');
          return;
        }
        const t = await getToken(messaging!, { vapidKey, serviceWorkerRegistration: await navigator.serviceWorker.ready });
        if (!t) return;
        setToken(t);
        const tokenRef = doc(db, `users/${user.uid}/fcmTokens/${t}`);
        await setDoc(tokenRef, {
          createdAt: serverTimestamp(),
          lastSeenAt: serverTimestamp(),
          userAgent: navigator.userAgent,
        }, { merge: true });

        // Foreground messages (optional UI hook)
        onMessage(messaging!, () => {
          // Handled by NotificationContext or local UI if desired
        });
      } catch (e: any) {
        setError(e.message || 'Failed to register for notifications');
      }
    };

    register();
  }, [user]);

  return { permission, token, error };
}


