const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';

async function fixSquareField() {
  try {
    console.log('🔧 Fixing square field in user squares...\n');

    const userRef = db.doc(`users/${TEST_USER_ID}`);
    
    // Get all user squares
    const squares = await db.collection('squares')
      .where('userID', '==', userRef)
      .get();
    
    console.log(`Found ${squares.size} squares to fix\n`);
    
    let fixedCount = 0;
    const batchSize = 500;
    let batch = db.batch();
    let operationCount = 0;
    
    for (const squareDoc of squares.docs) {
      const data = squareDoc.data();
      
      // Remove the incorrect square field
      batch.update(squareDoc.ref, {
        square: admin.firestore.FieldValue.delete()
      });
      
      operationCount++;
      fixedCount++;
      
      // Commit batch every 500 operations
      if (operationCount >= batchSize) {
        await batch.commit();
        console.log(`  Committed batch of ${operationCount} operations...`);
        batch = db.batch();
        operationCount = 0;
      }
    }
    
    // Commit remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`  Committed final batch of ${operationCount} operations...`);
    }
    
    console.log(`\n✅ Fixed ${fixedCount} squares - removed incorrect square field`);
    console.log('\nNote: square field will be properly calculated when board axis numbers are assigned');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixSquareField()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

