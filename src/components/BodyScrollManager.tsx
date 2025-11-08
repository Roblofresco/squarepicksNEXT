'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Define the paths where scrolling should be disabled
const noScrollPaths = [
  // '/',          // Welcome page - Removed to allow scrolling
  '/login',        // Login page
  '/loading',      // Loading page
  '/signup/email', // Signup email page
  '/signup/password', // Signup password page
  '/signup/identity', // Signup identity page
  '/signup/username', // Signup username page
];

export default function BodyScrollManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Check if the current path matches any of the no-scroll paths
    // Also check if pathname starts with /signup/ to catch all signup routes
    const shouldDisableScroll = noScrollPaths.some(path => pathname === path) || pathname?.startsWith('/signup/');

    if (shouldDisableScroll) {
      document.body.classList.add('no-scroll');
      document.documentElement.classList.add('no-scroll-html');
    } else {
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll-html');
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll-html');
    };
  }, [pathname]); // Re-run the effect when the pathname changes

  return <>{children}</>; // Pass children through unchanged
}
