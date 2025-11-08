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

  async function reassignBoardsToTestGame() {
    try {
      // Get board IDs from arguments or query active boards
      const regularBoardId = process.argv[2]; // Regular board ID from browser
      const sweepstakesBoardId = process.argv[3]; // Sweepstakes board ID (optional, will query if not provided)
      
      if (!regularBoardId) {
        console.error('❌ Please provide at least one board ID');
        console.log('Usage: node reassign-boards-to-test-game.js <regularBoardId> [sweepstakesBoardId]');
        console.log('\nOr query active boards:');
        console.log('   node reassign-boards-to-test-game.js --query');
        process.exit(1);
      }

      // If --query flag, find active boards
      if (regularBoardId === '--query') {
        console.log('🔍 Querying for active boards...\n');
        
        // Query for active boards (simplified - filter by amount in code)
        const activeBoardsSnap = await db.collection('boards')
          .where('status', '==', 'active')
          .limit(10)
          .get();
        
        const regularBoards = [];
        const sweepstakesBoards = [];
        
        activeBoardsSnap.forEach(doc => {
          const data = doc.data();
          if (data.amount > 0) {
            regularBoards.push({ id: doc.id, data });
          } else if (data.amount === 0) {
            sweepstakesBoards.push({ id: doc.id, data });
          }
        });
        
        console.log(`Found ${regularBoards.length} active regular board(s):`);
        regularBoards.forEach(board => {
          console.log(`  - Board ID: ${board.id}`);
          console.log(`    Amount: $${board.data.amount}, Game ID: ${board.data.gameID?.id || board.data.gameID}`);
        });

        console.log(`\nFound ${sweepstakesBoards.length} active sweepstakes board(s):`);
        sweepstakesBoards.forEach(board => {
          console.log(`  - Board ID: ${board.id}`);
          console.log(`    Sweepstakes ID: ${board.data.sweepstakesID?.id || board.data.sweepstakesID}`);
        });

        console.log('\nTo reassign boards, run:');
        console.log(`  node reassign-boards-to-test-game.js <regularBoardId> <sweepstakesBoardId>`);
        process.exit(0);
      }

      // Get the regular board
      const regularBoardRef = db.collection('boards').doc(regularBoardId);
      const regularBoardDoc = await regularBoardRef.get();
      
      if (!regularBoardDoc.exists) {
        console.error(`❌ Regular board ${regularBoardId} not found`);
        process.exit(1);
      }

      const regularBoardData = regularBoardDoc.data();
      const currentGameRef = regularBoardData.gameID;
      
      if (!currentGameRef) {
        console.error(`❌ Regular board ${regularBoardId} has no gameID`);
        process.exit(1);
      }

      // Get the current game to duplicate
      const currentGameDoc = await currentGameRef.get();
      if (!currentGameDoc.exists) {
        console.error(`❌ Current game ${currentGameRef.id} not found`);
        process.exit(1);
      }

      const currentGameData = currentGameDoc.data();
      
      console.log('📋 Current Setup:');
      console.log(`   Regular Board: ${regularBoardId}`);
      console.log(`   Current Game: ${currentGameRef.id}`);
      console.log(`   Game Status: ${currentGameData.status}`);
      console.log(`   Teams: ${currentGameData.awayTeam?.id || 'Unknown'} @ ${currentGameData.homeTeam?.id || 'Unknown'}\n`);

      // Create duplicated test game
      console.log('🔄 Creating duplicated test game...');
      const testGameRef = db.collection('games').doc();
      
      // Copy all game data, but with new ID and reset status
      const testGameData = {
        ...currentGameData,
        gameID: testGameRef.id, // Use new ID
        status: 'scheduled', // Reset to scheduled
        isLive: false,
        isOver: false,
        quarter: 0,
        homeScore: 0,
        awayScore: 0,
        timeRemaining: '',
        // Clear quarter scores
        homeQ1score: undefined,
        awayQ1score: undefined,
        homeQ2score: undefined,
        awayQ2score: undefined,
        homeQ3score: undefined,
        awayQ3score: undefined,
        homeFscore: undefined,
        awayFscore: undefined,
        // Clear winning squares
        q1WinningSquare: undefined,
        q2WinningSquare: undefined,
        q3WinningSquare: undefined,
        finalWinningSquare: undefined,
        created: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Remove undefined fields
      Object.keys(testGameData).forEach(key => {
        if (testGameData[key] === undefined) {
          delete testGameData[key];
        }
      });

      await testGameRef.set(testGameData);
      console.log(`   ✅ Test game created: ${testGameRef.id}\n`);

      // Update regular board
      console.log('🔄 Updating regular board...');
      await regularBoardRef.update({
        gameID: testGameRef,
        updated_time: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`   ✅ Regular board ${regularBoardId} now points to test game ${testGameRef.id}\n`);

      // Handle sweepstakes board
      let sweepstakesId = null;
      if (sweepstakesBoardId) {
        const sweepstakesBoardRef = db.collection('boards').doc(sweepstakesBoardId);
        const sweepstakesBoardDoc = await sweepstakesBoardRef.get();
        
        if (!sweepstakesBoardDoc.exists) {
          console.warn(`⚠️  Sweepstakes board ${sweepstakesBoardId} not found, skipping...\n`);
        } else {
          const sweepstakesBoardData = sweepstakesBoardDoc.data();
          sweepstakesId = sweepstakesBoardData.sweepstakesID?.id || sweepstakesBoardData.sweepstakesID;
          
          console.log('🔄 Updating sweepstakes board...');
          await sweepstakesBoardRef.update({
            gameID: testGameRef,
            updated_time: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`   ✅ Sweepstakes board ${sweepstakesBoardId} now points to test game ${testGameRef.id}\n`);

          // Update sweepstakes document if it exists
          if (sweepstakesId) {
            const sweepstakesRef = db.collection('sweepstakes').doc(sweepstakesId);
            const sweepstakesDoc = await sweepstakesRef.get();
            
            if (sweepstakesDoc.exists) {
              console.log('🔄 Updating sweepstakes document...');
              await sweepstakesRef.update({
                gameID: testGameRef,
                updated_time: admin.firestore.FieldValue.serverTimestamp(),
              });
              console.log(`   ✅ Sweepstakes document ${sweepstakesId} now points to test game ${testGameRef.id}\n`);
            }
          }
        }
      } else {
        // Try to find active sweepstakes board automatically
        const activeBoardsSnap = await db.collection('boards')
          .where('status', '==', 'active')
          .limit(10)
          .get();
        
        const sweepstakesBoardDoc = activeBoardsSnap.docs.find(doc => {
          const data = doc.data();
          return data.amount === 0;
        });
        
        if (sweepstakesBoardDoc) {
          const sweepstakesBoardData = sweepstakesBoardDoc.data();
          sweepstakesId = sweepstakesBoardData.sweepstakesID?.id || sweepstakesBoardData.sweepstakesID;
          
          console.log(`🔍 Found active sweepstakes board: ${sweepstakesBoardDoc.id}`);
          console.log('🔄 Updating sweepstakes board...');
          await sweepstakesBoardDoc.ref.update({
            gameID: testGameRef,
            updated_time: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(`   ✅ Sweepstakes board ${sweepstakesBoardDoc.id} now points to test game ${testGameRef.id}\n`);

          // Update sweepstakes document if it exists
          if (sweepstakesId) {
            const sweepstakesRef = db.collection('sweepstakes').doc(sweepstakesId);
            const sweepstakesDoc = await sweepstakesRef.get();
            
            if (sweepstakesDoc.exists) {
              console.log('🔄 Updating sweepstakes document...');
              await sweepstakesRef.update({
                gameID: testGameRef,
                updated_time: admin.firestore.FieldValue.serverTimestamp(),
              });
              console.log(`   ✅ Sweepstakes document ${sweepstakesId} now points to test game ${testGameRef.id}\n`);
            }
          }
        }
      }

      // Summary
      console.log('📊 Summary:');
      console.log(`   Test Game ID: ${testGameRef.id}`);
      console.log(`   Regular Board: ${regularBoardId} → ${testGameRef.id}`);
      if (sweepstakesBoardId || sweepstakesId) {
        console.log(`   Sweepstakes Board: ${sweepstakesBoardId || 'auto-found'} → ${testGameRef.id}`);
      }
      console.log('\n✅ All boards reassigned to test game!');
      console.log('   You can now test Process 6 (Game Start & Live Updates) with both board types.');
      
    } catch (error) {
      console.error('❌ Error reassigning boards:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  reassignBoardsToTestGame();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}

