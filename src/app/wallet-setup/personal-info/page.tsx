'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import ProgressBar from '@/components/ui/ProgressBar';
import PersonalInfoForm from '@/components/ui/PersonalInfoForm';

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
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary-blue" /></div>}>
      <PersonalInfoContent />
    </Suspense>
  );
}

function PersonalInfoContent() {
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
    email: '', // May pre-fill from auth user
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

  // Function to handle form submission with validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('Form submission started');

    // Basic validation
    for (const key in formData) {
      if (formData[key as keyof FormData].trim() === '') {
        setError(`Please fill out all fields. Missing: ${key}`);
        console.log('Validation failed:', `Missing: ${key}`);
        return;
      }
    }

    if (!verifiedState) { // Double check verifiedState is set (should be by useEffect)
      setError("State information is missing. Please go back to the location step.");
      console.log('State information missing');
      return;
    }

    if (!user) {
      setError("User session lost. Please log in again.");
      console.log('User session lost');
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Form submitted successfully:', formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
      console.log('Form submission ended');
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
        <ProgressBar step={2} totalSteps={2} />
      </div>

      <div className="w-full max-w-md bg-gradient-to-b from-gray-800/30 to-gray-900/50 rounded-lg shadow-xl p-6 md:p-8 border border-gray-700">
        <h1 className="text-2xl font-bold text-center text-white mb-2">Personal Information</h1>
        <p className="text-center text-gray-300 text-sm mb-6">
          Please provide the following information for verification and account setup purposes.
        </p>

        <PersonalInfoForm
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
          verifiedState={verifiedState}
        />

        <p className="mt-6 text-xs text-center text-gray-500">
          By submitting this information, you agree to our <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-blue">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-blue">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
} 