import React, { useState, useEffect } from 'react';
import { Shuffle, Check, ArrowRight } from 'lucide-react';

interface Game {
  id: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    record?: string;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    record?: string;
  };
  date: string;
  status: 'live' | 'upcoming' | 'completed';
  price: number;
}

interface Board {
  id: string;
  gameId: string;
  selectedIndexes: number[];
  totalSquares: number;
  availableSquares: number;
}

interface User {
  id: string;
  // Add other user properties as needed
}

interface BoardCardProps {
  game: Game;
  user?: User;
  handleBoardAction?: (action: string, data: any) => void;
  openWalletDialog?: () => void;
}

const BoardCard: React.FC<BoardCardProps> = ({
  game,
  user,
  handleBoardAction,
  openWalletDialog
}) => {
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [userSquares, setUserSquares] = useState<number[]>([2, 3, 11, 14, 26]); // Mock data
  const [selectedSquare, setSelectedSquare] = useState<number>(23);
  const [isLoading, setIsLoading] = useState(false);

  // Mock board data - replace with actual Firestore query
  useEffect(() => {
    // Simulate fetching active board
    const mockBoard: Board = {
      id: 'board-1',
      gameId: game.id,
      selectedIndexes: [33], // Mock taken squares
      totalSquares: 100,
      availableSquares: 73
    };
    setActiveBoard(mockBoard);
  }, [game.id]);

  const handleSquareClick = (square: number) => {
    setSelectedSquare(square);
  };

  const handleRandomSquare = () => {
    const availableSquares = Array.from({ length: 100 }, (_, i) => i)
      .filter(square => !userSquares.includes(square) && square !== 33); // Exclude user squares and taken squares
    const randomSquare = availableSquares[Math.floor(Math.random() * availableSquares.length)];
    setSelectedSquare(randomSquare);
  };

  const handleConfirm = async () => {
    if (!activeBoard || !user) return;
    
    setIsLoading(true);
    try {
      // Handle purchase logic here
      if (handleBoardAction) {
        await handleBoardAction('purchase', {
          boardId: activeBoard.id,
          square: selectedSquare,
          price: game.price
        });
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSquareState = (square: number) => {
    if (userSquares.includes(square)) return 'user-owned';
    if (activeBoard?.selectedIndexes.includes(square)) return 'taken';
    return 'available';
  };

  const renderGridCell = (row: number, col: number) => {
    if (row === 0 && col === 0) {
      return <div key="empty" className="grid-cell grid-header"></div>;
    }
    
    if (row === 0) {
      return (
        <div key={`col-${col-1}`} className="grid-cell grid-header">
          {col - 1}
        </div>
      );
    }
    
    if (col === 0) {
      return (
        <div key={`row-${row-1}`} className="grid-cell grid-header">
          {row - 1}
        </div>
      );
    }

    const square = (row - 1) * 10 + (col - 1);
    const state = getSquareState(square);
    
    return (
      <div
        key={square}
        className={`grid-cell grid-${state}`}
        onClick={() => state === 'available' ? handleSquareClick(square) : undefined}
      >
        {col - 1}
      </div>
    );
  };

  const renderGrid = () => {
    const cells = [];
    for (let row = 0; row <= 10; row++) {
      for (let col = 0; col <= 10; col++) {
        cells.push(renderGridCell(row, col));
      }
    }
    return cells;
  };

  if (!activeBoard) {
    return null; // Or loading state
  }

  return (
    <div className="board-card">
      <style jsx>{`
        .board-card {
          background: var(--card, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 0.5rem;
          padding: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          height: fit-content;
          max-height: 90vh;
          overflow: hidden;
          font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .team-matchup {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .team-logo {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 0.5rem;
        }

        .team-logo.home {
          background: linear-gradient(135deg, #e11d48, #dc2626);
        }

        .team-logo.away {
          background: linear-gradient(135deg, #065f46, #047857);
        }

        .status-badges {
          display: flex;
          gap: 0.25rem;
        }

        .status-badge {
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-live {
          background: #ef4444;
          color: white;
          animation: pulse 2s infinite;
        }

        .status-upcoming {
          background: #f59e0b;
          color: white;
        }

        .status-completed {
          background: #6b7280;
          color: white;
        }

        .price-badge {
          background: #10b981;
          color: white;
        }

        .game-info {
          color: #6b7280;
          font-size: 0.65rem;
          margin-bottom: 0.5rem;
          text-align: center;
        }

        .main-layout {
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: 0.5rem;
          align-items: start;
        }

        .mini-grid {
          display: grid;
          grid-template-columns: repeat(11, 1fr);
          gap: 1px;
          background: #e5e7eb;
          border-radius: 0.25rem;
          padding: 3px;
          width: 100%;
          max-width: 200px;
        }

        .grid-cell {
          aspect-ratio: 1;
          border-radius: 1px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.4rem;
          font-weight: 500;
          transition: all 150ms ease-out;
          cursor: pointer;
          min-height: 15px;
        }

        .grid-cell:active {
          transform: scale(1.3);
          z-index: 10;
        }

        .grid-header {
          background: #f3f4f6;
          color: #6b7280;
          font-weight: 600;
          cursor: default;
          font-size: 0.35rem;
        }

        .grid-header:active {
          transform: none;
        }

        .grid-available {
          background: #f9fafb;
          color: #111827;
        }

        .grid-available:active {
          background: #f59e0b;
          color: white;
        }

        .grid-user-owned {
          background: #10b981;
          color: white;
          animation: userSquarePulse 3s infinite;
        }

        .grid-taken {
          background: #9ca3af;
          color: #6b7280;
          cursor: not-allowed;
        }

        .grid-taken:active {
          transform: none;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          height: fit-content;
        }

        .square-input {
          width: 100%;
          padding: 0.375rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
          background: white;
          color: #111827;
          font-size: 0.75rem;
          text-align: center;
          font-weight: 600;
        }

        .square-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 1px #10b981;
        }

        .user-info {
          font-size: 0.55rem;
          text-align: center;
          color: #10b981;
          font-weight: 600;
          line-height: 1.2;
        }

        .btn {
          padding: 0.375rem;
          border-radius: 0.25rem;
          font-weight: 600;
          font-size: 0.65rem;
          border: none;
          cursor: pointer;
          transition: all 150ms ease-out;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          min-height: 32px;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:active:not(:disabled) {
          transform: scale(0.95);
          background: #e5e7eb;
        }

        .btn-primary {
          background: #10b981;
          color: white;
        }

        .btn-primary:active:not(:disabled) {
          transform: scale(0.95);
          background: #059669;
        }

        .bottom-section {
          margin-top: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .view-full-board {
          background: transparent;
          color: #10b981;
          border: 1px solid #10b981;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.375rem;
          border-radius: 0.25rem;
          font-weight: 500;
          font-size: 0.65rem;
          transition: all 150ms ease-out;
          min-height: 32px;
        }

        .view-full-board:active {
          background: #10b981;
          color: white;
          transform: scale(0.98);
        }

        .legend {
          display: flex;
          justify-content: center;
          gap: 0.75rem;
          font-size: 0.55rem;
          color: #6b7280;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .legend-square {
          width: 6px;
          height: 6px;
          border-radius: 1px;
        }

        .legend-available {
          background: #f9fafb;
        }

        .legend-user-owned {
          background: #10b981;
        }

        .legend-taken {
          background: #9ca3af;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes userSquarePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }

        @media (max-height: 650px) {
          .game-info {
            display: none;
          }
          
          .legend {
            display: none;
          }
          
          .board-card {
            padding: 0.5rem;
          }
        }

        @media (max-height: 580px) {
          .mini-grid {
            max-width: 180px;
          }
          
          .grid-cell {
            min-height: 13px;
            font-size: 0.35rem;
          }
          
          .controls {
            gap: 0.25rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="game-header">
        <div className="team-matchup">
          <div className="team-logo home">{game.homeTeam.abbreviation}</div>
          <span>{game.homeTeam.abbreviation} vs {game.awayTeam.abbreviation}</span>
          <div className="team-logo away">{game.awayTeam.abbreviation}</div>
        </div>
        <div className="status-badges">
          <span className={`status-badge status-${game.status}`}>
            {game.status === 'live' ? 'Live' : game.status === 'upcoming' ? 'Soon' : 'Done'}
          </span>
          <span className="status-badge price-badge">${game.price}</span>
        </div>
      </div>

      {/* Info */}
      <div className="game-info">
        {activeBoard.availableSquares}/{activeBoard.totalSquares} available • Your: {userSquares.length}
      </div>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Grid */}
        <div className="mini-grid">
          {renderGrid()}
        </div>

        {/* Controls */}
        <div className="controls">
          <input
            type="number"
            className="square-input"
            value={selectedSquare}
            onChange={(e) => setSelectedSquare(parseInt(e.target.value) || 0)}
            min="0"
            max="99"
          />
          <div className="user-info">
            Your: {userSquares.join(',')}
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleRandomSquare}
            disabled={isLoading}
          >
            <Shuffle size={12} />
            Rand
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={isLoading || !user}
          >
            <Check size={12} />
            {isLoading ? 'Wait...' : 'Buy'}
          </button>
        </div>
      </div>

      {/* Bottom */}
      <div className="bottom-section">
        <a href={`/game/${game.id}`} className="view-full-board">
          <span>View Full Board</span>
          <ArrowRight size={12} />
        </a>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-square legend-available"></div>
            <span>Open</span>
          </div>
          <div className="legend-item">
            <div className="legend-square legend-user-owned"></div>
            <span>Yours</span>
          </div>
          <div className="legend-item">
            <div className="legend-square legend-taken"></div>
            <span>Taken</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardCard;