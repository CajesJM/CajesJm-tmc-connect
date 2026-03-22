import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    collection,
    doc,
    getDocs,
    onSnapshot,
    updateDoc
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useMemo, useState } from 'react';
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
import { PieChart } from 'react-native-gifted-charts';

import { NotificationModal } from '../../../components/NotificationModal';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext'; // keep import
import { db } from '../../../lib/firebaseConfig';
import { createStudentDashboardStyles } from '../../../styles/student/dashboardStyles';
import { Notification, notificationService } from '../../../utils/notifications';

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
    const { width } = useWindowDimensions();
    const { colors, isDark } = useTheme();          // <-- theme
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    // Dynamic styles based on theme and screen size
    const styles = useMemo(
        () => createStudentDashboardStyles(colors, isDark, isMobile, isTablet, isDesktop),
        [colors, isDark, isMobile, isTablet, isDesktop]
    );

    // Dynamic header gradient (matches announcement / other screens)
    const headerGradientColors = isDark
        ? ['#0f172a', '#1e293b'] as const
        : ['#1e40af', '#3b82f6'] as const;

    const router = useRouter();
    const { userData } = useAuth();

    // State declarations (no duplicates)
    const [studentStats, setStudentStats] = useState({
        eventsAttended: 0,
        upcomingEvents: 0,
        totalAnnouncements: 0,
    });

    const [donutData, setDonutData] = useState({
        upcomingEvents: 0,
        pastEvents: 0,
        announcements: 0,
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

    // Helper: check if event/announcement should be shown (approved or no status)
    const isApproved = (data: any): boolean => {
        const status = data.status;
        return status === 'approved' || !status;
    };

    // Fetch student stats (attended, upcoming, total announcements)
    const fetchStudentStats = async () => {
        try {
            setLoading(true);
            if (!userData?.email) return;

            const now = new Date();

            const eventsSnapshot = await getDocs(collection(db, 'events'));
            let attendedCount = 0;
            let upcomingCount = 0;

            eventsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!isApproved(data)) return;

                const eventDate = data.date?.toDate?.() || data.date;
                if (!eventDate) return;

                if (eventDate < now) {
                    const attendees = data.attendees || [];
                    if (attendees.includes(userData.email)) {
                        attendedCount++;
                    }
                } else {
                    upcomingCount++;
                }
            });

            const announcementsSnapshot = await getDocs(collection(db, 'updates'));
            let totalAnnouncements = 0;
            announcementsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (isApproved(data)) totalAnnouncements++;
            });

            setStudentStats({
                eventsAttended: attendedCount,
                upcomingEvents: upcomingCount,
                totalAnnouncements,
            });
        } catch (error) {
            console.error('Error fetching student stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch donut data (counts for chart)
    const fetchDonutData = async () => {
        try {
            const now = new Date();
            const eventsSnapshot = await getDocs(collection(db, 'events'));
            let upcomingEventsCount = 0;
            let pastEventsCount = 0;

            eventsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (!isApproved(data)) return;

                const eventDate = data.date?.toDate?.() || data.date;
                if (!eventDate) return;

                if (eventDate > now) {
                    upcomingEventsCount++;
                } else {
                    pastEventsCount++;
                }
            });

            const announcementsSnapshot = await getDocs(collection(db, 'updates'));
            let totalAnnouncements = 0;
            announcementsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (isApproved(data)) totalAnnouncements++;
            });

            setDonutData({
                upcomingEvents: upcomingEventsCount,
                pastEvents: pastEventsCount,
                announcements: totalAnnouncements,
            });
        } catch (error) {
            console.error('Error fetching donut data:', error);
        }
    };

    // Real‑time listener for upcoming events (for the list)
    const fetchUpcomingEvents = () => {
        setEventsLoading(true);
        const now = new Date();

        const unsubscribe = onSnapshot(
            collection(db, 'events'),
            (snapshot) => {
                const events: Event[] = [];
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (!isApproved(data)) return;

                    const eventDate = data.date?.toDate?.() || data.date;
                    if (!eventDate) return;
                    if (eventDate <= now) return;

                    events.push({
                        id: doc.id,
                        title: data.title || 'Untitled Event',
                        description: data.description,
                        date: eventDate,
                        time: data.time,
                        location: data.location,
                        attendees: data.attendees || [],
                        createdAt: data.createdAt?.toDate(),
                    });
                });

                events.sort((a, b) => a.date.getTime() - b.date.getTime());
                setUpcomingEvents(events.slice(0, 3));
                setEventsLoading(false);
            },
            (error) => {
                console.error('Error fetching upcoming events:', error);
                setEventsLoading(false);
            }
        );

        return unsubscribe;
    };

    const fetchRecentAnnouncements = () => {
        setAnnouncementsLoading(true);
        const unsubscribe = onSnapshot(
            collection(db, 'updates'),
            (snapshot) => {
                const announcements: Announcement[] = [];
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (!isApproved(data)) return;

                    announcements.push({
                        id: doc.id,
                        title: data.title || 'Announcement',
                        content: data.content || data.message || 'No content',
                        createdAt: data.createdAt?.toDate() || new Date(),
                        priority: data.priority || 'medium',
                        author: data.author || 'Admin',
                    });
                });

                announcements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setRecentAnnouncements(announcements.slice(0, 3));
                setAnnouncementsLoading(false);
            },
            (error) => {
                console.error('Error fetching announcements:', error);
                setAnnouncementsLoading(false);
            }
        );

        return unsubscribe;
    };

    useEffect(() => {
        fetchStudentStats();
        fetchDonutData();

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
        Promise.all([fetchStudentStats(), fetchDonutData()]).finally(() => setRefreshing(false));
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
        <View style={[styles.statCard, { borderRightWidth: 3, borderRightColor: '#1266d4' }]}>
            <View style={styles.statCardHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
                    {icon}
                </View>
            </View>
            <Text style={styles.statNumber}>{value}</Text>
            <Text style={styles.statLabel}>{title}</Text>
        </View>
    );

    const DonutChart = () => {
        const total = donutData.upcomingEvents + donutData.pastEvents + donutData.announcements;
        const pieData = [
            {
                value: donutData.upcomingEvents,
                color: '#0ea5e9',
                text: `${Math.round((donutData.upcomingEvents / total) * 100)}%`,
                label: 'Upcoming Events',
                icon: 'time-outline',
            },
            {
                value: donutData.pastEvents,
                color: '#64748b',
                text: `${Math.round((donutData.pastEvents / total) * 100)}%`,
                label: 'Past Events',
                icon: 'calendar-outline',
            },
            {
                value: donutData.announcements,
                color: '#8b5cf6',
                text: `${Math.round((donutData.announcements / total) * 100)}%`,
                label: 'Announcements',
                icon: 'megaphone',
            },
        ];

        if (total === 0) {
            return (
                <View style={styles.donutChartContainer}>
                    <Text style={styles.donutChartEmptyText}>No data available</Text>
                </View>
            );
        }

        return (
            <View style={styles.donutChartContainer}>
                <View style={styles.donutHeader}>
                    <View style={styles.donutHeaderLeft}>
                        <Ionicons name="pie-chart" size={18} color="#0ea5e9" />
                        <Text style={styles.donutTitle}>Content Distribution</Text>
                    </View>
                    <Text style={styles.donutTotalBadge}>{total} total</Text>
                </View>

                <View style={styles.donutChartWrapper}>
                    <PieChart
                        data={pieData}
                        donut
                        showText
                        textColor={colors.text}                       
                        fontWeight="bold"
                        innerRadius={50}
                        innerCircleColor={colors.card}               
                        strokeWidth={2}
                        focusOnPress={false}
                        centerLabelComponent={() => (
                            <View style={styles.donutCenterLabel}>
                                <Text style={styles.donutCenterValue}>{total}</Text>
                                <Text style={styles.donutCenterText}>Total Items</Text>
                            </View>
                        )}
                    />
                </View>

                <View style={styles.progressLegendContainer}>
                    {pieData.map((item, idx) => (
                        <View key={idx} style={styles.progressLegendItem}>
                            <View style={[styles.progressLegendIcon, { backgroundColor: `${item.color}20` }]}>
                                <Ionicons name={item.icon as any} size={14} color={item.color} />
                            </View>
                            <View style={styles.progressLegendInfo}>
                                <Text style={styles.progressLegendLabel}>{item.label}</Text>
                                <Text style={styles.progressLegendCount}>{item.value} items</Text>
                            </View>
                            <Text style={[styles.progressLegendPercent, { color: item.color }]}>
                                {item.text}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    const renderOverview = () => (
        <ScrollView
            style={styles.overviewContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
        >
            {/* Header with dynamic gradient */}
            <LinearGradient
                colors={headerGradientColors}
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

            <DonutChart />

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