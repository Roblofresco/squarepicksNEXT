import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

    // For now, return test data to verify the API works
    console.log(`[API] Returning test data for debugging`);
    return NextResponse.json({
      success: true,
      boards: [
        {
          id: 'test-board-1',
          gameId: 'test-game-1',
          homeTeam: { name: 'Test Team A', initials: 'TTA', logo: undefined },
          awayTeam: { name: 'Test Team B', initials: 'TTB', logo: undefined },
          gameDateTime: new Date().toISOString(),
          status: 'open',
          amount: 5,
          pot: 400,
          is_live: false,
          sport: 'NFL',
          league: 'NFL',
          userSquareCount: 0,
          isFull: false,
          selected_indexes_on_board: [],
          totalSquareCount: 100,
          userPickedSquares: [],
          q1_winning_square: undefined,
          q2_winning_square: undefined,
          q3_winning_square: undefined,
          q4_winning_square: undefined,
          q1_winning_index: undefined,
          q2_winning_index: undefined,
          q3_winning_index: undefined,
          q4_winning_index: undefined,
          userWon_q1: false,
          userWon_q2: false,
          userWon_q3: false,
          userWon_final: false,
        }
      ],
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });

    // Commented out the original Firestore query for debugging
    /*
    // Get all active boards
    console.log(`[API] Querying boards collection...`);
    let boardsQuery;
    try {
      boardsQuery = await db.collection('boards')
        .where('status', 'in', ['open', 'full', 'active'])
        .get();
      console.log(`[API] Found ${boardsQuery.docs.length} total boards`);
    } catch (error) {
      console.error(`[API] Error querying boards collection:`, error);
      return NextResponse.json({ error: 'Failed to query boards' }, { status: 500 });
    }
    */

  } catch (error) {
    console.error('[API] Error in my-boards route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
