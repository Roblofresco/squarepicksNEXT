'use client'

import React, { useState, ChangeEvent, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, DollarSign, List, Settings, ShieldCheck, Scale, LogOut, Info, HelpCircle, BookOpen, FileText, ArrowRight, Edit2, Loader2 } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

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
  { href: "/transactions", icon: List, label: "Transaction History" },
  // Logout is handled separately as a button
];

const supportMenuItems = [
  { href: "/how-to-play", icon: HelpCircle, label: "How to Play" },
  { href: "/account-guide", icon: BookOpen, label: "Account Guide" },
  { href: "/faq", icon: Info, label: "FAQ" },
  { href: "/terms", icon: FileText, label: "Terms & Conditions" },
  { href: "/privacy", icon: ShieldCheck, label: "Privacy Policy" },
  { href: "/responsible-gaming-policy", icon: Scale, label: "Responsible Gaming Policy" },
  // Using a mailto link for Contact Support
  { href: "mailto:contact@squarpicks.com", icon: Mail, label: "Contact Support", isExternal: true },
];

const ProfilePage = () => {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null); // For BottomNav
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false); // For login modal
  const [isWalletLoading, setIsWalletLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user); // Set current Firebase user
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserProfile({
              username: userData.display_name || 'User',
              email: userData.email || user.email || 'N/A',
              balance: userData.balance !== undefined ? userData.balance : 0,
              totalWinnings: userData.totalWinnings || 0,
              gamesPlayed: userData.gamesPlayed || 0,
            });
            if (userData.photoURL || user.photoURL) {
              setImagePreview(userData.photoURL || user.photoURL);
            }
          } else {
            setError("User data not found.");
            console.log("No such document for user:", user.uid);
            // Set default or redirect
            setUserProfile({ username: 'User', email: user.email || 'N/A', balance: 0 });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setError("Failed to load profile data.");
          // Set default or redirect
          setUserProfile({ username: 'User', email: user.email || 'N/A', balance: 0 });
        }
      } else {
        // User is signed out
        router.push('/login'); // Redirect to login if not authenticated
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [router]);

  // Implement Firebase logout function
  const handleLogout = async () => {
    try {
        await signOut(auth);
        console.log("User signed out successfully.");
        // Redirect to login page or home page after logout
        router.push('/'); // Redirect to root welcome page on logout
    } catch (error) {
        console.error("Error signing out: ", error);
        // Optionally, show an error message to the user
        // setError("Failed to sign out. Please try again.");
    }
  };

  // Handle file selection for profile picture
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // TODO: Add actual upload logic here - send 'file' object to your backend API
      console.log("Selected file:", file);
    }
  };

  // Trigger file input click
   const handleEditClick = () => {
    fileInputRef.current?.click();
   };

  // Protected action handler for BottomNav
  const handleProtectedAction = () => {
    if (!currentUser) {
      console.log("Protected action triggered on profile page, showing login prompt.");
      setIsLoginModalOpen(true);
    }
  };

  // Wallet manage loading simulation
  const handleManageClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    setIsWalletLoading(true);
    // Simulate loading, then navigate
    setTimeout(() => {
      setIsWalletLoading(false);
      router.push('/wallet');
    }, 900);
    e.preventDefault();
  };

  return (
    <div className="bg-background text-foreground p-4 sm:p-6 lg:p-8 pb-20 flex flex-col min-h-screen">
      <div className="max-w-2xl mx-auto w-full flex-grow">

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-12 w-12 animate-spin text-accent-1" />
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 my-6 text-center">
            <p>{error}</p>
            <button onClick={() => router.push('/')} className="mt-2 px-4 py-2 bg-accent-1 text-white rounded hover:bg-accent-1/90">
              Go to Homepage
            </button>
          </div>
        ) : userProfile ? (
          <>
            {/* Profile Summary Card UI inlined here */}
            <div
              className="w-full rounded-2xl p-6 flex flex-col items-center mb-6 border relative"
              style={{
                background: 'linear-gradient(145deg, #262c3d 80%, #23293a 100%)',
                borderColor: 'rgba(255,255,255,0.04)',
                boxShadow:
                  'inset 0 2px 12px 0 rgba(255,255,255,0.07), inset 0 -8px 32px 0 rgba(0,0,0,0.18)',
              }}
            >
              {/* Balance, amount, and manage button in a single row, all bottom aligned */}
              <div className="absolute top-4 right-4 flex flex-row items-end gap-3">
                <span className="px-4 py-2 rounded-full bg-[#58513a] flex items-center gap-2" style={{minHeight:'32px'}}>
                  <span className="text-xs text-text-primary">Balance:</span>
                  <span className="text-yellow-400 font-bold text-md">${userProfile.balance.toFixed(2)}</span>
                </span>
                <Link
                  href="/wallet"
                  onClick={handleManageClick}
                  className={`text-accent-1 text-xs font-semibold cursor-pointer flex items-center transition-colors duration-150 ${isWalletLoading ? 'pointer-events-none opacity-70' : 'hover:underline hover:text-accent-1/80 active:text-accent-1/90'}`}
                  style={{}}
                  tabIndex={0}
                  aria-disabled={isWalletLoading}
                  legacyBehavior>
                  {isWalletLoading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  Manage
                </Link>
              </div>
              <div className="relative w-24 h-24 mb-3 group">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile Avatar"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="text-gray-400 w-12 h-12" />
                  </div>
                )}
                {/* Edit Overlay (shows on hover/tap) */}
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
                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload profile picture"
                />
              </div>
              <div className="text-xl font-bold text-text-primary mb-1">{userProfile.username}</div>
              {userProfile.email && <div className="text-xs text-text-secondary mb-2">{userProfile.email}</div>}
              {/* Removed Current Balance and Rookie text from below avatar */}
            </div>
            {/* End Profile Summary Card UI */}

            {/* Menu Buttons - Account Actions */}
            <div className="mb-8">
               <h2 className="text-xs uppercase text-text-secondary font-semibold mb-3 px-1">Account</h2>
               {/* Use via stop at 5% */}
                <div className="rounded-xl overflow-hidden bg-gradient-to-b from-background-primary via-background-primary via-5% to-background-secondary divide-y divide-gray-700/50 shadow-md">
                    {accountMenuItems.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="w-full p-4 flex items-center hover:bg-gray-700/30 hover:scale-[1.03] focus:scale-[1.03] active:scale-95 transition-all duration-150 hover:underline focus:underline rounded-none outline-none group"
                        legacyBehavior>
                        <item.icon className="text-text-secondary mr-4 w-5 h-5 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                        <span className="text-text-primary transition-colors duration-150 group-hover:text-accent-1 group-focus:text-accent-1">{item.label}</span>
                        <ArrowRight className="ml-auto text-text-secondary w-4 h-4 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                      </Link>
                    ))}
                    {/* Logout Button */}
                     <button
                       onClick={handleLogout}
                       className="w-full p-4 flex items-center hover:bg-red-900/20 text-red-500 hover:text-red-400 focus:text-red-400 active:scale-95 transition-all duration-150 rounded-none outline-none group"
                     >
                       <LogOut className="mr-4 w-5 h-5 group-hover:text-red-400 group-focus:text-red-400 transition-colors duration-150" />
                       <span>Logout</span>
                     </button>
                </div>
            </div>

            {/* Menu Buttons - Information & Support */}
            {/* Enhanced container style */}
             <div>
               <h2 className="text-xs uppercase text-text-secondary font-semibold mb-3 px-1">Information & Support</h2>
               {/* Use via stop at 5% */}
               <div className="rounded-xl overflow-hidden bg-gradient-to-b from-background-primary via-background-primary via-5% to-background-secondary divide-y divide-gray-700/50 shadow-md">
                 {supportMenuItems.map((item) => (
                   item.isExternal ? (
                     <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="w-full p-4 flex items-center hover:bg-gray-700/30 hover:scale-[1.03] focus:scale-[1.03] active:scale-95 transition-all duration-150 hover:underline focus:underline rounded-none outline-none group">
                        <item.icon className="text-text-secondary mr-4 w-5 h-5 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                        <span className="text-text-primary transition-colors duration-150 group-hover:text-accent-1 group-focus:text-accent-1">{item.label}</span>
                        <ArrowRight className="ml-auto text-text-secondary w-4 h-4 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                     </a>
                   ) : (
                     <Link
                       key={item.label}
                       href={item.href}
                       className="w-full p-4 flex items-center hover:bg-gray-700/30 hover:scale-[1.03] focus:scale-[1.03] active:scale-95 transition-all duration-150 hover:underline focus:underline rounded-none outline-none group"
                       legacyBehavior>
                       <item.icon className="text-text-secondary mr-4 w-5 h-5 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                       <span className="text-text-primary transition-colors duration-150 group-hover:text-accent-1 group-focus:text-accent-1">{item.label}</span>
                       <ArrowRight className="ml-auto text-text-secondary w-4 h-4 group-hover:text-accent-1 group-focus:text-accent-1 transition-colors duration-150" />
                     </Link>
                   )
                 ))}
               </div>
             </div>

             {/* Stats Preview Section Removed */}

          </>
        ) : (
          // Fallback if userProfile is null but not loading and no error (should not happen if logic is correct)
          (<div className="text-center py-10 text-text-secondary">
            <p>Could not load profile information.</p>
          </div>)
        )}

      </div>
      {/* Spacer for fixed BottomNav */}
      <div className="h-16" />
      {/* Bottom Navigation */}
      <BottomNav user={currentUser} onProtectedAction={handleProtectedAction} />
      {/* Login Required Modal */}
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