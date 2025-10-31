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

  async function triggerQ2WinnerAssignment() {
    try {
      const gameId = process.argv[2] || '401772943';
      
      console.log(`Triggering Q2 winner assignment for game: ${gameId}\n`);

      // Get current game document
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      const gameData = gameDoc.data();
      
      console.log('📊 Current Game Status:');
      console.log(`   Status: ${gameData.status || 'Unknown'}`);
      console.log(`   Quarter: ${gameData.quarter || 'Unknown'}`);
      console.log(`   isLive: ${gameData.isLive || false}`);
      console.log(`   Home Q2 Score: ${gameData.homeQ2score || 'Not set'}`);
      console.log(`   Away Q2 Score: ${gameData.awayQ2score || 'Not set'}`);
      console.log(`   Q2 Winning Square: ${gameData.q2WinningSquare || 'Not assigned'}\n`);

      // Verify Q2 scores exist
      if (gameData.homeQ2score === undefined || gameData.awayQ2score === undefined) {
        console.error(`❌ Q2 scores are not set. Cannot trigger Q2 winner assignment.`);
        process.exit(1);
      }

      console.log('🔄 Step 1: Changing game status to "in_progress"...');
      await gameRef.update({
        status: 'in_progress',
        statusState: 'in',
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('   ✅ Status changed to "in_progress"\n');

      // Wait a moment for the update to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('🔄 Step 2: Changing game status to "halftime"...');
      await gameRef.update({
        status: 'halftime',
        statusState: 'halftime',
        quarter: 2, // Ensure quarter is set to 2
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('   ✅ Status changed to "halftime"\n');

      console.log('⏳ Waiting 3 seconds for trigger to process...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if Q2 winner was assigned
      const updatedGameDoc = await gameRef.get();
      const updatedGameData = updatedGameDoc.data();
      
      console.log('📊 Updated Game Status:');
      console.log(`   Status: ${updatedGameData.status || 'Unknown'}`);
      console.log(`   Q2 Winning Square: ${updatedGameData.q2WinningSquare || 'Not assigned'}\n`);

      // Check board
      const boardsSnapshot = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .where('status', 'in', ['active', 'full'])
        .get();

      console.log(`📋 Checking ${boardsSnapshot.size} board(s):\n`);
      
      for (const boardDoc of boardsSnapshot.docs) {
        const boardData = boardDoc.data();
        console.log(`   Board ID: ${boardDoc.id}`);
        console.log(`   Status: ${boardData.status}`);
        
        if (boardData.winners && boardData.winners.q2) {
          const q2Winner = boardData.winners.q2;
          console.log(`   ✅ Q2 Winner assigned: ${q2Winner.assigned ? 'Yes' : 'No'}`);
          if (q2Winner.winningIndex !== undefined) {
            console.log(`      Winning Index: ${q2Winner.winningIndex}`);
          }
          if (q2Winner.assignedAt) {
            console.log(`      Assigned At: ${q2Winner.assignedAt.toDate().toISOString()}`);
          }
          if (q2Winner.paid !== undefined) {
            console.log(`      Paid: ${q2Winner.paid ? 'Yes' : 'No'}`);
            if (q2Winner.paidAmount !== undefined) {
              console.log(`      Paid Amount: $${q2Winner.paidAmount}`);
            }
          }
        } else {
          console.log(`   ❌ Q2 Winner: NOT ASSIGNED`);
        }
        console.log('');
      }

      console.log('\n✅ Trigger sequence complete!');
      console.log('   The onGameUpdatedAssignWinners function should have processed Q2 winner assignment.');
      
    } catch (error) {
      console.error('❌ Error triggering Q2 winner assignment:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  triggerQ2WinnerAssignment();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



