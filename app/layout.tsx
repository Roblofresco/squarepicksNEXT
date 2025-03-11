import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import AuthProvider from '@/providers/AuthProvider'
import ThemeProvider from '@/providers/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SquarePicks - Sports Betting & Predictions',
  description: 'Make picks on sports events, participate in sweepstakes, and compete with friends on SquarePicks.',
  keywords: 'sports betting, sports predictions, fantasy sports, sports picks, sweepstakes, square picks',
  openGraph: {
    title: 'SquarePicks - Sports Betting & Predictions',
    description: 'Make picks on sports events, participate in sweepstakes, and compete with friends on SquarePicks.',
    url: 'https://squarepicks.com',
    siteName: 'SquarePicks',
    images: [
      {
        url: 'https://squarepicks.com/assets/images/social-share.jpg',
        width: 1200,
        height: 630,
        alt: 'SquarePicks',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SquarePicks - Sports Betting & Predictions',
    description: 'Make picks on sports events, participate in sweepstakes, and compete with friends on SquarePicks.',
    images: ['https://squarepicks.com/assets/images/social-share.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  themeColor: '#3F0C44',
  viewport: 'width=device-width, initial-scale=1.0',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}