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
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const userId = decodedToken.uid;

    // Variant counters for debugging
    const variantCounts: Record<string, number> = {
      userID_ref: 0, userID_uid: 0, userID_path: 0,
      userId_ref: 0, userId_uid: 0, userId_path: 0,
    };

    const userRef = db.doc(`users/${userId}`);

    const safeQuery = async (field: 'userID'|'userId', value: any) => {
      try {
        const snap = await db.collectionGroup('squares').where(field, '==', value).get();
        if (!snap.empty) {
          const key = `${field}_${value?.path ? 'ref' : (typeof value === 'string' && value.startsWith('users/') ? 'path' : (typeof value === 'string' ? 'uid' : 'uid'))}`;
          variantCounts[key] = (variantCounts[key] || 0) + snap.size;
        }
        return snap?.docs || [];
      } catch (e) {
        // If index missing, just skip this variant in this debug route
        return [] as any[];
      }
    };

    // Run all variants in parallel
    const [
      v_userID_ref, v_userID_uid, v_userID_path,
      v_userId_ref, v_userId_uid, v_userId_path,
    ] = await Promise.all([
      safeQuery('userID', userRef),
      safeQuery('userID', userId),
      safeQuery('userID', `users/${userId}`),
      safeQuery('userId', userRef),
      safeQuery('userId', userId),
      safeQuery('userId', `users/${userId}`),
    ]);

    const mergedMap = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    [...v_userID_ref, ...v_userID_uid, ...v_userID_path, ...v_userId_ref, ...v_userId_uid, ...v_userId_path]
      .forEach((d: any) => { if (d && d.ref?.path) mergedMap.set(d.ref.path, d); });
    const squareDocs = Array.from(mergedMap.values());

    // Collect board IDs
    const boardIds = new Set<string>();
    squareDocs.forEach(d => { const id = d.ref.parent.parent?.id; if (id) boardIds.add(id); });
    const boardIdArray = Array.from(boardIds);

    // Fetch boards by ID
    const boardSnaps = await Promise.all(boardIdArray.map(id => db.doc(`boards/${id}`).get()));
    const boards = boardSnaps.filter(s => s.exists).map(snap => {
      const bd = snap.data() || {} as any;
      // Minimal join: try game data if available
      const gameId = (bd as any)?.gameID?.id || null;
      const picked = squareDocs
        .filter(d => d.ref.parent.parent?.id === snap.id)
        .map(d => ({ index: d.data().index || 0, isUserSquare: true, square: d.data().square || undefined }));
      return {
        id: snap.id,
        gameId: gameId || snap.id,
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
    });

    return NextResponse.json({ success: true, boards, timestamp: Date.now() }, {
      headers: {
        'Cache-Control': 'private, max-age=120',
        'X-MyBoards-All': String(boards.length),
        'X-MyBoards-Squares': String(squareDocs.length),
        'X-MyBoards-Variants': JSON.stringify(variantCounts),
      }
    });
  } catch (error: any) {
    const message = error?.message || 'Internal error';
    return NextResponse.json({ success: true, boards: [], timestamp: Date.now(), error: message }, {
      headers: { 'X-MyBoards-Error': message }
    });
  }
}


