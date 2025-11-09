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

  async function checkBoardFinalStatus() {
    try {
      const gameId = process.argv[2] || '401772943';
      const boardId = process.argv[3] || 'test-board-1761871705688';
      
      console.log(`Checking final status for board: ${boardId}\n`);

      const boardRef = db.collection('boards').doc(boardId);
      const boardDoc = await boardRef.get();
      
      if (!boardDoc.exists) {
        console.error(`❌ Board ${boardId} not found`);
        process.exit(1);
      }

      const boardData = boardDoc.data();
      
      console.log('📋 Board Status:');
      console.log(`   Board ID: ${boardDoc.id}`);
      console.log(`   Status: ${boardData.status}`);
      console.log(`   Game ID: ${boardData.gameID?.id || boardData.gameID || 'Unknown'}\n`);

      console.log('🎯 Final Winner Status:');
      if (boardData.winners && boardData.winners.final) {
        const finalWinner = boardData.winners.final;
        console.log(`   assigned: ${finalWinner.assigned || false}`);
        console.log(`   paid: ${finalWinner.paid || false}`);
        console.log(`   winningIndex: ${finalWinner.winningIndex !== undefined ? finalWinner.winningIndex : 'Not set'}`);
        console.log(`   paidAmount: ${finalWinner.paidAmount !== undefined ? `$${finalWinner.paidAmount}` : 'Not set'}`);
        if (finalWinner.assignedAt) {
          console.log(`   assignedAt: ${finalWinner.assignedAt.toDate().toISOString()}`);
        }
      } else {
        console.log('   ❌ No final winner data found in board');
      }

      // Check public winner summary
      const winnerSummaryRef = db.collection('boards').doc(boardId)
        .collection('winners').doc('final');
      const winnerSummary = await winnerSummaryRef.get();
      
      console.log('\n📊 Public Winner Summary (boards/{boardId}/winners/final):');
      if (winnerSummary.exists) {
        const summaryData = winnerSummary.data();
        console.log(`   ✅ Exists`);
        console.log(`   Period: ${summaryData.period}`);
        console.log(`   Winning Square: ${summaryData.winningSquare}`);
        console.log(`   Winning Index: ${summaryData.winningIndex}`);
        console.log(`   Winner Count: ${summaryData.winnerCount}`);
        if (summaryData.assignedAt) {
          console.log(`   Assigned At: ${summaryData.assignedAt.toDate().toISOString()}`);
        }
      } else {
        console.log('   ❌ Not found');
      }

      // Check game document
      console.log('\n🎮 Game Document:');
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();
      
      if (gameDoc.exists) {
        const gameData = gameDoc.data();
        console.log(`   isOver: ${gameData.isOver || false}`);
        console.log(`   status: ${gameData.status || 'Unknown'}`);
        console.log(`   finalWinningSquare: ${gameData.finalWinningSquare || 'Not set'}`);
        console.log(`   homeScore: ${gameData.homeScore || 0}`);
        console.log(`   awayScore: ${gameData.awayScore || 0}`);
      }
      
    } catch (error) {
      console.error('❌ Error checking board final status:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  checkBoardFinalStatus();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}










