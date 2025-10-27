const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
const userRef = db.doc(`users/${TEST_USER_ID}`);

async function findOldBoardsByPattern() {
  try {
    console.log('🔍 Finding old boards by square patterns...\n');

    // Get all user squares
    const allSquares = await db.collection('squares')
      .where('userID', '==', userRef)
      .get();

    console.log(`Total user squares: ${allSquares.size}\n`);

    // Group by board and find patterns
    const boardMap = new Map();
    
    allSquares.docs.forEach(doc => {
      const data = doc.data();
      const boardId = data.boardId;
      const index = data.index;
      
      if (!boardMap.has(boardId)) {
        boardMap.set(boardId, {
          indices: [],
          squares: [],
          gameId: data.gameId
        });
      }
      
      boardMap.get(boardId).indices.push(index);
      boardMap.get(boardId).squares.push({
        docId: doc.id,
        index: index,
        square: data.square || '?'
      });
    });

    // Target patterns from the 4 square cards
    const targetPatterns = [
      { name: 'Pattern 1: 8 squares', indices: [66, 25, 70, 47, 20, 88, 6, 80] },
      { name: 'Pattern 2: 1 square (33)', indices: [33] },
      { name: 'Pattern 3: 5 squares', indices: [30, 77, 94, 55, 17] },
      { name: 'Pattern 4: 2 squares', indices: [16, 43] }
    ];

    console.log('Matching boards to patterns:\n');

    for (const [boardId, boardData] of boardMap.entries()) {
      const sortedIndices = [...boardData.indices].sort((a, b) => a - b);
      
      for (const pattern of targetPatterns) {
        const sortedPattern = [...pattern.indices].sort((a, b) => a - b);
        
        if (sortedIndices.length === sortedPattern.length && 
            sortedIndices.every((val, i) => val === sortedPattern[i])) {
          
          console.log(`✓ Match: ${pattern.name}`);
          console.log(`  Board ID: ${boardId}`);
          console.log(`  Game ID: ${boardData.gameId}`);
          console.log(`  Indices: [${sortedIndices.join(', ')}]`);
          console.log(`  Squares: [${boardData.squares.map(s => s.square).join(', ')}]`);
          
          // Get board details
          const boardDoc = await db.doc(`boards/${boardId}`).get();
          if (boardDoc.exists) {
            const bd = boardDoc.data();
            console.log(`  Status: ${bd.status}`);
            console.log(`  Amount: $${bd.amount}`);
            
            // Get game details
            if (bd.gameID) {
              const gameDoc = await bd.gameID.get();
              if (gameDoc.exists) {
                const gd = gameDoc.data();
                console.log(`  Game Status: ${gd.status}`);
                console.log(`  Teams: ${gd.awayTeam?.id || '?'} @ ${gd.homeTeam?.id || '?'}`);
              }
            }
          }
          
          // Get win documents
          const winDocs = await db.collection(`users/${TEST_USER_ID}/wins`)
            .where('boardId', '==', boardId)
            .get();
          
          console.log(`  Win docs: ${winDocs.size}`);
          winDocs.docs.forEach(wd => {
            console.log(`    - ${wd.id} (${wd.data().period})`);
          });
          
          console.log('');
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

findOldBoardsByPattern()
  .then(() => {
    console.log('\n✨ Search completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

