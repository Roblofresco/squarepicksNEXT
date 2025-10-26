const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';

async function resetExtraBoards() {
  try {
    console.log('🔄 Resetting extra boards (keeping only $5 per game)...\n');

    const games = await db.collection('games')
      .where('status', 'in', ['live', 'in_progress', 'scheduled'])
      .get();

    let keptCount = 0;
    let resetCount = 0;
    let squaresDeletedCount = 0;

    for (const gameDoc of games.docs) {
      const gameId = gameDoc.id;
      console.log(`Processing game ${gameId}...`);

      const fullBoards = await db.collection('boards')
        .where('gameID', '==', gameDoc.ref)
        .where('status', 'in', ['full', 'active'])
        .get();

      if (fullBoards.empty) {
        console.log('  No full boards found, skipping');
        continue;
      }

      // Find the $5 board to keep (fallback to $1)
      let keepBoard = null;
      
      for (const doc of fullBoards.docs) {
        if (doc.data().amount === 5) {
          keepBoard = doc;
          break;
        }
      }

      if (!keepBoard) {
        for (const doc of fullBoards.docs) {
          if (doc.data().amount === 1) {
            keepBoard = doc;
            break;
          }
        }
      }

      if (!keepBoard && fullBoards.size > 0) {
        keepBoard = fullBoards.docs[0];
      }

      console.log(`  Keeping board ${keepBoard.id} ($${keepBoard.data().amount})`);
      keptCount++;

      // Reset all other boards
      for (const boardDoc of fullBoards.docs) {
        if (boardDoc.id === keepBoard.id) continue;

        const boardId = boardDoc.id;
        const amount = boardDoc.data().amount;

        try {
          // Delete user's squares for this board
          const squaresToDelete = await db.collection('squares')
            .where('boardId', '==', boardId)
            .where('userID', '==', TEST_USER_ID)
            .get();

          const batch = db.batch();

          // Reset board
          batch.update(boardDoc.ref, {
            selected_indexes: [],
            status: 'open',
            updated_time: admin.firestore.FieldValue.serverTimestamp()
          });

          // Delete squares
          squaresToDelete.docs.forEach(doc => {
            batch.delete(doc.ref);
          });

          await batch.commit();

          console.log(`  ✅ Reset board ${boardId} ($${amount}), deleted ${squaresToDelete.size} squares`);
          resetCount++;
          squaresDeletedCount += squaresToDelete.size;

        } catch (error) {
          console.error(`  ❌ Error resetting board ${boardId}:`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Cleanup complete!`);
    console.log(`   ✅ Boards kept: ${keptCount}`);
    console.log(`   🔄 Boards reset: ${resetCount}`);
    console.log(`   🗑️  Squares deleted: ${squaresDeletedCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
    throw error;
  }
}

resetExtraBoards()
  .then(() => {
    console.log('\n✨ Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });

