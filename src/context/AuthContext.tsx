"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, reauthenticateWithCredential, EmailAuthProvider, updateEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  reauthenticate: (password: string) => Promise<void>;
  updateEmailAddress: (newEmail: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const reauthenticate = async (password: string) => {
    if (!user || !user.email) {
      throw new Error("User not found or email is missing.");
    }
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  const updateEmailAddress = async (newEmail: string, password: string) => {
    await reauthenticate(password);
    if (!user) {
        throw new Error("User not found.");
    }
    await updateEmail(user, newEmail);
  };

  const value = { user, loading, reauthenticate, updateEmailAddress };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
