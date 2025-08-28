'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
// Import Firebase functions SDK
import { getFunctions, httpsCallable, Functions, FunctionsError } from 'firebase/functions';
import { app } from '@/lib/firebase'; // IMPORT Firebase app instance
// import { trackEvent } from '@/utils/analytics'; // COMMENTED OUT - Module not found
// Button is no longer used
// import { Button } from "@/components/ui/button";
// Input is no longer needed
// import { Input } from "@/components/ui/input"; 
import Image from 'next/image';
import { Loader2, AlertTriangle } from "lucide-react";
// Import AlertDialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
// Import StarfieldBackground
import StarfieldBackground from '@/components/effects/StarfieldBackground';
import ProgressBar from '@/components/ui/ProgressBar';

// Define the list of ineligible states
const INELIGIBLE_STATES: string[] = ['CO', 'MD', 'NE', 'ND', 'VT'];

// Get a Functions instance, specifying the region
// const functionsInstance = getFunctions(); // OLD
const functionsInstance = getFunctions(app, 'us-east1'); // NEW: Specify region

// Initialize the callable function reference directly here if not already done elsewhere
const verifyLocationFromCoordsCallable = httpsCallable(functionsInstance, 'verifyLocationFromCoords');

function LocationSetupPageContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // Renamed isLoading to isVerifyingLocation, default to false for initial page render
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false); 
  const [isAuthLoading, setIsAuthLoading] = useState(true); // For initial auth check
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Removed manualStateInput and showManualInput
  const [determinedState, setDeterminedState] = useState<string | null>(null);
  const [ineligibleStateDetected, setIneligibleStateDetected] = useState<string | null>(null);
  const [showIneligibleDialog, setShowIneligibleDialog] = useState(false);

  // Check auth state and redirect if necessary
  useEffect(() => {
    setIsAuthLoading(true); // Start auth loading
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      } 
      
        setUser(currentUser);
      // Removed userDoc fetch and step checking here to allow page to load first
      console.log("User authenticated, setting isAuthLoading to false.");
      setIsAuthLoading(false); // Auth check done, allow page render
    });
    return () => unsubscribe();
     
  }, [router]); 

  // Updated to pass state via query param, no Firestore interaction here
  const handleStateVerification = useCallback((state: string) => { 
    setError(null); 
    setIsVerifyingLocation(false); // Stop loading indicator

    if (!state || state.length !== 2) {
      setError('Invalid state format received from verification.');
      return;
    }

    const upperCaseState = state.toUpperCase();
    setDeterminedState(upperCaseState); // Still useful for UI feedback before navigation

    if (INELIGIBLE_STATES.includes(upperCaseState)) {
      setIneligibleStateDetected(upperCaseState);
      setShowIneligibleDialog(true);
      // No need to set isSubmitting or isVerifyingLocation as they are handled
      return; 
    }

    // State is eligible, navigate with state as query parameter
    // No longer checking auth.currentUser here as this page only deals with location determination and passing it on.
    // The personal-info page will handle auth checks for its own context.
    console.log(`State ${upperCaseState} is eligible. Navigating to personal-info with state.`);
    router.push(`/wallet-setup/personal-info?state=${upperCaseState}`); 
    
  }, [router, setError, setIsVerifyingLocation, setDeterminedState, setIneligibleStateDetected, setShowIneligibleDialog]); // Removed isSubmitting from dependencies

  // Function to handle geolocation attempt
  const attemptGeolocation = useCallback(() => {
    setIsVerifyingLocation(true); // Spinner on
    setError(null);
    console.log("Attempting geolocation...");

    if (typeof window === 'undefined' || !navigator.geolocation) {
      console.error('Geolocation API not supported or running in SSR.');
      setError('Geolocation is not supported by your browser. Please ensure it is enabled in your browser settings.');
      setIsVerifyingLocation(false); // Spinner off
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Geolocation Success (raw):', position);
        const { latitude, longitude } = position.coords;

        if (!functionsInstance) {
            console.error("Firebase Functions not initialized before calling verifyLocationFromCoords.");
            setError("Could not contact verification service. Please refresh and try again.");
            setIsVerifyingLocation(false); // Spinner off
            return;
        }
        
        console.log(`Frontend: Coordinates to send: latitude = ${latitude}, longitude = ${longitude}`);

        const dataToSend = { latitude, longitude };
        // console.log("Frontend: Sending this object to Cloud Function:", dataToSend); // Original log, kept for reference if needed, but the one above is more direct

        try {
            const result = await verifyLocationFromCoordsCallable(dataToSend); 
            const data = result.data as { state: string }; 

            if (data && data.state) {
                console.log("Cloud function returned state:", data.state);
                handleStateVerification(data.state);
            } else {
                 console.error("Invalid response from verification service. Data:", data);
                 throw new Error("Invalid response from verification service.");
            }
        } catch (funcError: any) {
            console.error("Error calling verifyLocationFromCoords function:", funcError);
            let errorMsg = "Could not verify location automatically. ";
            if (funcError.code === 'not-found') {
                 errorMsg += "Could not determine state from coordinates. Please try again.";
            } else if (funcError.message) {
                const displayMessage = funcError.message.length > 100 ? "An unexpected error occurred." : funcError.message;
                errorMsg += displayMessage;
            } else {
                errorMsg += "Please try again.";
            }
            setError(errorMsg);
            setIsVerifyingLocation(false); // Spinner off
        }
      },
      (geoError) => {
        console.error('Geolocation Error (raw):', geoError);
        let errorMsg = 'Could not determine your location automatically.';
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMsg += ' Please grant location permission in your browser settings and refresh the page.';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMsg += ' Location information is unavailable. Please ensure your GPS/location services are on and try again.';
            break;
          case geoError.TIMEOUT:
            errorMsg += ' The request to get your location timed out. Please try again.';
            break;
          default:
            errorMsg += ' An unknown error occurred. Please try again.';
            break;
        }
        setError(errorMsg);
        setIsVerifyingLocation(false); // Spinner off
      },
      { timeout: 10000, enableHighAccuracy: true } 
    );
  }, [setIsVerifyingLocation, setError, handleStateVerification]);

  // Effect to attempt geolocation once user is confirmed and auth loading is complete
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined = undefined; // For setTimeout

    // --- REMOVING AUTOMATIC GEOLOCATION ATTEMPT ---
    // if (user && !isAuthLoading) {
    //   console.log("Geolocation useEffect: Conditions met. Will attempt geolocation after 1s delay.");
    //   timerId = setTimeout(() => {
    //     // trackEvent('geolocation_auto_attempt_started'); // COMMENTED OUT - Module not found
    //     console.log("Geolocation useEffect: 1s delay complete. Calling attemptGeolocation.");
    //     attemptGeolocation();
    //   }, 1000); // 1-second delay
    // }
    // --- END OF REMOVAL ---
    return () => { // Cleanup
      if (timerId) {
        clearTimeout(timerId);
        // console.log("Geolocation useEffect: Cleared geolocation timer."); // No longer needed
      }
    };
  }, []); // Empty dependency array as it no longer depends on user/authLoading/attemptGeolocation for auto-trigger

  // Effect to automatically log out user after showing the ineligible dialog for 5 seconds
  useEffect(() => {
    let logoutTimerId: NodeJS.Timeout | undefined = undefined;

    // --- RE-ENABLING AUTOMATIC LOGOUT --- 
    if (showIneligibleDialog) {
      console.log("Ineligible dialog shown. Starting 5s logout timer.");
      // trackEvent('ineligible_location_dialog_shown', { state: ineligibleStateDetected }); // COMMENTED OUT - Module not found
      logoutTimerId = setTimeout(() => {
        console.log("5s elapsed. Signing out and redirecting to login.");
        auth.signOut().then(() => {
          // trackEvent('automatic_logout_success_ineligible'); // COMMENTED OUT - Module not found
          router.push('/');
        }).catch((signOutError: any) => { // TYPED signOutError
          // trackEvent('automatic_logout_failed_ineligible', { error: signOutError.message }); // COMMENTED OUT - Module not found
          console.error("Error during automatic sign out:", signOutError);
          // Attempt to redirect even if sign out fails
          router.push('/');
        });
      }, 5000); // 5-second delay
    }
    // --- END OF RE-ENABLING --- 

    return () => {
      if (logoutTimerId) {
        clearTimeout(logoutTimerId);
        console.log("Ineligible dialog effect cleanup: Cleared logout timer.");
      }
    };
  }, [showIneligibleDialog, router]); // Depend on the dialog state and router

  // Show a general loading screen during initial auth check
  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background-primary to-background-secondary p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary-blue mb-4" />
        <p className="text-gray-300">Loading account...</p>
      </div>
    );
  }

  // Main page content
  return (
    <>
      {/* Conditionally render Starfield Background for Modal */}
      {showIneligibleDialog && (
          <StarfieldBackground className="z-40" /> 
      )}

    <div className="flex flex-col items-center min-h-screen bg-gradient-to-b from-background-primary to-background-secondary p-4 pt-10">
      <div className="w-full max-w-md mb-6">
          <p className="text-sm text-primary-blue text-center font-semibold">Step 1 of 2: Location</p>
          <ProgressBar step={1} totalSteps={2} />
      </div>

      <div className="w-full max-w-md bg-gradient-to-b from-gray-800/30 to-gray-900/50 rounded-lg shadow-xl p-6 md:p-8 border border-gray-700">
        <div className="flex justify-center mb-5">
          <div className="bg-primary-blue rounded-full p-3 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-2">Verify Your Location</h1>
        <p className="text-center text-gray-300 text-sm mb-4">Why we need your location:</p>
        <ul className="text-sm text-gray-300 space-y-1 mb-5 list-none text-center">
          <li className="flex items-center justify-center"><svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Verify state eligibility</li>
          <li className="flex items-center justify-center"><svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>Ensure legal compliance</li>
        </ul>

        {/* ADDED "Verify My Location" Button */}
        {!isVerifyingLocation && !determinedState && !error && (
          <button
            onClick={() => {
              // trackEvent('verify_location_button_clicked'); // COMMENTED OUT - Module not found
              attemptGeolocation();
            }}
            className="w-full mt-2 mb-6 bg-gradient-to-r from-[#5855e4] to-[#6a67e8] hover:from-[#6a67e8] hover:to-[#5855e4] active:scale-95 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-accent-2/50 focus:ring-offset-2 focus:ring-offset-gray-800"
            disabled={isAuthLoading} // Disable if auth is still loading
            tabIndex={0}
            aria-label="Verify My Location"
          >
            Verify My Location
          </button>
        )}

          <div className="mb-6 flex justify-center">
               <Image src="/images/us_outline.png" alt="US Map Outline" width={300} height={180} priority />
        </div>

          {/* Spinner for when geolocation is actively being verified */}
          {isVerifyingLocation && !error && !determinedState && (
            <div className="flex flex-col items-center justify-center my-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary-blue mb-2" />
              <p className="text-gray-300 text-center">Attempting to verify your location automatically.<br/>Please check for a browser permission prompt.</p>
            </div>
          )}
          
          {/* Display determined state if auto-detected and not ineligible */} 
          {determinedState && !showIneligibleDialog && (
              <div className="text-center p-4 bg-green-900/30 border border-green-700 rounded-md my-4">
                <p className="text-green-300 font-semibold">Location Verified: {determinedState}</p>
                <p className="text-sm text-gray-400 mt-1">Proceeding to the next step...</p>
            </div>
        )}

          {/* Display error message if any, and not showing ineligible dialog */}
        {error && !showIneligibleDialog && (
            <div className="mt-4 text-center p-3 bg-red-900/20 border border-red-700/50 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
        )}

        <p className="mt-6 text-xs text-center text-gray-500">
          By proceeding, you confirm the information provided is accurate and truthful. Providing false information may result in disqualification.
        </p>
      </div>

        {/* --- Updated Ineligible State Dialog --- */}
      <AlertDialog open={showIneligibleDialog} onOpenChange={setShowIneligibleDialog}>
          <AlertDialogContent className="sm:max-w-md bg-gradient-to-b from-[#0a0e1b] to-[#5855e4] to-15% border-accent-1/50 text-white py-8 z-50">
            <AlertDialogHeader className="text-center items-center">
              <AlertDialogTitle className="text-red-400 text-2xl font-bold mb-2 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 mr-2" /> 
                Location Ineligible
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: '#eeeeee', textAlign: 'center' }}>
                 Due to regulatory restrictions, our services are currently unavailable in {ineligibleStateDetected || 'your detected state'}. We apologize for any inconvenience.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-6 mb-2 justify-center">
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
    </>
  );
} 

export default function LocationSetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LocationSetupPageContent />
    </Suspense>
  );
} 