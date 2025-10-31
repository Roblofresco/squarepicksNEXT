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

  async function checkUserWins() {
    try {
      const userId = process.argv[2] || '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
      const boardId = process.argv[3] || 'test-board-1761871705688';
      const period = process.argv[4] || 'q2';
      
      console.log(`Checking wins for user: ${userId}`);
      console.log(`Board ID: ${boardId}`);
      console.log(`Period: ${period.toUpperCase()}\n`);

      // Check for win document with pattern: {boardId}_{period}
      const winDocId = `${boardId}_${period}`;
      const winDocRef = db.collection('users').doc(userId).collection('wins').doc(winDocId);
      const winDoc = await winDocRef.get();

      if (winDoc.exists) {
        const winData = winDoc.data();
        console.log(`✅ Win document found: ${winDocId}\n`);
        console.log('📋 Win Document Data:');
        console.log(`   Board ID: ${winData.boardId || 'Not set'}`);
        console.log(`   Game ID: ${winData.gameId || 'Not set'}`);
        console.log(`   Period: ${winData.period || 'Not set'}`);
        console.log(`   Winning Index: ${winData.winningIndex !== undefined ? winData.winningIndex : 'Not set'}`);
        console.log(`   Winning Square: ${winData.winningSquare || 'Not set'}`);
        console.log(`   Square ID: ${winData.squareID || 'Not set'}`);
        if (winData.assignedAt) {
          console.log(`   Assigned At: ${winData.assignedAt.toDate().toISOString()}`);
        }
        console.log('');
      } else {
        console.log(`❌ Win document NOT found: ${winDocId}\n`);
      }

      // Also check the square document to verify user owns it
      console.log('🔍 Checking square document...');
      const squaresSnapshot = await db.collection('squares')
        .where('boardId', '==', boardId)
        .where('square', '==', '46') // Q2 winning square
        .get();

      console.log(`   Found ${squaresSnapshot.size} square(s) with value "46"\n`);

      if (squaresSnapshot.size > 0) {
        squaresSnapshot.docs.forEach(doc => {
          const squareData = doc.data();
          let squareUserId = null;
          
          if (squareData.userID && typeof squareData.userID === 'object' && squareData.userID.id) {
            squareUserId = squareData.userID.id;
          } else if (typeof squareData.userID === 'string') {
            squareUserId = squareData.userID;
          }

          console.log(`   Square Document ID: ${doc.id}`);
          console.log(`   Index: ${squareData.index}`);
          console.log(`   Square Value: ${squareData.square}`);
          console.log(`   User ID: ${squareUserId || 'Unknown'}`);
          
          if (squareUserId === userId) {
            console.log(`   ✅ This square belongs to your user!\n`);
          } else {
            console.log(`   ⚠️  This square belongs to a different user\n`);
          }
        });
      }

      // List all wins for this user
      console.log('\n📋 All Wins for This User:');
      const allWinsSnapshot = await db.collection('users').doc(userId).collection('wins').get();
      
      if (allWinsSnapshot.empty) {
        console.log('   No wins found for this user.\n');
      } else {
        console.log(`   Found ${allWinsSnapshot.size} win document(s):\n`);
        allWinsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`   Win ID: ${doc.id}`);
          console.log(`      Board ID: ${data.boardId || 'Not set'}`);
          console.log(`      Period: ${data.period || 'Not set'}`);
          console.log(`      Winning Square: ${data.winningSquare || 'Not set'}`);
          if (data.assignedAt) {
            console.log(`      Assigned At: ${data.assignedAt.toDate().toISOString()}`);
          }
          console.log('');
        });
      }

      // Summary
      console.log('\n📝 Summary:');
      if (winDoc.exists) {
        console.log(`   ✅ Win document exists for ${period.toUpperCase()} on board ${boardId}`);
      } else {
        console.log(`   ❌ Win document does NOT exist for ${period.toUpperCase()} on board ${boardId}`);
        console.log(`   ⚠️  Expected document ID: ${winDocId}`);
      }
      
    } catch (error) {
      console.error('❌ Error checking user wins:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  checkUserWins();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



