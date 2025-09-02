'use client'

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface ActionButtonProps {
  href?: string;
  onClick?: () => void | Promise<void>;
  variant: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  'aria-label'?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  href,
  onClick,
  variant,
  size = 'md',
  children,
  disabled = false,
  loading = false,
  className = '',
  'aria-label': ariaLabel,
  type = 'button',
  fullWidth = false,
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
        await onClick();
        return;
      }

      // Navigation handling
      if (href) {
        if (href.startsWith('/')) {
          // Internal navigation
          await router.push(href);
        } else if (href.startsWith('#')) {
          // Scroll to element
          const element = document.querySelector(href);
          if (element) {
            element.scrollIntoView({ 
              behavior: 'scrollBehavior' in document.documentElement.style ? 'smooth' : 'auto',
              block: 'start'
            });
          }
        } else {
          // External links
          window.location.href = href;
        }
      }
    } catch (error) {
      console.error('Action button error:', error);
      // Fallback for navigation
      if (href && href.startsWith('/')) {
        window.location.href = href;
      }
    } finally {
      setIsNavigating(false);
    }
  }, [href, onClick, disabled, loading, isNavigating, router]);

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-xl'
  };

  const baseClasses = `${sizeClasses[size]} rounded-md font-semibold transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-primary ${fullWidth ? 'w-full' : ''}`;
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-accent-1 to-accent-4 hover:from-accent-2 hover:to-accent-3 text-white shadow-lg hover:shadow-xl focus:ring-accent-1 hover:scale-105',
    secondary: 'bg-gradient-to-r from-accent-2 to-accent-3 hover:from-accent-1 hover:to-accent-4 text-white shadow-lg hover:shadow-xl focus:ring-accent-2 hover:scale-105',
    outline: 'border border-gray-500 text-white hover:bg-white/5 hover:border-gray-400 focus:ring-gray-400 hover:scale-105'
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <motion.button
      whileHover={!disabled && !loading && !isNavigating ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading && !isNavigating ? { scale: 0.98 } : {}}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading || isNavigating}
      type={type}
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
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Loading...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default ActionButton;
