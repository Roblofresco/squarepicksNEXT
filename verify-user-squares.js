const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';

(async () => {
  const userRef = db.doc(`users/${TEST_USER_ID}`);
  
  const squares = await db.collection('squares')
    .where('userID', '==', userRef)
    .get();
  
  console.log(`\nTotal squares for user: ${squares.size}\n`);
  
  const boardGroups = new Map();
  
  squares.docs.forEach(doc => {
    const data = doc.data();
    const boardId = data.boardId;
    
    if (!boardGroups.has(boardId)) {
      boardGroups.set(boardId, []);
    }
    boardGroups.get(boardId).push(data.index);
  });
  
  console.log('Squares by board:\n');
  for (const [boardId, indexes] of boardGroups.entries()) {
    console.log(`Board ${boardId}: ${indexes.length} squares`);
    console.log(`  Indexes: ${indexes.sort((a, b) => a - b).join(', ')}\n`);
  }
  
  process.exit(0);
})();

