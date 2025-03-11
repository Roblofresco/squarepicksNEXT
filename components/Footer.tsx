'use client'

import Link from 'next/link'
import { FaTwitter, FaFacebook, FaInstagram, FaYoutube } from 'react-icons/fa'

const footerLinks = [
  {
    title: 'Company',
    links: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' },
      { name: 'Press', href: '/press' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Blog', href: '/blog' },
      { name: 'Help Center', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Terms of Service', href: '/terms' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Responsible Gaming', href: '/responsible-gaming' },
    ],
  },
]

const socialLinks = [
  { name: 'Twitter', icon: FaTwitter, href: 'https://twitter.com/squarepicks' },
  { name: 'Facebook', icon: FaFacebook, href: 'https://facebook.com/squarepicks' },
  { name: 'Instagram', icon: FaInstagram, href: 'https://instagram.com/squarepicks' },
  { name: 'YouTube', icon: FaYoutube, href: 'https://youtube.com/squarepicks' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-secondary-900 text-white">
      <div className="container-responsive py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and description */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold">SquarePicks</span>
            </Link>
            <p className="mt-4 text-gray-400 max-w-md">
              Make picks on sports events, participate in sweepstakes, and compete with friends on SquarePicks.
              Join the community of sports enthusiasts today!
            </p>
            
            {/* Social links */}
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={link.name}
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                )
              })}
            </div>
          </div>
          
          {/* Footer links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} SquarePicks. All rights reserved.
          </p>
          
          <div className="mt-4 md:mt-0">
            <p className="text-gray-400 text-sm">
              SquarePicks is not affiliated with any professional sports league or team.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}