import {
    collection,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'event' | 'announcement' | 'attendance' | 'user' | 'system';
    timestamp: Date;
    read: boolean;
    data?: any;
    priority?: 'high' | 'medium' | 'low';
}

class NotificationService {
    private listeners: (() => void)[] = [];

    // Listen for real-time notifications
    listenForNotifications(
        userId: string,
        callback: (notifications: Notification[]) => void
    ) {
        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(),
            })) as Notification[];

            callback(notifications);
        });

        this.listeners.push(unsubscribe);
        return unsubscribe;
    }

    // Mark notification as read
    async markAsRead(notificationId: string) {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, {
                read: true
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    // Mark all as read
    async markAllAsRead(userId: string) {
        try {
            const unreadQuery = query(
                collection(db, 'notifications'),
                where('userId', '==', userId),
                where('read', '==', false)
            );

            const snapshot = await getDocs(unreadQuery);
            const batch = snapshot.docs.map(doc => updateDoc(doc.ref, { read: true }));

            await Promise.all(batch);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    // Create notification (can be called from other services)
    async createNotification(notification: Omit<Notification, 'id' | 'read'>) {
        try {
            const notificationsRef = collection(db, 'notifications');
            await updateDoc(doc(notificationsRef), {
                ...notification,
                read: false,
                timestamp: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    // Clean up listeners
    cleanup() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

export const notificationService = new NotificationService();