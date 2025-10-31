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

  async function createBoardAndSquares() {
    try {
      // Get user ID from command line argument or environment variable
      const userId = process.argv[2] || process.env.USER_ID || '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
      const gameId = process.argv[3] || '401772943'; // Live game from query
      
      console.log(`Using User ID: ${userId}`);
      console.log(`Using Game ID: ${gameId}\n`);

      // Get game reference
      const gameRef = db.doc(`games/${gameId}`);
      const gameDoc = await gameRef.get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      console.log(`✅ Game ${gameId} found`);
      
      // Get user reference
      const userRef = db.doc(`users/${userId}`);
      
      // Create board document following documentation structure
      const boardId = `test-board-${Date.now()}`;
      const amount = 5; // $5 board
      
      // Generate random axis numbers (10 numbers each, 0-9)
      const home_numbers = Array.from({ length: 10 }, (_, i) => i.toString())
        .sort(() => Math.random() - 0.5);
      const away_numbers = Array.from({ length: 10 }, (_, i) => i.toString())
        .sort(() => Math.random() - 0.5);
      
      // Create selected_indexes array with all 100 squares (0-99)
      const selected_indexes = Array.from({ length: 100 }, (_, i) => i);
      
      // Calculate pot and payout based on documentation
      // pot = amount × 80, payout = amount × 20
      const pot = amount * 80; // $400
      const payout = amount * 20; // $100
      
      const boardData = {
        gameID: gameRef,
        amount: amount,
        status: 'full', // Board is full with all 100 squares
        selected_indexes: selected_indexes,
        home_numbers: home_numbers,
        away_numbers: away_numbers,
        pot: pot,
        payout: payout,
        currency: 'USD',
        created_time: admin.firestore.FieldValue.serverTimestamp(),
        updated_time: admin.firestore.FieldValue.serverTimestamp()
      };
      
      console.log(`📝 Creating board: ${boardId}`);
      console.log(`   Amount: $${amount}`);
      console.log(`   Pot: $${pot}, Payout: $${payout}`);
      console.log(`   Selected indexes: 0-99 (100 squares)`);
      console.log(`   Home numbers: ${home_numbers.join(', ')}`);
      console.log(`   Away numbers: ${away_numbers.join(', ')}\n`);
      
      await db.collection('boards').doc(boardId).set(boardData);
      console.log(`✅ Board created: ${boardId}\n`);
      
      // Create square documents
      // Most squares with random indexes, a few with specific square values
      const now = admin.firestore.FieldValue.serverTimestamp();
      
      // Calculate square values for all indexes using formula:
      // square = away_numbers[row] + home_numbers[col]
      // where row = Math.floor(index/10), col = index % 10
      function calculateSquare(index) {
        const row = Math.floor(index / 10);
        const col = index % 10;
        return away_numbers[row] + home_numbers[col];
      }
      
      // Find indexes that produce square values "73" and "07"
      let indexFor73 = null;
      let indexFor07 = null;
      
      for (let i = 0; i < 100; i++) {
        const square = calculateSquare(i);
        if (square === '73' && indexFor73 === null) {
          indexFor73 = i;
        }
        if (square === '07' && indexFor07 === null) {
          indexFor07 = i;
        }
      }
      
      console.log(`📝 Creating square documents...`);
      console.log(`   Index for square "73": ${indexFor73}`);
      console.log(`   Index for square "07": ${indexFor07}\n`);
      
      // Create a few squares with random indexes (pick 10 random indexes from 0-99)
      const randomIndexes = [];
      while (randomIndexes.length < 10) {
        const randIndex = Math.floor(Math.random() * 100);
        if (!randomIndexes.includes(randIndex) && randIndex !== indexFor73 && randIndex !== indexFor07) {
          randomIndexes.push(randIndex);
        }
      }
      
      const squareIndexesToCreate = [...randomIndexes];
      if (indexFor73 !== null) squareIndexesToCreate.push(indexFor73);
      if (indexFor07 !== null) squareIndexesToCreate.push(indexFor07);
      
      console.log(`   Creating ${squareIndexesToCreate.length} square documents:`);
      
      for (const index of squareIndexesToCreate) {
        const squareValue = calculateSquare(index);
        const squareData = {
          userID: userRef,
          index: index,
          square: squareValue, // Always include square value since board is full
          boardId: boardId,
          gameId: gameId,
          created_time: now,
          updated_time: now
        };
        
        // Use index as part of document ID for uniqueness
        const squareDocId = `sq-${boardId}-${index}`;
        await db.collection('squares').doc(squareDocId).set(squareData);
        
        const specialMark = (squareValue === '73' || squareValue === '07') ? ' ⭐' : '';
        console.log(`   ✅ Square ${index}: value="${squareValue}"${specialMark}`);
      }
      
      console.log(`\n🎯 Board and Squares Created Successfully!`);
      console.log(`   Board ID: ${boardId}`);
      console.log(`   Game ID: ${gameId}`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Total squares created: ${squareIndexesToCreate.length}`);
      console.log(`   Squares with value "73": ${indexFor73 !== null ? 1 : 0}`);
      console.log(`   Squares with value "07": ${indexFor07 !== null ? 1 : 0}`);
      console.log(`   Board status: full (100 squares in selected_indexes)`);
      
    } catch (error) {
      console.error('❌ Error creating board and squares:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  createBoardAndSquares();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}



