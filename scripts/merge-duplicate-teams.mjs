import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('../certificates/firebase-admin-key.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://square-picks-vpbb8d.firebaseio.com'
});

const db = admin.firestore();

// Mapping: { newTeamId: oldTeamId } for NFL teams only
const teamMapping = {
  // New teams (ESPN logos, created/updated Oct 12+) → Old teams (Storage logos, sportID refs)
  '51vRc3W1qDwSBNVA6LIX': 'RDnjryTT2mkizKSm9ikl', // Baltimore Ravens
  'FwEQvJ2d2NCFZiMP8fQI': 'EQIgUZ28Cf6FrITIxWy7', // Carolina Panthers
  'GG5cJWs1ydU9qHT9qCR4': 'WOItYy5G1yRVG0fESSmF', // New England Patriots
  'HnyE2HWp2WEvQKBbC5rx': 'DjbPCyd97B5OqLNRGsym', // Denver Broncos
  'L2jzyVnm82FshlVqOXAz': 'NGTMc6cY1ZCdDOJx93RP', // Washington Commanders
  'LytgR0vWia3xCsbX5SAw': 'M81pkB3UYIsVdy8YyjlE', // Houston Texans
  'O4j0DXGDapOHYloDP5yI': 'pOPmOJG8juYhDHPhABTZ', // New Orleans Saints
  'O80ekrd4Ra0KNUBdnQ3J': 'KP13Gr1Pcl0v1E4beCZg', // Detroit Lions
  'OxpvLA5Oxl9LY560v7zP': 'R2h9AzWrdhqH23x3j3NW', // Chicago Bears (need to find old)
  'QyusLutREIDJRqOfCA4A': 'V4yqAwq5XzJFpTsTB4Fe', // Miami Dolphins
  'UbcwegB0R55c7yX4eW1z': 'ABZ1RckHosMndz32YZ1e', // Indianapolis Colts
  'Vc3rmthzwzHr8RXpZNPp': 'V99Z9G2U2MXSr6E85IBY', // Los Angeles Rams
  'XNOcM3LzgG8xY92l1aId': 'ItcC7vuurg0AxNlZylsu', // Green Bay Packers
  'XTKokiVLJRUXJg2P77Nw': 'R2h9AzWrdhqH23x3j3NW', // Cincinnati Bengals
  'XtTrfHEtD5MJebyeeScK': null, // Tampa Bay Buccaneers (find old)
  'YQbBmODVv5xeaFWMMkrn': 'LWxconGs3OxmsVyLx8xM', // Kansas City Chiefs
  'a9i8KLcbnJR8J0cmz3hf': 'NY4cLLiBKYInCKqdUyeH', // Arizona Cardinals
  'ahlbQv4L0aUNd8TmUqUP': 'aLErKrB7OpP0tEsJHAvQ', // Minnesota Vikings
  'dVCOKGl8IsAP7VxBDWnM': null, // Cleveland Browns (find old)
  'dpPvMTHOaLH9vPlxl6Sl': null, // Seattle Seahawks (find old)
  'enrtAXUhqGauUoyT8o5n': 'XlimffsRX1wQd3YFTXeH', // Tennessee Titans
  'fuMY59wlDsj3MkdSLW8k': '9cPsRpvGcXcXPPY2ZcK8', // New York Jets
  'iUUnAIgOk5aINUj99Hu0': null, // Dallas Cowboys (find old)
  'kygW1kEawhvqzDnzlAOq': 'nfRohFoPZESru1p0ynXG', // New York Giants
  'oTnSKRUzrIJDSOdhkF47': 'iz2nI7o69RLo2Upbid3N', // Jacksonville Jaguars
  'qBJ0nB1huKhUbgKd1fTd': '1m0J9SlMFNkNbtubwAX8', // Philadelphia Eagles
  'qELAttOPcrt5HKk5br3m': 'RUIBcaJ0TNPQadLB9iu7', // San Francisco 49ers
  'ttlT5U9UcjAJwpY3AcGB': 'ubbWz7RJZNUJbdGY9daA', // Atlanta Falcons
  'u2a10PlOYLg1l81A0aRw': 'NfejodWx0OxUQPxBwSfe', // Pittsburgh Steelers
  'vTV4SNcKOcdahd6QJHU2': 'T222VgdaBavKnSNynsKY', // Los Angeles Chargers
  'zfhrIPVFLlNIbFU4IKqA': null, // Buffalo Bills (find old)
  '14ZKx8KbtUJUPiTtmVD0': 'DoPUkuHQ8QyzjvnhbJG3', // Las Vegas Raiders (already enriched)
};

