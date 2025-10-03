'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TourGameCardProps {
  state?: 'scheduled' | 'live' | 'final'
  variant?: 'upcoming' | 'live'
  dataTour?: string;
  highlight?: boolean;
}

const mockTeamA = {
  name: 'New York Guardians',
  initials: 'NYG',
  record: '6-2',
  logo: '/images/mock-team-a.png',
  color: '#0B1E3C',
  seccolor: '#1C3F6E'
}

const mockTeamB = {
  name: 'Seattle Surge',
  initials: 'SEA',
  record: '5-3',
  logo: '/images/mock-team-b.png',
  color: '#0F2A14',
  seccolor: '#1E6F3B'
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

export default function TourGameCard({ state = 'scheduled', variant = state === 'live' ? 'live' : 'upcoming', dataTour = 'sports-game-card', highlight = false }: TourGameCardProps) {
  const copy = stateCopy[state]
  const footnoteCopy = variant === 'live'
    ? [
        { dot: 'bg-emerald-400', label: 'Score and clock update in real time' },
        { dot: 'bg-rose-400', label: 'Tap to reopen the board mid-game' },
      ]
    : [
        { dot: 'bg-emerald-400', label: 'Kickoff time, network, and matchup' },
        { dot: 'bg-sky-400', label: 'Records help compare recent form' },
      ];

  return (
    <motion.div
      data-tour={dataTour}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className={cn(
        'relative w-[240px] bg-gradient-to-b from-background-primary to-background-secondary border border-accent-1/20 rounded-2xl p-3 text-white shadow-[0_0_18px_rgba(14,165,233,0.25)] transition-shadow duration-200',
        highlight && 'ring-2 ring-offset-2 ring-offset-black/40 ring-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.45)]'
      )}
    >
      {copy.badge && (
        <span className={cn(
          'absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full',
          state === 'live' ? 'bg-red-500/90' : 'bg-slate-500/80'
        )}>
          {copy.badge}
        </span>
      )}

      <div className="flex items-center justify-between">
        <TeamColumn team={mockTeamA} align="left" />
        <div className="flex flex-col items-center text-center">
          <span className="text-lg sm:text-xl font-bold tracking-tight" data-tour="sports-game-center">
            {copy.centerLine}
          </span>
          <span className="text-xs text-white/70 whitespace-nowrap">{copy.subLine}</span>
        </div>
        <TeamColumn team={mockTeamB} align="right" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/70">
        {footnoteCopy.map(({ dot, label }, idx) => (
          <div key={idx} className={cn('flex items-center gap-1', idx === 1 && 'justify-end')}>
            <span className={cn('h-2 w-2 rounded-full', dot)} />
            <span className="whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function TeamColumn({
  team,
  align
}: {
  team: typeof mockTeamA
  align: 'left' | 'right'
}) {
  const shadow = team.seccolor ?? team.color ?? '#0EA5E9'
  const dropShadow = { filter: `drop-shadow(0 0 6px ${shadow}99)` }

  return (
    <div className={cn('flex flex-col items-center w-[70px] gap-1', align === 'left' ? 'text-left' : 'text-right')}>
      {team.logo ? (
        <Image
          src={team.logo}
          alt={`${team.name} logo`}
          width={48}
          height={48}
          className="rounded-full object-contain"
          style={dropShadow}
        />
      ) : (
        <div
          className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold"
          style={dropShadow}
        >
          {team.initials}
        </div>
      )}
      <span className="text-xs font-semibold truncate max-w-[72px]">{team.name}</span>
      <span className="text-[11px] text-white/60">{team.record}</span>
    </div>
  )
}

