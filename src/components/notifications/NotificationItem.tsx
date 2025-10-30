'use client';

import React, { useState, useRef } from 'react';
import { useNotifications, Notification } from '@/context/NotificationContext';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Award,
  CalendarCheck,
  Info,
  MessageSquare,
  Settings2,
  Users,
  Wallet,
  CircleDot,
  Eye,
  Trash2
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

const MESSAGE_MAX_LENGTH = 120; // Characters before truncation
const SLIDE_THRESHOLD = 50; // Pixels to swipe before snapping
const SLIDE_MAX_DISTANCE = 160; // Maximum slide distance (80px per button)
const SLIDE_RIGHT_MAX = 30; // Maximum right swipe distance

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const router = useRouter();
  
  const [isMessageExpanded, setIsMessageExpanded] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startXRef = useRef<number>(0);
  const currentTranslateXRef = useRef<number>(0);

  // Format tag text from snake_case to Title Case
  const formatTagText = (tag: string): string => {
    if (!tag) return '';
    return tag
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Smart navigation logic
  const getViewDestination = (notification: Notification): string | null => {
    const tag = notification.tag || notification.type;
    
    if (tag) {
      // Board-related notifications
      if (tag.startsWith('board_') || 
          ['board_full', 'board_active', 'board_entry', 'board_unfilled', 'winnings'].includes(tag)) {
        return '/my-boards';
      }
      // Wallet-related notifications
      if (['deposit', 'withdrawal', 'refund'].includes(tag)) {
        return '/wallet';
      }
    }
    
    // Fallback: use boardId presence to determine My Boards
    if (notification.boardId) {
      return '/my-boards';
    }
    
    // Last resort: use existing link
    return notification.link || null;
  };

  const getIcon = () => {
    const iconProps = { className: "h-4 w-4" };
    const tag = notification.tag || notification.type;
    
    // Check tag first, then type
    switch (tag?.toLowerCase()) {
      case 'board_full':
      case 'board_active':
      case 'board_entry':
      case 'board_unfilled':
        return <CalendarCheck {...iconProps} />;
      case 'deposit':
      case 'withdrawal':
      case 'refund':
        return <Wallet {...iconProps} />;
      case 'winnings':
        return <Award {...iconProps} />;
    }
    
    // Fallback to type field if tag not found
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

  // Truncate message for display
  const shouldTruncate = notification.message.length > MESSAGE_MAX_LENGTH;
  const displayMessage = isMessageExpanded || !shouldTruncate
    ? notification.message
    : notification.message.substring(0, MESSAGE_MAX_LENGTH) + '...';

  // Touch event handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentTranslateXRef.current = translateX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startXRef.current;
    const newTranslateX = currentTranslateXRef.current + deltaX;
    
    // Allow sliding right (positive, up to SLIDE_RIGHT_MAX) or left (negative, up to -SLIDE_MAX_DISTANCE)
    const clampedX = Math.max(-SLIDE_MAX_DISTANCE, Math.min(SLIDE_RIGHT_MAX, newTranslateX));
    setTranslateX(clampedX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    
    const currentX = e.changedTouches[0].clientX;
    const deltaX = currentX - startXRef.current;
    
    // Handle right swipe (closing actions and marking as read)
    if (deltaX > 0 && translateX < 0) {
      setTranslateX(0);
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
      return;
    }
    
    // Handle left swipe (opening actions)
    if (Math.abs(translateX) > SLIDE_THRESHOLD) {
      setTranslateX(-SLIDE_MAX_DISTANCE);
    } else {
      setTranslateX(0);
    }
  };

  // Mouse event handlers for desktop drag
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    currentTranslateXRef.current = translateX;
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const deltaX = currentX - startXRef.current;
    const newTranslateX = currentTranslateXRef.current + deltaX;
    
    // Allow sliding right (positive, up to SLIDE_RIGHT_MAX) or left (negative, up to -SLIDE_MAX_DISTANCE)
    const clampedX = Math.max(-SLIDE_MAX_DISTANCE, Math.min(SLIDE_RIGHT_MAX, newTranslateX));
    setTranslateX(clampedX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    
    const currentX = e.clientX;
    const deltaX = currentX - startXRef.current;
    
    // Handle right swipe (closing actions and marking as read)
    if (deltaX > 0 && translateX < 0) {
      setTranslateX(0);
      if (!notification.isRead) {
        markAsRead(notification.id);
      }
      return;
    }
    
    // Handle left swipe (opening actions)
    if (Math.abs(translateX) > SLIDE_THRESHOLD) {
      setTranslateX(-SLIDE_MAX_DISTANCE);
    } else {
      setTranslateX(0);
    }
  };

  // Prevent body scroll during drag
  React.useEffect(() => {
    if (isDragging) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isDragging]);

  const handleClick = () => {
    // Don't navigate if actions are open (slide left)
    if (translateX < -SLIDE_THRESHOLD) {
      return;
    }
    
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Try smart navigation
    const destination = getViewDestination(notification);
    if (destination) {
      router.push(destination);
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    const destination = getViewDestination(notification);
    if (destination) {
      router.push(destination);
    }
    // Close the slide
    setTranslateX(0);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
    // Close the slide
    setTranslateX(0);
  };

  const viewDestination = getViewDestination(notification);
  const tagValue = notification.tag || notification.type || '';
  const showTag = tagValue.length > 0;
  const formattedTag = formatTagText(tagValue);
  
  // Check if this is a sweepstakes notification
  const isSweepstakesNotification = tagValue.startsWith('sweepstakes_');

  return (
    <div className="relative overflow-hidden w-full">
      {/* Sliding content */}
      <div
        className="flex items-start gap-3 p-3 border-b border-slate-700/50 last:border-b-0 
                    hover:bg-slate-700/60 transition-transform duration-300 ease-out
                    cursor-pointer bg-slate-800/50"
        style={{ 
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      >
        {/* Icon */}
        <div className={`mt-0.5 flex-shrink-0 ${
          notification.isRead 
            ? 'text-slate-500' 
            : isSweepstakesNotification 
              ? 'text-[#E7B844]' 
              : 'text-accent-1'
        }`}>
          {getIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-grow min-w-0">
          {/* Tag/Type Badge (value only, no label) */}
          {showTag && (
            <span className={`inline-block px-2 py-0.5 text-xs rounded-full mb-1 ${
              notification.isRead 
                ? 'bg-slate-700/50 text-slate-400' 
                : isSweepstakesNotification
                  ? 'bg-[#E7B844] text-white shadow-[0_0_8px_rgba(231,184,68,0.4)]'
                  : 'bg-accent-1/20 text-accent-1'
            }`}>
              {formattedTag}
            </span>
          )}
          
          {/* Title (value only, no label) */}
          {notification.title && (
            <h4 className={`font-semibold text-base mb-1 ${
              notification.isRead ? 'text-slate-300' : 'text-slate-100'
            }`}>
              {notification.title}
            </h4>
          )}
          
          {/* Message (value only, no label) */}
          <p className={`text-sm leading-snug ${
            notification.isRead ? 'text-slate-400' : 'text-slate-100'
          }`}>
            {displayMessage}
            {shouldTruncate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMessageExpanded(!isMessageExpanded);
                }}
                className={`ml-1 underline text-xs ${
                  isSweepstakesNotification 
                    ? 'text-[#E7B844] hover:text-[#FFE08A]' 
                    : 'text-accent-1 hover:text-accent-2'
                }`}
              >
                {isMessageExpanded ? 'See less' : 'See more'}
              </button>
            )}
          </p>
          
          {/* Timestamp */}
          <p className={`text-xs mt-0.5 ${
            notification.isRead ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {formatRelativeTime(notification.timestamp)}
          </p>
        </div>
        
        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="ml-auto flex-shrink-0 self-center pl-2">
            <span className={`w-2 h-2 rounded-full inline-block ${
              isSweepstakesNotification
                ? 'bg-[#E7B844] shadow-[0_0_6px_1px_rgba(231,184,68,0.8)]'
                : 'bg-accent-1 shadow-[0_0_6px_1px_#1bb0f2b3]'
            }`} title="Unread"></span>
          </div>
        )}
      </div>
      
      {/* Action buttons (fixed on right, revealed when content slides left) */}
      {translateX < -SLIDE_THRESHOLD && (
        <div className="absolute right-0 top-0 h-full w-40 flex items-center">
          {/* View Button */}
          {viewDestination && (
            <button
              onClick={handleView}
              className={`h-full w-20 flex items-center justify-center text-white transition-all duration-200 ${
                isSweepstakesNotification
                  ? 'bg-[#E7B844] hover:bg-[#E0B954]'
                  : 'bg-gradient-to-br from-[#1bb0f2] to-[#108bcc] hover:from-[#108bcc] hover:to-[#0c6ca3]'
              }`}
              aria-label="View"
            >
              <Eye className="h-5 w-5" />
            </button>
          )}
          
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="h-full w-20 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 flex items-center justify-center text-white transition-all duration-200"
            aria-label="Delete"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
