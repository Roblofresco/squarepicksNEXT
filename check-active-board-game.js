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

  async function checkActiveBoardGame() {
    try {
      const boardId = process.argv[2];
      
      if (boardId) {
        // Check specific board
        console.log(`🔍 Checking board: ${boardId}\n`);

        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();
        
        if (!boardDoc.exists) {
          console.error(`❌ Board ${boardId} not found`);
          process.exit(1);
        }

        const boardData = boardDoc.data();
        const gameRef = boardData.gameID;
        
        if (!gameRef) {
          console.error(`❌ Board ${boardId} has no gameID`);
          process.exit(1);
        }

        const gameId = gameRef.id || gameRef;
        const gameDoc = await (typeof gameRef === 'string' ? db.doc(`games/${gameRef}`) : gameRef).get();
        
        let gameData = null;
        if (gameDoc.exists) {
          gameData = gameDoc.data();
        }

        console.log(`📋 Board Information:`);
        console.log(`   Board ID: ${boardId}`);
        console.log(`   Status: ${boardData.status}`);
        console.log(`   Amount: $${boardData.amount}`);
        console.log(`   Selected Indexes: ${boardData.selected_indexes?.length || 0} squares`);
        console.log('');
        console.log(`🎮 Game Information:`);
        console.log(`   Game ID: ${gameId}`);
        if (gameData) {
          console.log(`   Status: ${gameData.status}`);
          console.log(`   Is Live: ${gameData.isLive || gameData.is_live || false}`);
          console.log(`   Is Over: ${gameData.isOver || gameData.is_over || false}`);
          console.log(`   Quarter: ${gameData.quarter || 0}`);
          console.log(`   Teams: ${gameData.awayTeam?.id || 'Unknown'} @ ${gameData.homeTeam?.id || 'Unknown'}`);
        } else {
          console.log(`   ⚠️  Game document not found`);
        }
      } else {
        // Check all active/unfilled boards
        console.log(`🔍 Finding all active and unfilled boards...\n`);
        
        const activeBoardsSnap = await db.collection('boards')
          .where('status', '==', 'active')
          .limit(10)
          .get();
        
        const unfilledBoardsSnap = await db.collection('boards')
          .where('status', '==', 'unfilled')
          .limit(10)
          .get();
        
        const allBoards = [...activeBoardsSnap.docs, ...unfilledBoardsSnap.docs];
        
        if (allBoards.length === 0) {
          console.log(`ℹ️  No active or unfilled boards found`);
        } else {
          console.log(`Found ${allBoards.length} board(s):\n`);
          
          for (const boardDoc of allBoards) {
            const boardData = boardDoc.data();
            const gameRef = boardData.gameID;
            
            if (!gameRef) {
              console.log(`📋 Board: ${boardDoc.id}`);
              console.log(`   Status: ${boardData.status}`);
              console.log(`   ⚠️  No gameID`);
              continue;
            }
            
            const gameId = gameRef.id || gameRef;
            const gameDoc = await (typeof gameRef === 'string' ? db.doc(`games/${gameRef}`) : gameRef).get();
            
            let gameData = null;
            if (gameDoc.exists) {
              gameData = gameDoc.data();
            }
            
            console.log(`📋 Board: ${boardDoc.id}`);
            console.log(`   Status: ${boardData.status}`);
            console.log(`   Amount: $${boardData.amount}`);
            console.log(`   Game ID: ${gameId}`);
            if (gameData) {
              console.log(`   Game Status: ${gameData.status}`);
              console.log(`   Is Live: ${gameData.isLive || gameData.is_live || false}`);
              console.log(`   Quarter: ${gameData.quarter || 0}`);
            }
            console.log('');
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  checkActiveBoardGame();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}

