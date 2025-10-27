const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_GAME_ID = 'rFHzEnkCVIyzxKzDjIv1';
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
const userRef = db.doc(`users/${TEST_USER_ID}`);

async function restageTampaTestBoard() {
  try {
    console.log('🔄 Restaging Tampa Bay vs New Orleans test board...\n');

    // Step 1: Reset game document
    console.log('📝 Step 1: Resetting game document...');
    const gameRef = db.doc(`games/${TEST_GAME_ID}`);
    const gameDoc = await gameRef.get();
    
    if (!gameDoc.exists) {
      console.error('❌ Test game not found:', TEST_GAME_ID);
      process.exit(1);
    }

    const gameData = gameDoc.data();
    console.log('✅ Found game:', gameData.homeTeam?.id || '?', 'vs', gameData.awayTeam?.id || '?');

    // Delete fields and reset status
    const updates = {
      status: 'scheduled',
      isLive: false,
      isOver: false,
      homeScore: 0,
      awayScore: 0,
      quarter: 0,
      timeRemaining: null,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    };

    await gameRef.update(updates);
    console.log('✅ Game status reset to scheduled');

    // Delete quarter scores and winning squares
    const deletions = [
      'homeQ1score',
      'awayQ1score',
      'homeQ2score',
      'awayQ2score',
      'homeQ3score',
      'awayQ3score',
      'homeFscore',
      'awayFscore',
      'q1WinningSquare',
      'q2WinningSquare',
      'q3WinningSquare',
      'finalWinningSquare',
    ];

    const deleteBatch = db.batch();
    for (const field of deletions) {
      deleteBatch.update(gameRef, {
        [field]: admin.firestore.FieldValue.delete()
      });
    }
    await deleteBatch.commit();
    console.log('✅ Deleted quarter scores and winning squares');

    // Step 2: Find and reset board
    console.log('\n📝 Step 2: Finding and resetting $1 board...');
    const gameDocRef = db.doc(`games/${TEST_GAME_ID}`);
    
    const boardsSnapshot = await db.collection('boards')
      .where('gameID', '==', gameDocRef)
      .where('amount', '==', 1)
      .limit(1)
      .get();

    if (boardsSnapshot.empty) {
      console.error('❌ $1 board not found for test game');
      process.exit(1);
    }

    const boardDoc = boardsSnapshot.docs[0];
    const boardData = boardDoc.data();
    const boardId = boardDoc.id;
    
    console.log('✅ Found board:', boardId);
    console.log('   Current status:', boardData.status);

    // Assign random home and away numbers if missing
    const homeNumbers = boardData.home_numbers || Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));
    const awayNumbers = boardData.away_numbers || Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));

    // Update board to full state
    await boardDoc.ref.update({
      status: 'full',
      selected_indexes: Array.from({ length: 100 }, (_, i) => i),
      home_numbers: homeNumbers,
      away_numbers: awayNumbers,
      updated_time: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Board reset to full state with axis numbers');

    // Step 3: Delete existing user squares
    console.log('\n📝 Step 3: Deleting existing user squares...');
    const existingSquares = await db.collection('squares')
      .where('userID', '==', userRef)
      .where('boardId', '==', boardId)
      .get();

    if (!existingSquares.empty) {
      const deleteBatch = db.batch();
      existingSquares.docs.forEach(doc => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();
      console.log(`✅ Deleted ${existingSquares.size} existing user squares`);
    } else {
      console.log('ℹ️  No existing user squares to delete');
    }

    // Step 4: Delete win documents
    console.log('\n📝 Step 4: Deleting win documents...');
    const winsSnapshot = await db.collection(`users/${TEST_USER_ID}/wins`).get();
    
    if (!winsSnapshot.empty) {
      const deleteBatch = db.batch();
      winsSnapshot.docs.forEach(doc => {
        if (doc.data().boardId === boardId) {
          deleteBatch.delete(doc.ref);
        }
      });
      await deleteBatch.commit();
      console.log('✅ Deleted existing win documents for this board');
    } else {
      console.log('ℹ️  No existing win documents');
    }

    // Step 5: Create new user squares
    console.log('\n📝 Step 5: Creating new user squares...');
    
    // Generate 5 random square indices
    const randomIndices = [];
    const usedIndices = new Set();
    while (randomIndices.length < 5) {
      const idx = Math.floor(Math.random() * 100);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        randomIndices.push(idx);
      }
    }
    randomIndices.sort((a, b) => a - b);

    console.log('   Selected indices:', randomIndices);

    // Calculate square value from index
    const getSquareFromIndex = (index) => {
      const row = Math.floor(index / 10);
      const col = index % 10;
      return `${awayNumbers[col]}${homeNumbers[row]}`;
    };

    // Create square documents
    const createBatch = db.batch();
    randomIndices.forEach(index => {
      const squareRef = db.collection('squares').doc();
      const square = getSquareFromIndex(index);
      
      createBatch.set(squareRef, {
        userID: userRef,
        boardId: boardId,
        gameId: TEST_GAME_ID,
        index: index,
        square: square,
        selected_time: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await createBatch.commit();
    console.log(`✅ Created 5 new user squares`);
    console.log('   Indices:', randomIndices);
    console.log('   Squares:', randomIndices.map(idx => getSquareFromIndex(idx)));

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Restaging complete!');
    console.log('='.repeat(60));
    console.log(`Game: ${gameData.homeTeam?.id || '?'} vs ${gameData.awayTeam?.id || '?'}`);
    console.log(`Game ID: ${TEST_GAME_ID}`);
    console.log(`Game Status: scheduled`);
    console.log(`Board ID: ${boardId}`);
    console.log(`Board Status: full`);
    console.log(`User Squares: 5 random squares`);
    console.log('='.repeat(60));
    console.log('\n✨ Test board ready for live update testing!');
    console.log('   The board will transition from "full" → "active" when game goes live.');
    console.log('   Winner assignment will occur at each quarter transition.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error restaging test board:', error);
    throw error;
  }
}

restageTampaTestBoard()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

