require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

(async () => {
  const gameRef = db.doc('games/401772944');
  const boardsSnap = await db.collection('boards').where('gameID', '==', gameRef).get();
  
  console.log(`Found ${boardsSnap.size} board(s) for game 401772944:\n`);
  console.log('Current board statuses:');
  const statusGroups = {};
  boardsSnap.docs.forEach(doc => {
    const d = doc.data();
    const status = d.status || 'unknown';
    if (!statusGroups[status]) statusGroups[status] = [];
    statusGroups[status].push({ id: doc.id, amount: d.amount });
    console.log(`  ${doc.id}: ${status} ($${d.amount})`);
  });
  console.log('\nSummary by status:');
  Object.entries(statusGroups).forEach(([status, boards]) => {
    console.log(`  ${status}: ${boards.length} board(s)`);
  });
  process.exit(0);
})();

