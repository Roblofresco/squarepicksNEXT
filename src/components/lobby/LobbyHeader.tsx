import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserCircle, Wallet } from 'lucide-react'; // Example icons

const LobbyHeader = () => {
  // TODO: Fetch actual user data (username, balance)
  const username = 'Player123'; // Placeholder
  const balance = 100.00; // Placeholder

  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-sm border-b border-border/40 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/lobby" className="flex items-center gap-2">
          {/* Use your actual logo */}
           <Image
                src="/brandkit/logos/sp-logo-text-white.svg"
                alt="SquarePicks Logo"
                width={150} // Adjust size as needed
                height={30}
                className="h-auto"
                priority
              />
        </Link>

        {/* User Info/Balance Placeholder */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <UserCircle className="h-4 w-4" />
            <span>{username}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4" />
            {/* Format currency properly later */}
            <span>${balance.toFixed(2)}</span>
          </div>
           {/* Optional: Add Logout Button or Profile Link */}
        </div>
      </div>
    </header>
  );
};

export default LobbyHeader;
