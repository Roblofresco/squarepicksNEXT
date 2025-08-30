'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseAuthGuardReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
}

export function useAuthGuard(requireEmailVerification: boolean = true): UseAuthGuardReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Check email verification if required
        if (requireEmailVerification && !user.emailVerified) {
          setError('Email verification required');
          setLoading(false);
          return;
        }

        // Ensure user document exists in Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              createdAt: new Date(),
              email: user.email,
              display_name: user.displayName || 'User',
              emailVerified: user.emailVerified,
              lastLogin: new Date()
            }, { merge: true });
          }
        } catch (err) {
          console.error('Error ensuring user document exists:', err);
          // Don't set error here as this is not critical for basic auth
        }
        
        setLoading(false);
      } else {
        // No user logged in
        setUser(null);
        setLoading(false);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [requireEmailVerification, router]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false
  };
}

