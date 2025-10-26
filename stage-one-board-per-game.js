const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'square-picks-vpbb8d'
  });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';

async function stageOneBoardPerGame() {
  try {
    console.log('🚀 Starting selective board staging (one board per game)...\n');

    // Query all live and scheduled games
    const gamesSnapshot = await db.collection('games')
      .where('status', 'in', ['live', 'in_progress', 'scheduled'])
      .get();

    if (gamesSnapshot.empty) {
      console.log('❌ No live or scheduled games found.');
      return;
    }

    console.log(`📋 Found ${gamesSnapshot.size} live/scheduled games\n`);

    let stagedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each game
    for (const gameDoc of gamesSnapshot.docs) {
      const gameId = gameDoc.id;
      const gameData = gameDoc.data();
      const gameRef = gameDoc.ref;

      console.log(`Processing game ${gameId} (${gameData.status})...`);

      try {
        // Check if game already has a full board
        const fullBoardsSnap = await db.collection('boards')
          .where('gameID', '==', gameRef)
          .where('status', 'in', ['full', 'active'])
          .limit(1)
          .get();

        if (!fullBoardsSnap.empty) {
          console.log(`  ⏭️  Game already has a full/active board, skipping`);
          skippedCount++;
          continue;
        }

        // Find open boards for this game
        const openBoardsSnap = await db.collection('boards')
          .where('gameID', '==', gameRef)
          .where('status', '==', 'open')
          .get();

        if (openBoardsSnap.empty) {
          console.log(`  ⚠️  No open boards found for this game, skipping`);
          skippedCount++;
          continue;
        }

        // Select one board: prefer $5, fallback to $1, then any
        let selectedBoard = null;
        
        // Try to find $5 board
        for (const doc of openBoardsSnap.docs) {
          if (doc.data().amount === 5) {
            selectedBoard = doc;
            break;
          }
        }

        // Fallback to $1 board
        if (!selectedBoard) {
          for (const doc of openBoardsSnap.docs) {
            if (doc.data().amount === 1) {
              selectedBoard = doc;
              break;
            }
          }
        }

        // Fallback to any board
        if (!selectedBoard && openBoardsSnap.size > 0) {
          selectedBoard = openBoardsSnap.docs[0];
        }

        if (!selectedBoard) {
          console.log(`  ⚠️  No suitable board found, skipping`);
          skippedCount++;
          continue;
        }

        const boardId = selectedBoard.id;
        const boardAmount = selectedBoard.data().amount || 0;

        console.log(`  → Selected board ${boardId} ($${boardAmount})`);

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
        batch.update(selectedBoard.ref, {
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

        console.log(`  ✅ Staged board with ${numUserSquares} user squares`);
        stagedCount++;

      } catch (error) {
        console.error(`  ❌ Error staging board for game ${gameId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Selective board staging complete!`);
    console.log(`   ✅ Boards staged: ${stagedCount}`);
    console.log(`   ⏭️  Games skipped: ${skippedCount}`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error during selective board staging:', error);
    throw error;
  }
}

// Run the function
stageOneBoardPerGame()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

