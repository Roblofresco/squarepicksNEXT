// Simple script to create test data using Firebase Admin SDK
// This will work with the existing Firebase project

const admin = require('firebase-admin');

// Initialize with default credentials (uses Firebase CLI auth)
admin.initializeApp({
  projectId: 'square-picks-vpbb8d'
});

const db = admin.firestore();

async function createTestData() {
  try {
    console.log('🚀 Creating test live game and board...');
    
    // Create a test live game
    const gameData = {
      homeTeam: 'Test Home Team',
      awayTeam: 'Test Away Team', 
      status: 'live',
      quarter: 1,
      homeQ1score: 7,
      awayQ1score: 3,
      startTime: admin.firestore.Timestamp.now(),
      created_time: admin.firestore.Timestamp.now()
    };
    
    const gameRef = await db.collection('games').add(gameData);
    console.log(`✅ Created live game: ${gameRef.id}`);
    
    // Create board
    const boardData = {
      gameID: gameRef,
      amount: 5,
      prize: 100,
      status: 'open',
      selected_indexes: [0, 1, 2, 3, 4, 5, 6, 7],
      home_numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      away_numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      created_time: admin.firestore.Timestamp.now(),
      startTime: admin.firestore.Timestamp.now()
    };
    
    const boardRef = await db.collection('boards').add(boardData);
    console.log(`✅ Created board: ${boardRef.id}`);
    
    // Create 8 test squares
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
        gameId: gameRef.id,
        index: squareData.index,
        square: squareData.square,
        userID: squareData.userID,
        created_time: admin.firestore.Timestamp.now()
      });
    });
    
    await batch.commit();
    console.log(`✅ Created 8 test squares`);
    
    console.log(`\n🎯 Test Setup Complete!`);
    console.log(`   Game ID: ${gameRef.id}`);
    console.log(`   Board ID: ${boardRef.id}`);
    console.log(`   Squares: 0-7 (8 squares)`);
    console.log(`   Status: Live game with active board`);
    console.log(`\n🔗 Test URL: /game/${gameRef.id}?boardId=${boardRef.id}`);
    
    return { gameId: gameRef.id, boardId: boardRef.id };
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
createTestData().then(() => {
  console.log('\n✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
