'use client'

import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, DollarSign, List, Settings, ShieldCheck, Scale, LogOut, Info, HelpCircle, BookOpen, FileText, ArrowRight, Edit2, Loader2, Bell } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion'
import { HeroText } from '@/components/ui/hero-text'

// Import BottomNav
import BottomNav from '@/components/lobby/BottomNav';

// Import Shadcn Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Define a type for the user profile data
interface UserProfileData {
  username: string;
  email: string;
  balance: number;
  totalWinnings?: number;
  gamesPlayed?: number;
  // Add other fields as needed, e.g., photoURL
}

// Placeholder data - replace with actual data fetching logic
// const userProfile = {
//   username: 'default_user', // Replace with actual username
//   email: 'user@example.com',   // Replace with actual email
//   balance: 123.45,           // Replace with actual balance
//   // isVerified is no longer directly displayed here
// };

// Define menu items based on your existing links
const accountMenuItems = [
  { href: "/profile/settings", icon: Settings, label: "Account Settings" },
  { href: "/profile/notifications", icon: Bell, label: "Notifications" },
  // Logout is handled separately as a button
];

const supportMenuItems = [
  { href: "/information-and-support/how-to-play", icon: HelpCircle, label: "How to Play", isExternal: false },
  { href: "/information-and-support/account-guide", icon: BookOpen, label: "Account Guide", isExternal: false },
  { href: "/information-and-support/faq", icon: Info, label: "FAQ", isExternal: false },
  { href: "/information-and-support/terms", icon: FileText, label: "Terms & Conditions", isExternal: false },
  { href: "/information-and-support/privacy", icon: ShieldCheck, label: "Privacy Policy", isExternal: false },
  { href: "/information-and-support/responsible-gaming", icon: Scale, label: "Responsible Gaming", isExternal: false },
  { href: "/contact-support", icon: Mail, label: "Contact Support", isExternal: false },
];

