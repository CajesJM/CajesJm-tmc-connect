import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    updateDoc
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { NotificationModal } from '../../../components/NotificationModal';
import { StudentActivityModal } from '../../../components/StudentActivityModal';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
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

// Animated counter hook
const useAnimatedCounter = (targetValue: number, duration = 1500) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        animatedValue.setValue(0);
        Animated.timing(animatedValue, {
            toValue: targetValue,
            duration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();

        const listener = animatedValue.addListener(({ value }) => {
            setDisplayValue(Math.round(value));
        });

        return () => animatedValue.removeListener(listener);
    }, [targetValue, duration]);

    return displayValue;
};

// Shimmer loading effect component
const ShimmerPlaceholder = ({ width, height, colors }: { width: number; height: number; colors: any }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={{ width, height, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }}>
            <Animated.View
                style={{
                    width: '40%',
                    height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: [{ translateX }],
                }}
            />
        </View>
    );
};

export default function StudentDashboard() {
    const { width } = useWindowDimensions();
    const { colors, isDark } = useTheme();
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    const styles = useMemo(
        () => createStudentDashboardStyles(colors, isDark, isMobile, isTablet, isDesktop),
        [colors, isDark, isMobile, isTablet, isDesktop]
    );

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const headerSlideAnim = useRef(new Animated.Value(-100)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Interactive donut chart state
    const [selectedSlice, setSelectedSlice] = useState<number | null>(null);
    const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);
    const donutScaleAnim = useRef(new Animated.Value(1)).current;

    const router = useRouter();
    const { userData } = useAuth();

    // State declarations - MOVED BEFORE useAnimatedCounter calls
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
    const [activityModalVisible, setActivityModalVisible] = useState(false);
    const [badgeCount, setBadgeCount] = useState(0);
    const [lastViewed, setLastViewed] = useState<Date | null>(null);

    // Animated counters - NOW AFTER state declarations
    const animatedEventsAttended = useAnimatedCounter(studentStats.eventsAttended);
    const animatedUpcomingEvents = useAnimatedCounter(studentStats.upcomingEvents);
    const animatedAnnouncements = useAnimatedCounter(studentStats.totalAnnouncements);

    // Entry animations
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            }),
            Animated.timing(headerSlideAnim, {
                toValue: 0,
                duration: 1000,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for notification bell
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Rotate animation for refresh
    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const isApproved = (data: any): boolean => {
        const status = data.status;
        return status === 'approved' || !status;
    };

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

    const fetchRecentEvents = () => {
        setEventsLoading(true);

        const unsubscribe = onSnapshot(
            query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(10)),
            (snapshot) => {
                const events: Event[] = [];
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    if (!isApproved(data)) return;

                    events.push({
                        id: doc.id,
                        title: data.title || 'Untitled Event',
                        description: data.description,
                        date: data.date?.toDate() || new Date(),
                        time: data.time,
                        location: data.location,
                        attendees: data.attendees || [],
                        createdAt: data.createdAt?.toDate(),
                    });
                });
                events.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
                setUpcomingEvents(events.slice(0, 5));
                setEventsLoading(false);
            },
            (error) => {
                console.error('Error fetching events:', error);
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
                setRecentAnnouncements(announcements.slice(0, 5));
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

        const unsubscribeEvents = fetchRecentEvents();
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

    useEffect(() => {
        const loadLastViewed = async () => {
            try {
                const stored = await AsyncStorage.getItem('student_last_activity_view');
                if (stored) {
                    setLastViewed(new Date(parseInt(stored)));
                } else {
                    const now = Date.now();
                    await AsyncStorage.setItem('student_last_activity_view', now.toString());
                    setLastViewed(new Date(now));
                }
            } catch (error) {
                console.error('Error loading last viewed:', error);
            }
        };
        loadLastViewed();
    }, []);

    useEffect(() => {
        if (activityModalVisible) return;
        if (!lastViewed) return;

        const newCount = [
            ...recentAnnouncements.map(a => ({ ...a, createdAt: a.createdAt })),
            ...upcomingEvents.map(e => ({ ...e, createdAt: e.createdAt || e.date })),
        ].filter(item => item.createdAt > lastViewed).length;

        setBadgeCount(newCount);
    }, [recentAnnouncements, upcomingEvents, lastViewed, activityModalVisible]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        // Trigger rotation animation
        Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(() => rotateAnim.setValue(0));

        Promise.all([fetchStudentStats(), fetchDonutData()]).finally(() => setRefreshing(false));
    }, [rotateAnim]);

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

    const handleBellPress = async () => {
        const now = Date.now();
        await AsyncStorage.setItem('student_last_activity_view', now.toString());
        setLastViewed(new Date(now));
        setActivityModalVisible(true);
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
        // Add navigation animation
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

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

    // Enhanced stat card with animation
    const StatCard = ({ title, value, icon, color, index }: { title: string; value: number; icon: React.ReactElement; color: string; index: number }) => {
        const cardSlideAnim = useRef(new Animated.Value(50)).current;
        const cardFadeAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.timing(cardSlideAnim, {
                    toValue: 0,
                    duration: 600,
                    delay: index * 150,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(cardFadeAnim, {
                    toValue: 1,
                    duration: 600,
                    delay: index * 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }, [index]);

        return (
            <Animated.View
                style={[
                    styles.statCard,
                    {
                        borderRightWidth: 3,
                        borderRightColor: color,
                        transform: [{ translateY: cardSlideAnim }],
                        opacity: cardFadeAnim,
                    },
                ]}
            >
                <View style={styles.statCardHeader}>
                    <Animated.View
                        style={[
                            styles.statIconContainer,
                            { backgroundColor: `${color}20` },
                            { transform: [{ scale: pulseAnim }] },
                        ]}
                    >
                        {icon}
                    </Animated.View>
                </View>
                <Text style={[styles.statNumber, { color }]}>{value}</Text>
                <Text style={styles.statLabel}>{title}</Text>
            </Animated.View>
        );
    };

    // Interactive Donut Chart Component
    const InteractiveDonutChart = () => {
        const total = donutData.upcomingEvents + donutData.pastEvents + donutData.announcements;
        
        const chartData = [
            {
                value: donutData.upcomingEvents,
                color: '#0ea5e9',
                gradientColor: '#0284c7',
                text: `${Math.round((donutData.upcomingEvents / total) * 100)}%`,
                label: 'Upcoming Events',
                icon: 'time-outline',
                description: 'Events you can register for',
            },
            {
                value: donutData.pastEvents,
                color: '#64748b',
                gradientColor: '#475569',
                text: `${Math.round((donutData.pastEvents / total) * 100)}%`,
                label: 'Past Events',
                icon: 'calendar-outline',
                description: 'Events that have concluded',
            },
            {
                value: donutData.announcements,
                color: '#8b5cf6',
                gradientColor: '#7c3aed',
                text: `${Math.round((donutData.announcements / total) * 100)}%`,
                label: 'Announcements',
                icon: 'megaphone',
                description: 'Latest news and updates',
            },
        ];

        const handleSlicePress = (index: number) => {
            setSelectedSlice(selectedSlice === index ? null : index);
            
       
        };

        if (total === 0) {
            return (
                <Animated.View style={[styles.donutChartContainer, { opacity: fadeAnim }]}>
                    <View style={styles.donutChartEmptyContainer}>
                        <Animated.View style={{ transform: [{ rotate: spin }] }}>
                            <Ionicons name="refresh" size={48} color={colors.accent?.primary || '#0ea5e9'} />
                        </Animated.View>
                        <Text style={styles.donutChartEmptyText}>No data available</Text>
                        <Text style={styles.donutChartEmptySubtext}>Pull down to refresh</Text>
                    </View>
                </Animated.View>
            );
        }

        return (
            <Animated.View
                style={[
                    styles.donutChartContainer,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                <LinearGradient
                    colors={isDark ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f8fafc']}
                    style={styles.donutGradient}
                >
                    <View style={styles.donutHeader}>
                        <View style={styles.donutHeaderLeft}>
                            <View style={[styles.donutIconContainer, { backgroundColor: `${colors.accent?.primary || '#0ea5e9'}20` }]}>
                                <Ionicons name="pie-chart" size={20} color={colors.accent?.primary || '#0ea5e9'} />
                            </View>
                            <View>
                                <Text style={styles.donutTitle}>Content Distribution</Text>
                                <Text style={styles.donutSubtitle}>Tap segments for details</Text>
                            </View>
                        </View>
                        <View style={styles.donutTotalBadge}>
                            <Text style={styles.donutTotalBadgeText}>{total}</Text>
                            <Text style={styles.donutTotalBadgeLabel}>Total</Text>
                        </View>
                    </View>

                    <View style={styles.donutChartWrapper}>
                        <PieChart
                            data={chartData.map((item, index) => ({
                                ...item,
                                onPress: () => handleSlicePress(index),
                                strokeWidth: selectedSlice === index ? 4 : 2,
                                strokeColor: selectedSlice === index ? '#ffffff' : 'transparent',
                            }))}
                            donut
                            showText
                            textColor={isDark ? '#ffffff' : '#1e293b'}
                            fontWeight="bold"
                            innerRadius={60}
                            innerCircleColor={isDark ? '#0f172a' : '#ffffff'}
                            radius={isMobile ? 100 : 120}
                            focusOnPress
                            centerLabelComponent={() => (
                                <View style={styles.donutCenterLabel}>
                                    {selectedSlice !== null ? (
                                        <>
                                            <Text style={[styles.donutCenterValue, { color: chartData[selectedSlice].color }]}>
                                                {chartData[selectedSlice].value}
                                            </Text>
                                            <Text style={styles.donutCenterText}>
                                                {chartData[selectedSlice].label.split(' ')[0]}
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.donutCenterValue}>{total}</Text>
                                            <Text style={styles.donutCenterText}>Total Items</Text>
                                        </>
                                    )}
                                </View>
                            )}
                        />
                    </View>

                    {/* Interactive Legend */}
                    <View style={styles.interactiveLegendContainer}>
                        {chartData.map((item, index) => (
                            <Pressable
                                key={index}
                                onPress={() => handleSlicePress(index)}
                                onHoverIn={() => setHoveredSlice(index)}
                                onHoverOut={() => setHoveredSlice(null)}
                                style={[
                                    styles.interactiveLegendItem,
                                    selectedSlice === index && styles.interactiveLegendItemSelected,
                                    hoveredSlice === index && styles.interactiveLegendItemHovered,
                                ]}
                            >
                                <LinearGradient
                                    colors={[item.color, item.gradientColor]}
                                    style={styles.legendGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.legendContent}>
                                        <View style={styles.legendIconRow}>
                                            <Ionicons name={item.icon as any} size={16} color="#ffffff" />
                                            <Text style={styles.legendPercent}>{item.text}</Text>
                                        </View>
                                        <Text style={styles.legendLabel}>{item.label}</Text>
                                        <Text style={styles.legendCount}>{item.value} items</Text>
                                    </View>
                                    {selectedSlice === index && (
                                        <View style={styles.selectedIndicator}>
                                            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                                        </View>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        ))}
                    </View>

                    {/* Selected Item Details */}
                    {selectedSlice !== null && (
                        <Animated.View
                            style={styles.selectedDetailsContainer}
                        >
                            <LinearGradient
                                colors={[`${chartData[selectedSlice].color}20`, 'transparent']}
                                style={styles.selectedDetailsGradient}
                            >
                                <Ionicons name={chartData[selectedSlice].icon as any} size={24} color={chartData[selectedSlice].color} />
                                <View style={styles.selectedDetailsText}>
                                    <Text style={[styles.selectedDetailsTitle, { color: chartData[selectedSlice].color }]}>
                                        {chartData[selectedSlice].label}
                                    </Text>
                                    <Text style={styles.selectedDetailsDescription}>
                                        {chartData[selectedSlice].description}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.exploreButton, { backgroundColor: chartData[selectedSlice].color }]}
                                    onPress={() => {
                                        if (selectedSlice === 0) navigateTo('events');
                                        else if (selectedSlice === 2) navigateTo('announcements');
                                    }}
                                >
                                    <Text style={styles.exploreButtonText}>Explore</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                                </TouchableOpacity>
                            </LinearGradient>
                        </Animated.View>
                    )}
                </LinearGradient>
            </Animated.View>
        );
    };

    // Animated list item component
    const AnimatedListItem = ({ children, index }: { children: React.ReactNode; index: number }) => {
        const itemAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.timing(itemAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 100,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }).start();
        }, [index]);

        return (
            <Animated.View
                style={{
                    opacity: itemAnim,
                    transform: [{
                        translateX: itemAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-20, 0],
                        }),
                    }],
                }}
            >
                {children}
            </Animated.View>
        );
    };

    const renderOverview = () => (
        <>
            <ScrollView
                style={styles.overviewContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#0ea5e9"
                        colors={['#0ea5e9', '#8b5cf6', '#10b981']}
                    />
                }
            >
                {/* Animated Header */}
                <Animated.View
                    style={{
                        transform: [{ translateY: headerSlideAnim }],
                    }}
                >
                    <LinearGradient
                        colors={isDark ? ['#0f172a', '#1e293b', '#334155'] : ['#1e40af', '#3b82f6', '#60a5fa']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerGradient}
                    >
                        {/* Animated background shapes */}
                        <View style={styles.headerBackgroundShapes}>
                            <Animated.View
                                style={[
                                    styles.shape1,
                                    {
                                        transform: [
                                            { scale: pulseAnim },
                                            { rotate: spin },
                                        ],
                                    },
                                ]}
                            />
                            <Animated.View
                                style={[
                                    styles.shape2,
                                    {
                                        transform: [
                                            { scale: pulseAnim.interpolate({ inputRange: [1, 1.2], outputRange: [1.2, 1] }) },
                                            { rotate: spin },
                                        ],
                                    },
                                ]}
                            />
                        </View>

                        <View style={styles.headerContent}>
                            <View>
                                <Animated.Text
                                    style={[
                                        styles.greetingText,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ translateX: slideAnim }],
                                        },
                                    ]}
                                >
                                    Welcome back,
                                </Animated.Text>
                                <Animated.Text
                                    style={[
                                        styles.userName,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ translateX: slideAnim }],
                                        },
                                    ]}
                                >
                                    {userData?.name || 'Student'}
                                </Animated.Text>
                                <View style={styles.roleBadge}>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                                        style={styles.roleGradient}
                                    >
                                        <Ionicons name="school-outline" size={12} color="#ffffff" />
                                        <Text style={styles.roleText}>Student</Text>
                                    </LinearGradient>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.profileButton}
                                onPress={handleProfileImagePress}
                                disabled={uploadingImage}
                                activeOpacity={0.8}
                            >
                                {uploadingImage ? (
                                    <View style={[styles.profileImage, styles.profileFallback]}>
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    </View>
                                ) : userData?.photoURL ? (
                                    <Animated.Image
                                        source={{ uri: userData.photoURL }}
                                        style={[styles.profileImage, { transform: [{ scale: scaleAnim }] }]}
                                    />
                                ) : (
                                    <View style={[styles.profileImage, styles.profileFallback]}>
                                        <Text style={styles.profileInitials}>
                                            {userData?.name ? userData.name.charAt(0).toUpperCase() : 'S'}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.editIconContainer}>
                                    <Feather name="camera" size={10} color="#ffffff" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.dateSection}>
                            <View style={styles.dateContainer}>
                                <Feather name="calendar" size={14} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.dateText}>
                                    {new Date().toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </Text>
                            </View>
                            <View style={styles.headerActions}>
                                <TouchableOpacity
                                    style={styles.headerAction}
                                    onPress={handleBellPress}
                                    activeOpacity={0.8}
                                >
                                    <Animated.View style={{ transform: [{ scale: badgeCount > 0 ? pulseAnim : 1 }] }}>
                                        <Feather name="bell" size={20} color="#ffffff" />
                                    </Animated.View>
                                    {badgeCount > 0 && (
                                        <View style={styles.notificationBadge}>
                                            <Text style={styles.notificationBadgeText}>
                                                {badgeCount > 9 ? '9+' : badgeCount}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                <InteractiveDonutChart />

                {/* Two Column Layout with Animations */}
                <Animated.View
                    style={[
                        styles.twoColumnLayout,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Upcoming Events Card */}
                    <View style={[styles.column, styles.upcomingColumn]}>
                        <View style={styles.upcomingCard}>
                            <LinearGradient
                                colors={isDark ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f8fafc']}
                                style={styles.cardGradient}
                            >
                                <View style={styles.upcomingHeader}>
                                    <View style={styles.sectionTitleContainer}>
                                        <View style={[styles.sectionIcon, { backgroundColor: '#0ea5e920' }]}>
                                            <Ionicons name="calendar" size={18} color="#0ea5e9" />
                                        </View>
                                        <Text style={styles.upcomingTitle}>Upcoming Events</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => navigateTo('events')}
                                        style={styles.viewAllButton}
                                    >
                                        <Text style={styles.viewAllText}>View all</Text>
                                        <Feather name="arrow-right" size={14} color={colors.accent?.primary || '#0ea5e9'} />
                                    </TouchableOpacity>
                                </View>

                                {eventsLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#0ea5e9" />
                                        <Text style={styles.loadingText}>Loading events...</Text>
                                    </View>
                                ) : (() => {
                                    const futureEvents = upcomingEvents.filter(e => e.date > new Date());
                                    return futureEvents.length > 0 ? (
                                        <View style={styles.upcomingList}>
                                            {futureEvents.slice(0, 3).map((event, index) => {
                                                const day = event.date.getDate().toString().padStart(2, '0');
                                                const month = event.date.toLocaleString('default', { month: 'short' }).toUpperCase();
                                                const isRegistered = event.attendees?.includes(userData?.email || '');

                                                return (
                                                    <AnimatedListItem key={event.id} index={index}>
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.upcomingItem,
                                                                isRegistered && styles.registeredItem,
                                                            ]}
                                                            onPress={() => navigateTo('events', event.id)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <LinearGradient
                                                                colors={isRegistered ? ['#10b981', '#059669'] : ['#0ea5e9', '#0284c7']}
                                                                style={styles.eventDateGradient}
                                                            >
                                                                <Text style={styles.eventDay}>{day}</Text>
                                                                <Text style={styles.eventMonth}>{month}</Text>
                                                            </LinearGradient>
                                                            <View style={styles.eventInfo}>
                                                                <Text style={styles.eventName} numberOfLines={1}>
                                                                    {event.title}
                                                                </Text>
                                                                <View style={styles.eventMetaRow}>
                                                                    <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                                                                    <Text style={styles.eventTime} numberOfLines={1}>
                                                                        {event.time || event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </Text>
                                                                    <Text style={styles.eventMetaDivider}>•</Text>
                                                                    <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                                                                    <Text style={styles.eventTime} numberOfLines={1}>
                                                                        {event.location || 'TBA'}
                                                                    </Text>
                                                                </View>
                                                                {isRegistered && (
                                                                    <View style={styles.registeredBadge}>
                                                                        <Ionicons name="checkmark-circle" size={10} color="#10b981" />
                                                                        <Text style={styles.registeredBadgeText}>You're attending</Text>
                                                                    </View>
                                                                )}
                                                            </View>
                                                            <View style={styles.chevronContainer}>
                                                                <Feather name="chevron-right" size={20} color={colors.accent?.primary || '#0ea5e9'} />
                                                            </View>
                                                        </TouchableOpacity>
                                                    </AnimatedListItem>
                                                );
                                            })}
                                        </View>
                                    ) : (
                                        <View style={styles.emptyContainer}>
                                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                                <View style={styles.emptyIconContainer}>
                                                    <Feather name="calendar" size={40} color="#cbd5e1" />
                                                </View>
                                            </Animated.View>
                                            <Text style={styles.emptyText}>No upcoming events</Text>
                                            <TouchableOpacity
                                                style={styles.createButton}
                                                onPress={() => navigateTo('events')}
                                            >
                                                <LinearGradient
                                                    colors={['#0ea5e9', '#0284c7']}
                                                    style={styles.createButtonGradient}
                                                >
                                                    <Text style={styles.createButtonText}>Browse Events</Text>
                                                    <Feather name="arrow-right" size={16} color="#ffffff" />
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })()}
                            </LinearGradient>
                        </View>
                    </View>

                    {/* Announcements Card */}
                    <View style={[styles.column, styles.upcomingColumn]}>
                        <View style={styles.announcementCard}>
                            <LinearGradient
                                colors={isDark ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f8fafc']}
                                style={styles.cardGradient}
                            >
                                <View style={styles.announcementHeader}>
                                    <View style={styles.sectionTitleContainer}>
                                        <View style={[styles.sectionIcon, { backgroundColor: '#8b5cf620' }]}>
                                            <Ionicons name="megaphone" size={18} color="#8b5cf6" />
                                        </View>
                                        <Text style={styles.announcementTitle}>Announcements</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => navigateTo('announcements')}
                                        style={styles.viewAllButton}
                                    >
                                        <Text style={styles.viewAllText}>View all</Text>
                                        <Feather name="arrow-right" size={14} color={colors.accent?.primary || '#0ea5e9'} />
                                    </TouchableOpacity>
                                </View>

                                {announcementsLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#8b5cf6" />
                                        <Text style={styles.loadingText}>Loading announcements...</Text>
                                    </View>
                                ) : recentAnnouncements.length > 0 ? (
                                    <View style={styles.announcementList}>
                                        {recentAnnouncements.slice(0, 3).map((announcement, index) => {
                                            const priorityColor =
                                                announcement.priority === 'high' ? '#ef4444' :
                                                announcement.priority === 'medium' ? '#f59e0b' : '#10b981';
                                            const priorityIcon =
                                                announcement.priority === 'high' ? 'alert-circle' :
                                                announcement.priority === 'medium' ? 'information-circle' : 'checkmark-circle';

                                            return (
                                                <AnimatedListItem key={announcement.id} index={index}>
                                                    <TouchableOpacity
                                                        style={styles.announcementItem}
                                                        onPress={() => navigateTo('announcements', announcement.id)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <LinearGradient
                                                            colors={[`${priorityColor}20`, `${priorityColor}10`]}
                                                            style={[styles.announcementBadge, { borderColor: priorityColor }]}
                                                        >
                                                            <Ionicons name={priorityIcon as any} size={16} color={priorityColor} />
                                                        </LinearGradient>
                                                        <View style={styles.announcementContent}>
                                                            <Text style={styles.announcementText} numberOfLines={1}>
                                                                {announcement.title}
                                                            </Text>
                                                            <View style={styles.announcementMetaRow}>
                                                                <Text style={styles.announcementTime}>
                                                                    {formatTimeAgo(announcement.createdAt)}
                                                                </Text>
                                                                <Text style={styles.announcementMetaDivider}>•</Text>
                                                                <Text style={styles.announcementAuthor}>
                                                                    {announcement.author}
                                                                </Text>
                                                                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}20` }]}>
                                                                    <Text style={[styles.priorityText, { color: priorityColor }]}>
                                                                        {announcement.priority}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                </AnimatedListItem>
                                            );
                                        })}
                                    </View>
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                            <View style={styles.emptyIconContainer}>
                                                <Feather name="bell" size={40} color="#cbd5e1" />
                                            </View>
                                        </Animated.View>
                                        <Text style={styles.emptyText}>No announcements yet</Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>

            <NotificationModal
                visible={notificationModalVisible}
                onClose={() => setNotificationModalVisible(false)}
                notifications={notifications}
                onNotificationPress={handleNotificationPress}
                onMarkAllRead={handleMarkAllRead}
                pendingApprovals={[]}
                approvalCount={0}
            />

            <StudentActivityModal
                key={`modal-${recentAnnouncements.length}-${upcomingEvents.length}`}
                visible={activityModalVisible}
                onClose={() => setActivityModalVisible(false)}
                announcements={recentAnnouncements.map(a => ({
                    id: a.id,
                    type: 'announcement',
                    title: a.title,
                    date: a.createdAt,
                    author: a.author,
                }))}
                events={upcomingEvents.map(e => ({
                    id: e.id,
                    type: 'event',
                    title: e.title,
                    date: e.createdAt || e.date,
                    eventDate: e.date,
                    createdAt: e.createdAt,
                    location: e.location,
                }))}
            />
        </>
    );

    return (
        <View style={styles.container}>
            <View style={styles.contentArea}>
                {renderOverview()}
            </View>
        </View>
    );
}

