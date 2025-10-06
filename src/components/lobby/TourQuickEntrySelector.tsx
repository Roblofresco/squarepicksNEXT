'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
        className="rounded-lg overflow-hidden shadow-md w-full border border-white/10"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{ borderRadius: '10px' }}
      >
        <div className="flex justify-center items-center bg-black/20 backdrop-blur-sm border-t border-white/10 h-[95px]">
          <span className="text-3xl font-extrabold tracking-tight text-white" style={{ textShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}>
            {entryFeeDisplay}
          </span>
        </div>
        <Button
          className="w-full rounded-none text-white font-semibold bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#4338ca] hover:brightness-110"
          type="button"
          style={{ borderRadius: '0 0 10px 10px', borderTop: '1px solid rgba(255,255,255,0.15)', padding: '8px' }}
        >
          Enter
        </Button>
      </motion.div>
    )
  }

  if (stage === 'selecting') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="selecting"
          data-tour="sports-quick-entry"
          className="rounded-lg overflow-hidden shadow-md w-full border border-white/10"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          style={{ borderRadius: '10px' }}
        >
          <Button
            data-tour="sports-quick-entry-random"
            className="w-full text-sm font-semibold"
            type="button"
            style={{
              backgroundImage: 'linear-gradient(to top left, #5855E4, #403DAA)',
              color: '#FFFFFF',
              borderRadius: '10px 10px 0 0',
              padding: '8px',
              borderBottom: '1px solid rgba(0,0,0,0.1)',
            }}
          >
            Random
          </Button>
          <div className="bg-black/20 text-white flex items-center justify-center h-[95px] border-y border-white/10">
            <Input
              value={paddedNumber}
              readOnly
              className="text-center font-extrabold text-4xl bg-transparent border-none focus-visible:ring-0"
            />
          </div>
          <Button
            className="w-full text-sm font-semibold"
            type="button"
            style={{
              backgroundImage: 'linear-gradient(to bottom right, rgba(108, 99, 255, 1), rgba(68, 62, 180, 1))',
              color: '#FFFFFF',
              borderRadius: '0 0 10px 10px',
              padding: '8px',
              borderTop: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            Confirm
          </Button>
        </motion.div>
      </AnimatePresence>
    )
  }

  const isConfirmed = stage === 'confirming'

  return (
    <motion.div
      key="confirming"
      data-tour="sports-quick-entry"
      className="rounded-lg overflow-hidden shadow-md w-full border border-white/10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ borderRadius: '10px' }}
    >
      <div
        className={cn(
          'text-white text-center text-sm font-semibold py-2',
          isConfirmed
            ? 'bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#15803d]'
            : 'bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#4338ca]'
        )}
        style={{ borderRadius: '10px 10px 0 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
      >
        {isConfirmed || stage === 'entered' ? 'Entry Locked' : 'Confirm Entry'}
      </div>
      <div className="bg-black/20 text-white flex flex-col items-center justify-center h-[95px] gap-1 border-y border-white/10">
        <span className="text-xs uppercase text-white/60">Square</span>
        <span className="text-3xl font-bold">{paddedNumber}</span>
        <span className="text-[11px] text-white/60">{entryFeeDisplay}</span>
      </div>
      {stage === 'entered' ? (
        <div className="bg-white/10 text-white text-sm font-medium text-center py-2">
          You’re in! Watch for payout alerts.
        </div>
      ) : (
        <div className="bg-white/10 text-white text-sm font-medium text-center py-2">
          Good luck!
        </div>
      )}
    </motion.div>
  )
}



