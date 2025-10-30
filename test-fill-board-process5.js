const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();

// Board ID from browser console/URL
const BOARD_ID = '4MQZfMeUuxcD1mS6hpFd';
const GAME_ID = '401772766';

async function fillBoardForProcess5Test() {
  try {
    console.log('🎯 Testing Process 5: Board Full Transition');
    console.log(`📋 Board ID: ${BOARD_ID}`);
    console.log(`🎮 Game ID: ${GAME_ID}`);
    console.log('');

    // First, let's check the current state of the board
    console.log('📊 Checking current board state...');
    const boardDoc = await db.doc(`boards/${BOARD_ID}`).get();
    
    if (!boardDoc.exists) {
      throw new Error(`Board ${BOARD_ID} not found`);
    }

    const boardData = boardDoc.data();
    console.log(`   Current status: ${boardData.status}`);
    console.log(`   Current selected_indexes: ${boardData.selected_indexes?.length || 0} squares`);
    console.log(`   Board amount: $${boardData.amount}`);
    console.log('');

    // Create array of all 100 square indexes (0-99)
    const allIndexes = Array.from({ length: 100 }, (_, i) => i);
    
    console.log('🚀 Filling board to 100 squares...');
    console.log(`   Setting selected_indexes to: [0, 1, 2, ..., 99]`);
    
    // Update the board with all 100 squares selected
    await db.doc(`boards/${BOARD_ID}`).update({
      selected_indexes: allIndexes,
      updated_time: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Board updated successfully!');
    console.log('');
    console.log('🔄 The handleBoardFull Cloud Function should now trigger...');
    console.log('📝 Expected behavior:');
    console.log('   1. Board status changes from "open" to "full"');
    console.log('   2. Random axis numbers generated (home_numbers, away_numbers)');
    console.log('   3. All 100 square documents updated with calculated square values');
    console.log('   4. Notifications sent to all board participants');
    console.log('   5. New open board created for same game/amount');
    console.log('');
    console.log('🔍 Monitor Cloud Functions logs for handleBoardFull execution');
    console.log('🌐 Refresh the game page to see UI changes (orange ring, "FULL" badge)');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fillBoardForProcess5Test()
  .then(() => {
    console.log('\n✨ Process 5 test script completed');
    console.log('📋 Next steps:');
    console.log('   1. Check Cloud Functions logs for handleBoardFull trigger');
    console.log('   2. Verify board document updates in Firestore');
    console.log('   3. Check square documents for calculated square values');
    console.log('   4. Refresh browser to see UI changes');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
