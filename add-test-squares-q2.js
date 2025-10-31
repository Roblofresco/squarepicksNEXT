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

  async function addTestSquares() {
    try {
      const userId = process.argv[2] || '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
      const boardId = process.argv[3] || 'test-board-1761871705688'; // Board from earlier
      const gameId = process.argv[4] || '401772943';
      
      console.log(`Adding squares to board: ${boardId}`);
      console.log(`Game ID: ${gameId}`);
      console.log(`User ID: ${userId}\n`);

      // Get board document
      const boardDoc = await db.collection('boards').doc(boardId).get();
      
      if (!boardDoc.exists) {
        console.error(`❌ Board ${boardId} not found`);
        process.exit(1);
      }

      const boardData = boardDoc.data();
      console.log(`✅ Board found`);
      console.log(`   Status: ${boardData.status}`);
      console.log(`   Amount: $${boardData.amount}`);
      console.log(`   Home numbers: ${boardData.home_numbers?.join(', ') || 'Not set'}`);
      console.log(`   Away numbers: ${boardData.away_numbers?.join(', ') || 'Not set'}\n`);

      if (!boardData.home_numbers || !boardData.away_numbers) {
        console.error(`❌ Board does not have axis numbers set. Board must be full first.`);
        process.exit(1);
      }

      const userRef = db.doc(`users/${userId}`);

      // Calculate square values for all indexes
      function calculateSquare(index) {
        const row = Math.floor(index / 10);
        const col = index % 10;
        return boardData.away_numbers[row] + boardData.home_numbers[col];
      }

      // Find indexes that produce square values "46" and "16"
      let indexFor46 = null;
      let indexFor16 = null;

      for (let i = 0; i < 100; i++) {
        const square = calculateSquare(i);
        if (square === '46' && indexFor46 === null) {
          indexFor46 = i;
        }
        if (square === '16' && indexFor16 === null) {
          indexFor16 = i;
        }
      }

      console.log(`📝 Finding indexes for test squares...`);
      console.log(`   Index for square "46": ${indexFor46}`);
      console.log(`   Index for square "16": ${indexFor16}\n`);

      if (indexFor46 === null || indexFor16 === null) {
        console.error(`❌ Could not find indexes for both squares.`);
        console.log(`   Check board axis numbers match desired square values.`);
        process.exit(1);
      }

      // Check if squares already exist
      const existing46 = await db.collection('squares')
        .where('boardId', '==', boardId)
        .where('square', '==', '46')
        .limit(1)
        .get();
      
      const existing16 = await db.collection('squares')
        .where('boardId', '==', boardId)
        .where('square', '==', '16')
        .limit(1)
        .get();

      const now = admin.firestore.FieldValue.serverTimestamp();

      // Create or update square with value "46"
      if (!existing46.empty) {
        console.log(`⚠️  Square "46" already exists, updating...`);
        const existingDoc = existing46.docs[0];
        await existingDoc.ref.update({
          userID: userRef,
          updated_time: now
        });
        console.log(`   ✅ Updated existing square "${existingDoc.id}" with square value "46"`);
      } else {
        const square46Data = {
          userID: userRef,
          index: indexFor46,
          square: '46',
          boardId: boardId,
          gameId: gameId,
          created_time: now,
          updated_time: now
        };
        
        const square46DocId = `sq-${boardId}-${indexFor46}`;
        await db.collection('squares').doc(square46DocId).set(square46Data);
        console.log(`   ✅ Created square ${indexFor46} with value "46"`);
      }

      // Create or update square with value "16"
      if (!existing16.empty) {
        console.log(`⚠️  Square "16" already exists, updating...`);
        const existingDoc = existing16.docs[0];
        await existingDoc.ref.update({
          userID: userRef,
          updated_time: now
        });
        console.log(`   ✅ Updated existing square "${existingDoc.id}" with square value "16"`);
      } else {
        const square16Data = {
          userID: userRef,
          index: indexFor16,
          square: '16',
          boardId: boardId,
          gameId: gameId,
          created_time: now,
          updated_time: now
        };
        
        const square16DocId = `sq-${boardId}-${indexFor16}`;
        await db.collection('squares').doc(square16DocId).set(square16Data);
        console.log(`   ✅ Created square ${indexFor16} with value "16"`);
      }

      console.log(`\n🎯 Test Squares Added Successfully!`);
      console.log(`   Board ID: ${boardId}`);
      console.log(`   Square "46": index ${indexFor46}`);
      console.log(`   Square "16": index ${indexFor16}`);
      console.log(`\n⏳ Waiting for Q2 to end (halftime) to test winner assignment...`);
      
    } catch (error) {
      console.error('❌ Error adding test squares:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  addTestSquares();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



