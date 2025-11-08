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

  async function addSquaresToOpenBoards() {
    try {
      const gameId = process.argv[2] || '401772766';
      
      console.log(`🔍 Finding all open boards for game ${gameId}...\n`);

      // Get game reference
      const gameRef = db.doc(`games/${gameId}`);
      const gameDoc = await gameRef.get();
      
      if (!gameDoc.exists) {
        console.error(`❌ Game ${gameId} not found`);
        process.exit(1);
      }

      console.log(`✅ Game ${gameId} found`);
      console.log(`   Status: ${gameDoc.data().status}`);
      console.log(`   Is Live: ${gameDoc.data().isLive || gameDoc.data().is_live}`);
      console.log('');

      // Query for boards with this game (first check what exists)
      // Try both reference and string comparison
      const allBoardsSnap = await db.collection('boards')
        .where('gameID', '==', gameRef)
        .get();
      
      // Also check if any boards have gameID as string (fallback)
      const boardsByStringSnap = await db.collection('boards')
        .where('gameID', '==', gameId)
        .get();
      
      // Combine results (remove duplicates)
      const allBoardsMap = new Map();
      [...allBoardsSnap.docs, ...boardsByStringSnap.docs].forEach(doc => {
        allBoardsMap.set(doc.id, doc);
      });
      
      const allBoardsArray = Array.from(allBoardsMap.values());

      if (allBoardsArray.length === 0) {
        console.log(`ℹ️  No boards found for game ${gameId}`);
        process.exit(0);
      }

      console.log(`Found ${allBoardsArray.length} total board(s) for game ${gameId}:`);
      const statusCounts = {};
      allBoardsArray.forEach(doc => {
        const data = doc.data();
        const status = data.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
      console.log('');

      // Filter for boards that should be updated (open, or can be set to open)
      // Include: open, active, full, unfilled
      const boardsToUpdate = allBoardsArray.filter(doc => {
        const status = doc.data().status;
        return ['open', 'active', 'full', 'unfilled'].includes(status);
      });

      if (boardsToUpdate.length === 0) {
        console.log(`ℹ️  No updateable boards found for game ${gameId}`);
        console.log(`   Available statuses: ${Object.keys(statusCounts).join(', ')}`);
        console.log(`   Looking for: open, active, full, or unfilled`);
        process.exit(0);
      }

      console.log(`Found ${boardsToUpdate.length} board(s) to update:\n`);

      // Create array of all 100 square indexes (0-99)
      const allIndexes = Array.from({ length: 100 }, (_, i) => i);

      let updatedCount = 0;

      for (const boardDoc of boardsToUpdate) {
        const boardData = boardDoc.data();
        const currentIndexes = boardData.selected_indexes || [];
        const currentStatus = boardData.status;
        
        console.log(`📋 Board: ${boardDoc.id}`);
        console.log(`   Current status: ${currentStatus}`);
        console.log(`   Current selected_indexes: ${currentIndexes.length} squares`);
        console.log(`   Amount: $${boardData.amount}`);
        
        // Update board with all 100 squares and set status to open if not already
        const updateData = {
          selected_indexes: allIndexes,
          updated_time: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (currentStatus !== 'open') {
          updateData.status = 'open';
          console.log(`   ⚠️  Status will change: ${currentStatus} → open`);
        }
        
        await boardDoc.ref.update(updateData);
        
        console.log(`   ✅ Updated: selected_indexes set to [0-99] (100 squares)\n`);
        updatedCount++;
      }

      console.log(`\n📊 Summary:`);
      console.log(`   Game ID: ${gameId}`);
      console.log(`   Boards updated: ${updatedCount}`);
      console.log(`   Squares added per board: 100 (indexes 0-99)`);
      console.log(`\n✅ All open boards updated!`);
      console.log(`   The handleBoardFull Cloud Function should trigger for each board.`);
      
    } catch (error) {
      console.error('❌ Error updating boards:', error);
      throw error;
    } finally {
      process.exit(0);
    }
  }

  addSquaresToOpenBoards();

} catch (error) {
  console.error('❌ Firebase Admin SDK initialization FAILED:', error);
  process.exit(1);
}

