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

  async function setupBoardsForLiveGame() {
    try {
      const gameId = process.argv[2] || '401772818';
      
      console.log(`🔧 Setting up boards for game ${gameId}...\n`);

      // Get game reference
      const gameRef = db.doc(`games/${gameId}`);
      const gameDoc = await gameRef.get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      const gameData = gameDoc.data();
      console.log(`✅ Game ${gameId} found`);
      console.log(`   Current Status: ${gameData.status}`);
      console.log(`   Current Is Live: ${gameData.isLive || gameData.is_live || false}`);
      console.log('');

      // Find all boards with this game
      const boardsSnap = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .get();
      
      if (boardsSnap.empty) {
        console.log(`ℹ️  No boards found for game ${gameId}`);
        process.exit(0);
      }

      console.log(`Found ${boardsSnap.size} board(s) for game ${gameId}:\n`);

      // Create array of all 100 square indexes (0-99)
      const allIndexes = Array.from({ length: 100 }, (_, i) => i);

      let updatedCount = 0;

      // Step 1: Update all boards to open status and add selected_indexes
      console.log('📝 Step 1: Setting boards to "open" and adding selected_indexes 0-99...\n');
      
      for (const boardDoc of boardsSnap.docs) {
        const boardData = boardDoc.data();
        const currentStatus = boardData.status;
        const currentIndexes = boardData.selected_indexes || [];
        
        console.log(`📋 Board: ${boardDoc.id}`);
        console.log(`   Current status: ${currentStatus}`);
        console.log(`   Current selected_indexes: ${currentIndexes.length} squares`);
        console.log(`   Amount: $${boardData.amount}`);
        
        // Update board with all 100 squares and set status to open
        await boardDoc.ref.update({
          status: 'open',
          selected_indexes: allIndexes,
          updated_time: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`   ✅ Updated: status → open, selected_indexes → [0-99] (100 squares)\n`);
        updatedCount++;
      }

      console.log(`✅ Step 1 Complete: ${updatedCount} board(s) updated\n`);

      // Step 2: Toggle game isLive from false to true to trigger the function
      console.log('📝 Step 2: Toggling game isLive (false → true)...\n');
      
      // First set to false
      await gameRef.update({
        isLive: false,
        is_live: false,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`   ✅ Set isLive to false`);
      
      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then set back to true to trigger the function
      await gameRef.update({
        isLive: true,
        is_live: true,
        status: 'in_progress',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`   ✅ Set isLive back to true`);
      console.log(`✅ Step 2 Complete: Game ${gameId} isLive toggled (false → true)`);
      console.log(`   This should trigger onGameLiveCloseBoardsAndRefund function`);
      console.log(`   Boards should transition from "open" to "active"\n`);

      // Summary
      console.log(`📊 Summary:`);
      console.log(`   Game ID: ${gameId}`);
      console.log(`   Boards updated: ${updatedCount}`);
      console.log(`   All boards set to: open`);
      console.log(`   All boards have: selected_indexes [0-99] (100 squares)`);
      console.log(`   Game isLive: true`);
      console.log(`\n✅ Setup complete!`);
      console.log(`   The Cloud Functions should now process the boards.`);
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  setupBoardsForLiveGame();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}

