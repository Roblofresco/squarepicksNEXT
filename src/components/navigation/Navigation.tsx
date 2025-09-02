'use client'

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogoWithText } from '@/components/LogoWithText';

interface NavigationProps {
  variant?: 'home' | 'app';
  className?: string;
}

interface NavigationButtonProps {
  href: string;
  variant: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  'aria-label'?: string;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  href,
  variant,
  children,
  onClick,
  disabled = false,
  loading = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (disabled || loading || isNavigating) return;

    try {
      setIsNavigating(true);
      
      // Custom onClick handler if provided
      if (onClick) {
        onClick();
        return;
      }

      // Use Next.js router for internal navigation
      if (href.startsWith('/')) {
        await router.push(href);
      } else {
        // External links use window.location
        window.location.href = href;
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to window.location for reliability
      window.location.href = href;
    } finally {
      setIsNavigating(false);
    }
  }, [href, onClick, disabled, loading, isNavigating, router]);

  const baseClasses = 'px-6 py-2 rounded-md font-medium transition-all duration-300 flex items-center justify-center min-h-10 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-accent-1 to-accent-4 hover:from-accent-2 hover:to-accent-3 text-white shadow-lg hover:shadow-xl focus:ring-accent-1',
    secondary: 'bg-gradient-to-r from-accent-2 to-accent-3 hover:from-accent-1 hover:to-accent-4 text-white shadow-lg hover:shadow-xl focus:ring-accent-2',
    outline: 'border border-gray-500 text-white hover:bg-white/5 hover:border-gray-400 focus:ring-gray-400'
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <motion.button
      whileHover={!disabled && !loading && !isNavigating ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading && !isNavigating ? { scale: 0.95 } : {}}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading || isNavigating}
      type="button"
      aria-label={ariaLabel}
      aria-busy={loading || isNavigating}
    >
      <AnimatePresence mode="wait">
        {(loading || isNavigating) ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Loading...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export const Navigation: React.FC<NavigationProps> = ({ variant = 'home', className = '' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  if (variant === 'app') {
    return (
      <nav className={`w-full flex justify-between items-center px-4 py-2 z-20 bg-background-primary ${className}`}>
        <Link href="/" className="flex items-center justify-center" onClick={closeMenu}>
          <LogoWithText size="md" />
        </Link>
        
        {/* Mobile menu button */}
        <button
          onClick={toggleMenu}
          className="lg:hidden p-2 text-white hover:bg-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-1"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 mt-1 ${isMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 mt-1 ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`} />
          </div>
        </button>

        {/* Desktop navigation */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link href="/lobby" className="text-white hover:text-accent-1 transition-colors duration-200">
            Lobby
          </Link>
          <Link href="/my-boards" className="text-white hover:text-accent-1 transition-colors duration-200">
            My Boards
          </Link>
          <Link href="/profile" className="text-white hover:text-accent-1 transition-colors duration-200">
            Profile
          </Link>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-background-secondary border-t border-gray-700 lg:hidden"
            >
              <div className="px-4 py-2 space-y-2">
                <Link 
                  href="/lobby" 
                  className="block px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors duration-200"
                  onClick={closeMenu}
                >
                  Lobby
                </Link>
                <Link 
                  href="/my-boards" 
                  className="block px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors duration-200"
                  onClick={closeMenu}
                >
                  My Boards
                </Link>
                <Link 
                  href="/profile" 
                  className="block px-4 py-2 text-white hover:bg-white/10 rounded-md transition-colors duration-200"
                  onClick={closeMenu}
                >
                  Profile
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    );
  }

  // Home variant
  return (
    <nav className={`py-2 flex justify-between items-center ${className}`}>
      <Link href="/" className="flex items-center justify-center">
        <LogoWithText size="md" />
      </Link>
      
      <div className="flex space-x-2">
        <NavigationButton
          href="/login"
          variant="outline"
          aria-label="Navigate to login page"
        >
          Log In
        </NavigationButton>
        
        <NavigationButton
          href="/signup/email"
          variant="primary"
          aria-label="Navigate to signup page"
        >
          Sign Up
        </NavigationButton>
      </div>
    </nav>
  );
};

export default Navigation;


