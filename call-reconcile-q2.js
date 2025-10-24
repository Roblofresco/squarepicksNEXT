const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function callReconcileQ2() {
  try {
    console.log('Calling reconcileGameWinners for Q2...');
    
    // Import the function
    const { reconcileGameWinners } = require('./C:/Users/robeo/Documents/cloud-funcs/SquarePicks/functions/index.js');
    
    // Call the function
    const result = await reconcileGameWinners({
      data: {
        gameId: 'IrFea4elfrIgdBfRinXL',
        period: 'q2'
      }
    }, {
      auth: {
        uid: '0CUDUtFMoTWujVvQuSlGaWG9fwP2'
      }
    });
    
    console.log('Reconcile result:', result);
    
    // Check if Q2 win document was created
    const winsSnapshot = await db.collection('users/0CUDUtFMoTWujVvQuSlGaWG9fwP2/wins')
      .where('__name__', '>=', 'cekFVppdsCmWj3yntq9Y_')
      .where('__name__', '<=', 'cekFVppdsCmWj3yntq9Y_\uf8ff')
      .get();
    
    console.log('Test board win documents after reconcile:');
    winsSnapshot.docs.forEach(doc => {
      console.log('- ' + doc.id + ':', doc.data());
    });
    
  } catch (error) {
    console.error('Error calling reconcile:', error);
  }
}

callReconcileQ2()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
