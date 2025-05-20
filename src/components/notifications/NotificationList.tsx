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
    <div className="notification-list-container max-h-[70vh] flex flex-col"> {/* Ensure this class is on the outermost div for click outside to work */}
      <div className="p-3 border-b border-border flex justify-between items-center">
        <h3 className="font-semibold text-lg text-popover-foreground">Notifications</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead} 
              className="text-xs text-primary hover:text-primary/80 focus:outline-none"
              aria-label="Mark all notifications as read"
            >
              Mark all as read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent" aria-label="Close notifications">
            <X className="h-4 w-4 text-muted-foreground" />
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
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Inbox className="h-12 w-12 mb-4 opacity-50" />
          <h4 className="font-semibold text-lg mb-1">No new notifications</h4>
          <p className="text-sm">You're all caught up!</p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <div className="overflow-y-auto flex-grow py-1">
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