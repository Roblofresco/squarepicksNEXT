'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation'; 
import { FiGrid, FiHome, FiUser } from 'react-icons/fi'; 
import { cn } from '@/lib/utils'; 
import { User } from 'firebase/auth'; 
import React, { memo, useCallback } from 'react';


interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  user: User | null; 
  onProtectedAction: () => void; 
  isProtected: boolean; 
}

// Restore original NavItem signature and implementation
const NavItemComponent = ({ href, icon: Icon, label, isActive, user, onProtectedAction, isProtected }: NavItemProps) => {
  const activeTextColor = 'text-white'; 
  const inactiveTextColor = 'text-text-secondary';

  const handleClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isProtected && !user) {
      event.preventDefault(); 
      onProtectedAction(); 
    }
  }, [isProtected, user, onProtectedAction]);

  // Return the JSX structure for the NavItem
  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'flex flex-col items-center justify-center w-1/3 py-2 px-1 transition-colors duration-200 ease-in-out',
        isActive ? activeTextColor : inactiveTextColor, 
        `hover:text-${isActive ? 'white' : 'text-primary'}`
      )}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon 
        className="w-6 h-6 mb-0.5" 
        strokeWidth={isActive ? 2.5 : 2} 
      />
    </Link>
  );
};

const MemoizedNavItem = memo(NavItemComponent);
MemoizedNavItem.displayName = 'NavItem';

interface BottomNavProps {
    user: User | null;
    onProtectedAction: () => void;
}

const BottomNavComponent = ({ user, onProtectedAction }: BottomNavProps) => { 
  const pathname = usePathname(); 

  const navItems = [
    { href: '/my-boards', icon: FiGrid, label: 'My Boards', id: 'my-boards', isProtected: true },
    { href: '/lobby', icon: FiHome, label: 'Lobby', id: 'lobby', isProtected: false },
    { href: '/profile', icon: FiUser, label: 'Profile', id: 'profile', isProtected: true },
  ];

  return (
    <nav data-tour="bottom-nav" className="fixed bottom-0 left-0 right-0 h-16 w-full bg-background-secondary/80 backdrop-blur-sm border-t border-gray-700/50 z-50 rounded-tl-2xl rounded-tr-2xl px-0">
      <div className="flex justify-around items-stretch h-full w-full"> 
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <MemoizedNavItem
              key={item.id}
              href={item.href} 
              icon={item.icon}
              label={item.label}
              isActive={isActive} 
              user={user} 
              onProtectedAction={onProtectedAction} 
              isProtected={item.isProtected} 
            />
          );
        })}
      </div>
    </nav>
  );
}

BottomNavComponent.displayName = 'BottomNav';
export default memo(BottomNavComponent);
