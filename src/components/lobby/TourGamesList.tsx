'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import TourGameCard from '@/components/lobby/TourGameCard'

interface TourGamesListProps {
  activeStepId?: string
}

const tourCardVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
}

const TourGamesList = memo(({ activeStepId }: TourGamesListProps) => {
  return (
    <div className="w-full px-0.5 sm:px-[50px]" data-tour="sports-games-list">
      <motion.div
        className="flex overflow-x-auto gap-3 sm:gap-4 pr-2 pb-4 scrollbar-hide"
        initial="initial"
        animate="animate"
        variants={tourCardVariants}
      >
        <TourGameCard
          state="scheduled"
          variant="upcoming"
          dataTour="sports-games-upcoming"
          highlight={activeStepId === 'sports-games-upcoming'}
        />
        <TourGameCard
          state="live"
          variant="live"
          dataTour="sports-games-live"
          highlight={activeStepId === 'sports-games-live'}
        />
      </motion.div>
    </div>
  )
})

TourGamesList.displayName = 'TourGamesList'

export default TourGamesList

