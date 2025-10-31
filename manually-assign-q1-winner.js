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

  async function manuallyAssignQ1Winner() {
    try {
      const gameId = process.argv[2] || '401772943';
      
      console.log(`Manually assigning Q1 winner for game: ${gameId}\n`);

      // Get game document
      const gameDoc = await db.collection('games').doc(gameId).get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      const gameData = gameDoc.data();
      
      // Check if Q1 scores exist
      if (gameData.homeQ1score === undefined || gameData.awayQ1score === undefined) {
        console.error(`❌ Q1 scores not available`);
        console.log(`   Home Q1 Score: ${gameData.homeQ1score}`);
        console.log(`   Away Q1 Score: ${gameData.awayQ1score}`);
        process.exit(1);
      }

      const homeScore = Number(gameData.homeQ1score || 0);
      const awayScore = Number(gameData.awayQ1score || 0);
      
      // Calculate winning square
      const homeLast = homeScore % 10;
      const awayLast = awayScore % 10;
      const winningSquare = `${awayLast}${homeLast}`;
      
      console.log(`📊 Q1 Scores:`);
      console.log(`   Home: ${homeScore} (last digit: ${homeLast})`);
      console.log(`   Away: ${awayScore} (last digit: ${awayLast})`);
      console.log(`   Winning Square: ${winningSquare}\n`);

      // Get all boards for this game
      const gameRef = db.doc(`games/${gameId}`);
      const boardsSnapshot = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .get();

      if (boardsSnapshot.empty) {
        console.log(`❌ No boards found for game ${gameId}`);
        process.exit(1);
      }

      console.log(`Found ${boardsSnapshot.size} board(s) for this game\n`);

      // Import the assignWinnersForBoardPeriod function logic
      // Since we can't directly import, we'll replicate the key logic
      
      for (const boardDoc of boardsSnapshot.docs) {
        const boardData = boardDoc.data();
        const boardId = boardDoc.id;
        
        console.log(`Processing board: ${boardId}`);
        console.log(`   Status: ${boardData.status}`);
        console.log(`   Amount: $${boardData.amount || 'Unknown'}`);

        // Check if Q1 already assigned
        if (boardData.winners && boardData.winners.q1 && boardData.winners.q1.assigned) {
          console.log(`   ⚠️  Q1 winner already assigned for this board, skipping...\n`);
          continue;
        }

        // Find squares with the winning square value
        const squaresSnapshot = await db.collection('squares')
          .where('boardId', '==', boardId)
          .where('square', '==', winningSquare)
          .get();

        if (squaresSnapshot.empty) {
          console.log(`   ⚠️  No squares found with value "${winningSquare}"`);
        } else {
          console.log(`   ✅ Found ${squaresSnapshot.size} square(s) with value "${winningSquare}"`);
          
          // Get first winner's index
          const firstSquare = squaresSnapshot.docs[0].data();
          const winningIndex = firstSquare.index;
          
          console.log(`   Winning Index: ${winningIndex}`);

          // Update game document with Q1 winning square
          await db.collection('games').doc(gameId).update({
            q1WinningSquare: winningSquare,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`   ✅ Updated game document with q1WinningSquare: ${winningSquare}`);

          // Update board winners metadata
          const winnersUpdate = {
            'winners.q1.assigned': true,
            'winners.q1.winningIndex': winningIndex,
            'winners.q1.assignedAt': admin.firestore.FieldValue.serverTimestamp(),
            'updated_time': admin.firestore.FieldValue.serverTimestamp()
          };
          await db.collection('boards').doc(boardId).update(winnersUpdate);
          console.log(`   ✅ Updated board winners metadata`);

          // Create public winner summary
          const winnerSummaryRef = db.collection('boards').doc(boardId)
            .collection('winners').doc('Q1');
          await winnerSummaryRef.set({
            period: 'Q1',
            winningIndex: winningIndex,
            winningSquare: winningSquare,
            winnerCount: squaresSnapshot.size,
            assignedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`   ✅ Created public winner summary`);

          // Create private win records for each winner
          const batch = db.batch();
          squaresSnapshot.forEach((squareDoc) => {
            const squareData = squareDoc.data();
            let uid = null;
            if (squareData.userID && typeof squareData.userID === 'object' && squareData.userID.id) {
              uid = squareData.userID.id;
            } else if (typeof squareData.userID === 'string') {
              uid = squareData.userID;
            }
            if (!uid) return;
            
            const winDocId = `${boardId}_q1`;
            const winRef = db.doc(`users/${uid}/wins/${winDocId}`);
            batch.set(winRef, {
              boardId: boardId,
              gameId: gameId,
              period: 'Q1',
              winningIndex: squareData.index,
              winningSquare: winningSquare,
              squareID: squareDoc.id,
              assignedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
          });
          await batch.commit();
          console.log(`   ✅ Created ${squaresSnapshot.size} private win record(s)`);
        }
        
        console.log('');
      }

      console.log(`\n🎯 Q1 Winner Assignment Complete!`);
      
    } catch (error) {
      console.error('❌ Error assigning Q1 winner:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  manuallyAssignQ1Winner();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



