'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
  redirectTo?: string;
}

export default function AuthGuard({ 
  children, 
  requireEmailVerification = true,
  redirectTo = '/login'
}: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Reload to get latest verification status
        try {
          await user.reload();
          const freshUser = auth.currentUser;
          
          if (requireEmailVerification && freshUser && !freshUser.emailVerified) {
            setError('Email verification required');
            setUser(freshUser);
            setLoading(false);
            return;
          }
          
          setUser(freshUser);
          setLoading(false);
        } catch (error) {
          // Handle reload error - fallback to original user
          console.error('Error reloading user:', error);
          if (requireEmailVerification && !user.emailVerified) {
            setError('Email verification required');
          }
          setUser(user);
          setLoading(false);
        }
      } else {
        // No user logged in
        setUser(null);
        setLoading(false);
        router.push(redirectTo);
      }
    });

    return () => unsubscribe();
  }, [requireEmailVerification, redirectTo, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-primary">
        <Loader2 className="h-12 w-12 animate-spin text-accent-1 mb-4" />
        <p className="text-text-primary">Verifying authentication...</p>
      </div>
    );
  }

  // Show error state for unverified email
  if (error && user && !user.emailVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-primary p-4">
        <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">Email Verification Required</h1>
        <p className="text-text-secondary text-center mb-6 max-w-md">
          Please verify your email address before accessing this page. Check your inbox for a verification link.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => router.push('/verify-email')}
            className="bg-accent-1 hover:bg-accent-1/90 text-white"
          >
            Go to Email Verification
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/profile')}
            className="border-gray-500 text-gray-300 hover:bg-gray-500/20"
          >
            Back to Profile
          </Button>
        </div>
      </div>
    );
  }

  // Show error state for other authentication issues
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-primary p-4">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">Authentication Error</h1>
        <p className="text-text-secondary text-center mb-6 max-w-md">
          {error}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => router.push('/login')}
            className="bg-accent-1 hover:bg-accent-1/90 text-white"
          >
            Go to Login
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/')}
            className="border-gray-500 text-gray-300 hover:bg-gray-500/20"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // User is authenticated and verified (if required), render children
  return <>{children}</>;
}

