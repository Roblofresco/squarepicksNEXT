const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();

(async () => {
  const games = await db.collection('games')
    .where('status', 'in', ['live', 'in_progress', 'scheduled'])
    .get();
  
  console.log('Live/Scheduled Games and Their Full Boards:\n');
  
  for (const g of games.docs) {
    const boards = await db.collection('boards')
      .where('gameID', '==', g.ref)
      .where('status', 'in', ['full', 'active'])
      .get();
    
    console.log(`${g.id} (${g.data().status}): ${boards.size} full boards`);
    for (const b of boards.docs) {
      console.log(`  - Board ${b.id}: $${b.data().amount}`);
    }
  }
  
  process.exit(0);
})();

