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

  async function checkQ1WinnerAssignment() {
    try {
      const gameId = process.argv[2] || '401772943'; // Default to live game
      
      console.log(`Checking Q1 winner assignment for game: ${gameId}\n`);

      // Get game document
      const gameDoc = await db.collection('games').doc(gameId).get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      const gameData = gameDoc.data();
      
      console.log('📊 Game Status:');
      console.log(`   Status: ${gameData.status || 'Unknown'}`);
      console.log(`   Quarter: ${gameData.quarter || 'Unknown'}`);
      console.log(`   isLive: ${gameData.isLive || false}`);
      console.log(`   isOver: ${gameData.isOver || false}`);
      console.log(`   Home Score: ${gameData.homeScore || 0}`);
      console.log(`   Away Score: ${gameData.awayScore || 0}`);
      console.log(`   Home Q1 Score: ${gameData.homeQ1score || 'Not set'}`);
      console.log(`   Away Q1 Score: ${gameData.awayQ1score || 'Not set'}`);
      console.log(`   Home Q2 Score: ${gameData.homeQ2score || 'Not set'}`);
      console.log(`   Away Q2 Score: ${gameData.awayQ2score || 'Not set'}\n`);

      // Check for Q1 winning square
      console.log('🎯 Q1 Winner Assignment:');
      const q1WinningSquare = gameData.q1WinningSquare;
      if (q1WinningSquare) {
        console.log(`   ✅ Q1 Winning Square: ${q1WinningSquare}`);
      } else {
        console.log(`   ❌ Q1 Winning Square: NOT ASSIGNED`);
      }

      // Calculate what Q1 winning square should be
      if (gameData.homeQ1score !== undefined && gameData.awayQ1score !== undefined) {
        const homeLast = gameData.homeQ1score % 10;
        const awayLast = gameData.awayQ1score % 10;
        const calculatedSquare = `${awayLast}${homeLast}`;
        console.log(`   📐 Calculated from Q1 scores: ${calculatedSquare}`);
        console.log(`      (Away: ${gameData.awayQ1score} → last digit ${awayLast}, Home: ${gameData.homeQ1score} → last digit ${homeLast})`);
      }

      // Check boards for this game
      console.log('\n📋 Checking Boards:');
      const gameRef = db.doc(`games/${gameId}`);
      const boardsSnapshot = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .where('status', 'in', ['active', 'full'])
        .get();

      console.log(`   Found ${boardsSnapshot.size} active/full board(s)\n`);

      for (const boardDoc of boardsSnapshot.docs) {
        const boardData = boardDoc.data();
        console.log(`   Board ID: ${boardDoc.id}`);
        console.log(`   Status: ${boardData.status}`);
        console.log(`   Amount: $${boardData.amount || 'Unknown'}`);
        
        if (boardData.winners && boardData.winners.q1) {
          const q1Winner = boardData.winners.q1;
          console.log(`   ✅ Q1 Winner assigned: ${q1Winner.assigned ? 'Yes' : 'No'}`);
          if (q1Winner.winningIndex !== undefined) {
            console.log(`      Winning Index: ${q1Winner.winningIndex}`);
          }
          if (q1Winner.assignedAt) {
            console.log(`      Assigned At: ${q1Winner.assignedAt.toDate().toISOString()}`);
          }
        } else {
          console.log(`   ❌ Q1 Winner: NOT ASSIGNED in board metadata`);
        }

        // Check for public winner summary
        const winnerSummaryRef = db.collection('boards').doc(boardDoc.id)
          .collection('winners').doc('Q1');
        const winnerSummary = await winnerSummaryRef.get();
        
        if (winnerSummary.exists) {
          const summaryData = winnerSummary.data();
          console.log(`   ✅ Public Winner Summary exists:`);
          console.log(`      Period: ${summaryData.period}`);
          console.log(`      Winning Square: ${summaryData.winningSquare}`);
          console.log(`      Winning Index: ${summaryData.winningIndex}`);
          console.log(`      Winner Count: ${summaryData.winnerCount}`);
        } else {
          console.log(`   ❌ Public Winner Summary: NOT FOUND`);
        }
        
        console.log('');
      }

      // Summary
      console.log('\n📝 Summary:');
      if (q1WinningSquare) {
        console.log(`   ✅ Q1 winning square is assigned: ${q1WinningSquare}`);
      } else {
        console.log(`   ❌ Q1 winning square is NOT assigned`);
        if (gameData.quarter >= 2) {
          console.log(`   ⚠️  Q2 has begun (quarter: ${gameData.quarter}) but Q1 winner not assigned!`);
        }
        if (gameData.homeQ1score !== undefined && gameData.awayQ1score !== undefined) {
          console.log(`   ⚠️  Q1 scores exist but winner not calculated`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error checking Q1 winner:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  checkQ1WinnerAssignment();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



