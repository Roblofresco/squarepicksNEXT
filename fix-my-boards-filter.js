const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
const userRef = db.doc(`users/${TEST_USER_ID}`);

(async () => {
  console.log('Analyzing My Boards data...\n');
  
  // Get user squares
  const squares = await db.collection('squares')
    .where('userID', '==', userRef)
    .get();
  
  console.log(`User has ${squares.size} squares\n`);
  
  // Group by board
  const boardSquares = new Map();
  squares.docs.forEach(doc => {
    const data = doc.data();
    const boardId = data.boardId;
    if (!boardSquares.has(boardId)) {
      boardSquares.set(boardId, []);
    }
    boardSquares.get(boardId).push({
      index: data.index,
      gameId: data.gameId
    });
  });
  
  console.log(`User participates in ${boardSquares.size} different boards\n`);
  
  // Check boards
  for (const [boardId, squareList] of boardSquares.entries()) {
    const gameId = squareList[0].gameId;
    const boardDoc = await db.doc(`boards/${boardId}`).get();
    const gameDoc = await db.doc(`games/${gameId}`).get();
    
    if (boardDoc.exists && gameDoc.exists) {
      const boardData = boardDoc.data();
      const gameData = gameDoc.data();
      
      console.log(`Board: ${boardId}`);
      console.log(`  Status: ${boardData.status}`);
      console.log(`  Amount: $${boardData.amount}`);
      console.log(`  Game: ${gameData.awayTeam?.id || '?'} @ ${gameData.homeTeam?.id || '?'}`);
      console.log(`  Game Status: ${gameData.status}`);
      console.log(`  User Squares: ${squareList.length}`);
      console.log('');
    }
  }
  
  process.exit(0);
})();

