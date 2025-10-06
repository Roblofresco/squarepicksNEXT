'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X, Check } from 'lucide-react'

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
              fontFamily: 'Inter, sans-serif',
              borderRadius: '10px 10px 0 0',
              padding: '8px',
              borderBottom: '1px solid rgba(0,0,0,0.1)'
            }}
          >
            Random
          </Button>
          <div
            className="w-full flex justify-center items-center transition-all duration-200 ease-out bg-black/20 backdrop-blur-sm border-y border-white/10"
            style={{ height: '95px' }}
          >
            <span
              className="font-extrabold"
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '50px',
                color: '#F3F4F6',
                lineHeight: '95px'
              }}
            >
              {paddedNumber}
            </span>
          </div>
          <Button
            className="w-full text-sm font-semibold"
            type="button"
            style={{
              backgroundImage: 'linear-gradient(to bottom right, rgba(108, 99, 255, 1), rgba(68, 62, 180, 1))',
              color: '#FFFFFF',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '0 0 10px 10px',
              padding: '8px',
              borderTop: '1px solid rgba(255,255,255,0.15)'
            }}
          >
            Confirm?
          </Button>
        </motion.div>
      </AnimatePresence>
    )
  }

  const isConfirming = stage === 'confirming'
  const isEntered = stage === 'entered'

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
          isEntered
            ? 'bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-[#15803d]'
            : 'bg-gradient-to-br from-[#6366f1] via-[#4f46e5] to-[#4338ca]'
        )}
        style={{ borderRadius: '10px 10px 0 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}
      >
        {isEntered ? 'Entry Locked' : 'Confirm Entry'}
      </div>
      <div className="bg-black/20 text-white flex flex-col items-center justify-center h-[95px] gap-1 border-y border-white/10">
        <span className="text-xs uppercase text-white/60">Square</span>
        <span className="text-3xl font-bold">{paddedNumber}</span>
        <span className="text-[11px] text-white/60">{entryFeeDisplay}</span>
      </div>
      {isEntered ? (
        <div className="bg-white/10 text-white text-sm font-medium text-center py-2">
          You’re in! Watch for payout alerts.
        </div>
      ) : (
        <div className="flex w-full gap-0 min-w-0 items-stretch">
          <Button
            type="button"
            variant="outline"
            className="flex-1 text-sm inline-flex items-center justify-center relative overflow-hidden transition-all duration-200 ease-in-out bg-black/30 hover:bg-black/40 border-white/10 text-white backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-accent-1/40 min-w-0 rounded-none rounded-bl-[10px] border-t"
            style={{ padding: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}
          >
            <X className="h-5 w-5 shrink-0 text-red-400" strokeWidth={3} />
          </Button>
          <Button
            type="button"
            className="flex-1 text-sm inline-flex items-center justify-center relative overflow-hidden transition-all duration-200 ease-in-out hover:brightness-110 hover:scale-[1.02] min-w-0 rounded-none rounded-br-[10px] border-t"
            style={{
              backgroundImage: 'linear-gradient(to bottom right, rgba(108, 99, 255, 1), rgba(68, 62, 180, 1))',
              color: '#FFFFFF',
              padding: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <Check className="h-5 w-5 shrink-0 text-green-400" strokeWidth={3} />
          </Button>
        </div>
      )}
    </motion.div>
  )
}



