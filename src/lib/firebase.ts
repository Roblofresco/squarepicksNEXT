// Server-safe Firebase configuration
// This file is for server-side operations and type definitions only
// For client-side Firebase operations, use firebase-client.ts

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Export empty objects for server-side safety
export const app = null;
export const db = null;
export const auth = null;
