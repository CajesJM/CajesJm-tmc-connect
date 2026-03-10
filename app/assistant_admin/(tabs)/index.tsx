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
import { LineChart } from 'react-native-chart-kit';

import { NotificationModal } from '../../../components/NotificationModal';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../lib/firebaseConfig';
import { assistantDashboardStyles as styles } from '../../../styles/assistant-admin/dashboardStyles';
import { Notification, notificationService } from '../../../utils/notifications';
import { generateDashboardPDF, sharePDF } from '../../../utils/pdfGenerator';

// Types
interface Activity {
  id: string;
  type: 'event' | 'attendance' | 'announcement' | 'user';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
  data?: any;
}

interface MonthlyStats {
  month: string;
  events: number;
  attendance: number;
  announcements: number;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time?: string;
  location?: string;
  attendees?: any[];
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

export default function AssistantAdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState({
    myEvents: 0,
    myAnnouncements: 0,
    upcomingEvents: 0,
    totalAttendance: 0,
    pendingMyEvents: 0,
    pendingMyAnnouncements: 0,
  });

  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [displayedActivities, setDisplayedActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(5);
  const [refreshing, setRefreshing] = useState(false);

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const router = useRouter();
  const { userData } = useAuth();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const chartWidth = isMobile ? width - 64 : isTablet ? width / 2 - 48 : width - 400;

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  // --- Data fetching (same as before) ---
  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      if (!userData?.email) return;

      const myEventsQuery = query(
        collection(db, 'events'),
        where('createdBy', '==', userData.email)
      );
      const myEventsSnap = await getDocs(myEventsQuery);
      const myEvents = myEventsSnap.docs;
      const myEventsCount = myEvents.length;
      const pendingMyEvents = myEvents.filter(doc => doc.data().status === 'pending').length;

      const myAnnouncementsQuery = query(
        collection(db, 'updates'),
        where('createdBy', '==', userData.email)
      );
      const myAnnouncementsSnap = await getDocs(myAnnouncementsQuery);
      const myAnnouncementsCount = myAnnouncementsSnap.size;
      const pendingMyAnnouncements = myAnnouncementsSnap.docs.filter(doc => doc.data().status === 'pending').length;

      const now = new Date();
      const eventsSnap = await getDocs(collection(db, 'events'));
      const upcomingApproved = eventsSnap.docs.filter(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate();
        return data.status === 'approved' && eventDate && eventDate > now;
      }).length;

      let totalAttendance = 0;
      eventsSnap.docs.forEach(doc => {
        const attendees = doc.data().attendees;
        if (Array.isArray(attendees)) totalAttendance += attendees.length;
      });