const ProfilePage = () => {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false); // For login modal
  const [isWalletLoadingState, setIsWalletLoadingState] = useState(false);

  const { 
    userId,
    emailVerified,
    isLoading: walletIsLoading,
  } = useWallet();

  useEffect(() => {
    if (!walletIsLoading) {
      if (!userId) {
        router.push('/login');
      } else if (emailVerified === false) {
        router.push('/verify-email');
      }
    }
  }, [userId, emailVerified, walletIsLoading, router]);

  useEffect(() => {
    if (userId && emailVerified === true) {
      setProfileLoading(true);
      const fetchUserProfile = async () => {
        try {
          const userDocRef = doc(db, 'users', userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const firebaseUser = auth.currentUser;
            setUserProfile({
              username: userData.display_name || 'User',
              email: userData.email || firebaseUser?.email || 'N/A',
              balance: userData.balance !== undefined ? userData.balance : 0,
              totalWinnings: userData.totalWinnings || 0,
              gamesPlayed: userData.gamesPlayed || 0,
            });
            if (userData.photoURL || firebaseUser?.photoURL) {
              setImagePreview(userData.photoURL || firebaseUser?.photoURL);
            }
          } else {
            setError("User data not found.");
            console.log("No such document for user:", userId);
            setUserProfile({ username: 'User', email: auth.currentUser?.email || 'N/A', balance: 0 });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load profile data.");
          setUserProfile({ username: 'User', email: auth.currentUser?.email || 'N/A', balance: 0 });
        }
        setProfileLoading(false);
      };
      fetchUserProfile();
    } else if (!userId && !walletIsLoading) {
      setProfileLoading(false);
      setUserProfile(null);
    }
  }, [userId, emailVerified]);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        console.log("User signed out successfully.");
        router.push('/');
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      console.log("Selected file:", file);
    }
  };

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleProtectedAction = () => {
    if (!userId) {
      console.log("Protected action triggered on profile page, showing login prompt.");
      setIsLoginModalOpen(true);
    }
  };

  const handleManageClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    setIsWalletLoadingState(true);
    setTimeout(() => {
      setIsWalletLoadingState(false);
      const url = '/wallet?prev=Profile&prevHref=%2Fprofile';
      router.push(url);
    }, 900);
    e.preventDefault();
  };

  if (walletIsLoading || (userId && emailVerified === false && !profileLoading)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-accent-1" />
      </div>
    );
  }

  if (!userId && !walletIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Redirecting...</p>
        <Loader2 className="h-8 w-8 animate-spin text-accent-1 ml-2" />
      </div>
    );
  }

  if (userId && emailVerified === true && profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-accent-1" />
        <p className="ml-3">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-20 flex flex-col min-h-screen">
      <div className="max-w-2xl mx-auto w-full flex-grow">

        {error && !profileLoading ? (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 my-6 text-center">
            <p>{error}</p>
            <Button onClick={() => router.push('/')} className="mt-2 bg-accent-1 hover:bg-accent-1/90 text-white">
              Go to Homepage
            </Button>
          </div>
        ) : userProfile ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-2xl p-6 flex flex-col items-center mb-6 border relative overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(38, 44, 61, 0.5) 0%, rgba(35, 41, 58, 0.7) 100%)',
                borderColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                boxShadow:
                  'inset 0 2px 12px 0 rgba(255,255,255,0.07), 0 2px 20px -5px rgba(0,0,0,0.3)',
              }}
            >
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2 sm:flex-row sm:items-end sm:gap-3 z-10">
                <div className="flex flex-col items-end gap-2">
                  <div className="text-text-primary/80 text-[11px] sm:text-xs">Balance: <span className="text-yellow-400 font-bold text-sm sm:text-md">${userProfile.balance.toFixed(2)}</span></div>
                  <Link
                    href={{ pathname: '/wallet', query: { prev: 'Profile', prevHref: '/profile' } }}
                    onClick={handleManageClick}
                    className={`text-[11px] sm:text-xs font-semibold cursor-pointer flex items-center justify-center min-w-[60px] transition-all duration-150 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10 ${isWalletLoadingState ? 'pointer-events-none opacity-70' : 'hover:bg-accent-1/10 text-accent-1 hover:text-accent-1 active:text-accent-1/90'}`}
                    tabIndex={0}
                    aria-disabled={isWalletLoadingState}
                  >
                    {isWalletLoadingState ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Wallet'
                    )}
                  </Link>
                </div>
              </div>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mb-3 group">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile Avatar"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="text-gray-400 w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="absolute inset-0 w-full h-full rounded-full flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10 cursor-pointer focus:outline-none"
                  aria-label="Edit profile picture"
                  tabIndex={0}
                >
                  <Edit2 className="w-6 h-6 text-white mb-1" />
                  <span className="text-xs text-white font-semibold">Edit Photo</span>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
              </div>
              <div className="text-lg sm:text-xl font-bold text-text-primary mb-1">{userProfile.username}</div>
              {userProfile.email && <div className="text-xs text-text-secondary mb-2">{userProfile.email}</div>}
            </motion.div>

            <div className="mb-8">
               <h2 className="text-xs uppercase text-text-secondary font-semibold mb-3 px-1">Account</h2>
               <div className="rounded-xl overflow-hidden bg-gradient-to-b from-background-primary via-background-primary via-5% to-background-secondary divide-y divide-gray-700/50 shadow-md">
                    {accountMenuItems.map((item) => (
                      <motion.div key={item.label} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Link
                          href={item.href}
                          className="w-full p-4 flex items-center hover:bg-gray-700/30 hover:scale-[1.03] focus:scale-[1.03] active:scale-95 transition-all duration-150 hover:underline focus:underline rounded-none outline-none group"
                        >
                          <item.icon className="text-text-secondary mr-4 w-5 h-5 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                          <div className="relative">
                            <HeroText id={item.label.toLowerCase().replace(/\s+/g, '-')} className="text-text-primary transition-colors duration-150 group-hover:text-accent-1 group-focus:text-accent-1">{item.label}</HeroText>
                          </div>
                          <ArrowRight className="ml-auto text-text-secondary w-4 h-4 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                        </Link>
                      </motion.div>
                    ))}
                     <Button
                       onClick={handleLogout}
                       variant="destructive"
                       className="w-full p-4 flex items-center justify-start bg-red-600 hover:bg-red-700 text-white rounded-none"
                     >
                       <LogOut className="mr-4 w-5 h-5" />
                       <span>Logout</span>
                     </Button>
                </div>
            </div>

             <div>
               <h2 className="text-xs uppercase text-text-secondary font-semibold mb-3 px-1">Information & Support</h2>
               <div className="rounded-xl overflow-hidden bg-gradient-to-b from-background-primary via-background-primary via-5% to-background-secondary divide-y divide-gray-700/50 shadow-md">
                 {supportMenuItems.map((item) => (
                   item.isExternal ? (
                     <motion.a key={item.label} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} href={item.href} target="_blank" rel="noopener noreferrer" className="w-full p-4 flex items-center hover:bg-gray-700/30 hover:scale-[1.03] focus:scale-[1.03] active:scale-95 transition-all duration-150 hover:underline focus:underline rounded-none outline-none group">
                        <item.icon className="text-text-secondary mr-4 w-5 h-5 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                        <span className="text-text-primary transition-colors duration-150 group-hover:text-accent-1 group-focus:text-accent-1">{item.label}</span>
                        <ArrowRight className="ml-auto text-text-secondary w-4 h-4 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                     </motion.a>
                   ) : (
                     <motion.div key={item.label} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                       <Link
                         href={item.href}
                         {...(!item.isExternal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                         className="w-full p-4 flex items-center hover:bg-gray-700/30 hover:scale-[1.03] focus:scale-[1.03] active:scale-95 transition-all duration-150 hover:underline focus:underline rounded-none outline-none group"
                       >
                         <item.icon className="text-text-secondary mr-4 w-5 h-5 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                         <span className="text-text-primary transition-colors duration-150 group-hover:text-accent-1 group-focus:text-accent-1">{item.label}</span>
                         <ArrowRight className="ml-auto text-text-secondary w-4 h-4 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                       </Link>
                     </motion.div>
                   )
                 ))}
                 </div>
              </div>

          </>
        ) : (
          <div className="text-center py-10 text-text-secondary">
            <p>Could not load profile information.</p>
          </div>
        )}

      </div>
      <div className="h-16" />
      <BottomNav 
        onProtectedAction={handleProtectedAction} 
        user={auth.currentUser}
      />
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
         <DialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] to-[#5855e4] to-15% border-accent-1/50 text-white py-8">
            <DialogHeader className="text-center items-center">
               <DialogTitle className="text-2xl font-bold mb-2">Login Required</DialogTitle>
               <DialogDescription className="text-gray-300 opacity-90">
                  You need to be logged in or create an account to perform this action.
               </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-2">
               <Button 
                  onClick={() => { setIsLoginModalOpen(false); router.push('/login'); }} 
                  className="flex-1 bg-accent-1 hover:bg-accent-1/80 text-white font-semibold"
               >
                  Login
               </Button>
               <Button 
                  onClick={() => { setIsLoginModalOpen(false); router.push('/signup'); }} 
                  variant="outline" 
                  className="flex-1 bg-transparent border-gray-500 hover:bg-gray-500/20 text-gray-300 font-semibold hover:text-gray-300"
               >
                  Sign Up
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage; 