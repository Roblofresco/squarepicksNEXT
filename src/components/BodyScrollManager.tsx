'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Define the paths where scrolling should be disabled
const noScrollPaths = [
  // '/',          // Welcome page - Removed to allow scrolling
  '/login',        // Login page
  '/loading',      // Loading page
  '/signup/email', // Signup email page (Update if needed)
  // Add any other specific signup/auth paths here if needed
];

export default function BodyScrollManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Check if the current path starts with any of the no-scroll paths
    const shouldDisableScroll = noScrollPaths.some(path => pathname === path);

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
