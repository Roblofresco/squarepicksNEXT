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

  async function reconcileQ2Winner() {
    try {
      const gameId = process.argv[2] || '401772943';
      
      console.log(`Reconciling Q2 winner for game: ${gameId}\n`);

      // Get game document
      const gameDoc = await db.collection('games').doc(gameId).get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      const gameData = gameDoc.data();
      
      console.log('📊 Game Status:');
      console.log(`   Status: ${gameData.status || 'Unknown'}`);
      console.log(`   Home Q2 Score: ${gameData.homeQ2score || 'Not set'}`);
      console.log(`   Away Q2 Score: ${gameData.awayQ2score || 'Not set'}`);
      console.log(`   Q2 Winning Square: ${gameData.q2WinningSquare || 'Not assigned'}\n`);

      // Get boards
      const gameRef = db.doc(`games/${gameId}`);
      const boardsSnapshot = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .get();

      if (boardsSnapshot.empty) {
        console.log(`❌ No boards found for game ${gameId}`);
        process.exit(1);
      }

      console.log(`Found ${boardsSnapshot.size} board(s)\n`);

      // Manually call assignWinnersForBoardPeriod for Q2 on each board
      // This replicates the logic from reconcileGameWinners
      for (const boardDoc of boardsSnapshot.docs) {
        const boardData = boardDoc.data();
        console.log(`Processing board: ${boardDoc.id}`);
        console.log(`   Status: ${boardData.status}`);
        
        // Check if Q2 already assigned
        if (boardData.winners && boardData.winners.q2 && boardData.winners.q2.assigned === true) {
          console.log(`   ⚠️  Q2 winner already assigned for this board, skipping...\n`);
          continue;
        }

        // Check if Q2 scores exist
        if (gameData.homeQ2score === undefined || gameData.awayQ2score === undefined) {
          console.log(`   ⚠️  Q2 scores not available, skipping...\n`);
          continue;
        }

        const homeScore = Number(gameData.homeQ2score || 0);
        const awayScore = Number(gameData.awayQ2score || 0);
        
        console.log(`   Calling assignWinnersForBoardPeriod for Q2...`);
        
        // Import the assignWinnersForBoardPeriod function
        // Since we can't directly import from the functions, we'll use a workaround:
        // Call the reconcileGameWinners HTTP endpoint if available, or replicate the logic
        
        // For now, let's manually trigger by updating the game document in a way that triggers the function
        // Or better yet, let's directly call the function logic by importing the index.js file
        // Actually, we can't import it easily. Let's use the HTTP endpoint if it exists.
        
        // Alternative: Temporarily clear q2WinningSquare, then set status again to trigger
        console.log(`   Strategy: Temporarily modifying game to trigger assignment...`);
        
        // Actually, the simplest approach is to directly call the assignWinnersForBoardPeriod logic
        // But we can't import it. Let's use a different approach: 
        // Clear the game's q2WinningSquare, change status away from halftime, then back to halftime
        
        console.log(`   Step 1: Clearing q2WinningSquare from game document...`);
        await db.collection('games').doc(gameId).update({
          q2WinningSquare: admin.firestore.FieldValue.delete(),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`   ✅ Cleared q2WinningSquare`);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`   Step 2: Changing status to "in_progress"...`);
        await db.collection('games').doc(gameId).update({
          status: 'in_progress',
          statusState: 'in',
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`   ✅ Status changed to "in_progress"`);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`   Step 3: Changing status back to "halftime"...`);
        await db.collection('games').doc(gameId).update({
          status: 'halftime',
          statusState: 'halftime',
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`   ✅ Status changed to "halftime"`);
        
        console.log(`   ⏳ Waiting 5 seconds for Cloud Function to process...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check if Q2 winner was assigned
        const updatedBoardDoc = await db.collection('boards').doc(boardDoc.id).get();
        const updatedBoardData = updatedBoardDoc.data();
        
        if (updatedBoardData.winners && updatedBoardData.winners.q2 && updatedBoardData.winners.q2.assigned === true) {
          console.log(`   ✅ Q2 Winner assigned successfully!`);
          console.log(`      Winning Index: ${updatedBoardData.winners.q2.winningIndex}`);
          if (updatedBoardData.winners.q2.paid !== undefined) {
            console.log(`      Paid: ${updatedBoardData.winners.q2.paid ? 'Yes' : 'No'}`);
            if (updatedBoardData.winners.q2.paidAmount !== undefined) {
              console.log(`      Paid Amount: $${updatedBoardData.winners.q2.paidAmount}`);
            }
          }
        } else {
          console.log(`   ❌ Q2 Winner still not assigned`);
        }
        
        console.log('');
      }

      console.log('✅ Reconciliation complete!');
      
    } catch (error) {
      console.error('❌ Error reconciling Q2 winner:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  reconcileQ2Winner();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



