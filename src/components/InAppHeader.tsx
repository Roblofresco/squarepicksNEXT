'use client'

import React, { useState, useEffect, useCallback, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BiWallet } from 'react-icons/bi';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';

const InAppHeaderComponent = () => {
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
        <Link href="/login" aria-label="Go to Login Page">
          <LogoImage />
        </Link>
      )}

      {user && (
        <div className="flex items-center space-x-3">
          <NotificationIcon />
          <button 
            onClick={handleWalletClick} 
            aria-label="Wallet" 
            className="hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <BiWallet size={24} style={{ color: '#1bb0f2' }} />
          </button>
        </div>
      )}
    </div>
  );
}

InAppHeaderComponent.displayName = 'InAppHeader';
export default memo(InAppHeaderComponent);
