'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookOpen, HelpCircle, FileText, ShieldCheck, Scale, Info } from 'lucide-react'
import { motion } from 'framer-motion'

const iconMap = {
  BookOpen,
  HelpCircle,
  FileText,
  ShieldCheck,
  Scale,
  Info,
} as const

type IconName = keyof typeof iconMap

interface SectionCardProps {
  title: string
  description: string
  href: string
  iconName: IconName
}

export function SectionCard({ title, description, href, iconName }: SectionCardProps) {
  const Icon = iconMap[iconName]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={href}>
        <Card className="h-full bg-accent-1/5 border-accent-1/20 hover:border-accent-1/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Icon className="h-5 w-5 text-accent-1" />
              {title}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {description}
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </motion.div>
  )
}



