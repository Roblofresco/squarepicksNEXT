const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function checkQ2Winner() {
  // Check user's squares
  const squaresSnap = await db.collection('squares')
    .where('boardId', '==', 'cekFVppdsCmWj3yntq9Y')
    .where('userID', '==', db.doc('users/0CUDUtFMoTWujVvQuSlGaWG9fwP2'))
    .get();
  
  console.log('User Squares:');
  squaresSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log('- Index:', data.index, '| Square:', data.square);
  });
  
  console.log('');
  console.log('User owns square "31":', squaresSnap.docs.some(doc => doc.data().square === '31'));
  
  // Check Q2 win document
  const q2WinDoc = await db.doc('users/0CUDUtFMoTWujVvQuSlGaWG9fwP2/wins/cekFVppdsCmWj3yntq9Y_q2').get();
  
  console.log('');
  console.log('Q2 Win Document Exists:', q2WinDoc.exists);
  if (q2WinDoc.exists) {
    console.log('Q2 Win Data:', q2WinDoc.data());
  }
  
  // Check all win documents for this board
  const allWinsSnap = await db.collection('users/0CUDUtFMoTWujVvQuSlGaWG9fwP2/wins')
    .where('boardId', '==', 'cekFVppdsCmWj3yntq9Y')
    .get();
  
  console.log('');
  console.log('All Win Documents for this board:');
  allWinsSnap.docs.forEach(doc => {
    console.log('- ' + doc.id + ':', doc.data());
  });
  
  process.exit(0);
}

checkQ2Winner().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
