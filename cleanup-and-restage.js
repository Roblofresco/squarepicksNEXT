const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
const KEEP_BOARD_ID = 'Q9fjPiu9K2IIvnjh2AMY'; // Test board from documentation

async function cleanupAndRestage() {
  try {
    console.log('🧹 Starting cleanup and restage process...\n');

    // Step 1: Delete all squares with string userID (bad data from test script)
    console.log('Step 1: Deleting squares with string userID...');
    const badSquares = await db.collection('squares')
      .where('userID', '==', TEST_USER_ID) // String comparison
      .get();
    
    console.log(`Found ${badSquares.size} squares with string userID to delete`);
    
    const deleteBatch1 = db.batch();
    let deleteCount = 0;
    badSquares.docs.forEach(doc => {
      deleteBatch1.delete(doc.ref);
      deleteCount++;
    });
    
    if (deleteCount > 0) {
      await deleteBatch1.commit();
      console.log(`✅ Deleted ${deleteCount} bad squares\n`);
    }

    // Step 2: Reset all full boards except the test board
    console.log('Step 2: Resetting full boards (except test board)...');
    const fullBoards = await db.collection('boards')
      .where('status', '==', 'full')
      .get();
    
    const resetBatch = db.batch();
    let resetCount = 0;
    
    for (const boardDoc of fullBoards.docs) {
      if (boardDoc.id === KEEP_BOARD_ID) {
        console.log(`  ⏭️  Keeping test board ${KEEP_BOARD_ID}`);
        continue;
      }
      
      resetBatch.update(boardDoc.ref, {
        selected_indexes: [],
        status: 'open',
        updated_time: admin.firestore.FieldValue.serverTimestamp()
      });
      resetCount++;
    }
    
    if (resetCount > 0) {
      await resetBatch.commit();
      console.log(`✅ Reset ${resetCount} boards to open status\n`);
    }

    // Step 3: Restage boards with correct structure (userID as DocumentReference)
    console.log('Step 3: Staging boards with correct userID structure...');
    
    const games = await db.collection('games')
      .where('status', 'in', ['live', 'in_progress', 'scheduled'])
      .get();
    
    console.log(`Found ${games.size} live/scheduled games\n`);
    
    const userRef = db.doc(`users/${TEST_USER_ID}`);
    let stagedCount = 0;
    
    for (const gameDoc of games.docs) {
      const gameId = gameDoc.id;
      const gameRef = gameDoc.ref;
      
      console.log(`Processing game ${gameId}...`);
      
      // Check if already has full board
      const fullCheck = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .where('status', '==', 'full')
        .limit(1)
        .get();
      
      if (!fullCheck.empty) {
        console.log(`  ⏭️  Game already has full board, skipping`);
        continue;
      }
      
      // Find $5 board
      const openBoards = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .where('status', '==', 'open')
        .get();
      
      if (openBoards.empty) {
        console.log(`  ⚠️  No open boards, skipping`);
        continue;
      }
      
      let selectedBoard = null;
      for (const doc of openBoards.docs) {
        if (doc.data().amount === 5) {
          selectedBoard = doc;
          break;
        }
      }
      
      if (!selectedBoard) {
        for (const doc of openBoards.docs) {
          if (doc.data().amount === 1) {
            selectedBoard = doc;
            break;
          }
        }
      }
      
      if (!selectedBoard) {
        selectedBoard = openBoards.docs[0];
      }
      
      const boardId = selectedBoard.id;
      const amount = selectedBoard.data().amount || 0;
      
      console.log(`  → Staging board ${boardId} ($${amount})`);
      
      // Create full array
      const allIndexes = Array.from({ length: 100 }, (_, i) => i);
      
      // Random 1-5 squares for user
      const numUserSquares = Math.floor(Math.random() * 5) + 1;
      const shuffled = [...allIndexes].sort(() => Math.random() - 0.5);
      const userSquareIndexes = shuffled.slice(0, numUserSquares);
      
      const batch = db.batch();
      
      // Update board
      batch.update(selectedBoard.ref, {
        selected_indexes: allIndexes,
        status: 'full',
        updated_time: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Create squares with CORRECT structure (userID as DocumentReference)
      // Note: square field will be calculated by handleBoardFull after axis numbers assigned
      for (const index of userSquareIndexes) {
        const squareRef = db.collection('squares').doc();
        batch.set(squareRef, {
          boardId: boardId,
          gameId: gameId,
          index: index,
          // Do NOT set square field yet - it needs home_numbers/away_numbers from board
          userID: userRef, // DocumentReference, not string!
          selected_time: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log(`  ✅ Staged with ${numUserSquares} user squares (userID as reference)`);
      stagedCount++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Cleanup and restage complete!`);
    console.log(`   🗑️  Bad squares deleted: ${deleteCount}`);
    console.log(`   🔄 Boards reset: ${resetCount}`);
    console.log(`   ✅ Boards staged: ${stagedCount}`);
    console.log(`   ✓ Test board preserved: ${KEEP_BOARD_ID}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

cleanupAndRestage()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

