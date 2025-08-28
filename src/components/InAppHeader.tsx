'use client'

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BiWallet } from 'react-icons/bi';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';

interface InAppHeaderProps {
  showBalancePill?: boolean;
  balance?: number | null;
}

const InAppHeaderComponent = ({ showBalancePill = false, balance = null }: InAppHeaderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleWalletClick = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        console.warn("User document not found for UID:", user.uid);
        router.push('/wallet-setup/location');
        return;
      }

      const userData = userSnap.data();
      const hasWallet = userData?.hasWallet;

      if (hasWallet === true) {
        router.push('/wallet');
      } else {
        router.push('/wallet-setup/location');
      }
    } catch (error) {
      console.error("Error checking wallet status:", error);
      router.push('/wallet-setup/location');
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  if (loading && !user) {
    return (
      <div className="w-full flex justify-between items-center px-4 py-2 z-20 bg-background-primary h-[46px]">
        <div className="flex items-center justify-center">
          <div className="h-[30px] w-[180px] bg-gray-700/50 rounded animate-pulse"></div>
        </div>
        <div className="h-[24px] w-[24px] bg-gray-700/50 rounded-full animate-pulse"></div>
      </div>
    );
  }

  const LogoImage = memo(() => (
    <div className="flex items-center justify-center">
      <Image
        src="/brandkit/logos/sp-logo-icon-default-text-white.svg"
        alt="SquarePicks Logo"
        width={180}
        height={30}
        priority
      />
    </div>
  ));
  LogoImage.displayName = 'LogoImage';

  return (
    <div className="w-full flex justify-between items-center px-4 py-2 z-20 bg-background-primary">
      {user ? (
        <div aria-label="SquarePicks">
          <LogoImage />
        </div>
      ) : (
        <Link href="/login" aria-label="Go to Login Page" legacyBehavior>
          <LogoImage />
        </Link>
      )}
      {user && (
        <div className="flex items-center space-x-3">
          <NotificationIcon />
          <div className="relative flex items-center justify-end min-w-[28px]">
          <AnimatePresence mode="wait" initial={false}>
            {showBalancePill ? (
              <motion.button
                key="pill"
                onClick={handleWalletClick}
                aria-label="Wallet Balance"
                className="h-7 px-2 rounded-full bg-black/20 border border-white/10 text-white backdrop-blur-sm hover:bg-black/30 flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                style={{ transformOrigin: 'center right' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <BiWallet size={18} style={{ color: '#1bb0f2' }} />
                <span className="text-xs tabular-nums">${(balance ?? 0).toFixed(2)}</span>
              </motion.button>
            ) : (
              <motion.button 
                key="icon"
                onClick={handleWalletClick} 
                aria-label="Wallet" 
                className="h-7 w-7 rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                style={{ transformOrigin: 'center right' }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <BiWallet size={22} style={{ color: '#1bb0f2' }} />
              </motion.button>
            )}
          </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

InAppHeaderComponent.displayName = 'InAppHeader';
export default memo(InAppHeaderComponent);
