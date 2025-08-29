import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SquarePicks - Modern Sports Squares',
  description: 'Where Every Square Has a Chance. Select squares on game boards, win when your numbers match the score, and earn real prizes in our modern sports squares platform.',
  keywords: 'sports squares, betting, games, entertainment, prizes, sports betting, squares game',
  authors: [{ name: 'SquarePicks Team' }],
  creator: 'SquarePicks',
  publisher: 'SquarePicks',
  robots: 'index, follow',
  openGraph: {
    title: 'SquarePicks - Modern Sports Squares',
    description: 'Where Every Square Has a Chance. Select squares on game boards, win when your numbers match the score, and earn real prizes in our modern sports squares platform.',
    url: 'https://squarepicks.com',
    siteName: 'SquarePicks',
    images: [
      {
        url: '/brandkit/logos/sp-logo-app-icon.png',
        width: 512,
        height: 512,
        alt: 'SquarePicks Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SquarePicks - Modern Sports Squares',
    description: 'Where Every Square Has a Chance. Select squares on game boards, win when your numbers match the score, and earn real prizes in our modern sports squares platform.',
    images: ['/brandkit/logos/sp-logo-app-icon.png'],
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  themeColor: '#1a202c',
  colorScheme: 'dark',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SquarePicks',
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google verification code if you have one
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Favicon and App Icons */}
        <link rel="icon" href="/brandkit/logos/sp-logo-icon-default.png" />
        <link rel="icon" type="image/svg+xml" href="/brandkit/logos/sp-logo-icon-default.svg" />
        <link rel="apple-touch-icon" href="/brandkit/logos/sp-logo-app-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/brandkit/logos/maskable-icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/brandkit/logos/maskable-icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/brandkit/logos/maskable-icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/brandkit/logos/maskable-icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/brandkit/logos/maskable-icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/brandkit/logos/maskable-icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/brandkit/logos/maskable-icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/brandkit/logos/maskable-icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/brandkit/logos/maskable-icon-192x192.png" />
        
        {/* PWA and Mobile Home Screen */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="SquarePicks" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SquarePicks" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1a202c" />
        <meta name="msapplication-TileImage" content="/brandkit/logos/maskable-icon-192x192.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Preconnect and DNS Prefetch for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* Security Headers */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}