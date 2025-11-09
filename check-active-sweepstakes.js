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

  async function checkActiveSweepstakes() {
    try {
      console.log(`🔍 Finding active sweepstakes...\n`);
      
      // Find active sweepstakes
      const sweepstakesSnap = await db.collection('sweepstakes')
        .where('status', '==', 'active')
        .limit(10)
        .get();
      
      if (sweepstakesSnap.empty) {
        console.log(`ℹ️  No active sweepstakes found`);
        
        // Check for boards with amount $0 (sweepstakes boards)
        const sweepstakesBoardsSnap = await db.collection('boards')
          .where('amount', '==', 0)
          .limit(10)
          .get();
        
        if (!sweepstakesBoardsSnap.empty) {
          console.log(`\nFound ${sweepstakesBoardsSnap.size} board(s) with amount $0 (sweepstakes):\n`);
          for (const boardDoc of sweepstakesBoardsSnap.docs) {
            const boardData = boardDoc.data();
            const gameRef = boardData.gameID;
            const sweepstakesRef = boardData.sweepstakesID;
            
            console.log(`📋 Board: ${boardDoc.id}`);
            console.log(`   Status: ${boardData.status}`);
            if (gameRef) {
              const gameId = gameRef.id || gameRef;
              const gameDoc = await (typeof gameRef === 'string' ? db.doc(`games/${gameRef}`) : gameRef).get();
              if (gameDoc.exists) {
                const gameData = gameDoc.data();
                console.log(`   Game ID: ${gameId}`);
                console.log(`   Game Status: ${gameData.status}`);
                console.log(`   Is Live: ${gameData.isLive || gameData.is_live || false}`);
              }
            }
            if (sweepstakesRef) {
              const sweepstakesId = sweepstakesRef.id || sweepstakesRef;
              console.log(`   Sweepstakes ID: ${sweepstakesId}`);
            }
            console.log('');
          }
        }
        process.exit(0);
      }
      
      console.log(`Found ${sweepstakesSnap.size} active sweepstakes:\n`);
      
      for (const sweepstakesDoc of sweepstakesSnap.docs) {
        const sweepstakesData = sweepstakesDoc.data();
        const gameRef = sweepstakesData.gameID;
        
        console.log(`🎰 Sweepstakes: ${sweepstakesDoc.id}`);
        console.log(`   Status: ${sweepstakesData.status}`);
        console.log(`   Name: ${sweepstakesData.name || 'N/A'}`);
        
        if (gameRef) {
          const gameId = gameRef.id || gameRef;
          const gameDoc = await (typeof gameRef === 'string' ? db.doc(`games/${gameRef}`) : gameRef).get();
          
          if (gameDoc.exists) {
            const gameData = gameDoc.data();
            console.log(`   Game ID: ${gameId}`);
            console.log(`   Game Status: ${gameData.status}`);
            console.log(`   Is Live: ${gameData.isLive || gameData.is_live || false}`);
            console.log(`   Is Over: ${gameData.isOver || gameData.is_over || false}`);
            console.log(`   Quarter: ${gameData.quarter || 0}`);
          } else {
            console.log(`   Game ID: ${gameId} (not found)`);
          }
        } else {
          console.log(`   ⚠️  No gameID`);
        }
        
        // Find associated board
        const boardsSnap = await db.collection('boards')
          .where('sweepstakesID', '==', sweepstakesDoc.ref)
          .limit(1)
          .get();
        
        if (!boardsSnap.empty) {
          const boardDoc = boardsSnap.docs[0];
          const boardData = boardDoc.data();
          console.log(`   Board ID: ${boardDoc.id}`);
          console.log(`   Board Status: ${boardData.status}`);
        }
        
        console.log('');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  checkActiveSweepstakes();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}








