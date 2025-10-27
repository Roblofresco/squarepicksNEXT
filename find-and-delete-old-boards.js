const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
const userRef = db.doc(`users/${TEST_USER_ID}`);

async function findAndDeleteOldBoards() {
  try {
    console.log('🔍 Searching for old board documents...\n');

    // Pattern 1: Board with 8 squares showing indices 66, 25, 70, 47, 20, 88, 6, 80
    const pattern1Indices = [66, 25, 70, 47, 20, 88, 6, 80];

    // Pattern 2: Sweepstakes board with 1 square showing index 33
    const pattern2Indices = [33];

    // Pattern 3: Board with 5 squares showing indices 30, 77, 94, 55, 17
    const pattern3Indices = [30, 77, 94, 55, 17];

    // Pattern 4: Board with 2 squares showing indices 16, 43
    const pattern4Indices = [16, 43];

    console.log('Searching user squares...\n');
    const userSquares = await db.collection('squares')
      .where('userID', '==', userRef)
      .get();

    console.log(`Found ${userSquares.size} user squares\n`);

    // Group by board ID
    const boardSquareMap = new Map();
    userSquares.docs.forEach(doc => {
      const data = doc.data();
      const boardId = data.boardId;
      if (!boardSquareMap.has(boardId)) {
        boardSquareMap.set(boardId, []);
      }
      boardSquareMap.get(boardId).push({
        docId: doc.id,
        index: data.index
      });
    });

    console.log('Analyzing boards...\n');

    for (const [boardId, squares] of boardSquareMap.entries()) {
      const indices = squares.map(s => s.index).sort((a, b) => a - b);
      
      let match = false;
      let patternName = '';

      if (indices.length === 8 && indices.every((idx, i) => idx === pattern1Indices[i])) {
        match = true;
        patternName = 'Pattern 1 (8 squares: 66, 25, 70, 47, 20, 88, 6, 80)';
      } else if (indices.length === 1 && indices[0] === 33) {
        match = true;
        patternName = 'Pattern 2 (1 square: 33)';
      } else if (indices.length === 5 && indices.every((idx, i) => idx === pattern3Indices[i])) {
        match = true;
        patternName = 'Pattern 3 (5 squares: 30, 77, 94, 55, 17)';
      } else if (indices.length === 2 && indices.every((idx, i) => idx === pattern4Indices[i])) {
        match = true;
        patternName = 'Pattern 4 (2 squares: 16, 43)';
      }

      if (match) {
        console.log(`📌 Found matching board: ${boardId} (${patternName})`);
        console.log(`   Indices: ${indices.join(', ')}\n`);

        // Get board details
        const boardDoc = await db.doc(`boards/${boardId}`).get();
        if (boardDoc.exists) {
          const boardData = boardDoc.data();
          console.log(`   Status: ${boardData.status}`);
          console.log(`   Amount: $${boardData.amount}`);
          console.log(`   Squares: ${squares.length}\n`);
        }

        // Get win documents for this board
        const winDocs = await db.collection(`users/${TEST_USER_ID}/wins`)
          .where('boardId', '==', boardId)
          .get();

        console.log(`   Win documents: ${winDocs.size}`);
        winDocs.docs.forEach(winDoc => {
          console.log(`     - ${winDoc.id}: ${winDoc.data().period}`);
        });
        console.log('');

        // Ask for confirmation before deletion
        console.log(`🗑️  Ready to delete:`);
        console.log(`   - Board: ${boardId}`);
        console.log(`   - Squares: ${squares.length}`);
        console.log(`   - Win docs: ${winDocs.size}`);
        console.log('');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

findAndDeleteOldBoards()
  .then(() => {
    console.log('\n✨ Search completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

