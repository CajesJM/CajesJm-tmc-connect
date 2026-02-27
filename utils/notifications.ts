import { addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebaseConfig';
export interface Notification {
    id: string;
    userId: string;
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

    async createNotification(notification: Omit<Notification, 'id' | 'read'>) {
        try {
            const notificationsRef = collection(db, 'notifications');
            await addDoc(notificationsRef, {
                ...notification,
                read: false,
                timestamp: Timestamp.now(),
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    cleanup() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
}

export const notificationService = new NotificationService();