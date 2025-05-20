'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getFirestore, collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, writeBatch, serverTimestamp, Timestamp 
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db as firestoreInstance } from '@/lib/firebase'; // Assuming db is exported from your firebase config

// Mirror the Notification interface from your components
// It's good practice to define this in a shared types file (e.g., src/types/notifications.ts)
export interface Notification {
  id: string;
  message: string;
  title?: string; // Added optional title if backend sends it
  timestamp: Date; // Firestore Timestamps will be converted to Date
  isRead: boolean;
  link?: string;
  type?: string; 
  relatedID?: string;
  // Add any other relevant fields, e.g., icon, category
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  // fetchNotifications is now internal, triggered by auth state
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'> & { toastType?: 'success' | 'error' | 'info' | 'warning' | 'normal' }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null>(null);

  const auth = getAuth();
  // const db = getFirestore(); // Using imported firestoreInstance

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentFirebaseUser(user);
      if (!user) {
        setNotifications([]);
        setIsLoading(false); 
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  // Effect for Firestore listener based on currentFirebaseUser
  useEffect(() => {
    if (currentFirebaseUser) {
      setIsLoading(true);
      const notificationsQuery = query(
        collection(firestoreInstance, "notifications"),
        where("userID", "==", currentFirebaseUser.uid),
        orderBy("timestamp", "desc")
        // limit(20) // Optional: Consider limiting initial fetch for performance
      );

      const unsubscribeFirestore = onSnapshot(notificationsQuery, 
        (querySnapshot) => {
          const fetchedNotifications = querySnapshot.docs.map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              message: data.message || 'No message content',
              title: data.title,
              timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(), // Convert Firestore Timestamp to JS Date
              isRead: data.isRead || false,
              link: data.link,
              type: data.type,
              relatedID: data.relatedID,
            } as Notification;
          });
          setNotifications(fetchedNotifications);
          setIsLoading(false);
        },
        (error) => {
          console.error("Error fetching notifications: ", error);
          toast.error("Could not load notifications.");
          setIsLoading(false);
          setNotifications([]); // Clear notifications on error
        }
      );

      // Cleanup listener on unmount or when user changes
      return () => unsubscribeFirestore();
    } else {
      // No user, ensure notifications are cleared and not loading
      setNotifications([]);
      setIsLoading(false);
    }
  }, [currentFirebaseUser]); // Re-run when currentFirebaseUser changes

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'> & { toastType?: 'success' | 'error' | 'info' | 'warning' | 'normal' }) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
      ...notificationData,
    };
    // setNotifications(prev => [newNotification, ...prev]); // Only if you want local optimistic updates not driven by Firestore
    
    const { toastType, message, title } = notificationData;
    const toastMessage = title ? `${title}: ${message}` : message;
    if (toastType) {
      switch (toastType) {
        case 'success': toast.success(toastMessage); break;
        case 'error': toast.error(toastMessage); break;
        case 'warning': toast.warning(toastMessage); break;
        case 'info':
        case 'normal': 
        default: toast(toastMessage); break;
      }
    } else {
      toast(toastMessage);
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    if (!currentFirebaseUser) {
      toast.error("You must be logged in to update notifications.");
      return;
    }
    // Optimistic update for faster UI response
    const originalNotifications = notifications;
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );

    try {
      const notificationRef = doc(firestoreInstance, "notifications", notificationId);
      await updateDoc(notificationRef, { isRead: true });
      // console.log(`Notification ${notificationId} marked as read in Firestore.`);
    } catch (error) {
      console.error("Error marking notification as read: ", error);
      toast.error("Failed to update notification status.");
      // Revert optimistic update if Firestore update fails
      setNotifications(originalNotifications);
    }
  };

  const markAllAsRead = async () => {
    if (!currentFirebaseUser) {
      toast.error("You must be logged in to update notifications.");
      return;
    }

    const unreadNotifications = notifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) {
      // toast.info("No unread notifications to mark."); // Optional: if you want to notify for this case
      return; 
    }

    // Optimistic update
    const originalNotifications = [...notifications]; // Shallow copy for potential rollback
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })) );

    try {
      const batch = writeBatch(firestoreInstance);
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(firestoreInstance, "notifications", notification.id);
        batch.update(notificationRef, { isRead: true });
      });
      await batch.commit();
      // console.log("All unread notifications marked as read in Firestore.");
    } catch (error) {
      console.error("Error marking all notifications as read: ", error);
      toast.error("Failed to update all notification statuses.");
      // Revert optimistic update if Firestore update fails
      setNotifications(originalNotifications);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 