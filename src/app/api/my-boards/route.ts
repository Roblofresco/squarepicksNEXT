import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldPath } from 'firebase-admin/firestore';

// Force Node.js runtime (firebase-admin is not supported on Edge)
export const runtime = 'nodejs';
// Avoid caching since this depends on auth and live data
export const dynamic = 'force-dynamic';

// Optional feature flag: fall back to simpler logic to avoid 500s in prod during migration
const FALLBACK_MY_BOARDS = process.env.MY_BOARDS_FALLBACK === '1';

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
    console.log(`[API] Fetching all boards for user: ${userId}`);

    // Step 1: Query user's squares from top-level squares collection
    const userRef = db.doc(`users/${userId}`);
    console.log(`[API] Querying user's squares from top-level squares collection...`);

    const userSquaresSnap = await db.collection('squares')
      .where('userID', '==', userRef)
        .get();

    console.log(`[API] Found ${userSquaresSnap.size} squares for user`);

    if (userSquaresSnap.empty) {
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

    // Extract unique board IDs and group squares by board
    const boardIds = new Set<string>();
    const squaresByBoard = new Map<string, any[]>();
    
    userSquaresSnap.forEach(doc => {
      const data = doc.data();
      const boardId = data.boardId;
      if (boardId) {
        boardIds.add(boardId);
        if (!squaresByBoard.has(boardId)) {
          squaresByBoard.set(boardId, []);
        }
        squaresByBoard.get(boardId)!.push({
          index: data.index || 0,
          isUserSquare: true,
          square: data.square || undefined
        });
      }
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

    // Fetch boards by ID directly (avoid 'in' operator limits and index issues)
    const boardSnaps = await Promise.all(
      boardIdArray.map(id => db.doc(`boards/${id}`).get())
    );
    const allBoards = boardSnaps.filter(snap => snap.exists);

    // If fallback enabled, build a minimal response without fetching games/teams
    if (FALLBACK_MY_BOARDS) {
      // Return all boards - frontend will filter by status
      const filtered = allBoards;

      const boards = filtered.map(b => {
        const bd = (b.data() as any) || {};
        const userSquares = squaresByBoard.get(b.id) || [];
        return {
          id: b.id,
          gameId: bd?.gameID?.id || b.id,
          homeTeam: { name: 'Home', initials: 'HM' },
          awayTeam: { name: 'Away', initials: 'AW' },
          gameDateTime: bd?.startTime?.toDate?.()?.toISOString() || bd?.created_time?.toDate?.()?.toISOString() || new Date().toISOString(),
          status: bd?.status,
          amount: bd?.amount || 0,
          stake: bd?.amount || 0,
          pot: bd?.pot || (bd?.amount * 80) || 0,
          is_live: false,
          broadcast_provider: undefined,
          sport: bd?.sport || 'NFL',
          league: bd?.league || 'NFL',
          userSquareCount: userSquares.length,
          isFull: userSquares.length === 100,
          selected_indexes_on_board: bd?.selected_indexes || [],
          totalSquareCount: 100,
          userPickedSquares: userSquares,
          q1_winning_square: bd?.q1_winning_square,
          q2_winning_square: bd?.q2_winning_square,
          q3_winning_square: bd?.q3_winning_square,
          q4_winning_square: bd?.q4_winning_square,
          q1_winning_index: bd?.q1_winning_index,
          q2_winning_index: bd?.q2_winning_index,
          q3_winning_index: bd?.q3_winning_index,
          q4_winning_index: bd?.q4_winning_index,
          userWon_q1: bd?.userWon_q1 || false,
          userWon_q2: bd?.userWon_q2 || false,
          userWon_q3: bd?.userWon_q3 || false,
          userWon_final: bd?.userWon_final || false,
        };
      });

      return NextResponse.json({ success: true, boards, timestamp: Date.now() }, {
        headers: {
          'Cache-Control': 'private, max-age=120',
          'X-MyBoards-Fallback': '1'
        }
      });
    }

    // Step 3: Return all boards - frontend will filter by status client-side
    const filteredBoards = allBoards;
    console.log(`[API] Returning ${filteredBoards.length} boards (all statuses)`);

    // Step 4: Batch fetch related documents (games & teams)
    const gameRefs = new Map<string, any>();
    filteredBoards.forEach(doc => {
      const gameID = (doc.data() as any)?.gameID;
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
      if (gameDoc && gameDoc.exists) {
        const data = (gameDoc.data?.() as any) || {};
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
      const boardData = (boardDoc.data() as any) || {};
      const gameData = gameDataMap.get(boardData.gameID?.path);
      
      const homeTeam = gameData?.homeTeam?.path 
        ? teamDataMap.get(gameData.homeTeam.path)
        : null;
      const awayTeam = gameData?.awayTeam?.path 
        ? teamDataMap.get(gameData.awayTeam.path)
        : null;
      
      // Get user's squares for this board from the grouped map
      const userSquares = squaresByBoard.get(boardDoc.id) || [];

      const userSquareCount = userSquares.length;
      const isFull = userSquareCount === 100;

        return {
          id: boardDoc.id,
          gameId: gameData?.id || boardData.gameID?.id || boardDoc.id,
          homeTeam: homeTeam || { name: 'Team A', initials: 'TA', logo: undefined },
          awayTeam: awayTeam || { name: 'Team B', initials: 'TB', logo: undefined },
          gameDateTime: gameData?.startTime?.toDate?.()?.toISOString() || boardData.created_time?.toDate?.()?.toISOString() || new Date().toISOString(),
        status: boardData?.status,
        amount: boardData?.amount || 0,
        stake: boardData?.amount || 0, // Add stake field for consistency
        pot: boardData?.pot || (boardData?.amount * 80) || 0,
          is_live: gameData?.status === 'live' || false,
          broadcast_provider: gameData?.broadcast_provider || undefined,
          sport: gameData?.sport || 'NFL',
          league: gameData?.league || 'NFL',
          userSquareCount,
          isFull,
        selected_indexes_on_board: boardData?.selected_indexes || [],
          totalSquareCount: 100,
          // For UI display
        userPickedSquares: userSquares,
          // Quarter winners (if available)
        q1_winning_square: boardData?.q1_winning_square,
        q2_winning_square: boardData?.q2_winning_square,
        q3_winning_square: boardData?.q3_winning_square,
        q4_winning_square: boardData?.q4_winning_square,
        q1_winning_index: boardData?.q1_winning_index,
        q2_winning_index: boardData?.q2_winning_index,
        q3_winning_index: boardData?.q3_winning_index,
        q4_winning_index: boardData?.q4_winning_index,
          // User win status
        userWon_q1: boardData?.userWon_q1 || false,
        userWon_q2: boardData?.userWon_q2 || false,
        userWon_q3: boardData?.userWon_q3 || false,
        userWon_final: boardData?.userWon_final || false,
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

  } catch (error: any) {
    const message = error?.message || 'Internal server error';
    const code = error?.code || 'UNKNOWN';
    console.error('[API] Error in my-boards route:', code, message, error);
    // Soft-fail to avoid breaking the page
    return NextResponse.json(
      { success: true, boards: [], timestamp: Date.now() },
      { headers: { 'X-MyBoards-Error': `${code}:${message}` } }
    );
  }
}
