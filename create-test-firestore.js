// Create test data using Firebase CLI
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function createTestData() {
  try {
    console.log('🚀 Creating test live game and board...');
    
    // Generate unique IDs
    const gameId = `test-game-${Date.now()}`;
    const boardId = `test-board-${Date.now()}`;
    
    // Create game document
    const gameData = {
      homeTeam: 'Test Home Team',
      awayTeam: 'Test Away Team',
      status: 'live',
      quarter: 1,
      homeQ1score: 7,
      awayQ1score: 3,
      startTime: new Date().toISOString(),
      created_time: new Date().toISOString()
    };
    
    console.log(`📝 Creating game: ${gameId}`);
    await execAsync(`firebase firestore:set games/${gameId} '${JSON.stringify(gameData)}'`);
    
    // Create board document
    const boardData = {
      gameID: `games/${gameId}`,
      amount: 5,
      prize: 100,
      status: 'open',
      selected_indexes: [0, 1, 2, 3, 4, 5, 6, 7],
      home_numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      away_numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
      created_time: new Date().toISOString(),
      startTime: new Date().toISOString()
    };
    
    console.log(`📝 Creating board: ${boardId}`);
    await execAsync(`firebase firestore:set boards/${boardId} '${JSON.stringify(boardData)}'`);
    
    // Create 8 test squares
    console.log(`📝 Creating 8 test squares...`);
    
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
    
    for (let i = 0; i < testSquares.length; i++) {
      const squareData = {
        boardId: boardId,
        gameId: gameId,
        index: testSquares[i].index,
        square: testSquares[i].square,
        userID: testSquares[i].userID,
        created_time: new Date().toISOString()
      };
      
      const squareId = `test-square-${i}-${Date.now()}`;
      await execAsync(`firebase firestore:set squares/${squareId} '${JSON.stringify(squareData)}'`);
      console.log(`   ✅ Created square ${i}: ${squareId}`);
    }
    
    console.log(`\n🎯 Test Setup Complete!`);
    console.log(`   Game ID: ${gameId}`);
    console.log(`   Board ID: ${boardId}`);
    console.log(`   Squares: 0-7 (8 squares)`);
    console.log(`   Status: Live game with active board`);
    console.log(`\n🔗 Test URL: /game/${gameId}?boardId=${boardId}`);
    
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

