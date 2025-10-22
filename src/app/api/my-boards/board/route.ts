import { NextRequest, NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const adminApp = initAdmin();
const db = getFirestore(adminApp);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decodedToken.uid;
    const boardId = request.nextUrl.searchParams.get('id');
    if (!boardId) {
      return NextResponse.json({ success: true, boards: [], timestamp: Date.now() }, { headers: { 'X-MyBoards-Error': 'missing-board-id' } });
    }

    const userRef = db.doc(`users/${userId}`);
    // Single-board query mirroring the working Cloud Function
    const squaresSnap = await db.collection(`boards/${boardId}/squares`).where('userID','==', userRef).get();

    if (squaresSnap.empty) {
      return NextResponse.json({ success: true, boards: [], timestamp: Date.now() }, { headers: { 'X-MyBoards-Board-Squares': '0' } });
    }

    const boardSnap = await db.doc(`boards/${boardId}`).get();
    if (!boardSnap.exists) {
      return NextResponse.json({ success: true, boards: [], timestamp: Date.now() }, { headers: { 'X-MyBoards-Error': 'board-not-found' } });
    }
    const bd = boardSnap.data() || {} as any;
    const picked = squaresSnap.docs.map(d => ({ index: d.data().index || 0, isUserSquare: true, square: d.data().square || undefined }));
    const gameId = (bd as any)?.gameID?.id || null;

    const board = {
      id: boardSnap.id,
      gameId: gameId || boardSnap.id,
      homeTeam: { name: 'Home', initials: 'HM' },
      awayTeam: { name: 'Away', initials: 'AW' },
      gameDateTime: (bd as any)?.created_time?.toDate?.()?.toISOString() || new Date().toISOString(),
      status: (bd as any)?.status || 'open',
      amount: (bd as any)?.amount || 0,
      stake: (bd as any)?.amount || 0,
      pot: (bd as any)?.pot || ((bd as any)?.amount || 0) * 80,
      is_live: false,
      broadcast_provider: undefined,
      sport: (bd as any)?.sport || 'NFL',
      league: (bd as any)?.league || 'NFL',
      userSquareCount: picked.length,
      isFull: picked.length === 100,
      selected_indexes_on_board: (bd as any)?.selected_indexes || [],
      totalSquareCount: 100,
      userPickedSquares: picked,
      q1_winning_square: (bd as any)?.q1_winning_square,
      q2_winning_square: (bd as any)?.q2_winning_square,
      q3_winning_square: (bd as any)?.q3_winning_square,
      q4_winning_square: (bd as any)?.q4_winning_square,
      q1_winning_index: (bd as any)?.q1_winning_index,
      q2_winning_index: (bd as any)?.q2_winning_index,
      q3_winning_index: (bd as any)?.q3_winning_index,
      q4_winning_index: (bd as any)?.q4_winning_index,
      userWon_q1: (bd as any)?.userWon_q1 || false,
      userWon_q2: (bd as any)?.userWon_q2 || false,
      userWon_q3: (bd as any)?.userWon_q3 || false,
      userWon_final: (bd as any)?.userWon_final || false,
    };

    return NextResponse.json({ success: true, boards: [board], timestamp: Date.now() }, { headers: { 'X-MyBoards-Board-Squares': String(picked.length) } });
  } catch (error: any) {
    const message = error?.message || 'Internal error';
    return NextResponse.json({ success: true, boards: [], timestamp: Date.now(), error: message }, { headers: { 'X-MyBoards-Error': message } });
  }
}


