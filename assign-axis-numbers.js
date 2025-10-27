const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();

async function assignAxisNumbers() {
  try {
    console.log('🎲 Assigning axis numbers to boards...\n');

    // Get all boards with status 'full' or 'active' but missing axis numbers
    const boardsSnapshot = await db.collection('boards')
      .where('status', 'in', ['full', 'active'])
      .get();

    console.log(`Found ${boardsSnapshot.size} full/active boards\n`);

    let updatedCount = 0;

    for (const boardDoc of boardsSnapshot.docs) {
      const boardData = boardDoc.data();
      
      // Check if axis numbers already exist
      if (boardData.home_numbers && boardData.away_numbers) {
        console.log(`Board ${boardDoc.id} already has axis numbers, skipping`);
        continue;
      }

      console.log(`Processing board ${boardDoc.id}...`);

      // Generate random axis numbers (0-9 for each axis)
      const homeNumbers = Array.from({ length: 10 }, (_, i) => String(i));
      const awayNumbers = Array.from({ length: 10 }, (_, i) => String(i));

      // Shuffle both arrays
      const shuffle = (arr) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffledHome = shuffle(homeNumbers);
      const shuffledAway = shuffle(awayNumbers);

      console.log(`  Home numbers: [${shuffledHome.join(', ')}]`);
      console.log(`  Away numbers: [${shuffledAway.join(', ')}]`);

      // Update board with axis numbers
      await boardDoc.ref.update({
        home_numbers: shuffledHome,
        away_numbers: shuffledAway,
        updated_time: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`  ✅ Assigned axis numbers to board ${boardDoc.id}\n`);
      updatedCount++;

      // Now update all squares for this board with the correct square values
      const squaresSnapshot = await db.collection('squares')
        .where('boardId', '==', boardDoc.id)
        .get();

      console.log(`  Updating ${squaresSnapshot.size} squares...`);

      const batch = db.batch();
      for (const squareDoc of squaresSnapshot.docs) {
        const squareData = squareDoc.data();
        const index = squareData.index;

        // Calculate row and column from index (0-99)
        const row = Math.floor(index / 10); // 0-9
        const col = index % 10; // 0-9

        // Get axis numbers
        const homeDigit = shuffledAway[row]; // Row is away
        const awayDigit = shuffledHome[col]; // Col is home

        // Square value is away + home (e.g., "47")
        const squareValue = `${awayDigit}${homeDigit}`;

        batch.update(squareDoc.ref, {
          square: squareValue
        });
      }

      await batch.commit();
      console.log(`  ✅ Updated ${squaresSnapshot.size} squares with correct square values\n`);
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Axis assignment complete!`);
    console.log(`   ✅ Boards updated: ${updatedCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  }
}

assignAxisNumbers()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

