'use client';

import React from 'react';
import { useNotifications, Notification } from '@/context/NotificationContext'; // Adjusted path
import { useRouter } from 'next/navigation';
import {
  AlertCircle, // Example: for general alerts or errors
  Award,       // Example: for achievements or winnings
  CalendarCheck, // Example: for game starts or events
  Info,        // Example: for informational messages
  MessageSquare, // Example: for new messages or social interactions
  Settings2,   // Example: for account updates
  Users,       // Example: for friend requests or team updates
  Wallet,      // Example: for transactions
  CircleDot    // Default fallback icon
} from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
}

const formatRelativeTime = (timestamp: Date | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
};

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { markAsRead } = useNotifications();
  const router = useRouter();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
    // Potentially close the notification dropdown after click - depends on desired UX
    // You might need to pass down the onClose function from NotificationList if you want that behavior here.
  };

  const getIcon = () => {
    const iconProps = { className: "h-4 w-4" };
    switch (notification.type?.toUpperCase()) {
      case 'GAME_ALERT':
      case 'GAME_START':
        return <CalendarCheck {...iconProps} />;
      case 'WALLET_CREDIT':
      case 'TRANSACTION':
        return <Wallet {...iconProps} />;
      case 'ACHIEVEMENT':
      case 'WINNING':
        return <Award {...iconProps} />;
      case 'NEW_MESSAGE':
        return <MessageSquare {...iconProps} />;
      case 'ACCOUNT_UPDATE':
        return <Settings2 {...iconProps} />;
      case 'SOCIAL':
      case 'FRIEND_REQUEST':
        return <Users {...iconProps} />;
      case 'ERROR':
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
      case 'INFO':
        return <Info {...iconProps} />;
      default:
        return <CircleDot {...iconProps} />;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-3 border-b border-slate-700/50 last:border-b-0 
                  hover:bg-slate-700/60 transition-colors duration-150 cursor-pointer 
                  ${notification.isRead ? 'opacity-60 hover:opacity-80' : 'opacity-95 hover:opacity-100 font-medium'}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
    >
      <div className={`mt-0.5 flex-shrink-0 ${notification.isRead ? 'text-slate-500' : 'text-accent-1'}`}>
        {getIcon()}
      </div>
      <div className="flex-grow min-w-0">
        <p className={`text-sm leading-snug ${notification.isRead ? 'text-slate-400' : 'text-slate-100'}`}>
          {notification.message}
        </p>
        <p className={`text-xs mt-0.5 ${notification.isRead ? 'text-slate-500' : 'text-slate-400'}`}>
          {formatRelativeTime(notification.timestamp)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="ml-auto flex-shrink-0 self-center pl-2">
          <span className="w-2 h-2 bg-accent-1 rounded-full inline-block shadow-[0_0_6px_1px_#1bb0f2b3]" title="Unread"></span>
        </div>
      )}
    </div>
  );
}; 