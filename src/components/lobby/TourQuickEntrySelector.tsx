'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TourQuickEntrySelectorProps {
  stage?: 'idle' | 'selecting' | 'confirming' | 'entered'
  selectedNumber?: number | null
  entryFee?: number
  isFreeEntry?: boolean
}

export default function TourQuickEntrySelector({
  stage = 'idle',
  selectedNumber = 32,
  entryFee = 1,
  isFreeEntry = false,
}: TourQuickEntrySelectorProps) {
  const paddedNumber = useMemo(() => {
    if (selectedNumber === null || selectedNumber === undefined) return '--'
    return String(selectedNumber).padStart(2, '0')
  }, [selectedNumber])

  const entryFeeDisplay = isFreeEntry ? 'Free' : `$${entryFee.toFixed(2)}`

  if (stage === 'idle') {
    return (
      <motion.div
        data-tour="sports-quick-entry"
        className="rounded-2xl overflow-hidden shadow-lg w-[180px] border border-white/10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col items-center justify-center bg-black/20 text-white h-[90px] gap-1">
          <span className="text-3xl font-bold">{entryFeeDisplay}</span>
        </div>
        <Button
          className="w-full rounded-none text-white font-semibold bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#4338ca] hover:brightness-110"
          type="button"
        >
          Enter
        </Button>
      </motion.div>
    )
  }

  if (stage === 'selecting') {
    return (
      <motion.div
        key="selecting"
        data-tour="sports-quick-entry"
        className="rounded-xl overflow-hidden shadow-md w-[180px] border border-white/10"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          className="w-full rounded-none rounded-t-xl text-white font-semibold bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700"
          type="button"
        >
          Random
        </Button>
        <div className="bg-black/25 text-white flex items-center justify-center h-[80px]">
          <span className="text-3xl font-bold">{paddedNumber}</span>
        </div>
        <Button
          className="w-full rounded-none rounded-b-xl text-white font-semibold bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700"
          type="button"
        >
          Confirm
        </Button>
      </motion.div>
    )
  }

  const isConfirmed = stage === 'confirming'

  return (
    <motion.div
      key="confirming"
      data-tour="sports-quick-entry"
      className="rounded-2xl overflow-hidden shadow-lg w-[190px] border border-white/10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          'text-white text-center text-sm font-semibold py-2',
          isConfirmed
            ? 'bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#15803d]'
            : 'bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#4338ca]'
        )}
      >
        {isConfirmed ? 'Entry Locked' : 'Confirm Entry'}
      </div>
      <div className="bg-black/20 text-white flex flex-col items-center justify-center h-[90px] gap-1">
        <span className="text-xs uppercase text-white/60">Square</span>
        <span className="text-3xl font-bold">{paddedNumber}</span>
        <span className="text-[11px] text-white/60">{entryFeeDisplay}</span>
      </div>
      <div className="bg-white/10 text-white text-sm font-medium text-center py-2">
        Good luck!
      </div>
    </motion.div>
  )
}



