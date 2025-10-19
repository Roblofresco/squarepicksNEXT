import * as admin from 'firebase-admin';

// Function to ensure Firebase Admin is initialized only once
export const initAdmin = (): admin.app.App => {
  if (admin.apps.length > 0) {
    return admin.app(); // Return existing app if already initialized
  }

  // Try to get service account from environment variable first (for Vercel)
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (serviceAccountJson) {
    try {
      console.log('Initializing Firebase Admin SDK using environment variable...');
      const serviceAccount = JSON.parse(serviceAccountJson);
      const credential = admin.credential.cert(serviceAccount);
      const app = admin.initializeApp({ credential });
      console.log('Firebase Admin SDK initialized successfully from environment variable.');
      return app;
    } catch (error: any) {
      console.error('Firebase Admin SDK initialization error (from environment variable):', error);
      throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
  }

  // Fallback to file path (for local development)
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!serviceAccountPath) {
    console.error('Firebase Admin SDK Error: Neither FIREBASE_SERVICE_ACCOUNT_KEY nor GOOGLE_APPLICATION_CREDENTIALS environment variable is set.');
    throw new Error('Firebase Admin SDK credentials not configured.');
  }

  console.log(`Firebase Admin Init - Attempting to load credentials from file: ${serviceAccountPath}`);

  try {
    const fs = require('fs');
    
    // Check if file exists before reading
    if (!fs.existsSync(serviceAccountPath)) {
        console.error(`Firebase Admin SDK Error: Service account file not found at path: ${serviceAccountPath}`);
        throw new Error(`Service account file not found: ${serviceAccountPath}`);
    }

    // Read the service account file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    console.log('Initializing Firebase Admin SDK using service account file...');
    
    // Explicitly create credentials and initialize
    const credential = admin.credential.cert(serviceAccount);
    const app = admin.initializeApp({ credential });
    
    console.log('Firebase Admin SDK initialized successfully from file.');
    return app;

  } catch (error: any) {
    console.error(`Firebase Admin SDK initialization error (loading from file ${serviceAccountPath}):`, error);
    if (error instanceof SyntaxError) {
      throw new Error(`Firebase Admin SDK failed to parse service account JSON file: ${error.message}`);
    }
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
};

// Optionally, initialize immediately if needed by other server-side imports
// initAdmin(); 