async function main() {
  console.log('🔄 Starting team merge process...\n');

  // Step 1: Fetch all new teams to get ESPN IDs
  console.log('📥 Fetching new team data...');
  const newTeamIds = Object.keys(teamMapping);
  const newTeamDocs = await Promise.all(
    newTeamIds.map(id => db.collection('teams').doc(id).get())
  );
  const newTeamsData = {};
  newTeamDocs.forEach(doc => {
    if (doc.exists) {
      newTeamsData[doc.id] = doc.data();
    }
  });

  // Step 2: Enrich old teams with ESPN data
  console.log('\n✏️  Enriching old teams with externalIds.espn and abbrev...');
  const batch1 = db.batch();
  let enrichCount = 0;

  for (const [newId, oldId] of Object.entries(teamMapping)) {
    if (!oldId || !newTeamsData[newId]) continue;
    
    const oldTeamRef = db.collection('teams').doc(oldId);
    const enrichData = {
      sport: 'NFL',
      abbrev: newTeamsData[newId].abbrev,
      externalIds: { espn: newTeamsData[newId].externalIds?.espn || '' },
      updated_time: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    batch1.update(oldTeamRef, enrichData);
    enrichCount++;
    console.log(`  ✅ ${newTeamsData[newId].full_name} (${oldId})`);
    
    if (enrichCount % 500 === 0) {
      await batch1.commit();
      console.log(`  💾 Committed batch of ${enrichCount} updates`);
    }
  }

  if (enrichCount % 500 !== 0) {
    await batch1.commit();
    console.log(`  💾 Committed final batch (${enrichCount} total enrichments)\n`);
  }

  // Step 3: Remap game team refs
  console.log('🔄 Remapping game team references...');
  const gamesSnap = await db.collection('games')
    .where('sport', '==', 'NFL')
    .get();
  
  const batch2 = db.batch();
  let remapCount = 0;

  for (const gameDoc of gamesSnap.docs) {
    const gameData = gameDoc.data();
    let needsUpdate = false;
    const updates = {};

    if (gameData.awayTeam && teamMapping[gameData.awayTeam.id]) {
      const oldTeamId = teamMapping[gameData.awayTeam.id];
      if (oldTeamId) {
        updates.awayTeam = db.collection('teams').doc(oldTeamId);
        needsUpdate = true;
      }
    }

    if (gameData.homeTeam && teamMapping[gameData.homeTeam.id]) {
      const oldTeamId = teamMapping[gameData.homeTeam.id];
      if (oldTeamId) {
        updates.homeTeam = db.collection('teams').doc(oldTeamId);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      batch2.update(gameDoc.ref, updates);
      remapCount++;
      console.log(`  ✅ ${gameDoc.id}: remapped team refs`);
    }

    if (remapCount % 500 === 0 && remapCount > 0) {
      await batch2.commit();
      console.log(`  💾 Committed batch of ${remapCount} game updates`);
    }
  }

  if (remapCount % 500 !== 0 && remapCount > 0) {
    await batch2.commit();
    console.log(`  💾 Committed final batch (${remapCount} total game remaps)\n`);
  }

  // Step 4: Delete new duplicate teams
  console.log('🗑️  Deleting new duplicate team docs...');
  const batch3 = db.batch();
  let deleteCount = 0;

  for (const newId of newTeamIds) {
    if (teamMapping[newId]) { // Only delete if we have a mapping
      batch3.delete(db.collection('teams').doc(newId));
      deleteCount++;
      console.log(`  ❌ ${newTeamsData[newId]?.full_name || newId}`);
    }
  }

  if (deleteCount > 0) {
    await batch3.commit();
    console.log(`  💾 Deleted ${deleteCount} duplicate teams\n`);
  }

  console.log('✅ Team merge complete!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Enriched: ${enrichCount} old teams`);
  console.log(`   - Remapped: ${remapCount} games`);
  console.log(`   - Deleted: ${deleteCount} new teams`);
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

