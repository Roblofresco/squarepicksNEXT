'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupContext } from '@/context/SignupContext';
import Link from 'next/link';
import { FiCheck } from 'react-icons/fi'; // Remove unused icons
import SignupProgressDots from '@/components/SignupProgressDots'; // Import dots
// Firebase Imports
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { MailCheck, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from 'framer-motion'

export default function UsernamePage() {
  const router = useRouter();
  const { signupData, setSignupData } = useSignupContext();
  const [username, setUsername] = useState(signupData.username || '');
  const [termsAccepted, setTermsAccepted] = useState(signupData.termsAccepted || false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Loading state for final submission
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const totalSteps = 4;
  const currentStep = 4; // Step 4

  // Async check for username availability
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    let isCancelled = false;
    setCheckingUsername(true);
    setUsernameAvailable(null);
    const check = setTimeout(async () => {
      try {
        const res = await fetch('/api/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (!isCancelled) setUsernameAvailable(!data.exists);
      } catch {
        if (!isCancelled) setUsernameAvailable(null);
      } finally {
        if (!isCancelled) setCheckingUsername(false);
      }
    }, 500); // debounce
    return () => { isCancelled = true; clearTimeout(check); };
  }, [username]);

  const validateInput = () => {
    if (!username.trim()) return 'Please enter a username.';
    if (username.length < 3 || username.length > 20) return 'Username must be between 3 and 20 characters.';
    if (!/^[a-zA-Z0-9]+$/.test(username)) return 'Username can only contain letters and numbers (no spaces).';
    if (usernameAvailable === false) return 'This username is already taken.';
    if (!termsAccepted) return 'You must accept the terms and privacy policy.';
    return '';
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);

    if (!signupData.email || !signupData.password) {
      setError("Email or password missing from signup data.");
      setIsLoading(false);
      return;
    }
    if (username.length < 3) { // Basic validation, adjust as needed
      setError("Username must be at least 3 characters long.");
      setIsLoading(false);
      return;
    }
    if (!termsAccepted) {
      setError("You must accept the terms and conditions.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
      const user = userCredential.user;
      console.log("Firebase Auth user created:", user.uid);

      // 2. Set display name on user profile for email template personalization
      const displayName = signupData.firstName || username;
      await updateProfile(user, { displayName });
      console.log("User display name set:", displayName);

      // 3. Send verification email with explicit actionCodeSettings for local testing
      const actionCodeSettings = {
        url: 'http://localhost:3000/email-verified', // For local testing
        handleCodeInApp: true,
      };
      await sendEmailVerification(user, actionCodeSettings);
      console.log("Verification email sent with actionCodeSettings pointing to localhost.");

      // 4. Create user document in Firestore (as before)
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: signupData.email.toLowerCase(),
        display_name: username, // Use the local username state confirmed on this page
        created_at: serverTimestamp(),
        hasWallet: false,
        balance: 0,
      });
      console.log("Firestore user document created.");

      // 5. SIGN THE USER OUT IMMEDIATELY
      await signOut(auth);
      console.log("[SignupPage] User signed out. auth.currentUser:", auth.currentUser);

      // 6. Show success message and then redirect to login
      setShowSuccessMessage(true);
      toast.success("Signup successful! Please check your email to verify your account before logging in.", { duration: 4000 });
      console.log("[SignupPage] Success message shown. Redirecting to /login in 4 seconds...");
      
      setTimeout(() => {
        console.log("[SignupPage] Executing redirect to /login NOW.");
        router.push('/login');
      }, 4000);

    } catch (err: any) {
      console.error("Error during final signup step:", err);
      // Firebase errors (like email-already-in-use) have a 'code' property
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please try logging in or use a different email.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again.");
      }
      setIsLoading(false); // Ensure loading is stopped on error
    }
    // Do not set isLoading to false here if success path leads to unmount/redirect
  };

  if (showSuccessMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <MailCheck className="h-16 w-16 text-green-500 mb-6" />
        <h1 className="text-2xl font-semibold text-foreground mb-3">Signup Successful!</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          A verification email has been sent to <strong className="text-foreground">{signupData.email}</strong>. 
          Please click the link in the email to verify your account before logging in.
        </p>
        <p className="text-xs text-muted-foreground">Don't see it? Check your spam folder.</p>
        <p className="text-sm text-muted-foreground">
          You will be redirected to the login page shortly...
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-primary mt-4" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background">
      {/* Main content block matching email */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex-grow flex flex-col items-start justify-start px-5 pt-2 w-full max-w-sm mx-auto">
          <h1 className="text-2xl font-semibold text-white mb-6">Choose a username</h1>
          <p className="text-sm text-text-secondary mb-6">
             Create a username between 3 to 20 characters, letters and numbers only no spaces.
          </p>

          <form 
            id="username-form"
            onSubmit={(e) => { e.preventDefault(); handleComplete(); }}
            className="space-y-6 w-full"
            noValidate
          >
             {/* Input field */}
            <div className="relative">
              <label htmlFor="username" className="sr-only">Username</label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} // Remove spaces
                placeholder="Username"
                required
                minLength={3}
                maxLength={20}
                pattern="^[a-zA-Z0-9]*$" // Letters and numbers only
                className="w-full appearance-none bg-transparent border border-text-secondary text-white placeholder-gray-400 text-base p-3 rounded-lg focus:outline-none focus:border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.5)]"
                aria-invalid={usernameAvailable === false}
              />
              {checkingUsername && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400">Checking...</span>}
              {username && username.length >= 3 && usernameAvailable === true && !checkingUsername && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 h-5 w-5" aria-label="Username available" />
              )}
              {username && username.length >= 3 && usernameAvailable === false && !checkingUsername && (
                <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 h-5 w-5" aria-label="Username taken" />
              )}
            </div>
            
            {/* Error message area */}
            {error && <p className="text-red-500 text-sm text-left -mt-4 mb-4">{error}</p>}
            {username && username.length >= 3 && usernameAvailable === false && !checkingUsername && !error && (
              <p className="text-red-500 text-sm text-left -mt-4 mb-4">This username is already taken. Please choose another.</p>
            )}

          </form>

          {/* Checkbox container is MOVED to footer */}
      </motion.div>
      {/* Footer block matching email */}
      <div className="w-full max-w-sm mx-auto px-5 pb-8">
        {/* Checkbox and Terms - Moved here, remove mt-4, add mb-4 */}
        <div className="mb-4">
            <div className="flex items-start space-x-3 p-4 bg-gradient-to-b from-background-primary from-2% to-gray-800/30 border border-text-secondary shadow-[0_0_0_1px_rgba(255,255,255,0.5)] rounded-lg">
            <input
                id="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-700 accent-accent-3 focus:ring-accent-3"
            />
            <label htmlFor="terms" className="text-sm text-gray-300">
                By clicking here, and confirming below, you agree to create an account and confirm you have read, understand, and agree to Square Picks&apos; 
                <Link href="/terms" className="font-medium text-blue-400 hover:text-blue-300 underline"> General Term of Use</Link> and 
                <Link href="/privacy" className="font-medium text-blue-400 hover:text-blue-300 underline"> Privacy Policy</Link>.
            </label>
            </div>
        </div>

        {/* Wrap dots in div, remove margin */}
        <div>
          <SignupProgressDots currentStep={currentStep} totalSteps={totalSteps} />
        </div>
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
          <Button
              type="submit" 
              form="username-form" 
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 font-medium text-base py-3.5 px-5 rounded-lg transition-opacity mt-6 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
              style={{ backgroundColor: isLoading ? '#cccccc' : '#1bb0f2', color: isLoading ? '#666666' : '#202020' }}
          >
              {isLoading ? 'Completing Signup...' : 'Complete Signup'} {isLoading && <FiCheck className="animate-pulse"/>}
          </Button>
        </motion.div>
        <div className="text-center mt-4">
          <Link href="/signup/identity" className="text-sm text-gray-400 hover:text-white hover:underline">Back</Link>
        </div>
      </div>
    </div>
  );
} 