const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function createTestLiveGame() {
  try {
    console.log('Creating test live game in Q1...');

    // Step 1: Create game document
    const gameData = {
      gameID: 'TEST_LIVE_' + Date.now(),
      broadcastProvider: 'Test Network',
      week: 8,
      awayTeam: db.doc('teams/aLErKrB7OpP0tEsJHAvQ'), // Minnesota Vikings
      gameDate: new Date().toISOString().split('T')[0],
      homeTeam: db.doc('teams/T222VgdaBavKnSNynsKY'), // LA Chargers
      season: '2025',
      startTime: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 3600000)),
      sport: 'NFL',
      awayQ1score: 0,
      homeQ1score: 7,
      awayScore: 0,
      homeScore: 7,
      quarter: 1,
      isLive: true,
      created: admin.firestore.Timestamp.now(),
      statusState: 'in',
      timeRemaining: '2:15',
      isOver: false,
      statusDetail: 'End of 1st Quarter',
      status: 'in',
      lastUpdated: admin.firestore.Timestamp.now()
    };

    const gameRef = await db.collection('games').add(gameData);
    console.log('✓ Game created:', gameRef.id);

    // Step 2: Create board document
    const boardData = {
      gameID: gameRef,
      amount: 1,
      pot: 100,
      status: 'active',
      selected_indexes: Array.from({length: 100}, (_, i) => i),
      home_numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      away_numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      created_time: admin.firestore.Timestamp.now(),
      startTime: admin.firestore.Timestamp.now()
    };

    const boardRef = await db.collection('boards').add(boardData);
    console.log('✓ Board created:', boardRef.id);

    // Step 3: Create 100 square documents
    const userRef = db.doc('users/0CUDUtFMoTWujVvQuSlGaWG9fwP2');
    const batch = db.batch();
    
    // User's 8 squares (including index 7 for '07' and index 31 for '31')
    const userSquareIndexes = [7, 31, 15, 42, 58, 73, 89, 96];
    
    for (let i = 0; i < 100; i++) {
      const row = Math.floor(i / 10);
      const col = i % 10;
      const squareValue = boardData.away_numbers[row] + boardData.home_numbers[col];
      
      const squareRef = db.collection('squares').doc();
      const squareData = {
        boardId: boardRef.id,
        gameId: gameRef.id,
        index: i,
        square: squareValue,
        userID: userSquareIndexes.includes(i) ? userRef : db.doc('users/mockUser' + (i % 5)),
        created_time: admin.firestore.Timestamp.now()
      };
      
      batch.set(squareRef, squareData);
    }

    await batch.commit();
    console.log('✓ 100 squares created (8 owned by test user including squares 07 and 31)');

    console.log('\n=== TEST GAME SETUP COMPLETE ===');
    console.log('Game ID:', gameRef.id);
    console.log('Board ID:', boardRef.id);
    console.log('User owns squares at indexes:', userSquareIndexes);
    console.log('Square 07 (index 7) - Q1 winning square');
    console.log('Square 31 (index 31) - Q2 winning square');
    console.log('\nNext steps:');
    console.log('1. View game in My Boards');
    console.log('2. Update game quarter from 1 to 2 to trigger Q1 winner assignment');
    console.log('3. Add Q2 scores and set status to "halftime" to trigger Q2 winner assignment');

    return { gameId: gameRef.id, boardId: boardRef.id };
  } catch (error) {
    console.error('Error creating test game:', error);
    throw error;
  }
}

createTestLiveGame()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

