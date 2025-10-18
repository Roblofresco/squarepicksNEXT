import './globals.css'
import { Providers } from '@/components/providers'
import { Epilogue } from 'next/font/google'

// Configure Epilogue font with better Edge compatibility
const epilogue = Epilogue({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: true,
  preload: true,
  variable: '--font-epilogue',
})

export const metadata = {
  metadataBase: new URL('https://squarepicks.com'),
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

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0e1b',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={epilogue.variable}>
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
        <meta name="msapplication-TileColor" content="#0a0e1b" />
        <meta name="msapplication-TileImage" content="/brandkit/logos/maskable-icon-192x192.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Preconnect and DNS Prefetch for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* Stencil Font - Load with better Edge compatibility */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil+Text:wght@100;200;300;400;500;600;700;800;900&display=swap" as="style" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Stencil+Text:wght@100;200;300;400;500;600;700;800;900&display=swap" />
        

        
        {/* Security Headers */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}