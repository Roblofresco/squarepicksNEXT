'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface HeroTextProps {
  id: string
  children: React.ReactNode
  className?: string
  animate?: boolean
  delay?: number
}

export function HeroText({ id, children, className, animate = true, delay = 0 }: HeroTextProps) {
  return (
    <motion.div
      layoutId={`hero-text-${id}`}
      initial={false}
      transition={{
        type: "spring",
        bounce: 0.2,
        duration: 0.8,
        layout: { duration: 0.6 }
      }}
      className={cn("", className)}
    >
      {children}
    </motion.div>
  )
}
