'use client'

import React, { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { BiWallet } from 'react-icons/bi'
import { cn } from '@/lib/utils'

type WalletPillVariant = 'header' | 'docked'

interface WalletPillProps {
  balance: number | null
  onClick: () => void
  variant: WalletPillVariant
}

const WalletPill: React.FC<WalletPillProps> = ({ balance, onClick, variant }) => {
  const base = 'flex items-center gap-1.5 rounded-full transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed'
  // Use the same appearance in both places per design
  const styles = variant === 'header'
    ? 'h-7 px-2 bg-black/20 border border-white/10 text-white backdrop-blur-sm hover:bg-black/30'
    : 'h-7 px-2 bg-black/20 border border-white/10 text-white backdrop-blur-sm hover:bg-black/30'

  const controls = useAnimation()

  // Trigger a quick fade out/in whenever the pill moves between header and confirm
  useEffect(() => {
    controls.start({
      opacity: [1, 0, 1],
      transition: { duration: 0.35, times: [0, 0.5, 1], ease: 'easeInOut' }
    })
  }, [variant, controls])

  return (
    <motion.button
      layoutId="wallet-pill"
      layout
      transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.6 }}
      initial={false}
      animate={controls}
      onClick={onClick}
      aria-label="Wallet Balance"
      className={cn(base, styles)}
      style={{ transformOrigin: 'center right' }}
    >
      <BiWallet size={18} style={{ color: '#1bb0f2' }} />
      <span className="text-xs tabular-nums">${(balance ?? 0).toFixed(2)}</span>
    </motion.button>
  )
}

export default WalletPill


