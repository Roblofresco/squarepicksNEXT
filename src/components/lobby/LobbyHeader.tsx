import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UserCircle, Wallet } from 'lucide-react'; // Example icons
import { useWallet } from '@/hooks/useWallet';

const LobbyHeader = () => {
  const { balance, isLoading, userId } = useWallet();
  // Optionally fetch username from user profile if available
  // For now, just show userId or 'Guest'
  const username = userId ? userId.substring(0, 8) : 'Guest';

  return (
    <header className="sticky top-0 z-30 w-full bg-background/80 backdrop-blur-sm border-b border-border/40 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/lobby" className="flex items-center gap-2" legacyBehavior>
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

        {/* User Info/Balance */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <UserCircle className="h-4 w-4" />
            <span>{isLoading ? '...' : username}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wallet className="h-4 w-4" />
            <span>{isLoading ? '...' : `$${balance.toFixed(2)}`}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LobbyHeader;
