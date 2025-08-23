'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { m as motion } from 'framer-motion'

const infoLinks = [
  { href: '/information-and-support', label: 'Home' },
  { href: '/information-and-support/how-to-play', label: 'How to Play' },
  { href: '/information-and-support/account-guide', label: 'Account Guide' },
  { href: '/information-and-support/faq', label: 'FAQ' },
  { href: '/information-and-support/terms', label: 'Terms & Conditions' },
  { href: '/information-and-support/privacy', label: 'Privacy Policy' },
  { href: '/information-and-support/responsible-gaming', label: 'Responsible Gaming' },
]

export default function InfoNavbar() {
  const pathname = usePathname()

  // Function to check if a link is active
  const isLinkActive = (linkHref: string) => {
    // Exact match for home
    if (linkHref === '/information-and-support' && pathname === linkHref) {
      return true;
    }
    // For other pages, check if pathname includes the link href
    if (linkHref !== '/information-and-support') {
      return pathname.includes(linkHref);
    }
    return false;
  };

  return (
         <nav className="w-full border-b border-white/10 bg-transparent">
       <div className="flex overflow-x-auto overflow-y-hidden touch-pan-x scrollbar-hide">
         <div className="flex items-center py-3 pl-6 pr-6 whitespace-nowrap min-w-max select-none">
           {infoLinks.map((link, index) => (
             <React.Fragment key={link.href}>
               {index > 0 && (
                 <div className="h-4 w-px bg-white/10 mx-2 md:mx-4 shrink-0" />
               )}
               <Link
                href={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-accent-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-1",
                  isLinkActive(link.href) ? "text-accent-1" : "text-gray-400"
                )}
              >
                {link.label}
                {isLinkActive(link.href) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-accent-1"
                    style={{
                      boxShadow: '0 0 10px rgba(27, 176, 242, 0.5), 0 0 20px rgba(27, 176, 242, 0.3)'
                    }}
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
