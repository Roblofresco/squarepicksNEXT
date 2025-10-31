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

  async function findBoards() {
    try {
      const gameId = process.argv[2] || '401772943';
      
      console.log(`Finding boards for game: ${gameId}\n`);

      const gameRef = db.doc(`games/${gameId}`);
      const boardsSnapshot = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .get();

      if (boardsSnapshot.empty) {
        console.log(`❌ No boards found for game ${gameId}`);
        process.exit(1);
      }

      console.log(`Found ${boardsSnapshot.size} board(s):\n`);

      boardsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Board ID: ${doc.id}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Amount: $${data.amount || 'Unknown'}`);
        console.log(`   Has axis numbers: ${data.home_numbers && data.away_numbers ? 'Yes' : 'No'}`);
        if (data.home_numbers && data.away_numbers) {
          console.log(`   Home: [${data.home_numbers.join(', ')}]`);
          console.log(`   Away: [${data.away_numbers.join(', ')}]`);
        }
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Error finding boards:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  findBoards();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



