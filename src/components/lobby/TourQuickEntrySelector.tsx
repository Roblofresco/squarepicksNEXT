'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type TourQuickEntrySelectorProps = {
  stage?: 'idle' | 'selecting' | 'confirming'
  selectedNumber?: number | null
  isLoading?: boolean
}

const mockTaken = new Set([5, 17, 33])

export default function TourQuickEntrySelector({
  stage = 'idle',
  selectedNumber = 32,
  isLoading = false
}: TourQuickEntrySelectorProps) {
  const paddedNumber = useMemo(() => {
    if (selectedNumber === null || selectedNumber === undefined) return ''
    return String(selectedNumber).padStart(2, '0')
  }, [selectedNumber])

  if (stage === 'idle') {
    return (
      <motion.div
        data-tour="sports-quick-entry"
        className="rounded-xl overflow-hidden shadow-md w-[180px] border border-white/10"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-center bg-black/25 text-white h-[80px]">
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-white/60">Entry Fee</div>
            <div className="text-3xl font-bold">$5</div>
          </div>
        </div>
        <Button
          className="w-full rounded-none text-white font-semibold bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 hover:brightness-110"
          type="button"
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
            <Input
              value={paddedNumber}
              readOnly
              className="bg-transparent border-none text-center text-3xl font-bold focus-visible:ring-0"
            />
          </div>
          <Button
            className="w-full rounded-none rounded-b-xl text-white font-semibold bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700"
            type="button"
            disabled={selectedNumber === null || mockTaken.has(selectedNumber)}
          >
            {selectedNumber === null ? 'Select a Number' : mockTaken.has(selectedNumber) ? 'Taken' : 'Confirm?'}
          </Button>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <motion.div
      key="confirming"
      data-tour="sports-quick-entry"
      className="rounded-xl overflow-hidden shadow-md w-[190px] border border-white/10"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 text-white text-center text-sm font-semibold py-2">Confirm</div>
      <div className="bg-black/25 text-white flex flex-col items-center justify-center h-[80px] gap-1">
        <div className="text-3xl font-bold">{paddedNumber}</div>
        <div className="text-xs text-white/70">Entry Fee ${mockTaken.has(99) ? '0.00' : '5.00'}</div>
      </div>
      <div className="flex divide-x divide-white/10">
        <button
          type="button"
          className="flex-1 bg-white/5 text-white py-2 flex items-center justify-center gap-1 hover:bg-white/10"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
        <button
          type="button"
          className={cn(
            'flex-1 bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white py-2 flex items-center justify-center gap-1',
            isLoading && 'opacity-75 cursor-wait'
          )}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Confirm
        </button>
      </div>
    </motion.div>
  )
}

