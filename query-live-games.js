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

  async function queryLiveGames() {
    try {
      console.log('Querying games where isLive is true...\n');
      
      const gamesSnapshot = await db.collection('games')
        .where('isLive', '==', true)
        .get();
      
      console.log(`Found ${gamesSnapshot.size} live game(s):\n`);
      
      if (gamesSnapshot.size > 0) {
        gamesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`Game ID: ${doc.id}`);
          console.log(`  Home Team: ${data.homeTeam?.full_name || 'Unknown'}`);
          console.log(`  Away Team: ${data.awayTeam?.full_name || 'Unknown'}`);
          console.log(`  Date: ${data.date || 'Unknown'}`);
          console.log(`  Status: ${data.status || 'Unknown'}`);
          console.log(`  isLive: ${data.isLive}`);
          console.log('');
        });
      } else {
        console.log('No live games found.');
      }
      
    } catch (error) {
      console.error('❌ Error querying games:', error);
    } finally {
      process.exit(0);
    }
  }

  queryLiveGames();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



