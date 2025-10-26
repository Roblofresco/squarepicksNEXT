const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'square-picks-vpbb8d'
  });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';

async function stageBoardsForTesting() {
  try {
    console.log('🚀 Starting board staging for live testing...\n');

    // Query all open boards
    const boardsSnapshot = await db.collection('boards')
      .where('status', '==', 'open')
      .get();

    if (boardsSnapshot.empty) {
      console.log('❌ No open boards found to stage.');
      return;
    }

    console.log(`📋 Found ${boardsSnapshot.size} open boards to stage\n`);

    let successCount = 0;
    let errorCount = 0;

    // Process each board
    for (const boardDoc of boardsSnapshot.docs) {
      const boardId = boardDoc.id;
      const boardData = boardDoc.data();

      try {
        // Extract gameId from reference
        let gameId;
        if (boardData.gameID && boardData.gameID._path) {
          gameId = boardData.gameID._path.segments[1];
        } else if (boardData.gameID && boardData.gameID.path) {
          const pathParts = boardData.gameID.path.split('/');
          gameId = pathParts[pathParts.length - 1];
        } else {
          console.log(`⚠️  Skipping board ${boardId} - cannot extract gameId`);
          continue;
        }

        console.log(`Processing board ${boardId} for game ${gameId}...`);

        // Create full array of 100 indexes
        const allIndexes = Array.from({ length: 100 }, (_, i) => i);

        // Generate random number of squares (1-5) for test user
        const numUserSquares = Math.floor(Math.random() * 5) + 1;
        
        // Randomly select indexes for user
        const shuffled = [...allIndexes].sort(() => Math.random() - 0.5);
        const userSquareIndexes = shuffled.slice(0, numUserSquares);

        // Use batch for atomic operations
        const batch = db.batch();

        // Update board: fill selected_indexes and set status to full
        batch.update(boardDoc.ref, {
          selected_indexes: allIndexes,
          status: 'full',
          updated_time: admin.firestore.FieldValue.serverTimestamp()
        });

        // Create square documents for user's squares
        for (const index of userSquareIndexes) {
          const squareRef = db.collection('squares').doc();
          batch.set(squareRef, {
            boardId: boardId,
            gameId: gameId,
            index: index,
            square: String(index).padStart(2, '0'),
            userID: TEST_USER_ID,
            created_time: admin.firestore.FieldValue.serverTimestamp()
          });
        }

        // Commit batch
        await batch.commit();

        console.log(`  ✅ Staged board ${boardId}: ${numUserSquares} user squares created`);
        successCount++;

      } catch (error) {
        console.error(`  ❌ Error staging board ${boardId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Board staging complete!`);
    console.log(`   ✅ Successfully staged: ${successCount} boards`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount} boards`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error during board staging:', error);
    throw error;
  }
}

// Run the function
stageBoardsForTesting()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

