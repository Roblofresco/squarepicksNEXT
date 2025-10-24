const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function createTestScheduledGame() {
  try {
    console.log('Creating test scheduled game...');
    
    // Create new game document
    const gameRef = db.collection('games').doc();
    
    // Set game data based on source game 401772869
    await gameRef.set({
      gameID: gameRef.id, // Use the auto-generated ID
      broadcastProvider: 'FOX',
      homeScore: 0,
      week: 8,
      awayTeam: db.doc('teams/gVEJIamddUIZtsAPHlXS'), // Reference from source
      gameDate: '2025-10-26',
      created: admin.firestore.FieldValue.serverTimestamp(),
      statusState: 'pre',
      timeRemaining: '0:00',
      statusDetail: 'Sun, October 26th at 4:05 PM EDT',
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      isLive: false,
      awayScore: 0,
      homeTeam: db.doc('teams/pOPmOJG8juYhDHPhABTZ'), // Reference from source
      isOver: false,
      season: '2025',
      startTime: admin.firestore.Timestamp.fromDate(new Date('2025-10-26T20:05:00Z')),
      sport: 'NFL',
      quarter: '',
      status: 'scheduled', // This will trigger ensureGameBoards
      
      // Clear any existing scores
      homeQ1score: 0,
      homeQ2score: 0,
      homeQ3score: 0,
      homeQ4score: 0,
      awayQ1score: 0,
      awayQ2score: 0,
      awayQ3score: 0,
      awayQ4score: 0,
      
      // Clear winning squares
      q1WinningSquare: null,
      q2WinningSquare: null,
      q3WinningSquare: null,
      finalWinningSquare: null,
    });
    
    console.log(`✅ Test game created: ${gameRef.id}`);
    console.log(`Game ID: ${gameRef.id}`);
    console.log('Status: scheduled (should trigger board creation)');
    console.log('Teams: Home and Away team references set');
    console.log('Scores: All cleared to 0');
    console.log('Winning squares: All cleared to null');
    
    // Wait a moment for the trigger to process
    console.log('Waiting 5 seconds for ensureGameBoards to trigger...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Query boards to verify they were created
    const boardsQuery = db.collection('boards')
      .where('gameID', '==', gameRef)
      .orderBy('amount');
    
    const boardsSnap = await boardsQuery.get();
    
    if (boardsSnap.empty) {
      console.log('❌ No boards found - ensureGameBoards may not have triggered');
    } else {
      console.log(`✅ Found ${boardsSnap.size} boards:`);
      boardsSnap.forEach(doc => {
        const data = doc.data();
        console.log(`  - Amount: $${data.amount}, Pot: $${data.pot}, Payout: $${data.payout}, Status: ${data.status}`);
      });
    }
    
    return gameRef.id;
    
  } catch (error) {
    console.error('Error creating test game:', error);
    throw error;
  }
}

// Run the function
createTestScheduledGame()
  .then(gameId => {
    console.log(`\n🎉 Test game created successfully: ${gameId}`);
    console.log('Next steps:');
    console.log('1. Check Firebase Console for the new game');
    console.log('2. Verify boards were auto-created');
    console.log('3. Navigate to squarepicks.com to see the game in lobby');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to create test game:', err);
    process.exit(1);
  });
