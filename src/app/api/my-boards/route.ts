import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const adminApp = initAdmin();
const db = getFirestore(adminApp);

// Helper function to fetch team data
async function fetchTeamData(teamRef: any) {
  try {
    const teamDoc = await teamRef.get();
    if (!teamDoc.exists) {
      return { name: 'Unknown', initials: 'UNK', logo: undefined };
    }
    
    const data = teamDoc.data();
    return {
      id: teamDoc.id,
      name: data.name || 'Unknown',
      fullName: data.full_name || data.name || 'Unknown',
      initials: data.initials || 'UNK',
      record: data.record || '0-0',
      logo: data.logo || undefined,
      color: data.color || undefined,
      seccolor: data.seccolor || undefined,
    };
  } catch (error) {
    console.error('Error fetching team data:', error);
    return { name: 'Unknown', initials: 'UNK', logo: undefined };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const tab = request.nextUrl.searchParams.get('tab') || 'active';
    console.log(`[API] Fetching ${tab} boards for user: ${userId}`);

    // Step 1: Query ONLY user's squares across all boards using collection group
    const userRef = db.doc(`users/${userId}`);
    console.log(`[API] Querying user's squares with collection group...`);
    
    let userSquaresQuery;
    try {
      userSquaresQuery = await db.collectionGroup('squares')
        .where('userID', '==', userRef)
        .get();
      console.log(`[API] Found ${userSquaresQuery.docs.length} squares owned by user`);
    } catch (error) {
      console.error(`[API] Error querying user squares:`, error);
      return NextResponse.json({ error: 'Failed to query user squares' }, { status: 500 });
    }

    if (userSquaresQuery.empty) {
      console.log(`[API] User has no squares, returning empty result`);
      return NextResponse.json({
        success: true,
        boards: [],
        timestamp: Date.now()
      }, {
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      });
    }

    // Extract unique board IDs from user's squares
    const boardIds = new Set<string>();
    userSquaresQuery.docs.forEach(doc => {
      const boardId = doc.ref.parent.parent?.id;
      if (boardId) boardIds.add(boardId);
    });

    console.log(`[API] User participates in ${boardIds.size} boards`);

    // Step 2: Fetch boards in batches (Firestore limit: 10 per 'in' query)
    const boardIdArray = Array.from(boardIds);
    const boardBatches: any[][] = [];

    // Split into batches of 10 (Firestore 'in' operator limit)
    for (let i = 0; i < boardIdArray.length; i += 10) {
      const batch = boardIdArray.slice(i, i + 10);
      boardBatches.push(batch);
    }

    // Fetch boards in parallel batches
    const boardDocs = await Promise.all(
      boardBatches.map(batch =>
        db.collection('boards')
          .where(FieldPath.documentId(), 'in', batch)
          .get()
      )
    );

    // Flatten results
    const allBoards = boardDocs.flatMap(snapshot => snapshot.docs);

    // Step 3: Filter by tab (active vs history)
    const activeStatuses = ['open', 'full', 'active'];
    const historyStatuses = [
      'IN_PROGRESS_Q1', 'IN_PROGRESS_Q2', 'IN_PROGRESS_Q3', 
      'IN_PROGRESS_HALFTIME', 'IN_PROGRESS_Q4', 'IN_PROGRESS_OT',
      'FINAL_WON', 'FINAL_LOST', 'CANCELLED'
    ];

    const filteredBoards = allBoards.filter(doc => {
      const status = doc.data().status;
      return tab === 'active' 
        ? activeStatuses.includes(status)
        : historyStatuses.includes(status);
    });

    console.log(`[API] Filtered to ${filteredBoards.length} boards for ${tab} tab`);

    // Step 4: Batch fetch related documents (games & teams)
    const gameRefs = new Map<string, any>();
    filteredBoards.forEach(doc => {
      const gameID = doc.data().gameID;
      if (gameID?.path) {
        gameRefs.set(gameID.path, gameID);
      }
    });

    // Batch fetch games (max 100 at a time)
    const gameRefsArray = Array.from(gameRefs.values());
    const games = gameRefsArray.length > 0 ? await db.getAll(...gameRefsArray) : [];

    // Create game data map
    const gameDataMap = new Map();
    games.forEach(gameDoc => {
      if (gameDoc.exists) {
        gameDataMap.set(gameDoc.ref.path, gameDoc.data());
      }
    });

    // Collect unique team refs from games
    const teamRefs = new Map<string, any>();
    games.forEach(gameDoc => {
      if (gameDoc.exists) {
        const data = gameDoc.data();
        if (data?.homeTeam?.path) teamRefs.set(data.homeTeam.path, data.homeTeam);
        if (data?.awayTeam?.path) teamRefs.set(data.awayTeam.path, data.awayTeam);
      }
    });

    // Batch fetch teams
    const teamRefsArray = Array.from(teamRefs.values());
    const teams = teamRefsArray.length > 0 ? await db.getAll(...teamRefsArray) : [];

    // Create team data map
    const teamDataMap = new Map();
    teams.forEach(teamDoc => {
      if (teamDoc.exists) {
        teamDataMap.set(teamDoc.ref.path, teamDoc.data());
      }
    });

    // Step 5: Build response with cached data
    const boards = filteredBoards.map(boardDoc => {
      const boardData = boardDoc.data();
      const gameData = gameDataMap.get(boardData.gameID?.path);
      
      const homeTeam = gameData?.homeTeam?.path 
        ? teamDataMap.get(gameData.homeTeam.path)
        : null;
      const awayTeam = gameData?.awayTeam?.path 
        ? teamDataMap.get(gameData.awayTeam.path)
        : null;
      
      // Get user's squares for this board from the initial query
      const userSquares = userSquaresQuery.docs
        .filter(doc => doc.ref.parent.parent?.id === boardDoc.id)
        .map(doc => ({
          index: doc.data().index || 0,
          isUserSquare: true,
          square: doc.data().square || undefined
        }));

      const userSquareCount = userSquares.length;
      const isFull = userSquareCount === 100;

      return {
        id: boardDoc.id,
        gameId: gameData?.id || boardData.gameID?.id || boardDoc.id,
        homeTeam: homeTeam || { name: 'Team A', initials: 'TA', logo: undefined },
        awayTeam: awayTeam || { name: 'Team B', initials: 'TB', logo: undefined },
        gameDateTime: gameData?.dateTime || boardData.created_time?.toDate?.()?.toISOString() || new Date().toISOString(),
        status: boardData.status,
        amount: boardData.amount || 0,
        stake: boardData.amount || 0, // Add stake field for consistency
        pot: boardData.pot || (boardData.amount * 80) || 0,
        is_live: gameData?.status === 'live' || false,
        broadcast_provider: gameData?.broadcast_provider || undefined,
        sport: gameData?.sport || 'NFL',
        league: gameData?.league || 'NFL',
        userSquareCount,
        isFull,
        selected_indexes_on_board: boardData.selected_indexes || [],
        totalSquareCount: 100,
        // For UI display
        userPickedSquares: userSquares,
        // Quarter winners (if available)
        q1_winning_square: boardData.q1_winning_square,
        q2_winning_square: boardData.q2_winning_square,
        q3_winning_square: boardData.q3_winning_square,
        q4_winning_square: boardData.q4_winning_square,
        q1_winning_index: boardData.q1_winning_index,
        q2_winning_index: boardData.q2_winning_index,
        q3_winning_index: boardData.q3_winning_index,
        q4_winning_index: boardData.q4_winning_index,
        // User win status
        userWon_q1: boardData.userWon_q1 || false,
        userWon_q2: boardData.userWon_q2 || false,
        userWon_q3: boardData.userWon_q3 || false,
        userWon_final: boardData.userWon_final || false,
      };
    });

    console.log(`[API] Returning ${boards.length} boards for user ${userId}`);

    return NextResponse.json({
      success: true,
      boards: boards,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutes cache
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });

  } catch (error) {
    console.error('[API] Error in my-boards route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
