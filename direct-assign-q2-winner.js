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

  async function directAssignQ2Winner() {
    try {
      const gameId = process.argv[2] || '401772943';
      const boardId = process.argv[3] || 'test-board-1761871705688';
      
      console.log(`Directly assigning Q2 winner for game: ${gameId}, board: ${boardId}\n`);

      // Get game document
      const gameDoc = await db.collection('games').doc(gameId).get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      const gameData = gameDoc.data();
      
      // Verify Q2 scores exist
      if (gameData.homeQ2score === undefined || gameData.awayQ2score === undefined) {
        console.error(`❌ Q2 scores not available`);
        console.log(`   Home Q2 Score: ${gameData.homeQ2score}`);
        console.log(`   Away Q2 Score: ${gameData.awayQ2score}`);
        process.exit(1);
      }

      const homeScore = Number(gameData.homeQ2score || 0);
      const awayScore = Number(gameData.awayQ2score || 0);
      
      // Get board document
      const boardDoc = await db.collection('boards').doc(boardId).get();
      
      if (!boardDoc.exists) {
        console.error(`❌ Board ${boardId} not found`);
        process.exit(1);
      }

      const boardData = boardDoc.data();
      
      // Check if Q2 already assigned
      if (boardData.winners && boardData.winners.q2 && boardData.winners.q2.assigned === true) {
        console.log(`⚠️  Q2 winner already assigned for this board`);
        console.log(`   Winning Index: ${boardData.winners.q2.winningIndex}`);
        process.exit(0);
      }

      console.log('📊 Game Status:');
      console.log(`   Home Q2 Score: ${homeScore}`);
      console.log(`   Away Q2 Score: ${awayScore}`);
      console.log(`\n📋 Board Status:`);
      console.log(`   Status: ${boardData.status}`);
      console.log(`   Amount: $${boardData.amount || 'Unknown'}\n`);

      // Import assignWinnersForBoardPeriod logic
      // Since we can't directly import from functions, we'll replicate the key parts
      // Actually, let's use the reconcileGameWinners callable via HTTP or direct call
      
      // For now, let's directly replicate the core assignment logic
      const homeLast = String(homeScore % 10);
      const awayLast = String(awayScore % 10);
      const winningSquare = `${awayLast}${homeLast}`;
      
      console.log(`🎯 Calculating winning square:`);
      console.log(`   Away: ${awayScore} → last digit ${awayLast}`);
      console.log(`   Home: ${homeScore} → last digit ${homeLast}`);
      console.log(`   Winning Square: ${winningSquare}\n`);

      // Find squares with the winning square value
      const squaresSnapshot = await db.collection('squares')
        .where('boardId', '==', boardId)
        .where('square', '==', winningSquare)
        .get();

      if (squaresSnapshot.empty) {
        console.log(`❌ No squares found with value "${winningSquare}"`);
        process.exit(1);
      }

      console.log(`✅ Found ${squaresSnapshot.size} square(s) with value "${winningSquare}"`);
      
      // Get first winner's index
      const firstSquare = squaresSnapshot.docs[0].data();
      const winningIndex = firstSquare.index;
      
      console.log(`   Winning Index: ${winningIndex}\n`);

      // Use a transaction to update everything atomically
      await db.runTransaction(async (tx) => {
        // Get fresh board data
        const freshBoard = await tx.get(db.collection('boards').doc(boardId));
        if (!freshBoard.exists) {
          throw new Error('Board not found');
        }
        
        const b = freshBoard.data() || {};
        const winnersMeta = (b.winners && b.winners.q2) || {};
        
        // Check if already assigned (idempotent)
        if (winnersMeta.assigned === true) {
          console.log('⚠️  Q2 winner already assigned in board (idempotent check)');
          return;
        }

        // Get game and team data for notifications
        const gameRef = db.doc(`games/${gameId}`);
        const gameSnap = await tx.get(gameRef);
        let gameContext = null;
        if (gameSnap.exists) {
          const gameDataForContext = gameSnap.data();
          if (gameDataForContext.homeTeam && gameDataForContext.awayTeam) {
            const homeTeamSnap = await tx.get(gameDataForContext.homeTeam);
            const awayTeamSnap = await tx.get(gameDataForContext.awayTeam);
            gameContext = {
              homeTeamName: homeTeamSnap.data()?.full_name || homeTeamSnap.data()?.city || 'Unknown',
              awayTeamName: awayTeamSnap.data()?.full_name || awayTeamSnap.data()?.city || 'Unknown',
              gameId: gameId
            };
          }
        }

        // Get title prefix
        let titlePrefix = `$${Number(b.amount || 0)}`;
        if (b.amount === 0 && b.sweepstakesID) {
          const sweepstakesSnap = await tx.get(b.sweepstakesID);
          if (sweepstakesSnap.exists) {
            titlePrefix = sweepstakesSnap.data()?.title || 'Free Board';
          }
        }

        // Build title
        let title = `${titlePrefix} - Unknown @ Unknown`;
        if (gameContext) {
          title = `${titlePrefix} - ${gameContext.awayTeamName} @ ${gameContext.homeTeamName}`;
        }

        // 1. Create public winner summary
        const publicSummaryRef = db.collection('boards').doc(boardId)
          .collection('winners').doc('q2');
        tx.set(publicSummaryRef, {
          period: 'Q2',
          winningIndex: winningIndex,
          winningSquare: winningSquare,
          winnerCount: squaresSnapshot.size,
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // 2. Process payouts (if configured)
        const payoutPerQuarter = Number(b.payout || 0);
        let totalPaid = 0;
        
        if (payoutPerQuarter > 0 && !squaresSnapshot.empty) {
          // Get unique winner UIDs
          const uidSet = new Set();
          squaresSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.userID && typeof data.userID === 'object' && data.userID.id) {
              uidSet.add(data.userID.id);
            } else if (typeof data.userID === 'string') {
              uidSet.add(data.userID);
            }
          });
          
          const winnerUids = Array.from(uidSet);
          if (winnerUids.length > 0) {
            const perWinner = Math.round((payoutPerQuarter / winnerUids.length) * 100) / 100;
            
            winnerUids.forEach(uid => {
              const userRef = db.doc(`users/${uid}`);
              const txRef = db.collection('transactions').doc();
              
              tx.set(txRef, {
                userID: uid,
                userDocRef: userRef,
                type: 'winnings',
                amount: perWinner,
                currency: 'USD',
                status: 'completed',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                description: `Q2 quarter winnings for board ${boardId} (game ${gameId})`,
                boardId: boardId,
                gameId: gameId,
                period: 'Q2',
              });
              
              tx.update(userRef, {
                balance: admin.firestore.FieldValue.increment(perWinner),
                updated_time: admin.firestore.FieldValue.serverTimestamp(),
              });
              
              const message = `Congratulations! You won $${perWinner.toFixed(2)} for pick ${winningSquare} in the Q2 quarter!`;
              
              const notifRef = db.collection('notifications').doc();
              tx.set(notifRef, {
                userID: uid,
                tag: 'winnings',
                title: title,
                message: message,
                type: 'winnings',
                relatedID: txRef.id,
                boardId: boardId,
                gameId: gameId,
                isRead: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
              });
            });
            
            totalPaid = payoutPerQuarter;
            console.log(`   💰 Paid ${winnerUids.length} winners $${perWinner} each`);
          }
        }

        // 3. Update board winners metadata (all fields together to avoid conflict)
        const winnersUpdate = {};
        winnersUpdate['winners.q2'] = {
          assigned: true,
          winningIndex: winningIndex,
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          paid: true,
          paidAmount: totalPaid,
        };
        winnersUpdate['updated_time'] = admin.firestore.FieldValue.serverTimestamp();
        tx.update(db.collection('boards').doc(boardId), winnersUpdate);

        // 4. Create private win records
        squaresSnapshot.docs.forEach(squareDoc => {
          const data = squareDoc.data();
          let uid = null;
          if (data.userID && typeof data.userID === 'object' && data.userID.id) {
            uid = data.userID.id;
          } else if (typeof data.userID === 'string') {
            uid = data.userID;
          }
          if (!uid) return;
          
          const winDocId = `${boardId}_q2`;
          const winRef = db.doc(`users/${uid}/wins/${winDocId}`);
          tx.set(winRef, {
            boardId: boardId,
            gameId: gameId,
            period: 'Q2',
            winningIndex: data.index,
            winningSquare: winningSquare,
            squareID: squareDoc.id,
            assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        });

        console.log(`   ✅ Created ${squaresSnapshot.size} private win record(s)`);
      });

      console.log('\n✅ Q2 Winner Assignment Complete!');
      
    } catch (error) {
      console.error('❌ Error assigning Q2 winner:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  directAssignQ2Winner();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}

