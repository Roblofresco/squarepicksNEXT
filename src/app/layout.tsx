import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import BodyScrollManager from '@/components/BodyScrollManager';
import { NotificationProvider } from "@/context/NotificationContext";
import { Toaster } from 'sonner';
import EmailVerificationBanner from '@/components/ui/EmailVerificationBanner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SquarePicks",
  description: "SquarePicks App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0e1b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Squarepicks" />
        {/* Example if you add icons: <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" /> */}
      </head>
      <body className={`${inter.className} min-h-[100dvh] flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NotificationProvider>
            <EmailVerificationBanner />
            <main className="flex-grow">
          <BodyScrollManager>{children}</BodyScrollManager>
            </main>
            <Toaster richColors position="top-right" />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
