import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';
import { getAuth, getFirestore } from 'firebase-admin/auth';

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
    console.log(`[API] Fetching boards for user: ${userId}`);

    // Get all active boards
    const boardsQuery = await db.collection('boards')
      .where('status', 'in', ['open', 'full', 'active'])
      .get();

    console.log(`[API] Found ${boardsQuery.docs.length} total boards`);

    // Process boards in parallel to check user participation
    const boardPromises = boardsQuery.docs.map(async (boardDoc) => {
      try {
        // Check if user participates in this board
        const userSquares = await db
          .collection(`boards/${boardDoc.id}/squares`)
          .where('userID', '==', db.doc(`users/${userId}`))
          .get();

        if (userSquares.empty) {
          return null; // User doesn't participate in this board
        }

        const boardData = boardDoc.data();
        const userSquareCount = userSquares.size;
        const isFull = userSquareCount === 100;

        // Fetch game data
        let gameData = null;
        let homeTeam = null;
        let awayTeam = null;

        if (boardData.gameID) {
          try {
            const gameDoc = await boardData.gameID.get();
            if (gameDoc.exists) {
              gameData = gameDoc.data();
              
              // Fetch team data in parallel
              if (gameData.homeTeam && gameData.awayTeam) {
                const [homeTeamData, awayTeamData] = await Promise.all([
                  fetchTeamData(gameData.homeTeam),
                  fetchTeamData(gameData.awayTeam)
                ]);
                homeTeam = homeTeamData;
                awayTeam = awayTeamData;
              }
            }
          } catch (error) {
            console.error(`[API] Error fetching game data for board ${boardDoc.id}:`, error);
          }
        }

        // Return only necessary data
        return {
          id: boardDoc.id,
          gameId: gameData?.id || boardData.gameID?.id || '',
          homeTeam: homeTeam || { name: 'Team A', initials: 'TA', logo: undefined },
          awayTeam: awayTeam || { name: 'Team B', initials: 'TB', logo: undefined },
          gameDateTime: gameData?.dateTime || boardData.created_time?.toDate?.()?.toISOString() || new Date().toISOString(),
          status: boardData.status,
          amount: boardData.amount || 0,
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
          userPickedSquares: userSquares.docs.map(doc => ({
            index: doc.data().index || 0,
            isUserSquare: true,
            square: doc.data().square || undefined
          })),
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
      } catch (error) {
        console.error(`[API] Error processing board ${boardDoc.id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(boardPromises);
    const validBoards = results.filter(Boolean);

    console.log(`[API] Returning ${validBoards.length} boards for user ${userId}`);

    return NextResponse.json({
      success: true,
      boards: validBoards,
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