      setDashboardStats({
        myEvents: myEventsCount,
        myAnnouncements: myAnnouncementsCount,
        upcomingEvents: upcomingApproved,
        totalAttendance,
        pendingMyEvents,
        pendingMyAnnouncements,
      });
    } catch (error) {
      console.error('Error fetching assistant stats:', error);
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
      orderBy('date', 'asc'),
      limit(5)
    );

    return onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const eventDate = data.date?.toDate();
          if (eventDate && eventDate >= now) {
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
          }
          return null;
        })
        .filter(event => event !== null)
        .sort((a, b) => a!.date.getTime() - b!.date.getTime())
        .slice(0, 3);

      setUpcomingEvents(events as Event[]);
      setEventsLoading(false);
    }, (error) => {
      console.error('Error fetching events:', error);
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

  const setupRealtimeActivities = () => {
    setActivitiesLoading(true);

    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const announcementsQuery = query(
      collection(db, 'updates'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: `event-${doc.id}`,
        type: 'event' as const,
        title: 'New Event Created',
        description: doc.data().title || 'New event added',
        timestamp: doc.data().createdAt?.toDate() || new Date(),
        icon: 'calendar',
        color: '#0ea5e9',
        data: doc.data()
      }));
      updateActivities(events, 'event');
    });

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      const announcements = snapshot.docs.map(doc => ({
        id: `announcement-${doc.id}`,
        type: 'announcement' as const,
        title: 'New Announcement',
        description: doc.data().title || 'New announcement posted',
        timestamp: doc.data().createdAt?.toDate() || new Date(),
        icon: 'bell',
        color: '#f59e0b',
        data: doc.data()
      }));
      updateActivities(announcements, 'announcement');
    });

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: `user-${doc.id}`,
        type: 'user' as const,
        title: 'New User Registered',
        description: doc.data().name || doc.data().email || 'New user joined',
        timestamp: doc.data().createdAt ? new Date(doc.data().createdAt) : new Date(),
        icon: 'user-plus',
        color: '#8b5cf6',
        data: doc.data()
      }));
      updateActivities(users, 'user');
    });

    const updateActivities = (newActivities: Activity[], type: string) => {
      setRecentActivities(prev => {
        const filtered = prev.filter(a => a.type !== type);
        const combined = [...filtered, ...newActivities];
        const sorted = combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return sorted.slice(0, 50);
      });
      setActivitiesLoading(false);
    };

    return () => {
      unsubscribeEvents();
      unsubscribeAnnouncements();
      unsubscribeUsers();
    };
  };

  const calculateMonthlyStats = async () => {
    try {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 5);

      const eventsSnap = await getDocs(collection(db, 'events'));
      const approvedEvents = eventsSnap.docs.filter(doc => doc.data().status === 'approved');

      const announcementsSnap = await getDocs(collection(db, 'updates'));

      const eventsByMonth: { [key: string]: number } = {};
      const attendanceByMonth: { [key: string]: number } = {};
      const announcementsByMonth: { [key: string]: number } = {};

      approvedEvents.forEach(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate();
        if (eventDate && eventDate >= sixMonthsAgo) {
          const monthKey = eventDate.toLocaleString('default', { month: 'short', year: 'numeric' });
          eventsByMonth[monthKey] = (eventsByMonth[monthKey] || 0) + 1;
          const attendees = data.attendees?.length || 0;
          attendanceByMonth[monthKey] = (attendanceByMonth[monthKey] || 0) + attendees;
        }
      });

      announcementsSnap.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        if (createdAt && createdAt >= sixMonthsAgo) {
          const monthKey = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
          announcementsByMonth[monthKey] = (announcementsByMonth[monthKey] || 0) + 1;
        }
      });

      const months: MonthlyStats[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(now.getMonth() - i);
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        months.push({
          month: date.toLocaleString('default', { month: 'short' }),
          events: eventsByMonth[monthKey] || 0,
          attendance: attendanceByMonth[monthKey] || 0,
          announcements: announcementsByMonth[monthKey] || 0
        });
      }
      setMonthlyStats(months);
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    const unsubscribeActivities = setupRealtimeActivities();
    const unsubscribeEvents = fetchUpcomingEvents();
    const unsubscribeAnnouncements = fetchRecentAnnouncements();
    calculateMonthlyStats();

    if (userData?.email) {
      const unsubscribeNotifications = notificationService.listenForNotifications(
        userData.email,
        (notifs) => {
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length);
        }
      );
      return () => {
        unsubscribeActivities();
        unsubscribeEvents();
        unsubscribeAnnouncements();
        unsubscribeNotifications();
        notificationService.cleanup();
      };
    }
    return () => {
      unsubscribeActivities();
      unsubscribeEvents();
      unsubscribeAnnouncements();
    };
  }, [userData]);

  useEffect(() => {
    updateDisplayedActivities();
  }, [recentActivities, currentPage]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchDashboardStats(),
      calculateMonthlyStats()
    ]).finally(() => setRefreshing(false));
  }, []);

  const handleDownloadReport = async () => {
    try {
      setDownloadLoading(true);

      // Map assistant stats to PDF structure
      const pdfStats = {
        totalUsers: 0,
        totalEvents: dashboardStats.myEvents,
        totalAnnouncements: dashboardStats.myAnnouncements,
        activeAttendees: dashboardStats.totalAttendance,
        upcomingEvents: dashboardStats.upcomingEvents,
        pendingVerifications: dashboardStats.pendingMyEvents + dashboardStats.pendingMyAnnouncements,
        activeUsers: 0,
        totalAttendance: dashboardStats.totalAttendance,
      };

      const pdfData = {
        stats: pdfStats,
        monthlyStats: monthlyStats,
        recentActivities: recentActivities.slice(0, 10),
        upcomingEvents: upcomingEvents,
      };

      const fileUri = await generateDashboardPDF(pdfData);
      await sharePDF(fileUri);

      if (Platform.OS !== 'web') {
        Alert.alert('Success', '✅ Report generated successfully!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', '❌ Failed to generate report.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const updateDisplayedActivities = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedActivities(recentActivities.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(recentActivities.length / itemsPerPage));
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) await notificationService.markAsRead(notification.id);
    switch (notification.type) {
      case 'event':
        router.push(notification.data?.eventId ? `/assistant_admin/events?id=${notification.data.eventId}` : '/assistant_admin/events');
        break;
      case 'announcement':
        router.push(notification.data?.announcementId ? `/assistant_admin/announcements?id=${notification.data.announcementId}` : '/assistant_admin/announcements');
        break;
      case 'attendance':
        router.push('/assistant_admin/attendance');
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
        router.push(id ? `/assistant_admin/events?id=${id}` : '/assistant_admin/events');
        break;
      case 'attendance':
        router.push('/assistant_admin/attendance');
        break;
      case 'announcements':
        router.push(id ? `/assistant_admin/announcements?id=${id}` : '/assistant_admin/announcements');
        break;
      case 'profile':
        router.push('/assistant_admin/profile');
        break;
      default: break;
    }
  };

  const getActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case 'event': return <Ionicons name="calendar" size={16} color={activity.color} />;
      case 'attendance': return <Feather name="check-square" size={16} color={activity.color} />;
      case 'announcement': return <Feather name="bell" size={16} color={activity.color} />;
      case 'user': return <Feather name="user-plus" size={16} color={activity.color} />;
      default: return <Feather name="activity" size={16} color={activity.color} />;
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        >
          <Feather name="chevron-left" size={18} color={currentPage === 1 ? '#cbd5e1' : '#0ea5e9'} />
          <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>Prev</Text>
        </TouchableOpacity>
        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>{currentPage}/{totalPages}</Text>
        </View>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>Next</Text>
          <Feather name="chevron-right" size={18} color={currentPage === totalPages ? '#cbd5e1' : '#0ea5e9'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderOverview = () => (
    <ScrollView
      style={styles.overviewContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />}
    >
      <LinearGradient
        colors={['#14203d', '#06080b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.userName}>{userData?.name || 'Assistant'}</Text>
            <Text style={styles.roleText}>Assistant Admin</Text>
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
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.dateSection}>
          <View style={styles.dateContainer}>
            <Feather name="calendar" size={12} color="#94a3b8" />
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction} onPress={handleDownloadReport} disabled={downloadLoading}>
              {downloadLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Feather name="download" size={18} color="#ffffff" />}
            </TouchableOpacity>
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
        pendingApprovals={[]} // No approvals for assistant
        approvalCount={0}
      />

      {/* Analytics Graph - moved to top */}
      <View style={styles.chartsContainer}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.chartsTitle}>Analytics Overview</Text>
            <Text style={styles.chartsSubtitle}>Last 6 months activity</Text>
          </View>
          <View style={styles.chartLegend}>
            <TouchableOpacity
              style={[styles.legendItem, styles.legendButton, selectedDataset === 'events' && styles.legendButtonActiveBlue]}
              onPress={() => setSelectedDataset(selectedDataset === 'events' ? null : 'events')}
            >
              <View style={[styles.legendDot, { backgroundColor: '#0ea5e9' }]} />
              <Text style={[styles.legendText, selectedDataset === 'events' && styles.legendTextActive]}>Events</Text>
              <View style={[styles.legendValue, { backgroundColor: '#0ea5e915' }]}>
                <Text style={[styles.legendValueText, { color: '#0ea5e9' }]}>
                  {monthlyStats.reduce((sum, s) => sum + s.events, 0)}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.legendItem, styles.legendButton, selectedDataset === 'attendance' && styles.legendButtonActiveGreen]}
              onPress={() => setSelectedDataset(selectedDataset === 'attendance' ? null : 'attendance')}
            >
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.legendText, selectedDataset === 'attendance' && styles.legendTextActive]}>Attendance</Text>
              <View style={[styles.legendValue, { backgroundColor: '#10b98115' }]}>
                <Text style={[styles.legendValueText, { color: '#10b981' }]}>
                  {monthlyStats.reduce((sum, s) => sum + s.attendance, 0)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {monthlyStats.length > 0 && (
          <View style={styles.chartWrapper}>
            <LinearGradient colors={['#f0f9ff', '#ffffff']} style={styles.chartBackground} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScrollContent}>
              <LineChart
                data={{
                  labels: monthlyStats.map(s => s.month),
                  datasets: [
                    {
                      data: monthlyStats.map(s => s.events),
                      color: () => selectedDataset === 'attendance' ? '#0ea5e920' : '#0ea5e9',
                      strokeWidth: 4
                    },
                    {
                      data: monthlyStats.map(s => s.attendance),
                      color: () => selectedDataset === 'events' ? '#10b98120' : '#10b981',
                      strokeWidth: 4
                    }
                  ]
                }}
                width={Math.max(chartWidth, 350)}
                height={260}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: '6', strokeWidth: '3', stroke: '#ffffff' },
                  propsForBackgroundLines: { stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '0' },
                }}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines={false}
                withVerticalLines
                withHorizontalLines
                fromZero
                yAxisInterval={1}
                segments={5}
              />
            </ScrollView>
            <View style={styles.axisLabelContainer}>
              <Text style={styles.axisLabel}>Timeline (Months)</Text>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions - fixed navigation */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
         
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateTo('announcements')}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.quickActionGradient}>
              <FontAwesome6 name="bullhorn" size={24} color="#ffffff" />
              <Text style={styles.quickActionText}>Make Announcement</Text>
            </LinearGradient>
          </TouchableOpacity>
           <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateTo('events')}>
            <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.quickActionGradient}>
              <Ionicons name="add-circle" size={24} color="#ffffff" />
              <Text style={styles.quickActionText}>Create Event</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateTo('attendance')}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.quickActionGradient}>
              <Ionicons name="scan" size={24} color="#ffffff" />
              <Text style={styles.quickActionText}>Generate QR</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Two Column Layout - Recent Activity + Upcoming Events/Announcements */}
      <View style={styles.twoColumnLayout}>
        <View style={[styles.column, styles.activityColumn]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {activitiesLoading && <ActivityIndicator size="small" color="#0ea5e9" />}
          </View>
          <View style={styles.activityList}>
            {displayedActivities.length > 0 ? (
              <>
                {displayedActivities.map((activity, index) => (
                  <View key={activity.id} style={[styles.activityItem, index === displayedActivities.length - 1 && styles.lastActivityItem]}>
                    <View style={[styles.activityIcon, { backgroundColor: `${activity.color}15` }]}>
                      {getActivityIcon(activity)}
                    </View>
                    <View style={styles.activityContent}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityTitle}>{activity.title}</Text>
                        <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
                      </View>
                      <Text style={styles.activityDescription}>{activity.description}</Text>
                    </View>
                  </View>
                ))}
                {renderPagination()}
              </>
            ) : (
              <View style={styles.emptyActivity}>
                <Feather name="activity" size={32} color="#cbd5e1" />
                <Text style={styles.emptyActivityText}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>

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
                  return (
                    <TouchableOpacity key={event.id} style={styles.upcomingItem} onPress={() => navigateTo('events', event.id)}>
                      <View style={styles.eventDate}>
                        <Text style={styles.eventDay}>{day}</Text>
                        <Text style={styles.eventMonth}>{month}</Text>
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventName} numberOfLines={1}>{event.title}</Text>
                        <Text style={styles.eventTime} numberOfLines={1}>
                          {event.time || event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location || 'TBA'}
                        </Text>
                        <Text style={styles.eventAttendees}>{event.attendees?.length || 0} attending</Text>
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
                  <Text style={styles.createButtonText}>Create Event</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

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
                  const priorityColor = announcement.priority === 'high' ? '#ef4444' : announcement.priority === 'medium' ? '#f59e0b' : '#10b981';
                  return (
                    <TouchableOpacity key={announcement.id} style={styles.announcementItem} onPress={() => navigateTo('announcements', announcement.id)}>
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
                <TouchableOpacity style={styles.createButton} onPress={() => navigateTo('announcements')}>
                  <Text style={styles.createButtonText}>Create Announcement</Text>
                </TouchableOpacity>
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