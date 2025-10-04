'use client'

import Image from 'next/image'
import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface TeamInfoMock {
  id: string
  name: string
  fullName: string
  initials: string
  record: string
  logo?: string
  color?: string
  seccolor?: string
}

interface BoardMock {
  id: string
  entryFee: number
  isFreeEntry: boolean
  selectedIndexes: number[]
}

const mockTeamA: TeamInfoMock = {
  id: 'mock-team-a',
  name: 'Philadelphia',
  fullName: 'Philadelphia Eagles',
  initials: 'PHI',
  record: '7-10',
  logo: undefined,
  color: '#0d4b3d',
  seccolor: '#1f7a67'
}

const mockTeamB: TeamInfoMock = {
  id: 'mock-team-b',
  name: 'New Orleans',
  fullName: 'New Orleans Saints',
  initials: 'NO',
  record: '0-0',
  logo: undefined,
  color: '#2b1f0f',
  seccolor: '#c9a43d'
}

const mockBoard: BoardMock = {
  id: 'mock-board',
  entryFee: 1,
  isFreeEntry: false,
  selectedIndexes: [5, 12, 34, 56, 78]
}

interface TourBoardCardProps {
  stage?: 'idle' | 'selecting' | 'confirming' | 'entered'
  highlightedNumber?: number | null
}

const stageCopy: Record<NonNullable<TourBoardCardProps['stage']>, { footer: string; cta: string }> = {
  idle: {
    footer: 'Pick a number or use quick entry to join the $1 grid.',
    cta: 'Enter Board'
  },
  selecting: {
    footer: 'Numbers in blue are available. Choose your favorite or try quick entry.',
    cta: 'Confirm Number'
  },
  confirming: {
    footer: 'Double-check your selection. You can still edit before locking in.',
    cta: 'Lock In Entry'
  },
  entered: {
    footer: 'Entry locked. Watch the game or explore other boards while you wait!',
    cta: 'Explore Boards'
  }
}

const TourBoardCard = memo(({ stage = 'idle', highlightedNumber = null }: TourBoardCardProps) => {
  const copy = stageCopy[stage]
  const gridNumbers = useMemo(() => Array.from({ length: 25 }, (_, i) => i), [])
  const stageSelected = stage === 'entered' ? highlightedNumber : highlightedNumber

  const takenNumbers = new Set(mockBoard.selectedIndexes)

  const logoStyleA = { filter: `drop-shadow(0 0 4px ${(mockTeamA.seccolor || mockTeamA.color || '#ffffff') + '80'}` }
  const logoStyleB = { filter: `drop-shadow(0 0 4px ${(mockTeamB.seccolor || mockTeamB.color || '#ffffff') + '80'}` }

  return (
    <motion.div
      data-tour="sports-board-card"
      data-tour-allow="sports-board"
      className="w-full max-w-[390px] mx-auto p-4 text-white relative overflow-hidden flex flex-col bg-gradient-to-b from-[#0a0e1b] to-[#1f2937] border border-sky-400/30 shadow-[0px_0px_40px_-20px_#63c6ff] rounded-3xl"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {mockBoard.isFreeEntry && (
        <div className="absolute top-0 left-0 bg-gradient-accent1-accent4 text-white text-xs font-bold px-3 py-1 rounded-br-lg z-10">
          Free Entry!
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2 w-1/3 justify-start">
          <TeamBadge team={mockTeamA} className="items-start" />
        </div>
        <div className="text-accent-1 font-bold text-xl text-center">@</div>
        <div className="flex items-center space-x-2 w-1/3 justify-end">
          <TeamBadge team={mockTeamB} align="right" />
        </div>
      </div>

      <div className="flex flex-row items-center space-x-4 flex-grow mt-4">
        <div className="block w-[65%] relative bg-transparent rounded-lg overflow-hidden cursor-pointer border border-slate-300/60 shadow-[inset_0px_4px_4px_rgba(0,0,0,0.25)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 pointer-events-none" />
          <div className="grid grid-cols-5 gap-1.5 p-2">
            {gridNumbers.map((num) => {
              const isTaken = takenNumbers.has(num)
              const isSelected = stageSelected === num
              return (
                <div
                  key={num}
                  className={cn(
                    'aspect-square rounded-md flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-200 border border-white/5',
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-[0_0_18px_rgba(16,185,129,0.45)]'
                      : isTaken
                        ? 'bg-white/10 text-white/50'
                        : 'bg-gradient-to-br from-[#0d1b2a] to-[#16213e] text-sky-100 hover:ring-1 hover:ring-sky-400/60'
                  )}
                >
                  {String(num).padStart(2, '0')}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col space-y-2 w-[35%]">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-left">
            <div className="text-xs uppercase tracking-widest text-white/60">Entry Fee</div>
            <div className="text-xl font-semibold text-white">${mockBoard.entryFee.toFixed(2)}</div>
            <div className="text-[11px] text-white/50 mt-1">Open • Instant payouts</div>
          </div>
          <button
            type="button"
            className="rounded-xl bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 text-white text-sm font-semibold py-2 px-3 hover:brightness-110 transition"
          >
            {copy.cta}
          </button>
        </div>
      </div>

      <footer className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold text-white">$1 Featured Grid</div>
          <div className="text-[11px] text-white/60">Entry Fee • ${mockBoard.entryFee.toFixed(2)}</div>
        </div>
        <p className="text-xs leading-relaxed">{copy.footer}</p>
      </footer>
    </motion.div>
  )
})

TourBoardCard.displayName = 'TourBoardCard'

export default TourBoardCard

function TeamBadge({ team, align, className }: { team: TeamInfoMock; align?: 'left' | 'right'; className?: string }) {
  const shadow = team.seccolor ?? team.color ?? '#38bdf8'
  const dropShadow = { filter: `drop-shadow(0 0 6px ${shadow}88)` }

  return (
    <div className={cn('flex items-center gap-2', align === 'right' && 'flex-row-reverse text-right', className)}>
      {team.logo ? (
        <Image
          src={team.logo}
          alt={`${team.fullName} logo`}
          width={45}
          height={45}
          className="rounded-full object-contain"
          style={dropShadow}
        />
      ) : (
        <div
          className="w-[45px] h-[45px] rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-sm font-semibold text-white"
          style={dropShadow}
        >
          {team.initials}
        </div>
      )}
      <div className="flex flex-col">
        <div className="font-semibold text-sm text-white whitespace-nowrap">{team.name}</div>
        <div className="text-xs text-white/60">{team.record}</div>
      </div>
    </div>
  )
}

