// test-firebase-admin.js
require('dotenv').config({ path: '.env.local' }); // Load .env.local variables
const admin = require('firebase-admin');
const fs = require('fs');

console.log("--- Starting Standalone Firebase Admin Test ---");

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set in .env.local');
  process.exit(1);
}

console.log(`Attempting to load credentials from: ${serviceAccountPath}`);

try {
  // Check if file exists
  if (!fs.existsSync(serviceAccountPath)) {
      console.error(`Error: Service account file not found at path: ${serviceAccountPath}`);
      process.exit(1);
  }

  // Read the service account file
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  console.log('Initializing Firebase Admin SDK using service account file...');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("✅ Firebase Admin SDK initialized successfully!");

} catch (error) {
  console.error("❌ Firebase Admin SDK initialization FAILED:");
  console.error(error);
  process.exit(1);
}

console.log("--- Test Finished ---"); 