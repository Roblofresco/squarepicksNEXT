const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'square-picks-vpbb8d'
});

const db = admin.firestore();

async function createTestLiveGame() {
  try {
    console.log('🔍 Querying for live games...');
    
    // Query for live games
    const gamesSnapshot = await db.collection('games')
      .where('status', '==', 'live')
      .limit(1)
      .get();
    
    if (gamesSnapshot.empty) {
      console.log('❌ No live games found. Creating a test live game...');
      
      // Create a test live game
      const testGame = {
        homeTeam: 'Test Home Team',
        awayTeam: 'Test Away Team',
        status: 'live',
        quarter: 1,
        homeQ1score: 7,
        awayQ1score: 3,
        startTime: admin.firestore.Timestamp.now(),
        created_time: admin.firestore.Timestamp.now()
      };
      
      const gameRef = await db.collection('games').add(testGame);
      console.log(`✅ Created test live game: ${gameRef.id}`);
      
      await createBoardAndSquares(gameRef.id);
    } else {
      const gameDoc = gamesSnapshot.docs[0];
      console.log(`✅ Found live game: ${gameDoc.id}`);
      console.log(`   Home: ${gameDoc.data().homeTeam}`);
      console.log(`   Away: ${gameDoc.data().awayTeam}`);
      
      await createBoardAndSquares(gameDoc.id);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function createBoardAndSquares(gameId) {
  try {
    console.log(`\n🏗️ Creating board for game: ${gameId}`);
    
    // Create board document
    const boardData = {
      gameID: db.doc(`games/${gameId}`),
      amount: 5,
      prize: 100,
      status: 'open',
      selected_indexes: [],
      home_numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      away_numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      created_time: admin.firestore.Timestamp.now(),
      startTime: admin.firestore.Timestamp.now()
    };
    
    const boardRef = await db.collection('boards').add(boardData);
    console.log(`✅ Created board: ${boardRef.id}`);
    
    // Create 8 test square documents
    console.log(`\n📦 Creating 8 test squares...`);
    
    const testSquares = [
      { index: 0, square: '00', userID: 'test-user-1' },
      { index: 1, square: '01', userID: 'test-user-2' },
      { index: 2, square: '02', userID: 'test-user-3' },
      { index: 3, square: '03', userID: 'test-user-4' },
      { index: 4, square: '04', userID: 'test-user-5' },
      { index: 5, square: '05', userID: 'test-user-6' },
      { index: 6, square: '06', userID: 'test-user-7' },
      { index: 7, square: '07', userID: 'test-user-8' }
    ];
    
    const batch = db.batch();
    
    testSquares.forEach(squareData => {
      const squareRef = db.collection('squares').doc();
      batch.set(squareRef, {
        boardId: boardRef.id,
        gameId: gameId,
        index: squareData.index,
        square: squareData.square,
        userID: squareData.userID,
        created_time: admin.firestore.Timestamp.now()
      });
    });
    
    await batch.commit();
    console.log(`✅ Created 8 test squares`);
    
    // Update board with selected indexes
    await boardRef.update({
      selected_indexes: testSquares.map(s => s.index)
    });
    console.log(`✅ Updated board with selected indexes`);
    
    console.log(`\n🎯 Test Setup Complete!`);
    console.log(`   Game ID: ${gameId}`);
    console.log(`   Board ID: ${boardRef.id}`);
    console.log(`   Squares: 0-7 (8 squares)`);
    console.log(`   Status: Live game with active board`);
    
    return { gameId, boardId: boardRef.id };
    
  } catch (error) {
    console.error('❌ Error creating board and squares:', error);
  }
}

// Run the script
createTestLiveGame().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

