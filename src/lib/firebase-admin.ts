import * as admin from 'firebase-admin';
import fs from 'fs'; // Import fs for file reading
// import path from 'path'; // Path might not be needed if using absolute path

// Function to ensure Firebase Admin is initialized only once
export const initAdmin = (): admin.app.App => {
  if (admin.apps.length > 0) {
    return admin.app(); // Return existing app if already initialized
  }

  // Get the path to the service account key file from environment variables
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!serviceAccountPath) {
    console.error('Firebase Admin SDK Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set.');
    throw new Error('Firebase Admin SDK credentials path is not configured.');
  }

  console.log(`Firebase Admin Init - Attempting to load credentials from: ${serviceAccountPath}`);

  try {
    // Check if file exists before reading
    if (!fs.existsSync(serviceAccountPath)) {
        console.error(`Firebase Admin SDK Error: Service account file not found at path: ${serviceAccountPath}`);
        throw new Error(`Service account file not found: ${serviceAccountPath}`);
    }

    // Read the service account file
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    console.log('Initializing Firebase Admin SDK using service account file (explicitly)...');
    
    // Explicitly create credentials and initialize
    const credential = admin.credential.cert(serviceAccount);
    const app = admin.initializeApp({ credential });
    
    console.log('Firebase Admin SDK initialized successfully (explicitly).');
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