'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const infoLinks = [
  { href: '/information-and-support/how-to-play', label: 'How to Play' },
  { href: '/information-and-support/account-guide', label: 'Account Guide' },
  { href: '/information-and-support/faq', label: 'FAQ' },
  { href: '/information-and-support/terms', label: 'Terms & Conditions' },
  { href: '/information-and-support/privacy', label: 'Privacy Policy' },
  { href: '/information-and-support/responsible-gaming', label: 'Responsible Gaming' },
  { href: '/contact-support', label: 'Contact Support' },
]

export function InfoNavbar() {
  const pathname = usePathname()

  return (
    <nav className="w-full border-b border-white/10 bg-transparent">
      <div className="flex items-center">
        <div className="flex w-full items-center pb-4 pl-6">
          {infoLinks.map((link, index) => (
            <React.Fragment key={link.href}>
              {index > 0 && (
                <div className="h-4 w-px bg-white/10 mx-6" />
              )}
              <Link
                href={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-accent-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-1",
                  pathname === link.href ? "text-accent-1" : "text-gray-400"
                )}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-accent-1"
                    initial={false}
                  />
                )}
              </Link>
            </React.Fragment>
          ))}
        </div>
      </div>
    </nav>
  )
}
