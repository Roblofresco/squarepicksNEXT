'use client';

import React, { useState } from 'react';
import { Bell, Loader2 } from 'lucide-react'; // Import Bell and Loader2 icon
import { useNotifications } from '@/context/NotificationContext'; // Adjusted path
import { NotificationList } from './NotificationList'; 

export const NotificationIcon = () => {
  const { unreadCount, isLoading: isLoadingContext } = useNotifications(); // Use context
  const [isOpen, setIsOpen] = useState(false);

  const toggleNotifications = () => {
    if (!isLoadingContext) { // Prevent opening if context is still loading initial data
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-accent-1 
                   focus:outline-none focus:ring-2 focus:ring-accent-1 focus:ring-offset-2 focus:ring-offset-slate-800 
                   disabled:opacity-50 transition-colors duration-150 group"
        aria-label="View notifications"
        disabled={isLoadingContext} // Disable button while context is loading
      >
        {isLoadingContext ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        ) : (
          <Bell className="h-5 w-5 group-focus:fill-white group-focus:text-white" />
        )}

        {unreadCount > 0 && !isLoadingContext && (
          <span className="absolute top-0 right-0 block h-4 w-4 transform translate-x-1/4 -translate-y-1/4">
            <span 
              className="block h-full w-full rounded-full bg-accent-3 text-white 
                         text-[10px] flex items-center justify-center 
                         ring-1 ring-slate-800 shadow-[0_0_5px_0px_#d43daecc]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>
      {isOpen && !isLoadingContext && (
        <div className="absolute right-0 mt-2 z-50 w-80 md:w-96 bg-popover shadow-lg rounded-md border border-border">
          <NotificationList onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}; 