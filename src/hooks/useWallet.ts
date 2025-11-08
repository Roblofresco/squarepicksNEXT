'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User, sendEmailVerification, useDeviceLanguage, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

interface WalletState {
  hasWallet: boolean | null; // null while loading, true/false once checked
  balance: number;
  isLoading: boolean;
  error: string | null;
  userId: string | null;
  emailVerified: boolean | null;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    hasWallet: null,
    balance: 0,
    isLoading: true,
    error: null,
    userId: null,
    emailVerified: null,
  });

  // Store snapshot unsubscribe function to properly clean it up
  const unsubscribeSnapshotRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log("[useWallet] onAuthStateChanged triggered. User:", user ? user.uid : null, "Email Verified:", user ? user.emailVerified : null);
      
      // Clean up previous snapshot listener if it exists
      if (unsubscribeSnapshotRef.current) {
        console.log("[useWallet] Cleaning up previous snapshot listener");
        unsubscribeSnapshotRef.current();
        unsubscribeSnapshotRef.current = null;
      }

      if (user) {
        if (user.emailVerified) {
          console.warn("[useWallet] User is VERIFIED:", user.uid, "Email:", user.email);
        } else {
          console.log("[useWallet] User is NOT verified:", user.uid, "Email:", user.email);
        }
        setWalletState((prevState) => ({ 
          ...prevState, 
          userId: user.uid, 
          emailVerified: user.emailVerified,
          isLoading: true,
          error: null 
        }));
        const userDocRef = doc(db, 'users', user.uid);

        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setWalletState({
              userId: user.uid,
              emailVerified: user.emailVerified,
              hasWallet: data.hasWallet === true,
              balance: data.balance ?? 0,
              isLoading: false,
              error: null,
            });
          } else {
            // User document doesn't exist, meaning no wallet setup yet
            setWalletState({
              userId: user.uid,
              emailVerified: user.emailVerified,
              hasWallet: false,
              balance: 0,
              isLoading: false,
              error: null,
            });
          }
        }, (err) => {
          console.error("Error fetching wallet data:", err);
          setWalletState({
            userId: user.uid,
            emailVerified: user.emailVerified,
            hasWallet: null,
            balance: 0,
            isLoading: false,
            error: 'Failed to load wallet data.',
          });
        });

        // Store the snapshot unsubscribe function
        unsubscribeSnapshotRef.current = unsubscribeSnapshot;

      } else {
        // No user logged in
        console.log("[useWallet] onAuthStateChanged: No user logged in. Setting isLoading to false.");
        setWalletState({
          hasWallet: null,
          balance: 0,
          isLoading: false,
          error: null,
          userId: null,
          emailVerified: null,
        });
      }
    });

    // Return the auth listener cleanup function
    return () => {
      unsubscribeAuth();
      // Also clean up snapshot listener if it exists
      if (unsubscribeSnapshotRef.current) {
        unsubscribeSnapshotRef.current();
        unsubscribeSnapshotRef.current = null;
      }
    };
  }, []);

  // Function to initialize the wallet for a user
  const initializeWallet = async () => {
    if (!walletState.userId) {
      console.error("Cannot initialize wallet: No user ID.");
      setWalletState(prev => ({ ...prev, error: "Login required to initialize wallet." }));
      return;
    }
    if (walletState.hasWallet) {
        console.log("Wallet already initialized.");
        return; // Avoid re-initializing
    }

    setWalletState(prev => ({ ...prev, isLoading: true }));
    try {
      const userDocRef = doc(db, 'users', walletState.userId);
      // Check again if it exists right before setting, just in case
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
          await setDoc(userDocRef, {
              hasWallet: true,
              balance: 0,
              createdAt: new Date(), // Optional: track creation time
          }, { merge: true }); // Use merge to avoid overwriting other user data if it exists
          console.log("Wallet initialized successfully.");
           // State will update via the onSnapshot listener
      } else if (!docSnap.data()?.hasWallet) {
           await setDoc(userDocRef, { hasWallet: true, balance: docSnap.data()?.balance ?? 0 }, { merge: true });
           console.log("Wallet marked as initialized.");
           // State will update via the onSnapshot listener
      } else {
          console.log("Wallet initialization skipped, already exists.");
          setWalletState(prev => ({ ...prev, isLoading: false })); // Ensure loading is false if skipped
      }
    } catch (err) {
      console.error("Error initializing wallet:", err);
      setWalletState(prev => ({ ...prev, isLoading: false, error: "Failed to initialize wallet." }));
    }
  };

  // Function to resend verification email
  const resendVerificationEmail = async (): Promise<{ success: boolean; message: string }> => {
    if (!auth.currentUser) {
      return { success: false, message: 'No user logged in to resend verification email.' };
    }
    try {
      // Ensure displayName is set for email template personalization
      if (!auth.currentUser.displayName) {
        try {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const displayName = userData.display_name || userData.firstName || auth.currentUser.email?.split('@')[0] || 'User';
            await updateProfile(auth.currentUser, { displayName });
          }
        } catch (updateError) {
          console.warn("Could not update displayName before resending verification email:", updateError);
          // Continue anyway - email will still be sent
        }
      }
      
      useDeviceLanguage(auth);
      await sendEmailVerification(auth.currentUser);
      return { success: true, message: 'Verification email sent! Please check your inbox (and spam folder).' };
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      // Firebase often has built-in rate limiting (auth/too-many-requests)
      if (error.code === 'auth/too-many-requests') {
        return { success: false, message: 'Verification email already sent recently. Please wait a few minutes before trying again.' };
      }
      return { success: false, message: error.message || 'Failed to resend verification email.' };
    }
  };

  return { ...walletState, initializeWallet, resendVerificationEmail };
} 