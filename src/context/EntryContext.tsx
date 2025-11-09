'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Entry interaction state interface
interface EntryInteractionState {
  boardId: string | null;
  stage: 'idle' | 'selecting' | 'confirming';
  selectedNumber: number | null;
}

interface EntryContextType {
  entryInteraction: EntryInteractionState;
  handleBoardAction: (action: string, boardId: string, value?: number | string | null) => void;
}

const EntryContext = createContext<EntryContextType | undefined>(undefined);

export const EntryProvider = ({ children, userId }: { children: ReactNode; userId: string | null }) => {
  const [entryInteraction, setEntryInteraction] = useState<EntryInteractionState>({ 
    boardId: null, stage: 'idle', selectedNumber: null
  });

  const handleBoardAction = useCallback((action: string, boardId: string, value?: number | string | null) => {
    switch (action) {
      case 'START_ENTRY':
        setEntryInteraction({ boardId, stage: 'selecting', selectedNumber: null });
        break;
      case 'SET_NUMBER':
        setEntryInteraction(prev => ({
          ...prev,
          boardId: boardId,
          selectedNumber: typeof value === 'number' ? value : value !== undefined && value !== null ? Number(value) : null,
          stage: 'selecting'
        }));
        break;
      case 'REQUEST_CONFIRM':
        if (entryInteraction.selectedNumber === null || String(entryInteraction.selectedNumber).trim() === '') {
          // Don't proceed if no number selected
          return;
        }
        if (entryInteraction.boardId === boardId) {
          setEntryInteraction(prev => ({ ...prev, stage: 'confirming' }));
        }
        break;
      case 'CANCEL_CONFIRM':
        if (entryInteraction.boardId === boardId) {
          setEntryInteraction(prev => ({ ...prev, stage: 'selecting' })); 
        }
        break;
      case 'ENTRY_COMPLETED_RESET': 
        if (entryInteraction.boardId === boardId || boardId === null) {
          setEntryInteraction({ boardId: null, stage: 'idle', selectedNumber: null });
        }
        break;
      default:
        console.warn("Unknown board action in EntryContext:", action, boardId, value);
    }
  }, [entryInteraction]);

  return (
    <EntryContext.Provider value={{ entryInteraction, handleBoardAction }}>
      {children}
    </EntryContext.Provider>
  );
};

export const useEntry = (): EntryContextType => {
  const context = useContext(EntryContext);
  if (!context) {
    throw new Error('useEntry must be used within an EntryProvider');
  }
  return context;
};
