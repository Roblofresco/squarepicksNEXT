'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';

interface WalletState {
  hasWallet: boolean | null; // null while loading, true/false once checked
  balance: number;
  isLoading: boolean;
  error: string | null;
  userId: string | null;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    hasWallet: null,
    balance: 0,
    isLoading: true,
    error: null,
    userId: null,
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setWalletState((prevState) => ({ ...prevState, userId: user.uid, isLoading: true, error: null }));
        const userDocRef = doc(db, 'users', user.uid);

        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setWalletState({
              userId: user.uid,
              hasWallet: data.hasWallet === true, // Check specifically for true
              balance: data.balance ?? 0, // Default to 0 if balance is undefined/null
              isLoading: false,
              error: null,
            });
          } else {
            // User document doesn't exist, meaning no wallet setup yet
            setWalletState({
              userId: user.uid,
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
            hasWallet: null, // Error state
            balance: 0,
            isLoading: false,
            error: 'Failed to load wallet data.',
          });
        });

        // Return the snapshot listener cleanup function
        return () => unsubscribeSnapshot();

      } else {
        // No user logged in
        setWalletState({
          hasWallet: null,
          balance: 0,
          isLoading: false,
          error: null,
          userId: null,
        });
      }
    });

    // Return the auth listener cleanup function
    return () => unsubscribeAuth();
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


  return { ...walletState, initializeWallet };
} 