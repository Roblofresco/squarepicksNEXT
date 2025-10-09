'use client'

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import TourGameCard from '@/components/lobby/TourGameCard'
import { Game, TeamInfo } from '@/types/lobby'

interface TourGamesListProps {
  activeStepId?: string
  games?: Game[]
  onMounted?: () => void
}

const tourCardVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
}

const TourGamesList = memo(({ activeStepId, games = [], onMounted }: TourGamesListProps) => {
  const upcomingTeams = useMemo(() => {
    const first = games.find((game) => !!game.teamA && !!game.teamB)
    if (!first) return { teamA: undefined, teamB: undefined }
    return { teamA: first.teamA, teamB: first.teamB }
  }, [games])

  const liveTeams = useMemo(() => {
    const live = games.find((game) => (game.isLive ?? game.is_live) && game.teamA && game.teamB)
    if (!live) return upcomingTeams
    return { teamA: live.teamA, teamB: live.teamB }
  }, [games, upcomingTeams])

  return (
    <div className="w-full px-0.5 sm:px-[50px]" data-tour="sports-games-list">
      <motion.div
        className="flex overflow-x-auto gap-3 sm:gap-4 pr-2 pb-4 scrollbar-hide"
        initial="initial"
        animate="animate"
        variants={tourCardVariants}
        onAnimationComplete={() => onMounted?.()}
      >
        <TourGameCard
          state="scheduled"
          variant="upcoming"
          dataTour="sports-games-upcoming"
          allowKey="sports-games-upcoming"
          highlight={activeStepId === 'sports-games-upcoming'}
          teamA={upcomingTeams.teamA as TeamInfo | undefined}
          teamB={upcomingTeams.teamB as TeamInfo | undefined}
        />
        <TourGameCard
          state="live"
          variant="live"
          dataTour="sports-games-live"
          allowKey="sports-games-live"
          highlight={activeStepId === 'sports-games-live'}
          teamA={liveTeams.teamA as TeamInfo | undefined}
          teamB={liveTeams.teamB as TeamInfo | undefined}
        />
      </motion.div>
    </div>
  )
})

TourGamesList.displayName = 'TourGamesList'

export default TourGamesList

