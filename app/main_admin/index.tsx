import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
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
import { NotificationModal } from '../../components/NotificationModal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebaseConfig';
import { Notification, notificationService } from '../../utils/notifications';

import { dashboardStyles as styles } from '../../styles/main-admin/dashboardStyles';
import { generateDashboardPDF, sharePDF } from '../../utils/pdfGenerator';
import MainAdminAnnouncements from './announcements';
import MainAdminAttendance from './attendance';
import MainAdminEvents from './events';
import MainAdminProfile from './profile';
import UserManagement from './users';

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
interface PendingApproval {
  id: string;
  type: 'announcement' | 'event';
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: Date;
  data: any;
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
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  priority?: 'high' | 'medium' | 'low';
  author?: string;
}

export default function MainAdminDashboard() {
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    totalAnnouncements: 0,
    activeAttendees: 0,
    upcomingEvents: 0,
    pendingVerifications: 0,
    activeUsers: 0,
    totalAttendance: 0,
    userGrowth: 0,
    eventGrowth: 0
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
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();
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
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [approvalCount, setApprovalCount] = useState(0);


  const getActiveTabFromPath = () => {
    if (pathname.includes('/main_admin/events')) return 'events';
    if (pathname.includes('/main_admin/attendance')) return 'attendance';
    if (pathname.includes('/main_admin/announcements')) return 'announcements';
    if (pathname.includes('/main_admin/users')) return 'users';
    if (pathname.includes('/main_admin/profile')) return 'profile';
    return 'overview';
  };


  const activeTab = getActiveTabFromPath();
  
  const fetchUpcomingEvents = () => {
    setEventsLoading(true);
    const now = new Date();

    const eventsQuery = query(
      collection(db, 'events'),
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
        .slice(0, 3); // Get only the next 3 events

      setUpcomingEvents(events as Event[]);
      setEventsLoading(false);
    }, (error) => {
      console.error('Error fetching events:', error);
      setEventsLoading(false);
    });
  };


  const fetchPendingApprovals = () => {
  
    const pendingAnnouncementsQuery = query(
      collection(db, 'updates'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const pendingEventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeAnnouncements = onSnapshot(pendingAnnouncementsQuery, (snapshot) => {
      const announcements = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'announcement' as const,
        title: doc.data().title || 'New Announcement',
        description: `Created by ${doc.data().createdByName || doc.data().createdBy || 'Assistant Admin'}`,
        requestedBy: doc.data().createdByName || doc.data().createdBy || 'Assistant Admin',
        requestedAt: doc.data().createdAt?.toDate() || new Date(),
        data: { ...doc.data(), id: doc.id }
      }));

      updatePendingApprovals(announcements, 'announcement');
    });

    const unsubscribeEvents = onSnapshot(pendingEventsQuery, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'event' as const,
        title: doc.data().title || 'New Event',
        description: `Created by ${doc.data().createdByName || doc.data().createdBy || 'Assistant Admin'}`,
        requestedBy: doc.data().createdByName || doc.data().createdBy || 'Assistant Admin',
        requestedAt: doc.data().createdAt?.toDate() || new Date(),
        data: { ...doc.data(), id: doc.id }
      }));

      updatePendingApprovals(events, 'event');
    });

    return () => {
      unsubscribeAnnouncements();
      unsubscribeEvents();
    };
  };

  const updatePendingApprovals = (newItems: PendingApproval[], type: string) => {
    setPendingApprovals(prev => {
      const filtered = prev.filter(item => item.type !== type);
      const combined = [...filtered, ...newItems];
      return combined.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    });
  };

  const fetchRecentAnnouncements = () => {
    setAnnouncementsLoading(true);

    const announcementsQuery = query(
      collection(db, 'updates'),
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
    fetchDashboardStats();

    const unsubscribeActivities = setupRealtimeActivities();
    const unsubscribeEvents = fetchUpcomingEvents();
    const unsubscribeAnnouncements = fetchRecentAnnouncements();

    calculateMonthlyStats();

    return () => {
      unsubscribeActivities();
      unsubscribeEvents();
      unsubscribeAnnouncements();
    };
  }, []);

  useEffect(() => {
    fetchDashboardStats();
    const unsubscribeActivities = setupRealtimeActivities();
    const unsubscribeEvents = fetchUpcomingEvents();
    const unsubscribeAnnouncements = fetchRecentAnnouncements();
    const unsubscribeApprovals = fetchPendingApprovals();
    calculateMonthlyStats();

    if (userData?.email) {
      const unsubscribeNotifications = notificationService.listenForNotifications(
        userData.email,
        (notifs) => {
          setNotifications(notifs);
          setUnreadCount(notifs.filter(n => !n.read).length + pendingApprovals.length);
        }
      );

      return () => {
        unsubscribeActivities();
        unsubscribeEvents();
        unsubscribeAnnouncements();
        unsubscribeApprovals(); 
        unsubscribeNotifications();
        notificationService.cleanup();
      };
    }
    return () => {
      unsubscribeActivities();
      unsubscribeEvents();
      unsubscribeAnnouncements();
      unsubscribeApprovals();
    };
  }, [userData, pendingApprovals.length]);

  const handleApprove = async (approval: PendingApproval) => {
    try {
      const collectionName = approval.type === 'announcement' ? 'updates' : 'events';
      const docRef = doc(db, collectionName, approval.id);

      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userData?.email
      });

      if (approval.data.createdBy) {
        await notificationService.createNotification({
          userId: approval.data.createdBy, 
          title: `${approval.type === 'announcement' ? 'Announcement' : 'Event'} Approved`,
          message: `Your "${approval.title}" has been approved by the main admin.`,
          type: approval.type,
          timestamp: new Date(),
          data: { [`${approval.type}Id`]: approval.id }
        });
      }

      Alert.alert('Success', `${approval.type} approved successfully!`);
    } catch (error) {
      console.error('Error approving:', error);
      Alert.alert('Error', 'Failed to approve. Please try again.');
    }
  };

  const handleReject = async (approval: PendingApproval) => {
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject "${approval.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const collectionName = approval.type === 'announcement' ? 'updates' : 'events';
              const docRef = doc(db, collectionName, approval.id);

              await updateDoc(docRef, {
                status: 'rejected',
                rejectedAt: new Date(),
                rejectedBy: userData?.email
              });

              if (approval.data.createdBy) {
                await notificationService.createNotification({
                  userId: approval.data.createdBy, 
                  title: `${approval.type === 'announcement' ? 'Announcement' : 'Event'} Rejected`,
                  message: `Your "${approval.title}" has been rejected by the main admin.`,
                  type: approval.type,
                  timestamp: new Date(), 
                  data: { [`${approval.type}Id`]: approval.id }
                });
              }

              Alert.alert('Rejected', `${approval.type} has been rejected.`);
            } catch (error) {
              console.error('Error rejecting:', error);
              Alert.alert('Error', 'Failed to reject. Please try again.');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read).length;
    setUnreadCount(unreadNotifications + pendingApprovals.length);
    setApprovalCount(pendingApprovals.length);
  }, [pendingApprovals, notifications]);

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


  const updateDisplayedActivities = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setDisplayedActivities(recentActivities.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(recentActivities.length / itemsPerPage));
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `event-${doc.id}`,
          type: 'event' as const,
          title: 'New Event Created',
          description: data.title || 'New event added',
          timestamp: data.createdAt?.toDate() || new Date(),
          icon: 'calendar',
          color: '#0ea5e9',
          data: data
        };
      });

      updateActivities(events, 'event');
    });

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      const announcements = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `announcement-${doc.id}`,
          type: 'announcement' as const,
          title: 'New Announcement',
          description: data.title || 'New announcement posted',
          timestamp: data.createdAt?.toDate() || new Date(),
          icon: 'bell',
          color: '#f59e0b',
          data: data
        };
      });

      updateActivities(announcements, 'announcement');
    });

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: `user-${doc.id}`,
          type: 'user' as const,
          title: 'New User Registered',
          description: data.name || data.email || 'New user joined',
          timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
          icon: 'user-plus',
          color: '#8b5cf6',
          data: data
        };
      });

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

      const months: MonthlyStats[] = [];

      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const announcementsSnapshot = await getDocs(collection(db, 'updates'));

      let totalAttendance = 0;
      const eventsByMonth: { [key: string]: number } = {};
      const attendanceByMonth: { [key: string]: number } = {};
      const announcementsByMonth: { [key: string]: number } = {};

      eventsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate();
        if (eventDate && eventDate >= sixMonthsAgo) {
          const monthKey = eventDate.toLocaleString('default', { month: 'short', year: 'numeric' });
          eventsByMonth[monthKey] = (eventsByMonth[monthKey] || 0) + 1;

          const attendees = data.attendees?.length || 0;
          totalAttendance += attendees;
          attendanceByMonth[monthKey] = (attendanceByMonth[monthKey] || 0) + attendees;
        }
      });

      announcementsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        if (createdAt && createdAt >= sixMonthsAgo) {
          const monthKey = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
          announcementsByMonth[monthKey] = (announcementsByMonth[monthKey] || 0) + 1;
        }
      });

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

      setDashboardStats(prev => ({
        ...prev,
        totalAttendance
      }));

    } catch (error) {
      console.error('Error calculating monthly stats:', error);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadLoading(true);

      const pdfData = {
        stats: dashboardStats,
        monthlyStats: monthlyStats,
        recentActivities: recentActivities.slice(0, 10),
        upcomingEvents: upcomingEvents,
      };

      const fileUri = await generateDashboardPDF(pdfData);
      await sharePDF(fileUri);

      if (Platform.OS !== 'web') {
        Alert.alert(
          'Success',
          '✅ Report generated successfully!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert(
        'Error',
        '❌ Failed to generate report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'event':
        if (notification.data?.eventId) {
          router.push(`/main_admin/events?id=${notification.data.eventId}`);
        } else {
          navigateTo('events');
        }
        break;
      case 'announcement':
        if (notification.data?.announcementId) {
          router.push(`/main_admin/announcements?id=${notification.data.announcementId}`);
        } else {
          navigateTo('announcements');
        }
        break;
      case 'attendance':
        navigateTo('attendance');
        break;
      case 'user':
        navigateTo('users');
        break;
      default:
        break;
    }
  };

  const handleMarkAllRead = async () => {
    if (userData?.email) {
      await notificationService.markAllAsRead(userData.email);
    }
  };

  const handleProfileImagePress = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (file) {
            await uploadProfileImage(file);
          }
        };
        input.click();
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
          Alert.alert(
            'Permission Required',
            'Permission to access camera roll is required!',
            [{ text: 'OK' }]
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        });

        if (!result.canceled) {
          await uploadProfileImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(
        'Error',
        'Failed to pick image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const uploadProfileImage = async (imageUri: string | File) => {
    try {
      setUploadingImage(true);

      let blob: Blob;
      if (imageUri instanceof File) {
    
        blob = imageUri;
      } else {
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
        await updateDoc(userRef, {
          photoURL: downloadUrl
        });

        Alert.alert(
          'Success',
          'Profile image updated successfully!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        'Error',
        'Failed to upload image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter(doc =>
        doc.data().active !== false
      ).length;

      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const totalEvents = eventsSnapshot.size;
      const now = new Date();
      const upcomingEvents = eventsSnapshot.docs.filter(doc => {
        const eventDate = doc.data().date?.toDate();
        return eventDate && eventDate > now;
      }).length;

      const announcementsSnapshot = await getDocs(collection(db, 'updates'));
      const totalAnnouncements = announcementsSnapshot.size;

      let activeAttendees = 0;
      let pendingVerifications = 0;

      eventsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const attendees = data.attendees;
        if (attendees && Array.isArray(attendees)) {
          activeAttendees += attendees.length;

          if (data.coordinates) {
            const unverified = attendees.filter((a: any) =>
              !a.location?.isWithinRadius
            ).length;
            pendingVerifications += unverified;
          }
        }
      });

      const userGrowth = ((activeUsers - totalUsers * 0.8) / (totalUsers * 0.8)) * 100;
      const eventGrowth = ((upcomingEvents - totalEvents * 0.3) / (totalEvents * 0.3)) * 100;

      setDashboardStats({
        totalUsers,
        totalEvents,
        totalAnnouncements,
        activeAttendees,
        upcomingEvents,
        pendingVerifications,
        activeUsers,
        totalAttendance: activeAttendees,
        userGrowth,
        eventGrowth
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (screen: string, id?: string) => {
    switch (screen) {
      case 'events':
        router.push(id ? `/main_admin/events?id=${id}` : '/main_admin/events');
        break;
      case 'attendance':
        router.push('/main_admin/attendance');
        break;
      case 'announcements':
        router.push(id ? `/main_admin/announcements?id=${id}` : '/main_admin/announcements');
        break;
      case 'users':
        router.push('/main_admin/users');
        break;
      case 'profile':
        router.push('/main_admin/profile');
        break;
      case 'overview':
      default:
        console.log('Already on overview');
        break;
    }
  };

  const getActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case 'event':
        return <Ionicons name="calendar" size={16} color={activity.color} />;
      case 'attendance':
        return <Feather name="check-square" size={16} color={activity.color} />;
      case 'announcement':
        return <Feather name="bell" size={16} color={activity.color} />;
      case 'user':
        return <Feather name="user-plus" size={16} color={activity.color} />;
      default:
        return <Feather name="activity" size={16} color={activity.color} />;
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

  const renderStatCard = (title: string, value: string | number, icon: any, color: string, trend?: number, subtitle?: string) => (
    <TouchableOpacity
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={() => setSelectedStat(selectedStat === title ? null : title)}
      activeOpacity={0.7}
    >
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        {trend !== undefined && (
          <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#10b98120' : '#ef444420' }]}>
            <Feather
              name={trend >= 0 ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend >= 0 ? '#10b981' : '#ef4444'}
            />
            <Text style={[styles.trendText, { color: trend >= 0 ? '#10b981' : '#ef4444' }]}>
              {Math.abs(trend).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
      {subtitle && <Text style={styles.statSubtext}>{subtitle}</Text>}

      {selectedStat === title && (
        <View style={styles.statExpand}>
          <View style={styles.statProgress}>
            <View style={[styles.statProgressBar, { width: '70%', backgroundColor: color }]} />
          </View>
          <Text style={styles.statDetail}>View details →</Text>
        </View>
      )}
    </TouchableOpacity>
  );

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
          <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
            Prev
          </Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>{currentPage}/{totalPages}</Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
            Next
          </Text>
          <Feather name="chevron-right" size={18} color={currentPage === totalPages ? '#cbd5e1' : '#0ea5e9'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderOverview = () => (
    <ScrollView
      style={styles.overviewContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0ea5e9" />
      }
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
            <Text style={styles.userName}>{userData?.name || 'Admin'}</Text>
            <Text style={styles.roleText}>Administrator</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfileImagePress}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            ) : userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.profileImage}
              />
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
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerAction}
              onPress={handleDownloadReport}
              disabled={downloadLoading}
            >
              {downloadLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Feather name="download" size={18} color="#ffffff" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerAction}
              onPress={() => setNotificationModalVisible(true)}
            >
              <Feather name="bell" size={18} color="#ffffff" />
              {(unreadCount > 0 || approvalCount > 0) && (
                <View style={[styles.notificationBadge, approvalCount > 0 && styles.approvalBadge]}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount + approvalCount > 9 ? '9+' : unreadCount + approvalCount}
                  </Text>
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
        pendingApprovals={pendingApprovals}
        onApprove={handleApprove}
        onReject={handleReject}
        approvalCount={approvalCount}
      />
   
      <View style={styles.statsGrid}>
        {renderStatCard(
          'Total Users',
          dashboardStats.totalUsers,
          <FontAwesome6 name="users" size={20} color="#0ea5e9" />,
          '#0ea5e9',
          dashboardStats.userGrowth,
          `${dashboardStats.activeUsers} active`
        )}

        {renderStatCard(
          'Total Events',
          dashboardStats.totalEvents,
          <Ionicons name="calendar" size={20} color="#f59e0b" />,
          '#f59e0b',
          dashboardStats.eventGrowth,
          `${dashboardStats.upcomingEvents} upcoming`
        )}

        {renderStatCard(
          'Announcements',
          dashboardStats.totalAnnouncements,
          <FontAwesome6 name="bullhorn" size={20} color="#8b5cf6" />,
          '#8b5cf6',
          undefined,
          'Last 30 days'
        )}

        {renderStatCard(
          'Attendance',
          dashboardStats.totalAttendance,
          <Ionicons name="qr-code" size={20} color="#10b981" />,
          '#10b981',
          undefined,
          `${dashboardStats.pendingVerifications} pending`
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActionsContainer}
        contentContainerStyle={styles.quickActionsContent}
      >
        <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateTo('events')}>
          <LinearGradient
            colors={['#0ea5e9', '#0284c7']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add-circle" size={24} color="#ffffff" />
            <Text style={styles.quickActionText}>Create Event</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateTo('announcements')}>
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome6 name="bullhorn" size={24} color="#ffffff" />
            <Text style={styles.quickActionText}>Make Announcement</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateTo('attendance')}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="scan" size={24} color="#ffffff" />
            <Text style={styles.quickActionText}>Scan QR</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateTo('users')}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome6 name="user-plus" size={24} color="#ffffff" />
            <Text style={styles.quickActionText}>Add User</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Charts Section */}
      <View style={styles.chartsContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartsTitle}>Analytics Overview</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0ea5e9' }]} />
              <Text style={styles.legendText}>Events</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Attendance</Text>
            </View>
          </View>
        </View>

        {monthlyStats.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <LineChart
              data={{
                labels: monthlyStats.map(s => s.month),
                datasets: [
                  {
                    data: monthlyStats.map(s => s.events),
                    color: () => '#0ea5e9',
                    strokeWidth: 2
                  },
                  {
                    data: monthlyStats.map(s => s.attendance),
                    color: () => '#10b981',
                    strokeWidth: 2
                  }
                ]
              }}
              width={Math.max(chartWidth, 600)}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#ffffff'
                }
              }}
              bezier
              style={styles.chart}
            />
          </ScrollView>
        )}
      </View>

      {/* Two Column Layout */}
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
                  <View key={activity.id} style={[
                    styles.activityItem,
                    index === displayedActivities.length - 1 && styles.lastActivityItem
                  ]}>
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

        {/* Upcoming Events & Announcements */}
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
                  const eventDate = event.date;
                  const day = eventDate.getDate().toString().padStart(2, '0');
                  const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
                  const timeString = event.time || eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                          {timeString} • {event.location || 'TBA'}
                        </Text>
                        {event.attendees && (
                          <Text style={styles.eventAttendees}>
                            {event.attendees.length} attending
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity style={styles.eventAction}>
                        <Feather name="chevron-right" size={20} color="#94a3b8" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="calendar" size={32} color="#cbd5e1" />
                <Text style={styles.emptyText}>No upcoming events</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => navigateTo('events')}
                >
                  <Text style={styles.createButtonText}>Create Event</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Recent Announcements with Real Data */}
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
                  const timeAgo = formatTimeAgo(announcement.createdAt);
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
                        <FontAwesome6
                          name="bullhorn"
                          size={12}
                          color={priorityColor}
                        />
                      </View>
                      <View style={styles.announcementContent}>
                        <Text style={styles.announcementText} numberOfLines={1}>
                          {announcement.title}
                        </Text>
                        <Text style={styles.announcementTime}>
                          {timeAgo} • {announcement.author}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="bell" size={32} color="#cbd5e1" />
                <Text style={styles.emptyText}>No announcements yet</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => navigateTo('announcements')}
                >
                  <Text style={styles.createButtonText}>Create Announcement</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>
                {((dashboardStats.activeUsers / dashboardStats.totalUsers) * 100 || 0).toFixed(1)}%
              </Text>
              <Text style={styles.quickStatLabel}>Active Rate</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>
                {Math.round(dashboardStats.totalAttendance / (dashboardStats.totalEvents || 1))}
              </Text>
              <Text style={styles.quickStatLabel}>Avg/Event</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.quickStatValue}>
                {dashboardStats.pendingVerifications}
              </Text>
              <Text style={styles.quickStatLabel}>Pending</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return <MainAdminEvents />;
      case 'attendance':
        return <MainAdminAttendance />;
      case 'announcements':
        return <MainAdminAnnouncements />;
      case 'users':
        return <UserManagement />;
      case 'profile':
        return <MainAdminProfile />;
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        {renderContent()}
      </View>
    </View>
  );
}