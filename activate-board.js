require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set in .env.local');
  process.exit(1);
}

try {
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Error: Service account file not found at path: ${serviceAccountPath}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  async function activateBoard() {
    try {
      const boardId = process.argv[2] || 'test-board-1761871705688';
      
      console.log(`Activating board: ${boardId}\n`);

      const boardRef = db.collection('boards').doc(boardId);
      const boardDoc = await boardRef.get();

      if (!boardDoc.exists) {
        console.error(`❌ Board ${boardId} not found`);
        process.exit(1);
      }

      const boardData = boardDoc.data();
      console.log(`Current status: ${boardData.status}`);

      if (boardData.status === 'active') {
        console.log(`✅ Board is already active`);
        process.exit(0);
      }

      // Update board status to active
      await boardRef.update({
        status: 'active',
        activated_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_time: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Board ${boardId} status changed from "${boardData.status}" to "active"`);
      console.log(`   Activated at: ${new Date().toISOString()}`);
      
    } catch (error) {
      console.error('❌ Error activating board:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  activateBoard();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



