'use client'

import Image from 'next/image'
import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const mockBoard = {
  id: 'demo-board',
  entryFee: 5,
  isFreeEntry: false,
  selected_indexes: [5, 12, 34, 56, 78]
}

const mockTeams = {
  teamA: {
    name: 'Las Vegas Rush',
    record: '8-1',
    logo: '/images/mock-team-a.png',
    color: '#0B1228',
    seccolor: '#163175'
  },
  teamB: {
    name: 'Miami Blaze',
    record: '7-2',
    logo: '/images/mock-team-b.png',
    color: '#1A2E14',
    seccolor: '#3C7A2E'
  }
}

interface TourBoardCardProps {
  stage?: 'idle' | 'selecting' | 'confirming' | 'entered'
  highlightedNumber?: number
}

const stageCopy: Record<NonNullable<TourBoardCardProps['stage']>, { header: string; badge?: string; footer: string }> = {
  idle: {
    header: 'Featured $5 Grid',
    badge: 'Featured',
    footer: 'Pick a number to get started'
  },
  selecting: {
    header: 'Select Your Number',
    badge: 'Progress',
    footer: 'Use quick entry or tap the grid'
  },
  confirming: {
    header: 'Confirm Entry',
    badge: 'Review',
    footer: 'Double-check and lock in your pick'
  },
  entered: {
    header: 'Entry Locked',
    badge: 'Success',
    footer: 'We saved your number. Good luck!'
  }
}

const TourBoardCard = memo(({ stage = 'idle', highlightedNumber = 32 }: TourBoardCardProps) => {
  const copy = stageCopy[stage]
  const gridNumbers = useMemo(() => Array.from({ length: 25 }, (_, i) => i), [])

  const highlightedIndex = stage === 'entered' ? highlightedNumber : null

  return (
    <motion.div
      data-tour="sports-board-card"
      className="w-full max-w-[420px] mx-auto rounded-3xl bg-gradient-to-b from-[#080f1d] to-[#121b2d] border border-sky-400/20 shadow-[0_0_35px_rgba(14,165,233,0.25)] p-5 text-white"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TeamBadge team={mockTeams.teamA} align="left" />
          <div className="text-xs uppercase tracking-widest text-white/50">vs</div>
          <TeamBadge team={mockTeams.teamB} align="right" />
        </div>
        <div className="text-right">
          {copy.badge && (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-100">
              {copy.badge}
            </span>
          )}
          <div className="text-xs text-white/60 mt-1">Entry Fee • ${mockBoard.entryFee.toFixed(2)}</div>
        </div>
      </header>

      <div className="grid grid-cols-5 gap-2 rounded-2xl bg-black/20 p-3 shadow-inner">
        {gridNumbers.map((num) => {
          const isTaken = mockBoard.selected_indexes.includes(num)
          const isSelected = highlightedIndex === num
          return (
            <div
              key={num}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center font-mono text-sm transition-all duration-200 border border-white/5',
                isSelected
                  ? 'bg-emerald-600 text-white shadow-[0_0_18px_rgba(16,185,129,0.55)]'
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

      <footer className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
        <div className="font-semibold text-white mb-1">{copy.header}</div>
        <p className="text-xs leading-relaxed">{copy.footer}</p>
      </footer>
    </motion.div>
  )
})

TourBoardCard.displayName = 'TourBoardCard'

export default TourBoardCard

function TeamBadge({ team, align }: { team: typeof mockTeams.teamA; align: 'left' | 'right' }) {
  const shadow = team.seccolor ?? team.color ?? '#38bdf8'
  const dropShadow = { filter: `drop-shadow(0 0 6px ${shadow}88)` }

  return (
    <div className={cn('flex items-center gap-2', align === 'right' && 'flex-row-reverse text-right')}>
      {team.logo ? (
        <Image
          src={team.logo}
          alt={`${team.name} logo`}
          width={40}
          height={40}
          className="rounded-full object-contain"
          style={dropShadow}
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold"
          style={dropShadow}
        >
          {team.name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div>
        <div className="text-sm font-semibold text-white whitespace-nowrap">{team.name}</div>
        <div className="text-[11px] text-white/60">{team.record}</div>
      </div>
    </div>
  )
}

