require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable not set in .env.local');
  process.exit(1);
}

try {
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Error: Service account file not found at path: ${serviceAccountPath}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  async function setupBoardsForTodayGame() {
    try {
      // Get user ID from command line or use default test user
      const userId = process.argv[2] || '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
      
      // Target date: 11/6/2025
      const targetDate = '2025-11-06';
      
      console.log(`🔧 Setting up boards for game on ${targetDate}...\n`);
      console.log(`👤 User ID: ${userId}\n`);

      // Find game for 11/6/2025
      const gamesSnap = await db.collection('games')
        .where('gameDate', '==', targetDate)
        .limit(10)
        .get();
      
      if (gamesSnap.empty) {
        console.error(`❌ No games found for date ${targetDate}`);
        process.exit(1);
      }

      // Get the first game (or you can specify which one)
      const gameDoc = gamesSnap.docs[0];
      const gameId = gameDoc.id;
      const gameRef = gameDoc.ref;
      const gameData = gameDoc.data();
      
      console.log(`✅ Found game: ${gameId}`);
      console.log(`   Teams: ${gameData.awayTeam?.id || 'Unknown'} @ ${gameData.homeTeam?.id || 'Unknown'}`);
      console.log(`   Status: ${gameData.status}`);
      console.log(`   Start Time: ${gameData.startTime?.toDate?.() || 'N/A'}\n`);

      // Find all open boards for this game, grouped by amount
      const boardsSnap = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .where('status', '==', 'open')
        .get();
      
      if (boardsSnap.empty) {
        console.log(`ℹ️  No open boards found for game ${gameId}`);
        process.exit(0);
      }

      console.log(`Found ${boardsSnap.size} open board(s) for game ${gameId}:\n`);

      // Group boards by amount
      const boardsByAmount = new Map();
      boardsSnap.docs.forEach(doc => {
        const amount = doc.data().amount || 0;
        if (!boardsByAmount.has(amount)) {
          boardsByAmount.set(amount, []);
        }
        boardsByAmount.get(amount).push(doc);
      });

      // Create array of all 100 square indexes (0-99)
      const allIndexes = Array.from({ length: 100 }, (_, i) => i);
      const userRef = db.doc(`users/${userId}`);

      // Verify user exists
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        console.error(`❌ User ${userId} not found`);
        process.exit(1);
      }
      console.log(`✅ User verified: ${userSnap.data().email || userSnap.data().display_name || userId}\n`);

      // Process each amount group
      for (const [amount, boards] of boardsByAmount.entries()) {
        console.log(`\n💰 Processing $${amount} boards (${boards.length} board(s)):`);
        
        for (const boardDoc of boards) {
          const boardId = boardDoc.id;
          const boardData = boardDoc.data();
          
          console.log(`\n📋 Board: ${boardId}`);
          console.log(`   Amount: $${amount}`);
          console.log(`   Current selected_indexes: ${(boardData.selected_indexes || []).length} squares`);

          // Step 1: Update board with all 100 squares
          await boardDoc.ref.update({
            selected_indexes: allIndexes,
            updated_time: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`   ✅ Updated selected_indexes → [0-99] (100 squares)`);

          // Step 2: Create square documents for user (assign 10 squares per board for testing)
          const squaresToAssign = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // First 10 squares
          
          // Check existing squares for this user on this board
          const existingSquares = await db.collection('squares')
            .where('boardId', '==', boardId)
            .where('userID', '==', userRef)
            .get();
          
          const existingIndexes = new Set(existingSquares.docs.map(doc => doc.data().index));
          
          // Create squares that don't already exist
          const squaresToCreate = squaresToAssign.filter(idx => !existingIndexes.has(idx));
          
          if (squaresToCreate.length > 0) {
            const batch = db.batch();
            squaresToCreate.forEach(index => {
              const squareRef = db.collection('squares').doc();
              batch.set(squareRef, {
                userID: userRef,
                index: index,
                boardId: boardId,
                gameId: gameId,
                created_time: admin.firestore.FieldValue.serverTimestamp(),
                updated_time: admin.firestore.FieldValue.serverTimestamp(),
              });
            });
            await batch.commit();
            console.log(`   ✅ Created ${squaresToCreate.length} square(s) for user (indexes: ${squaresToCreate.join(', ')})`);
          } else {
            console.log(`   ℹ️  User already has squares on this board`);
          }
        }
      }

      // Summary
      console.log(`\n\n📊 Summary:`);
      console.log(`   Game ID: ${gameId}`);
      console.log(`   Game Date: ${targetDate}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Boards processed: ${boardsSnap.size}`);
      console.log(`   All boards updated with selected_indexes [0-99]`);
      console.log(`   Squares assigned to user for testing`);
      console.log(`\n✅ Setup complete!`);
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  setupBoardsForTodayGame();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}

