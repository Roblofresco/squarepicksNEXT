'use client'

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics"; // Optional: Analytics
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional: Add if using Analytics
};

// Initialize Firebase
// Check if Firebase app has already been initialized to avoid errors during hot-reloading
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
// const analytics = getAnalytics(app); // Optional

// Initialize App Check in the browser to satisfy Firestore/AppCheck enforcement
if (typeof window !== 'undefined') {
  try {
    // Enable debug token on localhost if configured
    if (process.env.NEXT_PUBLIC_APPCHECK_DEBUG === 'true') {
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
    if (siteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
  } catch (err) {
    // Swallow to avoid breaking SSR/CSR; logs can be inspected in devtools
    // console.warn('App Check initialization skipped or failed:', err);
  }
}

// Export the initialized services
export { app, db, auth /*, analytics */ }; // Add other services like 'analytics' if needed
