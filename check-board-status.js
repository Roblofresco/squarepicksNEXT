const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();

const BOARD_ID = 'oDaiUQNZzvWXcKRAOvxF'; // Cardinals board

async function checkBoardStatus() {
  try {
    console.log('🔍 Checking Cardinals board status...');
    
    const boardDoc = await db.doc(`boards/${BOARD_ID}`).get();
    
    if (!boardDoc.exists) {
      console.log('❌ Board not found');
      return;
    }

    const boardData = boardDoc.data();
    console.log(`📋 Board ID: ${BOARD_ID}`);
    console.log(`📊 Status: "${boardData.status}"`);
    console.log(`📊 Status type: ${typeof boardData.status}`);
    console.log(`📊 Status length: ${boardData.status?.length}`);
    console.log(`📊 Selected indexes: ${boardData.selected_indexes?.length || 0}`);
    console.log(`📊 Amount: $${boardData.amount}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBoardStatus()
  .then(() => {
    console.log('\n✨ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  });
