'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string; // May pre-fill from auth user
  street: string;
  city: string;
  postalCode: string;
  // State is likely already stored from step 1
}

export default function PersonalInfoSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to get URL search params
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Loading auth/progress check
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    postalCode: '',
  });
  const [verifiedState, setVerifiedState] = useState<string | null>(null);

  // Check auth and retrieve state from URL param
  useEffect(() => {
    const passedState = searchParams.get('state');

    if (!passedState || passedState.length !== 2) {
      // If no valid state in URL, redirect to location setup
      console.log("State parameter missing or invalid in URL. Redirecting to location setup.");
      router.push('/wallet-setup/location');
      return;
    }
    setVerifiedState(passedState.toUpperCase());

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        // Pre-fill form data from Firestore if available (userDocSnap might not exist yet)
        const userData = userDocSnap.exists() ? userDocSnap.data() : {};

        setFormData(prev => ({
          ...prev, 
          email: userData?.email || currentUser.email || '',
          firstName: userData?.firstName || '', 
          lastName: userData?.lastName || '',
          phone: userData?.phone || '',
          street: userData?.street || '',
          city: userData?.city || '',
          postalCode: userData?.postalCode || '',
        }));
        setIsLoading(false); 
        
      } catch (err) {
         console.error("Error fetching user data for pre-fill:", err);
         setError("Could not load your existing information. Please try again.");
         setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, searchParams]); // Added searchParams to dependency array

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // 1. Get only digits from the input
      const digits = value.replace(/\D/g, ''); // \D matches any non-digit character
      
      // 2. Limit to 10 digits (standard US phone number length)
      const truncatedDigits = digits.slice(0, 10);
      
      // 3. Apply formatting (XXX) XXX-XXXX
      let formattedValue = '';
      if (truncatedDigits.length > 0) {
        formattedValue = `(${truncatedDigits.slice(0, 3)}`;
      }
      if (truncatedDigits.length > 3) {
        formattedValue += `) ${truncatedDigits.slice(3, 6)}`;
      }
      if (truncatedDigits.length > 6) {
        formattedValue += `-${truncatedDigits.slice(6, 10)}`;
      }

      // 4. Update state with the formatted value
      setFormData(prev => ({ ...prev, [name]: formattedValue }));

    } else {
      // Handle other inputs normally
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    // Basic validation
    for (const key in formData) {
      if (formData[key as keyof FormData].trim() === '') {
        setError(`Please fill out all fields. Missing: ${key}`);
        return;
      }
    }

    if (!verifiedState) { // Double check verifiedState is set (should be by useEffect)
      setError("State information is missing. Please go back to the location step.");
      return;
    }

    if (!user) {
      setError("User session lost. Please log in again.");
      router.push('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      
      const dataToSave = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode,
          state: verifiedState, // Use state from URL param
          hasWallet: true // Add this field to indicate wallet setup is complete
      };

      await setDoc(userDocRef, 
          dataToSave, 
          { merge: true } 
      ); 

      console.log("Personal info saved. Navigating to wallet.");
      router.push('/wallet'); 

    } catch (updateError) {
      console.error("Error saving personal information:", updateError);
      setError('Could not save your information. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background-primary to-background-secondary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-blue mb-4" />
        <p className="text-gray-300">Loading your info...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background-primary to-background-secondary p-4 pt-10">
      {/* Progress Indicator */}
      <div className="w-full max-w-md mb-6">
        <p className="text-sm text-primary-blue text-center font-semibold">Step 2 of 2: Personal Information</p>
        {/* TODO: Add a more visual progress bar */} 
      </div>

      <div className="w-full max-w-md bg-gradient-to-b from-gray-800/30 to-gray-900/50 rounded-lg shadow-xl p-6 md:p-8 border border-gray-700">
        <h1 className="text-2xl font-bold text-center text-white mb-2">Personal Information</h1>
        <p className="text-center text-gray-300 text-sm mb-6">
          Please provide the following information for verification and account setup purposes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              name="firstName"
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              disabled={isSubmitting}
            />
            <Input
              name="lastName"
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              disabled={isSubmitting}
            />
          </div>
          <Input
            name="phone"
            type="tel" // Use tel type for phone numbers
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
            disabled={isSubmitting}
          />
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
            disabled={isSubmitting}
          />
          <Input
            name="street"
            type="text"
            placeholder="Street Address"
            value={formData.street}
            onChange={handleChange}
            required
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
            disabled={isSubmitting}
          />
          <Input
            name="city"
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            required
            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
            disabled={isSubmitting}
          />
           <div className="flex flex-col sm:flex-row gap-4">
            <Input
              name="stateDisplay" // Read-only display
              type="text"
              placeholder="State"
              value={verifiedState || ''} // Display state from step 1
              readOnly
              className="flex-1 bg-gray-600 border-gray-500 text-gray-300 placeholder-gray-400 cursor-not-allowed"
              aria-label="State (verified)"
            />
            <Input
              name="postalCode"
              type="text"
              placeholder="Postal Code"
              value={formData.postalCode}
              onChange={handleChange}
              required
              className="flex-1 bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <Button 
            type="submit" 
            className="w-full bg-primary-blue hover:bg-primary-blue-dark text-white font-semibold mt-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Information'}
          </Button>
        </form>

        <p className="mt-6 text-xs text-center text-gray-500">
          By submitting this information, you agree to our <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-blue">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-blue">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
} 