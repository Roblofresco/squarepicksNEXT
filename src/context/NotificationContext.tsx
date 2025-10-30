'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getFirestore, collection, query, where, orderBy, onSnapshot,
  doc, updateDoc, writeBatch, serverTimestamp, Timestamp, limit, deleteDoc
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
  tag?: string; // Notification tag (e.g., "board_entry", "deposit", "winnings")
  boardId?: string; // Board ID for board-related notifications
  gameId?: string; // Game ID for game-related notifications
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
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'> & { toastType?: 'success' | 'error' | 'info' | 'warning' | 'normal' }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userPreferences, setUserPreferences] = useState<{ prefersEmail: boolean; prefersSMS: boolean } | null>(null);

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
        orderBy("timestamp", "desc"),
        limit(20) // Fetch only the 20 most recent notifications
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
              tag: data.tag,
              boardId: data.boardId,
              gameId: data.gameId,
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

  // Fetch user preferences when auth state changes
  useEffect(() => {
    if (currentFirebaseUser) {
      const userDocRef = doc(firestoreInstance, "users", currentFirebaseUser.uid);
      const unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserPreferences({
            prefersEmail: data.prefersEmail || false,
            prefersSMS: data.prefersSMS || false,
          });
        }
      });
      return () => unsubscribeUserDoc();
    } else {
      setUserPreferences(null);
    }
  }, [currentFirebaseUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'> & { toastType?: 'success' | 'error' | 'info' | 'warning' | 'normal' }) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
      ...notificationData,
    };

    // Check user preferences and send notifications accordingly
    if (userPreferences?.prefersEmail) {
      // Call function to send email notification
      sendEmailNotification(newNotification);
    }
    if (userPreferences?.prefersSMS) {
      // Call function to send SMS notification
      sendSMSNotification(newNotification);
    }

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
  }, [userPreferences]);

  // Placeholder functions for sending notifications
  const sendEmailNotification = (notification: Notification) => {
    // Implement email sending logic using Resend
    console.log('Sending email notification:', notification);
  };

  const sendSMSNotification = (notification: Notification) => {
    // Implement SMS sending logic using Twilio
    console.log('Sending SMS notification:', notification);
  };

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

    console.log(`[NotificationContext] Attempting to mark as read. Notification ID: ${notificationId}, User UID: ${currentFirebaseUser.uid}`); // Logging

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

    const unreadIds = unreadNotifications.map(n => n.id).join(', ');
    console.log(`[NotificationContext] Attempting to mark all as read. Notification IDs: [${unreadIds}], User UID: ${currentFirebaseUser.uid}`); // Logging

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

  const deleteNotification = async (notificationId: string) => {
    if (!currentFirebaseUser) {
      toast.error("You must be logged in to delete notifications.");
      return;
    }

    // Optimistic update: Remove from list immediately
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    try {
      const notificationRef = doc(firestoreInstance, "notifications", notificationId);
      await deleteDoc(notificationRef);
      // console.log(`Notification ${notificationId} deleted from Firestore.`);
    } catch (error) {
      console.error("Error deleting notification: ", error);
      toast.error("Failed to delete notification.");
      // Revert optimistic update if Firestore delete fails
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
        deleteNotification,
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