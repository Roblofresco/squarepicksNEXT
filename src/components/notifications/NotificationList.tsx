'use client';

import React, { useEffect } from 'react';
import { useNotifications, Notification } from '@/context/NotificationContext'; // Adjusted path
import { NotificationItem } from './NotificationItem';
import { X, Loader2, Inbox } from 'lucide-react'; // For close, loader, and empty state icons

interface NotificationListProps {
  onClose: () => void;
}

export const NotificationList = ({ onClose }: NotificationListProps) => {
  const { notifications, markAllAsRead, isLoading, unreadCount } = useNotifications();

  // Click outside to close (adapted from previous version)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if the click is outside the notification list container
      if (!target.closest('.notification-list-container')) {
        onClose();
      }
    };
    // Add listener on mount
    document.addEventListener('mousedown', handleClickOutside);
    // Cleanup listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    // Optionally close the list after marking all as read, or keep it open
    // onClose(); 
  }

  return (
    <div className="notification-list-container flex flex-col 
                    bg-slate-800 backdrop-blur-md 
                    border border-accent-1/50 rounded-lg 
                    shadow-2xl shadow-accent-1/30 max-h-[80vh]">
      <div className="p-3 border-b border-slate-700 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-slate-100">Notifications</h3>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead} 
              className="text-xs text-accent-1 hover:text-accent-1/80 focus:outline-none focus:ring-1 focus:ring-accent-1 rounded"
              aria-label="Mark all notifications as read"
            >
              Mark all as read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-500" aria-label="Close notifications">
            <X className="h-4 w-4 text-slate-400 hover:text-slate-200" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>Loading notifications...</p>
          {/* Basic Skeleton for a few items */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="w-full p-3 my-1.5 bg-muted/50 rounded-md animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-1.5"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-slate-400">
          <Inbox className="h-12 w-12 mb-4 opacity-40" />
          <h4 className="font-semibold text-lg text-slate-300 mb-1">No new notifications</h4>
          <p className="text-sm">You're all caught up!</p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="overflow-y-auto flex-grow py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}

      {/* Optional Footer for a link to all notifications page */}
      {/* 
      {!isLoading && notifications.length > 0 && (
        <div className="p-2 border-t border-border text-center">
          <Link href="/notifications" className="text-sm text-primary hover:underline" onClick={onClose}>
            View all notifications
          </Link>
        </div>
      )}
      */}
    </div>
  );
}; 