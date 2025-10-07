'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import BoardMiniGrid from '@/components/lobby/BoardMiniGrid'
import TourQuickEntrySelector from '@/components/lobby/TourQuickEntrySelector'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import type { Game as GameType, Board as BoardType, TeamInfo } from '@/types/lobby'

const mockTeamA: TeamInfo = {
  id: 'mock-team-a',
  name: 'Eagles',
  fullName: 'Philadelphia Eagles',
  initials: 'PHI',
  record: '7-10',
  color: '#0d4b3d',
  seccolor: '#1f7a67',
}

const mockTeamB: TeamInfo = {
  id: 'mock-team-b',
  name: 'Saints',
  fullName: 'New Orleans Saints',
  initials: 'NO',
  record: '0-0',
  color: '#2b1f0f',
  seccolor: '#c9a43d',
}

const mockBoard: BoardType = {
  id: 'tour-board',
  gameID: {} as BoardType['gameID'],
  entryFee: 1,
  amount: 1,
  status: 'open',
  selected_indexes: [5, 12, 34, 56, 78],
  isFreeEntry: false,
  currentUserSelectedIndexes: [44, 45],
}

const stageCopy: Record<'idle' | 'selecting' | 'confirming' | 'entered', { title: string; description: string }> = {
  idle: {
    title: ' ',
    description: ' ',
  },
  selecting: {
    title: 'Choose Your Square',
    description: 'Bright green squares are open. Tap one to highlight it in purple before confirming.',
  },
  confirming: {
    title: 'Review Your Pick',
    description: 'Double-check the purple highlight. Need a change? Go back and try another open square.',
  },
  entered: {
    title: 'Entry Locked',
    description: 'Your blue-glow squares are locked in. Track the grid during the game for a winning combo.',
  },
}

interface TourBoardCardProps {
  stage?: 'idle' | 'selecting' | 'confirming' | 'entered'
  highlightedNumber?: number
  game?: GameType
  board?: BoardType
  legendSquares?: number[]
  quickEntryStage?: 'idle' | 'selecting' | 'confirming' | 'entered'
  showResponseDialog?: boolean
}

export default function TourBoardCard({
  stage = 'idle',
  highlightedNumber = 32,
  game,
  board,
  legendSquares,
  quickEntryStage,
  showResponseDialog = false,
}: TourBoardCardProps) {
  const boardForRender = board ?? mockBoard
  const teamA = game?.teamA ?? mockTeamA
  const teamB = game?.teamB ?? mockTeamB
  const entryFee = boardForRender.entryFee ?? mockBoard.entryFee
  const isFree = boardForRender.isFreeEntry ?? entryFee === 0
  const emphasizedNumber = highlightedNumber ?? 32
  const copy = stageCopy[stage]
  const showHighlightedSquare = stage !== 'idle'
  const showCurrentUserSquares = stage === 'entered'
  const legendSquaresForStage = legendSquares ?? (stage === 'selecting' ? [12, 47, 88] : [])
  const currentUserSquares = useMemo(() => {
    if (stage === 'entered') {
      const basis = board?.currentUserSelectedIndexes ?? boardForRender.currentUserSelectedIndexes
      if (basis && basis.length > 0) {
        return new Set(basis)
      }
    }
    return new Set<number>()
  }, [stage, board?.currentUserSelectedIndexes, boardForRender.currentUserSelectedIndexes])
  const shadowA = teamA.seccolor ?? teamA.color ?? '#38bdf8'
  const shadowB = teamB.seccolor ?? teamB.color ?? '#38bdf8'

  return (
    <motion.div
      data-tour="sports-board-card"
      data-tour-allow="sports-board"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'w-full max-w-[390px] h-auto mx-auto p-4 text-white relative overflow-hidden flex flex-col',
        'bg-gradient-to-b from-[#0a0e1b] to-[#1f2937] to-25% border-[1.5px] border-[#1bb0f2] shadow-[0px_0px_40px_-20px_#63c6ff] rounded-3xl',
        'transition-shadow duration-200 ease-out hover:shadow-xl hover:ring-2 hover:ring-accent-1/40'
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.25 }}
    >
      {isFree && (
        <div className="absolute top-0 left-0 bg-gradient-accent1-accent4 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10">
          Free Entry!
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <TeamBadge team={teamA} shadowColor={shadowA} align="left" />
        <div className="text-accent-1 font-bold text-xl text-center">@</div>
        <TeamBadge team={teamB} shadowColor={shadowB} align="right" />
      </div>

      <div className="flex flex-row items-center space-x-4 flex-grow mt-4">
        <div className="block w-[65%] relative bg-transparent rounded-xl overflow-hidden border-[1.5px] border-slate-300 shadow-[inset_0px_4px_4px_rgba(0,0,0,0.25)]" data-tour="sports-board-grid">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/nfl-grid-background.png"
              alt="Grid background"
              fill
              priority
              sizes="100vw"
              className="rounded-xl object-cover"
            />
          </div>
          <div className="relative z-10">
            <BoardMiniGrid
              boardData={boardForRender}
              currentUserSelectedSquares={currentUserSquares}
              highlightedNumber={emphasizedNumber}
              showHighlightedSquare={showHighlightedSquare}
              showCurrentUserSquares={showCurrentUserSquares}
              legendSquares={legendSquaresForStage}
            />
          </div>
        </div>
        <div className="w-[35%] flex-shrink-0">
          <TourQuickEntrySelector
            stage={quickEntryStage ?? stage}
            selectedNumber={emphasizedNumber}
            entryFee={entryFee}
            isFreeEntry={isFree}
          />
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-white/75">
        <div className="font-semibold text-white mb-1">{copy.title}</div>
        <p className="text-xs leading-relaxed text-white/70">{copy.description}</p>
      </div>
    </motion.div>
    <Dialog open={showResponseDialog}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-background-primary/80 via-background-primary/70 to-accent-2/10 border border-white/10 text-white backdrop-blur-xl shadow-[0_0_1px_1px_rgba(255,255,255,0.1)] backdrop-saturate-150">
        <DialogHeader className="text-center space-y-2">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            Entry Successful
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Your square has been locked in. Good luck!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button className="bg-gradient-to-r from-accent-2/60 via-accent-1/45 to-accent-2/60 hover:opacity-90">Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TeamBadge({ team, shadowColor, align }: { team: TeamInfo; shadowColor: string; align: 'left' | 'right' }) {
  return (
    <div className={cn('flex items-center gap-2 w-1/3', align === 'right' ? 'flex-row-reverse justify-end text-right' : 'justify-start')}>
      {team.logo ? (
        <Image
          src={team.logo}
          alt={`${team.name} logo`}
          width={45}
          height={45}
          className="rounded-full object-contain flex-shrink-0"
          style={{ filter: `drop-shadow(0 0 6px ${shadowColor}90)` }}
        />
      ) : (
        <div
          className="w-[45px] h-[45px] rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-sm font-semibold text-white"
          style={{ filter: `drop-shadow(0 0 6px ${shadowColor}66)` }}
        >
          {team.initials}
        </div>
      )}
      <div className="flex flex-col">
        <div className="font-semibold text-sm text-white truncate">{team.name}</div>
        <div className="text-xs text-white/60">{team.record ?? '0-0'}</div>
      </div>
    </div>
  )
}

