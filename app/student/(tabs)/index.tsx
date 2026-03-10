import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    collection,
    doc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

import { NotificationModal } from '../../../components/NotificationModal';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebaseConfig';
import { studentDashboardStyles as styles } from '../../../styles/student/dashboardStyles';
import { Notification, notificationService } from '../../../utils/notifications';

// Types
interface Event {
    id: string;
    title: string;
    description?: string;
    date: Date;
    time?: string;
    location?: string;
    attendees?: string[];
    createdAt?: Date;
    status?: string;
}

interface Announcement {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
    priority?: 'high' | 'medium' | 'low';
    author?: string;
    status?: string;
}

export default function StudentDashboard() {
    const [studentStats, setStudentStats] = useState({
        eventsAttended: 0,
        upcomingEvents: 0,
        totalAnnouncements: 0,
    });

    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationModalVisible, setNotificationModalVisible] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [uploadingImage, setUploadingImage] = useState(false);

    const { width } = useWindowDimensions();
    const router = useRouter();
    const { userData } = useAuth();

    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;

    const fetchStudentStats = async () => {
    try {
        setLoading(true);
        if (!userData?.email) return;

        const now = new Date();

   
        const attendedQuery = query(
            collection(db, 'events'),
            where('status', '==', 'approved'),
            where('attendees', 'array-contains', userData.email),
            where('date', '<', now)
        );
        const attendedSnap = await getDocs(attendedQuery);
        const eventsAttended = attendedSnap.size;

        const upcomingQuery = query(
            collection(db, 'events'),
            where('status', '==', 'approved'),
            where('date', '>', now)
        );
        const upcomingSnap = await getDocs(upcomingQuery);
        const upcomingEvents = upcomingSnap.size;

      
        const announcementsQuery = query(
            collection(db, 'updates'),
            where('status', '==', 'approved')
        );
        const announcementsSnap = await getDocs(announcementsQuery);
        const totalAnnouncements = announcementsSnap.size;

        setStudentStats({
            eventsAttended,
            upcomingEvents,
            totalAnnouncements,
        });
    } catch (error) {
        console.error('Error fetching student stats:', error);
    } finally {
        setLoading(false);
    }
};

    const fetchUpcomingEvents = () => {
        setEventsLoading(true);

        const now = new Date();
        
        const eventsQuery = query(
            collection(db, 'events'),
            where('status', '==', 'approved'),
            where('date', '>', now), 
            orderBy('date', 'asc'),
            limit(5)
        );

        return onSnapshot(eventsQuery, (snapshot) => {
            console.log('Upcoming events snapshot size:', snapshot.size);
            snapshot.docs.forEach(doc => {
                console.log('Event:', doc.id, doc.data());
            });

            const events = snapshot.docs.map(doc => {
                const data = doc.data();
                const eventDate = data.date?.toDate();
                return {
                    id: doc.id,
                    title: data.title || 'Untitled Event',
                    description: data.description,
                    date: eventDate,
                    time: data.time,
                    location: data.location,
                    attendees: data.attendees || [],
                    createdAt: data.createdAt?.toDate()
                };
            });

            setUpcomingEvents(events);
            setEventsLoading(false);
        }, (error) => {
            console.error('Error fetching upcoming events:', error);
            setEventsLoading(false);
        });
    };

    const fetchRecentAnnouncements = () => {
        setAnnouncementsLoading(true);
        const announcementsQuery = query(
            collection(db, 'updates'),
            where('status', '==', 'approved'),
            orderBy('createdAt', 'desc'),
            limit(3)
        );

        return onSnapshot(announcementsQuery, (snapshot) => {
            const announcements = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || 'Announcement',
                    content: data.content || data.message || 'No content',
                    createdAt: data.createdAt?.toDate() || new Date(),
                    priority: data.priority || 'medium',
                    author: data.author || 'Admin'
                };
            });
            setRecentAnnouncements(announcements);
            setAnnouncementsLoading(false);
        }, (error) => {
            console.error('Error fetching announcements:', error);
            setAnnouncementsLoading(false);
        });
    };

    useEffect(() => {
        fetchStudentStats();
        const unsubscribeEvents = fetchUpcomingEvents();
        const unsubscribeAnnouncements = fetchRecentAnnouncements();

        if (userData?.email) {
            const unsubscribeNotifications = notificationService.listenForNotifications(
                userData.email,
                (notifs) => {
                    setNotifications(notifs);
                    setUnreadCount(notifs.filter(n => !n.read).length);
                }
            );
            return () => {
                unsubscribeEvents();
                unsubscribeAnnouncements();
                unsubscribeNotifications();
                notificationService.cleanup();
            };
        }
        return () => {
            unsubscribeEvents();
            unsubscribeAnnouncements();
        };
    }, [userData]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchStudentStats().finally(() => setRefreshing(false));
    }, []);

    const handleNotificationPress = async (notification: Notification) => {
        if (!notification.read) await notificationService.markAsRead(notification.id);
        switch (notification.type) {
            case 'event':
                router.push(notification.data?.eventId ? `/student/events?id=${notification.data.eventId}` : '/student/events');
                break;
            case 'announcement':
                router.push(notification.data?.announcementId ? `/student/announcements?id=${notification.data.announcementId}` : '/student/announcements');
                break;
            case 'attendance':
                router.push('/student/attendance');
                break;
            default: break;
        }
    };

    const handleMarkAllRead = async () => {
        if (userData?.email) await notificationService.markAllAsRead(userData.email);
    };

    const handleProfileImagePress = async () => {
        try {
            if (Platform.OS === 'web') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e: any) => {
                    const file = e.target.files[0];
                    if (file) await uploadProfileImage(file);
                };
                input.click();
            } else {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permissionResult.granted) {
                    Alert.alert('Permission Required', 'Permission to access camera roll is required!');
                    return;
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.5,
                });
                if (!result.canceled) await uploadProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image.');
        }
    };

    const uploadProfileImage = async (imageUri: string | File) => {
        try {
            setUploadingImage(true);
            let blob: Blob;
            if (imageUri instanceof File) blob = imageUri;
            else {
                const response = await fetch(imageUri);
                blob = await response.blob();
            }
            const storage = getStorage();
            const fileName = `profile_${userData?.email}_${Date.now()}.jpg`;
            const storageRef = ref(storage, `profileImages/${fileName}`);
            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);
            if (userData?.email) {
                const userRef = doc(db, 'users', userData.email);
                await updateDoc(userRef, { photoURL: downloadUrl });
                Alert.alert('Success', 'Profile image updated!');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', 'Failed to upload image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const navigateTo = (screen: string, id?: string) => {
        switch (screen) {
            case 'events':
                router.push(id ? `/student/events?id=${id}` : '/student/events');
                break;
            case 'attendance':
                router.push('/student/attendance');
                break;
            case 'announcements':
                router.push(id ? `/student/announcements?id=${id}` : '/student/announcements');
                break;
            case 'profile':
                router.push('/student/profile');
                break;
            default: break;
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const renderStatCard = (title: string, value: number, icon: React.ReactElement, color: string) => (
        <View style={[styles.statCard, {borderRightWidth: 3, borderRightColor: '#1266d4'}]}>
            <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
                    {icon}
                </View>
            </View>
            <Text style={styles.statNumber}>{value}</Text>
            <Text style={styles.statLabel}>{title}</Text>
        </View>
    );

    const renderOverview = () => (
        <ScrollView
            style={styles.overviewContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
        >
            {/* Header */}
            <LinearGradient
                colors={['#14203d', '#06080b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.greetingText}>Hello,</Text>
                        <Text style={styles.userName}>{userData?.name || 'Student'}</Text>
                        <Text style={styles.roleText}>Student</Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton} onPress={handleProfileImagePress} disabled={uploadingImage}>
                        {uploadingImage ? (
                            <View style={[styles.profileImage, styles.profileFallback]}>
                                <ActivityIndicator size="small" color="#ffffff" />
                            </View>
                        ) : userData?.photoURL ? (
                            <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
                        ) : (
                            <View style={[styles.profileImage, styles.profileFallback]}>
                                <Text style={styles.profileInitials}>
                                    {userData?.name ? userData.name.charAt(0).toUpperCase() : 'S'}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.dateSection}>
                    <View style={styles.dateContainer}>
                        <Feather name="calendar" size={12} color="#94a3b8" />
                        <Text style={styles.dateText}>
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerAction} onPress={() => setNotificationModalVisible(true)}>
                            <Feather name="bell" size={18} color="#ffffff" />
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            <NotificationModal
                visible={notificationModalVisible}
                onClose={() => setNotificationModalVisible(false)}
                notifications={notifications}
                onNotificationPress={handleNotificationPress}
                onMarkAllRead={handleMarkAllRead}
                pendingApprovals={[]}
                approvalCount={0}
            />

            <View style={styles.statsGrid}>
                {renderStatCard(
                    'Events Attended',
                    studentStats.eventsAttended,
                    <Ionicons name="calendar" size={20} color="#0ea5e9" />,
                    '#0ea5e9'
                )}
                {renderStatCard(
                    'Upcoming Events',
                    studentStats.upcomingEvents,
                    <Ionicons name="time" size={20} color="#f59e0b" />,
                    '#f59e0b'
                )}
                {renderStatCard(
                    'Announcements',
                    studentStats.totalAnnouncements,
                    <FontAwesome6 name="bullhorn" size={20} color="#8b5cf6" />,
                    '#8b5cf6'
                )}
            </View>

            <View style={styles.twoColumnLayout}>
    
                <View style={[styles.column, styles.upcomingColumn]}>
                    <View style={styles.upcomingCard}>
                        <View style={styles.upcomingHeader}>
                            <Text style={styles.upcomingTitle}>Upcoming Events</Text>
                            <TouchableOpacity onPress={() => navigateTo('events')}>
                                <Text style={styles.viewAllText}>View all</Text>
                            </TouchableOpacity>
                        </View>
                        {eventsLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#0ea5e9" />
                                <Text style={styles.loadingText}>Loading events...</Text>
                            </View>
                        ) : upcomingEvents.length > 0 ? (
                            <View style={styles.upcomingList}>
                                {upcomingEvents.map((event) => {
                                    const day = event.date.getDate().toString().padStart(2, '0');
                                    const month = event.date.toLocaleString('default', { month: 'short' }).toUpperCase();
                                    const isRegistered = event.attendees?.includes(userData?.email || '');
                                    return (
                                        <TouchableOpacity
                                            key={event.id}
                                            style={styles.upcomingItem}
                                            onPress={() => navigateTo('events', event.id)}
                                        >
                                            <View style={styles.eventDate}>
                                                <Text style={styles.eventDay}>{day}</Text>
                                                <Text style={styles.eventMonth}>{month}</Text>
                                            </View>
                                            <View style={styles.eventInfo}>
                                                <Text style={styles.eventName} numberOfLines={1}>{event.title}</Text>
                                                <Text style={styles.eventTime} numberOfLines={1}>
                                                    {event.time || event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location || 'TBA'}
                                                </Text>
                                                {isRegistered && (
                                                    <Text style={styles.registeredBadge}>✓ You're attending</Text>
                                                )}
                                            </View>
                                            <Feather name="chevron-right" size={20} color="#94a3b8" />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Feather name="calendar" size={32} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No upcoming events</Text>
                                <TouchableOpacity style={styles.createButton} onPress={() => navigateTo('events')}>
                                    <Text style={styles.createButtonText}>Browse Events</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Recent Announcements */}
                <View style={[styles.column, styles.upcomingColumn]}>
                    <View style={styles.announcementCard}>
                        <View style={styles.announcementHeader}>
                            <Text style={styles.announcementTitle}>Recent Announcements</Text>
                            <TouchableOpacity onPress={() => navigateTo('announcements')}>
                                <Text style={styles.viewAllText}>View all</Text>
                            </TouchableOpacity>
                        </View>
                        {announcementsLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#0ea5e9" />
                                <Text style={styles.loadingText}>Loading announcements...</Text>
                            </View>
                        ) : recentAnnouncements.length > 0 ? (
                            <View style={styles.announcementList}>
                                {recentAnnouncements.map((announcement) => {
                                    const priorityColor =
                                        announcement.priority === 'high' ? '#ef4444' :
                                        announcement.priority === 'medium' ? '#f59e0b' : '#10b981';
                                    return (
                                        <TouchableOpacity
                                            key={announcement.id}
                                            style={styles.announcementItem}
                                            onPress={() => navigateTo('announcements', announcement.id)}
                                        >
                                            <View style={[styles.announcementBadge, { backgroundColor: `${priorityColor}20` }]}>
                                                <FontAwesome6 name="bullhorn" size={12} color={priorityColor} />
                                            </View>
                                            <View style={styles.announcementContent}>
                                                <Text style={styles.announcementText} numberOfLines={1}>{announcement.title}</Text>
                                                <Text style={styles.announcementTime}>{formatTimeAgo(announcement.createdAt)} • {announcement.author}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Feather name="bell" size={32} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No announcements yet</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    return (
        <View style={styles.container}>
            <View style={styles.contentArea}>
                {renderOverview()}
            </View>
        </View>
    );
}