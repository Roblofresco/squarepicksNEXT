// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase-client'; // Adjust this path if your Firebase init is elsewhere

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const auth = getAuth(app); // Get the auth instance

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({ user: user, loading: false, error: null });
    }, (error) => {
      console.error("Auth state change error:", error);
      setAuthState({ user: null, loading: false, error: error });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

  return authState;
} 