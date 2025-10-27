const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
const userRef = db.doc(`users/${TEST_USER_ID}`);

// Board IDs to delete (from the 4 matching patterns)
const boardIdsToDelete = [
  'cekFVppdsCmWj3yntq9Y',  // Pattern 1: 8 squares [6, 20, 25, 47, 66, 70, 80, 88]
  'nvvDMkAIAPDJHaeMpqWN',  // Pattern 2: 1 square [33] - Sweepstakes
  'Un2l0MuJ2t2n8ciFVHLa',  // Pattern 4: 2 squares [16, 43]
  // NOTE: 5vwtRUIyfogeUrYqE8CT (Pattern 3) should be kept for testing
];

async function deleteOldBoardDocuments() {
  try {
    console.log('🗑️  Deleting old board documents...\n');

    let deletedBoards = 0;
    let deletedSquares = 0;
    let deletedWinDocs = 0;

    for (const boardId of boardIdsToDelete) {
      console.log(`Processing board: ${boardId}...`);

      try {
        // Get board
        const boardDoc = await db.doc(`boards/${boardId}`).get();
        
        if (!boardDoc.exists) {
          console.log(`  ⚠️  Board ${boardId} not found, skipping`);
          continue;
        }

        const boardData = boardDoc.data();
        console.log(`  Status: ${boardData.status}`);
        console.log(`  Amount: $${boardData.amount}`);

        // Get all squares for this board
        const squaresSnapshot = await db.collection('squares')
          .where('boardId', '==', boardId)
          .get();

        console.log(`  Found ${squaresSnapshot.size} squares to delete`);

        // Get win documents for this board
        const winDocsSnapshot = await db.collection(`users/${TEST_USER_ID}/wins`)
          .where('boardId', '==', boardId)
          .get();

        console.log(`  Found ${winDocsSnapshot.size} win documents to delete`);

        const batch = db.batch();

        // Delete squares
        squaresSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        // Delete win documents
        winDocsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        // Delete board
        batch.delete(boardDoc.ref);

        await batch.commit();

        console.log(`  ✅ Deleted board, ${squaresSnapshot.size} squares, ${winDocsSnapshot.size} win docs\n`);
        
        deletedBoards++;
        deletedSquares += squaresSnapshot.size;
        deletedWinDocs += winDocsSnapshot.size;

      } catch (error) {
        console.error(`  ❌ Error deleting board ${boardId}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Cleanup complete!`);
    console.log(`   🗑️  Boards deleted: ${deletedBoards}`);
    console.log(`   🗑️  Squares deleted: ${deletedSquares}`);
    console.log(`   🗑️  Win docs deleted: ${deletedWinDocs}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

deleteOldBoardDocuments()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

