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

  async function checkSquare46() {
    try {
      const boardId = process.argv[2] || 'test-board-1761871705688';
      
      console.log(`Checking for square "46" on board: ${boardId}\n`);

      // Check squares with value "46"
      const squaresSnapshot = await db.collection('squares')
        .where('boardId', '==', boardId)
        .where('square', '==', '46')
        .get();

      console.log(`Found ${squaresSnapshot.size} square(s) with value "46":\n`);

      if (squaresSnapshot.empty) {
        console.log('❌ No squares found with value "46"');
      } else {
        squaresSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`   Square Document ID: ${doc.id}`);
          console.log(`   Index: ${data.index}`);
          console.log(`   Square Value: ${data.square}`);
          console.log(`   User ID: ${data.userID?.id || data.userID || 'Unknown'}`);
          console.log(`   Game ID: ${data.gameId || 'Unknown'}`);
          console.log('');
        });
      }

      // Check board status
      const boardDoc = await db.collection('boards').doc(boardId).get();
      if (boardDoc.exists) {
        const boardData = boardDoc.data();
        console.log(`Board Status: ${boardData.status}`);
        console.log(`Board Amount: $${boardData.amount}`);
      }
      
    } catch (error) {
      console.error('❌ Error checking square:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  checkSquare46();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



