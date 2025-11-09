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

  async function toggleIsOver() {
    try {
      const gameId = process.argv[2];
      
      if (!gameId) {
        console.error('❌ Please provide a game ID as argument');
        console.log('Usage: node toggle-game-isover.js <gameId>');
        process.exit(1);
      }
      
      console.log(`🔄 Toggling isOver for game: ${gameId}\n`);

      // Get game document
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      const gameData = gameDoc.data();
      
      console.log('📊 Current Game State:');
      console.log(`   Status: ${gameData.status || 'Unknown'}`);
      console.log(`   Quarter: ${gameData.quarter || 'Unknown'}`);
      console.log(`   isLive: ${gameData.isLive || false}`);
      console.log(`   isOver: ${gameData.isOver || false}`);
      console.log(`   Home Score: ${gameData.homeScore || 0}`);
      console.log(`   Away Score: ${gameData.awayScore || 0}\n`);

      // Check current board statuses
      console.log('📋 Current Board Statuses:');
      const boardsSnapshot = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .get();
      
      for (const boardDoc of boardsSnapshot.docs) {
        const boardData = boardDoc.data();
        console.log(`   Board ${boardDoc.id}: status="${boardData.status}"`);
      }
      console.log('');

      // Step 1: Set isOver to false
      console.log('⏸️  Step 1: Setting isOver to false...');
      await gameRef.update({
        isOver: false,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('   ✅ isOver set to false\n');

      // Wait a moment for Firestore to process
      console.log('⏳ Waiting 2 seconds for Firestore to process...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Set isOver back to true
      console.log('▶️  Step 2: Setting isOver back to true...');
      await gameRef.update({
        isOver: true,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('   ✅ isOver set to true\n');

      console.log('✅ Toggle complete! The onGameUpdatedAssignWinners function should now trigger.');
      console.log('   This should:');
      console.log('   1. Assign final winning square to game document');
      console.log('   2. Process final winners for all boards via assignWinnersForBoardPeriod');
      console.log('   3. Close boards (set status to "closed") during final processing\n');

      console.log('⏳ Waiting 5 seconds for functions to process...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check board statuses after processing
      console.log('\n📋 Board Statuses After Processing:');
      const boardsAfterSnapshot = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .get();
      
      for (const boardDoc of boardsAfterSnapshot.docs) {
        const boardData = boardDoc.data();
        const wasActive = boardDoc.data().status === 'active' || boardDoc.data().status === 'full';
        const isNowClosed = boardData.status === 'closed';
        console.log(`   Board ${boardDoc.id}: status="${boardData.status}" ${isNowClosed && wasActive ? '✅ (CLOSED)' : ''}`);
        
        if (boardData.winners && boardData.winners.final) {
          const finalWinner = boardData.winners.final;
          console.log(`      Final Winner: ${finalWinner.assigned ? '✅ Assigned' : '❌ Not assigned'}`);
          if (finalWinner.winningSquare) {
            console.log(`      Winning Square: ${finalWinner.winningSquare}`);
          }
        }
      }

      // Check game document for final winning square
      const gameAfterDoc = await gameRef.get();
      const gameAfterData = gameAfterDoc.data();
      console.log('\n🎯 Game Document Final Winning Square:');
      if (gameAfterData.finalWinningSquare) {
        console.log(`   ✅ finalWinningSquare: ${gameAfterData.finalWinningSquare}`);
      } else {
        console.log(`   ❌ finalWinningSquare: NOT ASSIGNED`);
      }
      
    } catch (error) {
      console.error('❌ Error toggling isOver:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  toggleIsOver();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}










