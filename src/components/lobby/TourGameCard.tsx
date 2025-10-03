'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TeamInfo } from '@/types/lobby'

interface TourGameCardProps {
  state?: 'scheduled' | 'live' | 'final'
  variant?: 'upcoming' | 'live'
  dataTour?: string
  highlight?: boolean
  teamA?: TeamInfo
  teamB?: TeamInfo
}

const mockTeamA: TeamInfo = {
  id: 'mock-team-a',
  name: 'Philadelphia',
  fullName: 'Philadelphia Eagles',
  initials: 'PHI',
  record: '4-0',
  logo: undefined,
  color: '#0d4b3d',
  seccolor: '#1f7a67'
}

const mockTeamB: TeamInfo = {
  id: 'mock-team-b',
  name: 'New Orleans',
  fullName: 'New Orleans Saints',
  initials: 'NO',
  record: '3-1',
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
    subLine: 'Final Score'
  }
}

export default function TourGameCard({ state = 'scheduled', variant = state === 'live' ? 'live' : 'upcoming', dataTour = 'sports-game-card', highlight = false, teamA, teamB }: TourGameCardProps) {
  const copy = stateCopy[state]
  const displayTeamA = teamA ?? mockTeamA
  const displayTeamB = teamB ?? mockTeamB

  return (
    <motion.div
      data-tour={dataTour}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={cn(highlight && 'ring-2 ring-offset-2 ring-offset-black/30 ring-sky-400')}
    >
      <Card className="relative w-[150px] sm:w-[240px] bg-gradient-to-b from-background-primary to-background-secondary border-accent-1/20">
        <CardContent className="flex items-center justify-between p-2 sm:p-3 h-[60px] sm:h-[90px]">
          {variant === 'live' && (
            <Badge variant="destructive" className="absolute top-2 sm:top-3 right-2 sm:right-3 text-[0.45rem] sm:text-[0.5rem] uppercase">
              Live
            </Badge>
          )}

          <div className="w-1/4 flex items-center justify-center h-full">
            <TeamDisplay team={displayTeamA} />
          </div>

          <div className="flex flex-col items-center justify-center w-1/2 text-center px-1">
            <div className="text-xs sm:text-sm font-bold mb-1 text-white" data-tour="sports-game-center">
              {copy.centerLine}
            </div>
            <div className="text-[10px] sm:text-xs text-white/70">
              {copy.subLine}
            </div>
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
  const record = team?.record ?? '--'
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
      <span className="text-[11px] text-white/60">{record}</span>
    </div>
  )
}

