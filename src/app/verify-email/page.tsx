'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase'; // For signOut
import { signOut } from 'firebase/auth';
import { MailCheck, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const VerifyEmailPage = () => {
  const router = useRouter();
  const { userId, emailVerified, resendVerificationEmail, isLoading: walletLoading } = useWallet();
  const [isResending, setIsResending] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // If email becomes verified while on this page, redirect to lobby
    if (emailVerified === true) {
      toast.success('Email successfully verified!');
      router.push('/lobby');
    }
    // If user is not logged in (e.g., logs out) or wallet is still loading auth state, redirect to login
    // We add a small delay to walletLoading to avoid flash redirect on initial load
    const timer = setTimeout(() => {
        if (!walletLoading && !userId) {
            router.push('/login');
        }
    }, 200);
    return () => clearTimeout(timer);

  }, [emailVerified, userId, router, walletLoading]);

  const handleResendEmail = async () => {
    if (!resendVerificationEmail) return;
    setIsResending(true);
    const result = await resendVerificationEmail();
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setIsResending(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      toast.success('Logged out successfully.');
      router.push('/login'); // Redirect to login after logout
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out. Please try again.');
    }
    setIsLoggingOut(false);
  };

  if (walletLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your details...</p>
      </div>
    );
  }
  
  // This case should ideally be caught by the useEffect redirect, but as a fallback:
  if (!userId) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Not Authenticated</h1>
        <p className="text-muted-foreground mb-6">You need to be logged in to see this page.</p>
        <Link href="/login">
            <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  // If email is already verified (should be caught by useEffect, but good for explicit rendering check)
  if (emailVerified === true) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <MailCheck className="h-12 w-12 text-green-500 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Email Verified!</h1>
        <p className="text-muted-foreground mb-6">Your email is verified. Redirecting you now...</p>
        <Link href="/lobby">
            <Button variant="outline">Go to Lobby</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-2xl text-center">
        <MailCheck className="h-16 w-16 text-primary mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-4">Verify Your Email</h1>
        <p className="text-muted-foreground mb-8">
          A verification link has been sent to your email address.
          Please check your inbox (and spam folder) and click the link to activate your account.
        </p>
        
        <Button 
          onClick={handleResendEmail} 
          disabled={isResending} 
          className="w-full mb-4 text-lg py-6"
        >
          {isResending ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <MailCheck className="mr-2 h-5 w-5" />
          )}
          {isResending ? 'Sending...' : 'Resend Verification Email'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleLogout} 
          disabled={isLoggingOut} 
          className="w-full text-muted-foreground hover:text-foreground text-lg py-6"
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-5 w-5" />
          )}
          {isLoggingOut ? 'Logging Out...' : 'Log Out'}
        </Button>

        <p className="text-xs text-muted-foreground mt-8">
          If you encounter any issues, please contact support.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
