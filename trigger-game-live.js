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

  async function triggerGameLive() {
    try {
      const gameId = process.argv[2] || '401772944'; // Default to today's game
      
      console.log(`🔧 Triggering game ${gameId} to go live...\n`);

      const gameRef = db.doc(`games/${gameId}`);
      const gameDoc = await gameRef.get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      const gameData = gameDoc.data();
      console.log(`✅ Game ${gameId} found`);
      console.log(`   Current Status: ${gameData.status}`);
      console.log(`   Current isLive: ${gameData.isLive || false}`);
      console.log(`   Current isOver: ${gameData.isOver || false}\n`);

      // Step 1: Set isLive to false first
      console.log('📝 Step 1: Setting isLive to false...');
      await gameRef.update({
        isLive: false,
        is_live: false,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   ✅ Set isLive to false`);
      
      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 2: Set isLive to true to trigger the function
      console.log('\n📝 Step 2: Setting isLive to true (this triggers onGameLiveCloseBoardsAndRefund)...');
      await gameRef.update({
        isLive: true,
        is_live: true,
        status: 'in_progress',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   ✅ Set isLive to true`);
      console.log(`   ✅ Set status to 'in_progress'`);
      
      // Wait a moment for the function to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check board statuses
      console.log('\n📝 Step 3: Checking board statuses...');
      const boardsSnap = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .get();
      
      console.log(`\n📊 Board Status Summary:`);
      const statusCounts = {};
      boardsSnap.docs.forEach(doc => {
        const status = doc.data().status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} board(s)`);
      });
      
      // Show details of full/active boards
      const fullBoards = boardsSnap.docs.filter(doc => 
        doc.data().status === 'full' || doc.data().status === 'active'
      );
      
      if (fullBoards.length > 0) {
        console.log(`\n✅ Found ${fullBoards.length} full/active board(s):`);
        fullBoards.forEach(doc => {
          const data = doc.data();
          console.log(`   Board ${doc.id}: ${data.status} ($${data.amount})`);
        });
      }

      console.log(`\n✅ Trigger complete!`);
      console.log(`   The onGameLiveCloseBoardsAndRefund function should have processed the boards.`);
      console.log(`   Full boards should now be 'active' and unfilled boards should be 'unfilled'.`);
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  triggerGameLive();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}

