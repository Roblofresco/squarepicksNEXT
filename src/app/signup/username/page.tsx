'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupContext } from '@/context/SignupContext';
import Link from 'next/link';
import { FiCheck } from 'react-icons/fi'; // Remove unused icons
import SignupProgressDots from '@/components/SignupProgressDots'; // Import dots
// Firebase Imports
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function UsernamePage() {
  const router = useRouter();
  const { signupData, setSignupData } = useSignupContext();
  const [username, setUsername] = useState(signupData.username || '');
  const [termsAccepted, setTermsAccepted] = useState(signupData.termsAccepted || false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state for final submission

  const totalSteps = 4;
  const currentStep = 4; // Step 4

  const validateInput = () => {
    if (!username.trim()) return 'Please enter a username.';
    if (username.length < 3 || username.length > 20) return 'Username must be between 3 and 20 characters.';
    if (!/^[a-zA-Z0-9]+$/.test(username)) return 'Username can only contain letters and numbers (no spaces).';
    // TODO: Add async username availability check here (query Firestore)
    if (!termsAccepted) return 'You must accept the terms and privacy policy.';
    return '';
  };

  const handleComplete = async () => {
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setIsLoading(true);

    // Make sure email and password exist in context
    if (!signupData.email || !signupData.password) {
        setError('Missing email or password from previous steps. Please go back.');
        setIsLoading(false);
        return;
    }

    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, signupData.email, signupData.password);
        const user = userCredential.user;
        console.log("Firebase Auth user created:", user.uid);

        // Update context with final username & terms (optional, as we are redirecting)
        setSignupData({ ...signupData, username, termsAccepted });

        // 2. Create user profile document in Firestore
        const userDocRef = doc(db, "users", user.uid);

        // Prepare profile data (ensure all required fields from context are included)
        const userProfile = {
            email: signupData.email, // Store email in profile as well
            username: username.trim(), // Store the validated username
            firstName: signupData.firstName || '', // Get from context
            lastName: signupData.lastName || '', // Get from context
            dob: signupData.dob || null, // Get from context (ensure format is consistent or use Timestamp)
            createdAt: serverTimestamp(), // Add a creation timestamp
            termsAccepted: termsAccepted
            // Add any other relevant profile fields from signupData
        };

        await setDoc(userDocRef, userProfile);
        console.log("Firestore user profile created for:", user.uid);

        // 3. Redirect to a logged-in page (e.g., lobby or profile)
        router.push('/lobby'); // Or '/profile' or wherever you want users to land

    } catch (firebaseError: any) {
        // Handle Firebase errors
        console.error("Signup Error:", firebaseError);
        let errorMessage = "Signup failed. Please try again.";
        if (firebaseError.code === 'auth/email-already-in-use') {
            errorMessage = "This email address is already in use. Try logging in.";
        } else if (firebaseError.code === 'auth/weak-password') {
            errorMessage = "Password is too weak. Please choose a stronger password.";
        } else if (firebaseError.code) {
             errorMessage = firebaseError.message; // Use the default firebase error message
        }
        setError(errorMessage);
        setIsLoading(false);
    }
    // Note: setIsLoading(false) is handled within the try/catch blocks now
  };

  return (
    <>
      {/* Main content block matching email */}
      <div className="flex-grow flex flex-col items-start justify-start px-5 pt-2 w-full max-w-sm mx-auto">
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
              <input
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
              />
            </div>
            
            {/* Error message area */}
            {error && <p className="text-red-500 text-sm text-left -mt-4 mb-4">{error}</p>}

          </form>

          {/* Checkbox container is MOVED to footer */}
      </div>

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
        <button
            type="submit" 
            form="username-form" 
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-2 font-medium text-base py-3.5 px-5 rounded-lg transition-opacity mt-6 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            style={{ backgroundColor: isLoading ? '#cccccc' : '#1bb0f2', color: isLoading ? '#666666' : '#202020' }}
        >
            {isLoading ? 'Completing Signup...' : 'Complete Signup'} {isLoading && <FiCheck className="animate-pulse"/>}
        </button>
        <div className="text-center mt-4">
          <Link href="/signup/identity" className="text-sm text-gray-400 hover:text-white hover:underline">Back</Link>
        </div>
      </div>
    </>
  );
} 