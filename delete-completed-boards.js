const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
const userRef = db.doc(`users/${TEST_USER_ID}`);

async function deleteCompletedBoards() {
  try {
    console.log('🗑️  Deleting closed and unfilled boards...\n');

    // Get all user squares
    const squares = await db.collection('squares')
      .where('userID', '==', userRef)
      .get();

    console.log(`Found ${squares.size} user squares\n`);

    // Get unique board IDs
    const boardIds = new Set();
    squares.docs.forEach(doc => {
      boardIds.add(doc.data().boardId);
    });

    console.log(`Found ${boardIds.size} unique boards\n`);

    let deletedSquares = 0;
    let deletedBoards = 0;
    const boardsToDelete = [];

    // Check each board
    for (const boardId of boardIds) {
      const boardDoc = await db.doc(`boards/${boardId}`).get();
      
      if (boardDoc.exists) {
        const boardData = boardDoc.data();
        const status = boardData.status;
        
        if (status === 'closed' || status === 'unfilled' || status === 'settled') {
          boardsToDelete.push({ id: boardId, status });
        }
      }
    }

    console.log(`Boards to delete: ${boardsToDelete.length}\n`);

    for (const board of boardsToDelete) {
      console.log(`Processing board ${board.id} (${board.status})...`);
      
      // Get all squares for this board
      const boardSquares = await db.collection('squares')
        .where('boardId', '==', board.id)
        .get();
      
      const batch = db.batch();
      
      // Delete all squares
      boardSquares.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete board
      const boardRef = db.doc(`boards/${board.id}`);
      batch.delete(boardRef);
      
      await batch.commit();
      
      deletedSquares += boardSquares.size;
      deletedBoards++;
      console.log(`  ✅ Deleted board and ${boardSquares.size} squares`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Cleanup complete!`);
    console.log(`   🗑️  Boards deleted: ${deletedBoards}`);
    console.log(`   🗑️  Squares deleted: ${deletedSquares}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

deleteCompletedBoards()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

