'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TeamInfo } from '@/types/lobby'

interface TourGameCardProps {
  state?: 'scheduled' | 'live' | 'final'
  variant?: 'upcoming' | 'live'
  dataTour?: string
  highlight?: boolean
  teamA?: TeamInfo
  teamB?: TeamInfo
  allowKey?: string
}

const mockTeamA: TeamInfo = {
  id: 'mock-team-a',
  name: 'Philadelphia',
  fullName: 'Philadelphia Eagles',
  initials: 'PHI',
  record: undefined,
  logo: undefined,
  color: '#0d4b3d',
  seccolor: '#1f7a67'
}

const mockTeamB: TeamInfo = {
  id: 'mock-team-b',
  name: 'New Orleans',
  fullName: 'New Orleans Saints',
  initials: 'NO',
  record: undefined,
  logo: undefined,
  color: '#2b1f0f',
  seccolor: '#c9a43d'
}

const stateCopy: Record<NonNullable<TourGameCardProps['state']>, { badge?: string; centerLine: string; subLine: string }> = {
  scheduled: {
    badge: undefined,
    centerLine: 'VS',
    subLine: 'Sun 7:20 PM • ESPN'
  },
  live: {
    badge: 'Live',
    centerLine: '21 - 17',
    subLine: '4th • 08:15'
  },
  final: {
    badge: 'Final',
    centerLine: '28 - 24',
    subLine: ''
  }
}

export default function TourGameCard({ state = 'scheduled', variant = state === 'live' ? 'live' : 'upcoming', dataTour = 'sports-game-card', highlight = false, teamA, teamB, allowKey }: TourGameCardProps) {
  const copy = stateCopy[state]
  const displayTeamA = teamA ?? mockTeamA
  const displayTeamB = teamB ?? mockTeamB

  return (
    <motion.div
      data-tour={dataTour}
      data-tour-allow={allowKey}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
    >
      <Card
        className={cn(
          'relative w-[150px] sm:w-[240px] bg-gradient-to-b from-background-primary to-background-secondary border-accent-1/20 transition-shadow duration-200',
          highlight && 'border-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.45)]'
        )}
      >
        <CardContent className="flex items-center justify-between p-2 sm:p-3 h-[60px] sm:h-[90px] relative">
          <div className="w-1/4 flex items-center justify-center h-full">
            <TeamDisplay team={displayTeamA} />
          </div>

          <div className="relative flex flex-col items-center justify-center w-1/2 text-center px-1 pt-5 sm:pt-6 gap-1">
            {state === 'live' && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-semibold uppercase tracking-wide text-white bg-red-600 rounded-full shadow-[0_0_10px_rgba(248,113,113,0.45)] animate-pulse">
                Live
              </span>
            )}
            {state === 'final' && (
              <span data-tour="sports-games-final" className="absolute top-0 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[0.55rem] sm:text-[0.6rem] font-semibold uppercase tracking-wide text-white bg-gray-600 rounded-full">
                Final
              </span>
            )}
            <div className="text-xs sm:text-sm font-bold text-white" data-tour="sports-game-center">
              {copy.centerLine}
            </div>
            {state !== 'final' && (
              <div className="text-[10px] sm:text-xs text-white/70">
                {copy.subLine}
              </div>
            )}
          </div>

          <div className="w-1/4 flex items-center justify-center h-full">
            <TeamDisplay team={displayTeamB} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TeamDisplay({ team }: { team?: TeamInfo }) {
  const shadow = team?.seccolor ?? team?.color ?? '#0EA5E9'
  const dropShadow = { filter: `drop-shadow(0 0 6px ${shadow}99)` }
  const initials = team?.initials ?? 'N/A'
  const logoSrc = team?.logo
  const nameForAlt = team?.fullName ?? team?.name ?? initials

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={`${nameForAlt} logo`}
          width={40}
          height={40}
          className="object-contain"
          style={dropShadow}
        />
      ) : (
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center text-sm sm:text-base font-semibold text-white"
          style={dropShadow}
        >
          {initials}
        </div>
      )}
      <span className="text-[10px] sm:text-xs text-white font-semibold uppercase tracking-wide">
        {initials}
      </span>
    </div>
  )
}

