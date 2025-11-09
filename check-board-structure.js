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

  async function checkBoardStructure() {
    try {
      const boardId = process.argv[2] || 'test-board-1761871705688';
      
      console.log(`Checking structure for board: ${boardId}\n`);

      const boardRef = db.collection('boards').doc(boardId);
      const boardDoc = await boardRef.get();
      
      if (!boardDoc.exists) {
        console.error(`❌ Board ${boardId} not found`);
        process.exit(1);
      }

      const boardData = boardDoc.data();
      
      console.log('📋 Board Data:');
      console.log(`   Status: ${boardData.status}`);
      console.log(`   Amount: $${boardData.amount || 0}`);
      console.log(`   Selected Indexes: ${(boardData.selected_indexes || []).length}/100`);
      console.log(`   Home Numbers: ${Array.isArray(boardData.home_numbers) ? boardData.home_numbers.length : 'Not set'}`);
      console.log(`   Away Numbers: ${Array.isArray(boardData.away_numbers) ? boardData.away_numbers.length : 'Not set'}`);
      console.log(`   Pot: $${boardData.pot || 0}`);
      console.log(`   Payout: ${JSON.stringify(boardData.payout || {})}\n`);

      // Check for squares with the final winning square (86)
      const gameRef = boardData.gameID;
      const gameDoc = await gameRef.get();
      const gameData = gameDoc.data();
      const finalWinningSquare = gameData.finalWinningSquare;
      
      if (finalWinningSquare) {
        console.log(`🎯 Game Final Winning Square: ${finalWinningSquare}`);
        console.log(`\n🔍 Checking for squares with value "${finalWinningSquare}":`);
        
        const squaresSnap = await db.collection('squares')
          .where('boardId', '==', boardId)
          .where('square', '==', finalWinningSquare)
          .get();
        
        console.log(`   Found ${squaresSnap.size} square(s) with value "${finalWinningSquare}"`);
        
        if (squaresSnap.size > 0) {
          squaresSnap.forEach((sqDoc) => {
            const sqData = sqDoc.data();
            console.log(`   Square ID: ${sqDoc.id}`);
            console.log(`      Index: ${sqData.index}`);
            console.log(`      Square: ${sqData.square}`);
            console.log(`      User ID: ${sqData.userID?.id || sqData.userID || 'Unknown'}`);
          });
        } else {
          console.log(`   ⚠️  No squares found with winning square "${finalWinningSquare}"`);
          console.log(`   This would cause assignWinnersForBoardPeriod to find 0 winners, but it should still process.`);
        }
      } else {
        console.log('   ❌ Game does not have finalWinningSquare set');
      }

      // Check total squares for this board
      const allSquaresSnap = await db.collection('squares')
        .where('boardId', '==', boardId)
        .get();
      
      console.log(`\n📊 Total squares for board: ${allSquaresSnap.size}`);
      
    } catch (error) {
      console.error('❌ Error checking board structure:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  checkBoardStructure();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}










