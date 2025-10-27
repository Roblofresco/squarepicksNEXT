const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_GAME_ID = 'rFHzEnkCVIyzxKzDjIv1';
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';

async function verifyRestage() {
  try {
    console.log('🔍 Verifying restaged test setup...\n');

    // Verify game state
    console.log('📝 Step 1: Verifying game state...');
    const gameDoc = await db.doc(`games/${TEST_GAME_ID}`).get();
    
    if (!gameDoc.exists) {
      console.error('❌ Game not found');
      process.exit(1);
    }

    const gameData = gameDoc.data();
    console.log('✅ Game found:', gameData.homeTeam?.id || '?', 'vs', gameData.awayTeam?.id || '?');
    console.log('   Status:', gameData.status);
    console.log('   isLive:', gameData.isLive);
    console.log('   isOver:', gameData.isOver);
    console.log('   Quarter:', gameData.quarter);
    console.log('   Home Score:', gameData.homeScore);
    console.log('   Away Score:', gameData.awayScore);
    console.log('   Has Q1 scores:', !!(gameData.homeQ1score !== undefined));
    console.log('   Has winning squares:', !!(gameData.q1WinningSquare));

    // Verify board state
    console.log('\n📝 Step 2: Verifying board state...');
    const boardsSnapshot = await db.collection('boards')
      .where('gameID', '==', db.doc(`games/${TEST_GAME_ID}`))
      .where('amount', '==', 1)
      .limit(1)
      .get();

    if (boardsSnapshot.empty) {
      console.error('❌ Board not found');
      process.exit(1);
    }

    const boardDoc = boardsSnapshot.docs[0];
    const boardData = boardDoc.data();
    const boardId = boardDoc.id;

    console.log('✅ Board found:', boardId);
    console.log('   Status:', boardData.status);
    console.log('   Selected indexes:', boardData.selected_indexes?.length || 0);
    console.log('   Home numbers:', boardData.home_numbers ? '✅ Assigned' : '❌ Missing');
    console.log('   Away numbers:', boardData.away_numbers ? '✅ Assigned' : '❌ Missing');

    // Verify user squares
    console.log('\n📝 Step 3: Verifying user squares...');
    const userRef = db.doc(`users/${TEST_USER_ID}`);
    const userSquares = await db.collection('squares')
      .where('userID', '==', userRef)
      .where('boardId', '==', boardId)
      .get();

    console.log('✅ User squares found:', userSquares.size);
    
    if (!userSquares.empty) {
      userSquares.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - Index: ${data.index}, Square: ${data.square}, Square ID: ${doc.id}`);
      });
    }

    // Verify no win documents
    console.log('\n📝 Step 4: Verifying win documents...');
    const winsSnapshot = await db.collection(`users/${TEST_USER_ID}/wins`)
      .where('boardId', '==', boardId)
      .get();

    console.log('✅ Win documents found:', winsSnapshot.size);
    if (!winsSnapshot.empty) {
      console.warn('⚠️  Warning: Found win documents (should be 0)');
      winsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.period}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Verification complete!');
    console.log('='.repeat(60));
    console.log('Game Status:', gameData.status === 'scheduled' ? '✅ scheduled' : '❌ not scheduled');
    console.log('Board Status:', boardData.status === 'full' ? '✅ full' : '❌ not full');
    console.log('Board has 100 indexes:', boardData.selected_indexes?.length === 100 ? '✅ yes' : '❌ no');
    console.log('Board has axis numbers:', boardData.home_numbers && boardData.away_numbers ? '✅ yes' : '❌ no');
    console.log('User squares created:', userSquares.size > 0 ? `✅ ${userSquares.size}` : '❌ none');
    console.log('Win documents:', winsSnapshot.size === 0 ? '✅ none' : `⚠️  ${winsSnapshot.size}`);
    console.log('='.repeat(60));
    console.log('\n✨ Test environment ready for live update testing!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

verifyRestage()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

