const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();

const BOARD_ID = '4MQZfMeUuxcD1mS6hpFd';
const GAME_ID = '401772766';

async function verifyProcess5Results() {
  try {
    console.log('🔍 Verifying Process 5 Results...');
    console.log('');

    // Check board document
    console.log('📋 Checking board document...');
    const boardDoc = await db.doc(`boards/${BOARD_ID}`).get();
    const boardData = boardDoc.data();
    
    console.log(`   Status: ${boardData.status}`);
    console.log(`   Selected indexes: ${boardData.selected_indexes?.length} squares`);
    console.log(`   Home numbers: [${boardData.home_numbers?.join(', ')}]`);
    console.log(`   Away numbers: [${boardData.away_numbers?.join(', ')}]`);
    console.log(`   Amount: $${boardData.amount}`);
    console.log('');

    // Check a few square documents
    console.log('🎯 Checking square documents...');
    const squaresSnapshot = await db.collection('squares')
      .where('boardId', '==', BOARD_ID)
      .limit(5)
      .get();

    console.log(`   Found ${squaresSnapshot.size} squares (showing first 5):`);
    squaresSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   Square ${data.index}: value="${data.square}"`);
    });
    console.log('');

    // Check if new board was created
    console.log('🆕 Checking for new board creation...');
    const gameRef = db.doc(`games/${GAME_ID}`);
    const newBoardsSnapshot = await db.collection('boards')
      .where('gameID', '==', gameRef)
      .where('amount', '==', 5)
      .where('status', '==', 'open')
      .get();

    console.log(`   New $5 boards found: ${newBoardsSnapshot.size}`);
    if (newBoardsSnapshot.size > 0) {
      newBoardsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   New board ID: ${doc.id}, selected_indexes: ${data.selected_indexes?.length || 0}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

verifyProcess5Results()
  .then(() => {
    console.log('\n✅ Process 5 verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });
