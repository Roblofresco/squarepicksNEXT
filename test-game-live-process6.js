const admin = require('firebase-admin');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'square-picks-vpbb8d' });
}

const db = admin.firestore();

// Test configuration from Process 5
const GAME_ID = '401772766'; // Colts vs Steelers, Nov 2, 1:00 PM
const FULL_BOARD_ID = '4MQZfMeUuxcD1mS6hpFd'; // Colts $5 board (status: 'full')
const TEST_USER_ID = '0CUDUtFMoTWujVvQuSlGaWG9fwP2';
const BOARD_AMOUNT = 5; // $5 board

let unfilledBoardId = null;

/**
 * Attempt to set kill switch via Firebase CLI
 */
async function setKillSwitch(attempt = 1) {
  try {
    console.log(`\n🔄 Attempt ${attempt}: Setting kill switch (DISABLE_LIVE_UPDATES=true)...`);
    
    // Try setting via Firebase CLI
    const { stdout, stderr } = await execAsync(
      'firebase functions:config:set disable_live_updates=true',
      { cwd: __dirname }
    );
    
    if (stderr && !stderr.includes('Using firebase-tools')) {
      console.warn(`⚠️  Warning from Firebase CLI: ${stderr}`);
    }
    
    console.log('✅ Kill switch set via Firebase CLI');
    console.log('⚠️  Note: Functions may need to be redeployed for environment variable changes to take effect');
    console.log('⚠️  For testing purposes, scheduled function should still be disabled');
    
    return true;
  } catch (error) {
    console.error(`❌ Attempt ${attempt} failed:`, error.message);
    
    if (attempt < 2) {
      console.log('🔄 Retrying with alternative method...');
      // Could try alternative method here
      return false;
    }
    
    console.warn('⚠️  Kill switch setup failed after 2 attempts');
    console.warn('⚠️  Proceeding with test - scheduled function may interfere');
    return false;
  }
}

/**
 * Verify game and board setup
 */
async function verifySetup() {
  console.log('\n📊 Verifying test setup...');
  
  // Check game
  const gameDoc = await db.doc(`games/${GAME_ID}`).get();
  if (!gameDoc.exists) {
    throw new Error(`Game ${GAME_ID} not found`);
  }
  
  const gameData = gameDoc.data();
  console.log(`✅ Game found: ${GAME_ID}`);
  console.log(`   Status: ${gameData.status}`);
  console.log(`   isLive: ${gameData.isLive}`);
  console.log(`   Teams: ${gameData.awayTeam?.id || 'Away'} vs ${gameData.homeTeam?.id || 'Home'}`);
  
  if (gameData.status !== 'scheduled') {
    throw new Error(`Game status is '${gameData.status}', expected 'scheduled'`);
  }
  
  if (gameData.isLive !== false) {
    throw new Error(`Game isLive is ${gameData.isLive}, expected false`);
  }
  
  // Check full board
  const fullBoardDoc = await db.doc(`boards/${FULL_BOARD_ID}`).get();
  if (!fullBoardDoc.exists) {
    throw new Error(`Full board ${FULL_BOARD_ID} not found`);
  }
  
  const fullBoardData = fullBoardDoc.data();
  console.log(`✅ Full board found: ${FULL_BOARD_ID}`);
  console.log(`   Status: ${fullBoardData.status}`);
  console.log(`   Amount: $${fullBoardData.amount}`);
  console.log(`   Selected squares: ${fullBoardData.selected_indexes?.length || 0}/100`);
  
  if (fullBoardData.status !== 'full') {
    throw new Error(`Full board status is '${fullBoardData.status}', expected 'full'`);
  }
  
  if (!fullBoardData.home_numbers || !fullBoardData.away_numbers) {
    throw new Error('Full board missing axis numbers (should have been set by handleBoardFull)');
  }
  
  // Check test user
  const userDoc = await db.doc(`users/${TEST_USER_ID}`).get();
  if (!userDoc.exists) {
    throw new Error(`Test user ${TEST_USER_ID} not found`);
  }
  
  const userData = userDoc.data();
  const initialBalance = userData.balance || 0;
  console.log(`✅ Test user found: ${TEST_USER_ID}`);
  console.log(`   Initial wallet balance: $${initialBalance.toFixed(2)}`);
  
  return { initialBalance, gameData, fullBoardData };
}

/**
 * Create unfilled board for testing
 */
async function createUnfilledBoard() {
  console.log('\n🏗️  Creating unfilled board for testing...');
  
  const gameRef = db.doc(`games/${GAME_ID}`);
  const userRef = db.doc(`users/${TEST_USER_ID}`);
  
  // Create board with 15 selected squares
  const selectedIndexes = [10, 11, 12, 13, 14, 20, 21, 22, 30, 31, 32, 40, 41, 42, 50];
  
  const newBoardRef = db.collection('boards').doc();
  await newBoardRef.set({
    gameID: gameRef,
    amount: BOARD_AMOUNT,
    status: 'open',
    selected_indexes: selectedIndexes,
    pot: BOARD_AMOUNT * 80,
    payout: BOARD_AMOUNT * 20,
    currency: 'USD',
    created_time: admin.firestore.FieldValue.serverTimestamp(),
    updated_time: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  unfilledBoardId = newBoardRef.id;
  console.log(`✅ Created unfilled board: ${unfilledBoardId}`);
  console.log(`   Selected squares: ${selectedIndexes.length} (indexes: ${selectedIndexes.join(', ')})`);
  
  // Create square documents for test user
  console.log('\n📦 Creating square documents for test user...');
  const batch = db.batch();
  
  for (const index of selectedIndexes) {
    const squareRef = db.collection('squares').doc();
    batch.set(squareRef, {
      userID: userRef,
      index: index,
      boardId: unfilledBoardId,
      gameId: GAME_ID,
      created_time: admin.firestore.FieldValue.serverTimestamp(),
      updated_time: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  
  await batch.commit();
  console.log(`✅ Created ${selectedIndexes.length} square documents`);
  
  // Calculate expected refund
  const expectedRefund = BOARD_AMOUNT * selectedIndexes.length;
  console.log(`💰 Expected refund amount: $${expectedRefund.toFixed(2)} (${selectedIndexes.length} squares × $${BOARD_AMOUNT})`);
  
  return { unfilledBoardId, selectedIndexes, expectedRefund };
}

/**
 * Trigger game to go live
 */
async function triggerGameLive() {
  console.log('\n🚀 Triggering game to go live...');
  console.log('   This will trigger onGameLiveCloseBoardsAndRefund Cloud Function');
  
  const gameRef = db.doc(`games/${GAME_ID}`);
  await gameRef.update({
    isLive: true,
    status: 'in_progress',
    quarter: 1,
    homeScore: 0,
    awayScore: 0,
    timeRemaining: '15:00',
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  console.log('✅ Game document updated: isLive = true');
  console.log('⏳ Waiting 10 seconds for Cloud Function to execute...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Re-check game to ensure update was processed
  const gameRef = db.doc(`games/${GAME_ID}`);
  const gameCheck = await gameRef.get();
  const gameCheckData = gameCheck.data();
  console.log(`   Game isLive after wait: ${gameCheckData.isLive}`);
}

/**
 * Verify unfilled board closure and refunds
 */
async function verifyUnfilledBoardClosure(expectedRefund, initialBalance) {
  console.log('\n🔍 Verifying unfilled board closure and refunds...');
  
  const boardDoc = await db.doc(`boards/${unfilledBoardId}`).get();
  const boardData = boardDoc.data();
  
  console.log(`\n📋 Unfilled Board Verification:`);
  console.log(`   Board ID: ${unfilledBoardId}`);
  console.log(`   Status: ${boardData.status} (expected: 'unfilled')`);
  
  // Check status
  if (boardData.status !== 'unfilled') {
    console.error(`❌ Status is '${boardData.status}', expected 'unfilled'`);
  } else {
    console.log('   ✅ Status correctly changed to "unfilled"');
  }
  
  // Check closure timestamp
  if (!boardData.closed_at) {
    console.error('   ❌ Missing closed_at timestamp');
  } else {
    console.log('   ✅ closed_at timestamp present');
  }
  
  // Check closure reason
  if (boardData.closure_reason !== 'game_started_unfilled') {
    console.error(`   ❌ closure_reason is '${boardData.closure_reason}', expected 'game_started_unfilled'`);
  } else {
    console.log('   ✅ closure_reason correctly set');
  }
  
  // Check user wallet balance
  const userDoc = await db.doc(`users/${TEST_USER_ID}`).get();
  const userData = userDoc.data();
  const newBalance = userData.balance || 0;
  const balanceIncrease = newBalance - initialBalance;
  
  console.log(`\n💰 Wallet Balance Verification:`);
  console.log(`   Initial balance: $${initialBalance.toFixed(2)}`);
  console.log(`   New balance: $${newBalance.toFixed(2)}`);
  console.log(`   Increase: $${balanceIncrease.toFixed(2)} (expected: $${expectedRefund.toFixed(2)})`);
  
  if (Math.abs(balanceIncrease - expectedRefund) > 0.01) {
    console.error(`   ❌ Balance increase doesn't match expected refund`);
  } else {
    console.log('   ✅ Wallet balance correctly increased');
  }
  
  // Check refund transaction (simplified query to avoid index requirement)
  console.log(`\n💳 Transaction Verification:`);
  const transactionsSnap = await db.collection('transactions')
    .where('userID', '==', TEST_USER_ID)
    .where('type', '==', 'refund')
    .where('boardId', '==', unfilledBoardId)
    .get();
  
  if (transactionsSnap.empty) {
    console.error('   ❌ No refund transaction found');
  } else {
    // Sort by timestamp manually if needed
    const transactions = transactionsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toMillis?.() || 0 }))
      .sort((a, b) => b.timestamp - a.timestamp);
    
    const txDoc = transactions[0];
    console.log(`   ✅ Refund transaction found: ${txDoc.id}`);
    console.log(`      Amount: $${txDoc.amount.toFixed(2)}`);
    console.log(`      Status: ${txDoc.status}`);
    
    if (txDoc.amount !== expectedRefund) {
      console.error(`      ❌ Transaction amount doesn't match expected refund`);
    }
  }
  
  // Check refund notification (simplified query to avoid index requirement)
  console.log(`\n📬 Notification Verification:`);
  const notificationsSnap = await db.collection('notifications')
    .where('userID', '==', TEST_USER_ID)
    .where('type', '==', 'refund')
    .where('boardId', '==', unfilledBoardId)
    .get();
  
  if (notificationsSnap.empty) {
    console.error('   ❌ No refund notification found');
  } else {
    const notifDoc = notificationsSnap.docs[0];
    const notifData = notifDoc.data();
    console.log(`   ✅ Refund notification found: ${notifDoc.id}`);
    console.log(`      Title: ${notifData.title}`);
    console.log(`      Message: ${notifData.message}`);
  }
  
  return {
    boardStatus: boardData.status,
    hasClosedAt: !!boardData.closed_at,
    closureReason: boardData.closure_reason,
    balanceIncrease,
    expectedRefund,
    hasRefundTransaction: !transactionsSnap.empty,
    hasRefundNotification: !notificationsSnap.empty,
  };
}

/**
 * Verify full board activation
 */
async function verifyFullBoardActivation() {
  console.log('\n🔍 Verifying full board activation...');
  
  const boardDoc = await db.doc(`boards/${FULL_BOARD_ID}`).get();
  const boardData = boardDoc.data();
  
  console.log(`\n📋 Full Board Verification:`);
  console.log(`   Board ID: ${FULL_BOARD_ID}`);
  console.log(`   Status: ${boardData.status} (expected: 'active')`);
  
  // Check status
  if (boardData.status !== 'active') {
    console.error(`❌ Status is '${boardData.status}', expected 'active'`);
  } else {
    console.log('   ✅ Status correctly changed to "active"');
  }
  
  // Check activation timestamp
  if (!boardData.activated_at) {
    console.error('   ❌ Missing activated_at timestamp');
  } else {
    console.log('   ✅ activated_at timestamp present');
  }
  
  // Verify board data intact
  if (!boardData.home_numbers || !boardData.away_numbers) {
    console.error('   ❌ Missing axis numbers');
  } else {
    console.log('   ✅ Axis numbers intact');
    console.log(`      Home numbers: [${boardData.home_numbers.join(', ')}]`);
    console.log(`      Away numbers: [${boardData.away_numbers.join(', ')}]`);
  }
  
  if (!boardData.selected_indexes || boardData.selected_indexes.length !== 100) {
    console.error(`   ❌ Selected indexes incorrect: ${boardData.selected_indexes?.length || 0}/100`);
  } else {
    console.log('   ✅ Selected indexes intact (100/100)');
  }
  
  // Check for activation notification (if it exists)
  console.log(`\n📬 Activation Notification Check:`);
  // Note: Function may not create notification for activation - this is expected behavior per user request
  console.log('   ℹ️  Note: Activation notification may not be implemented (per user feedback)');
  
  return {
    boardStatus: boardData.status,
    hasActivatedAt: !!boardData.activated_at,
    hasAxisNumbers: !!(boardData.home_numbers && boardData.away_numbers),
    hasAllSquares: boardData.selected_indexes?.length === 100,
  };
}

/**
 * Verify game document updates
 */
async function verifyGameUpdates() {
  console.log('\n🔍 Verifying game document updates...');
  
  const gameDoc = await db.doc(`games/${GAME_ID}`).get();
  const gameData = gameDoc.data();
  
  console.log(`\n📋 Game Document Verification:`);
  console.log(`   Game ID: ${GAME_ID}`);
  console.log(`   isLive: ${gameData.isLive} (expected: true)`);
  console.log(`   Status: ${gameData.status} (expected: 'in_progress' or similar)`);
  console.log(`   Quarter: ${gameData.quarter} (expected: 1)`);
  
  if (gameData.isLive !== true) {
    console.error('   ❌ isLive is not true');
  } else {
    console.log('   ✅ isLive correctly set to true');
  }
  
  if (!gameData.status || gameData.status === 'scheduled') {
    console.error(`   ❌ Status still 'scheduled', expected 'in_progress' or similar`);
  } else {
    console.log(`   ✅ Status updated to '${gameData.status}'`);
  }
  
  return {
    isLive: gameData.isLive === true,
    statusUpdated: gameData.status !== 'scheduled',
    quarter: gameData.quarter,
  };
}

/**
 * Cleanup: Unset kill switch
 */
async function cleanup() {
  console.log('\n🧹 Cleaning up...');
  
  try {
    await execAsync(
      'firebase functions:config:unset disable_live_updates',
      { cwd: __dirname }
    );
    console.log('✅ Kill switch unset');
  } catch (error) {
    console.warn('⚠️  Failed to unset kill switch:', error.message);
    console.warn('⚠️  You may need to manually unset it: firebase functions:config:unset disable_live_updates');
  }
}

/**
 * Main test function
 */
async function testProcess6() {
  try {
    console.log('🎯 Testing Process 6: Game Start & Live Updates');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Step 1: Set kill switch (max 2 attempts)
    const killSwitchSet = await setKillSwitch(1);
    if (!killSwitchSet) {
      await setKillSwitch(2);
    }
    
    // Step 2: Verify setup
    const { initialBalance } = await verifySetup();
    
    // Step 3: Create unfilled board
    const { expectedRefund } = await createUnfilledBoard();
    
    // Step 4: Trigger game to go live
    await triggerGameLive();
    
    // Step 5: Verify unfilled board closure
    const unfilledResults = await verifyUnfilledBoardClosure(expectedRefund, initialBalance);
    
    // Step 6: Verify full board activation
    const fullBoardResults = await verifyFullBoardActivation();
    
    // Step 7: Verify game document updates
    const gameResults = await verifyGameUpdates();
    
    // Step 8: Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('✅ Unfilled Board Closure:');
    console.log(`   Status transition: ${unfilledResults.boardStatus === 'unfilled' ? '✅' : '❌'}`);
    console.log(`   closed_at timestamp: ${unfilledResults.hasClosedAt ? '✅' : '❌'}`);
    console.log(`   closure_reason: ${unfilledResults.closureReason === 'game_started_unfilled' ? '✅' : '❌'}`);
    console.log(`   Refund amount: ${Math.abs(unfilledResults.balanceIncrease - unfilledResults.expectedRefund) < 0.01 ? '✅' : '❌'}`);
    console.log(`   Refund transaction: ${unfilledResults.hasRefundTransaction ? '✅' : '❌'}`);
    console.log(`   Refund notification: ${unfilledResults.hasRefundNotification ? '✅' : '❌'}`);
    
    console.log('\n✅ Full Board Activation:');
    console.log(`   Status transition: ${fullBoardResults.boardStatus === 'active' ? '✅' : '❌'}`);
    console.log(`   activated_at timestamp: ${fullBoardResults.hasActivatedAt ? '✅' : '❌'}`);
    console.log(`   Axis numbers intact: ${fullBoardResults.hasAxisNumbers ? '✅' : '❌'}`);
    console.log(`   All squares intact: ${fullBoardResults.hasAllSquares ? '✅' : '❌'}`);
    
    console.log('\n✅ Game Document Updates:');
    console.log(`   isLive = true: ${gameResults.isLive ? '✅' : '❌'}`);
    console.log(`   Status updated: ${gameResults.statusUpdated ? '✅' : '❌'}`);
    console.log(`   Quarter set: ${gameResults.quarter === 1 ? '✅' : '❌'}`);
    
    console.log('\n📋 Test IDs for Documentation:');
    console.log(`   Game ID: ${GAME_ID}`);
    console.log(`   Full Board ID: ${FULL_BOARD_ID}`);
    console.log(`   Unfilled Board ID: ${unfilledBoardId}`);
    console.log(`   Test User ID: ${TEST_USER_ID}`);
    
    // Cleanup
    await cleanup();
    
    console.log('\n✨ Process 6 test script completed');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testProcess6()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

