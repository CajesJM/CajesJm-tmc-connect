import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { PieChart } from 'react-native-gifted-charts';
import { NotificationModal } from '../../components/NotificationModal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebaseConfig';
import { Notification, notificationService } from '../../utils/notifications';

import { useTheme } from '../../context/ThemeContext';
import { createDashboardStyles } from '../../styles/main-admin/dashboardStyles';

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
 interface UserRoleStat {
    role: 'student' | 'assistant_admin' | 'main_admin';
    label: string;
    count: number;
    percentage: number;
    color: string;
    icon: 'school' | 'shield-checkmark' | 'star';
  }

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  priority?: 'high' | 'medium' | 'low';
  author?: string;
}
interface DonutChartProps {
  userRoleStats: UserRoleStat[];
  totalUsers: number;
  dynamic: {
    headerGradient: readonly [string, string];
    chartBackground: readonly [string, string];
    statCardBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    cardBg: string;
    borderColor: string;
  };
  colors: {
    accent: { primary: string };
    // you can expand this as needed, but the component only uses colors.accent.primary
  };
  isDark: boolean;
  styles: any; // or define a more precise type from your styles object
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
    eventGrowth: 0,
    pendingAnnouncements: 0,
    approvedAnnouncements: 0,
    rejectedAnnouncements: 0,
  });


  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [displayedActivities, setDisplayedActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(5);
  const [refreshing, setRefreshing] = useState(false);

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [yearlyStats, setYearlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  
  const router = useRouter();
  const pathname = usePathname();
  const { userData } = useAuth();
  const { colors, isDark } = useTheme();

  const styles = createDashboardStyles(colors, isDark);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const chartWidth = isMobile ? width - 32 : isTablet ? width / 2 - 48 : width - 400;

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
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const [userRoleStats, setUserRoleStats] = useState<UserRoleStat[]>([
    { role: 'student', label: 'Students', count: 0, percentage: 0, color: '#0ea5e9', icon: 'school' },
    { role: 'assistant_admin', label: 'Assistants', count: 0, percentage: 0, color: '#f59e0b', icon: 'shield-checkmark' },
    { role: 'main_admin', label: 'Admins', count: 0, percentage: 0, color: '#8b5cf6', icon: 'star' },
  ]);
  

 

  const fetchUserRoleStats = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => doc.data());

      const total = users.length;
      if (total === 0) return;

      // Use Record type with string keys
      const roleCounts: Record<string, number> = {
        student: users.filter(u => u.role === 'student' || !u.role).length,
        assistant_admin: users.filter(u => u.role === 'assistant_admin').length,
        main_admin: users.filter(u => u.role === 'main_admin').length,
      };

      setUserRoleStats(prev => prev.map(role => ({
        ...role,
        count: roleCounts[role.role] || 0,
        percentage: Math.round(((roleCounts[role.role] || 0) / total) * 100)
      })));
    } catch (error) {
      console.error('Error fetching user role stats:', error);
    }
  };


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
    limit(20)
  );

  return onSnapshot(eventsQuery, (snapshot) => {
    const allEvents = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate();
        const status = data.status;
        const isApproved = status === 'approved' || !status;
        if (!isApproved) return null;
        if (!eventDate) return null;
        if (eventDate < now) return null;

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
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3) as Event[];  // ✅ type assertion ensures compatibility

    setUpcomingEvents(allEvents);
    setEventsLoading(false);
  }, (error) => {
    console.error('Error fetching events:', error);
    setEventsLoading(false);
  });
};
function DonutChart({ userRoleStats, totalUsers, dynamic, colors, isDark, styles }: DonutChartProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const animationsRef = useRef({
    positions: userRoleStats.map(() => new Animated.Value(0)),
    scales: userRoleStats.map(() => new Animated.Value(0)),
    opacities: userRoleStats.map(() => new Animated.Value(0)),
  });

  const { positions, scales, opacities } = animationsRef.current;

  // STANDARD SIZE pie data
  const pieData = userRoleStats.map((role: UserRoleStat, index: number) => ({
    value: role.count,
    color: role.color,
    text: focusedIndex === index ? '' : `${role.percentage}%`,
    textSize: focusedIndex === index ? 0 : 14,
    radius: focusedIndex === index ? 100 : 85,
    strokeWidth: focusedIndex === index ? 5 : 3,
    strokeColor: focusedIndex === index ? role.color : (isDark ? '#1e293b' : '#ffffff'),
    label: role.label,
    icon: role.icon,
  }));

  const handleSectionPress = (index: number) => {
    if (typeof index !== 'number' || index < 0 || index >= userRoleStats.length) return;
    const isSameSection = focusedIndex === index;

    if (focusedIndex !== null && focusedIndex !== index) {
      Animated.parallel([
        Animated.timing(positions[focusedIndex], { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scales[focusedIndex], { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(opacities[focusedIndex], { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }

    if (isSameSection) {
      Animated.parallel([
        Animated.timing(positions[index], { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(scales[index], { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(opacities[index], { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setFocusedIndex(null));
    } else {
      setFocusedIndex(index);
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(positions[index], { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
          Animated.spring(scales[index], { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
          Animated.timing(opacities[index], { toValue: 1, duration: 250, useNativeDriver: true }),
        ]).start();
      }, 50);
    }
  };

  const getLabelPosition = (index: number, percentage: number) => {
    let startAngle = 0;
    for (let i = 0; i < index; i++) {
      startAngle += (userRoleStats[i].percentage / 100) * 360;
    }
    const sectionAngle = (percentage / 100) * 360;
    const midAngle = startAngle + sectionAngle / 2;
    const angleRad = ((midAngle - 90) * Math.PI) / 180;
    const distance = 150;
    return { x: Math.cos(angleRad) * distance, y: Math.sin(angleRad) * distance };
  };

  return (
    <View style={[styles.donutChartContainer, {
      backgroundColor: dynamic.cardBg,
      borderColor: dynamic.borderColor,
    }]}>
      <View style={styles.donutHeader}>
        <View style={styles.donutHeaderLeft}>
          <Ionicons name="pie-chart" size={18} color={colors.accent.primary} />
          <Text style={[styles.donutTitle, { color: dynamic.textPrimary }]}>
            User Distribution
          </Text>
        </View>
        <Text style={[styles.donutTotalBadge, {
          backgroundColor: isDark ? colors.accent.primary + '30' : colors.accent.primary + '15',
          color: colors.accent.primary
        }]}>
          {totalUsers} total
        </Text>
      </View>

      <View style={styles.donutChartWrapper}>
        <PieChart
          data={pieData}
          donut
          showText={true}
          textColor={isDark ? '#ffffff' : '#1e293b'}
          fontWeight="bold"
          innerRadius={60}
          innerCircleColor={isDark ? '#1e293b' : '#ffffff'}
          innerCircleBorderWidth={focusedIndex !== null ? 2 : 0}
          innerCircleBorderColor={focusedIndex !== null ? userRoleStats[focusedIndex]?.color : 'transparent'}
          strokeWidth={3}
          focusOnPress={false}
          onPress={(item: any, index: number) => {
            if (typeof index === 'number' && index >= 0) handleSectionPress(index);
          }}
          centerLabelComponent={() => (
            <View style={styles.donutCenterLabel}>
              <Text style={[styles.donutCenterValue, { color: dynamic.textPrimary }]}>
                {totalUsers}
              </Text>
              <Text style={[styles.donutCenterText, { color: dynamic.textSecondary }]}>
                Total Users
              </Text>
            </View>
          )}
        />

        {userRoleStats.map((role: UserRoleStat, index: number) => {
          const position = getLabelPosition(index, role.percentage);
          return (
            <Animated.View
              key={`label-${index}`}
              style={[
                styles.externalLabelContainer,
                {
                  transform: [
                    { translateX: positions[index].interpolate({ inputRange: [0, 1], outputRange: [0, position.x] }) },
                    { translateY: positions[index].interpolate({ inputRange: [0, 1], outputRange: [0, position.y] }) },
                    { scale: scales[index] }
                  ],
                  opacity: opacities[index],
                }
              ]}
              pointerEvents="none"
            >
              <View style={[styles.externalLabelBubble, {
                backgroundColor: role.color,
                shadowColor: role.color,
              }]}>
                <Text style={styles.externalLabelPercent}>{role.percentage}%</Text>
              </View>
              <View style={[styles.externalLabelArrow, { borderTopColor: role.color }]} />
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.progressLegendContainer}>
        {userRoleStats.map((role, index) => {
          const isFocused = focusedIndex === index;
          return (
            <TouchableOpacity
              key={role.role}
              style={[styles.progressLegendItem, isFocused && styles.progressLegendItemFocused]}
              activeOpacity={0.8}
              onPress={() => handleSectionPress(index)}
            >
              <View style={styles.progressLegendHeader}>
                <View style={[styles.progressLegendIcon, {
                  backgroundColor: role.color + (isDark ? '30' : '20')
                }, isFocused && { backgroundColor: role.color }]}>
                  <Ionicons name={role.icon} size={16} color={isFocused ? '#ffffff' : role.color} />
                </View>
                <View style={styles.progressLegendInfo}>
                  <Text style={[styles.progressLegendLabel, { color: dynamic.textPrimary },
                  isFocused && { color: role.color, fontWeight: '700' }]}>
                    {role.label}
                  </Text>
                  <Text style={[styles.progressLegendCount, { color: dynamic.textSecondary }]}>
                    {role.count} users
                  </Text>
                </View>
                <Text style={[styles.progressLegendPercent, { color: role.color },
                isFocused && { fontWeight: '800' }]}>
                  {role.percentage}%
                </Text>
              </View>
              <View style={[styles.progressBarBackground, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <Animated.View style={[styles.progressBarFill, {
                  backgroundColor: role.color,
                  width: isFocused ? '100%' : `${role.percentage}%`
                }]} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

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
    limit(10)
  );

  return onSnapshot(announcementsQuery, (snapshot) => {
    const approvedAnnouncements = snapshot.docs
      .map(doc => {
        const data = doc.data();
        const status = data.status;
        const isApproved = status === 'approved' || !status;
        if (!isApproved) return null;

        return {
          id: doc.id,
          title: data.title || 'Announcement',
          content: data.content || data.message || 'No content',
          createdAt: data.createdAt?.toDate() || new Date(),
          priority: data.priority || 'medium',
          author: data.author || 'Admin'
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, 3) as Announcement[];  // ✅ type assertion

    setRecentAnnouncements(approvedAnnouncements);
    setAnnouncementsLoading(false);
  }, (error) => {
    console.error('Error fetching announcements:', error);
    setAnnouncementsLoading(false);
  });
};

  useEffect(() => {
    fetchDashboardStats();
    fetchUserRoleStats();

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
        approvedBy: userData?.email,
      });

      if (approval.data?.createdBy) {
        await notificationService.createNotification({
          userId: approval.data.createdBy,
          title: `${approval.type === 'announcement' ? 'Announcement' : 'Event'} Approved`,
          message: `Your "${approval.title}" has been approved by the main admin.`,
          type: approval.type,
          timestamp: new Date(),
          data: { [`${approval.type}Id`]: approval.id },
        });
      }

      if (Platform.OS === 'web') {
        window.alert(`${approval.type} approved successfully!`);
      } else {
        Alert.alert('Success', `${approval.type} approved successfully!`);
      }
    } catch (error) {
      console.error('Error approving:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to approve. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to approve. Please try again.');
      }
    }
  };
  const handleReject = (approval: PendingApproval) => {
    console.log('🚨 handleReject called with:', approval);
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to reject "${approval.title}"?`);
      if (confirmed) {
        performReject(approval);
      }
    } else {
      Alert.alert(
        'Reject Request',
        `Are you sure you want to reject "${approval.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: () => performReject(approval),
          },
        ]
      );
    }
  };

  const performReject = async (approval: PendingApproval) => {
    console.log('🔴 Reject button pressed for:', approval.id, approval.type);
    try {
      const collectionName = approval.type === 'announcement' ? 'updates' : 'events';
      const docRef = doc(db, collectionName, approval.id);
      console.log('Document path:', docRef.path);

      await updateDoc(docRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: userData?.email || 'unknown',
      });
      console.log('✅ Firestore update succeeded');

      // Send notification to the creator (if they exist)
      if (approval.data?.createdBy) {
        try {
          await notificationService.createNotification({
            userId: approval.data.createdBy,
            title: `${approval.type === 'announcement' ? 'Announcement' : 'Event'} Rejected`,
            message: `Your "${approval.title}" has been rejected by the main admin.`,
            type: approval.type,
            timestamp: new Date(),
            data: { [`${approval.type}Id`]: approval.id },
          });
          console.log('✅ Notification sent');
        } catch (notifyError) {
          console.error('❌ Notification failed:', notifyError);
          // Continue – notification failure shouldn't break the rejection
        }
      }

      // Show success message
      if (Platform.OS === 'web') {
        window.alert(`${approval.type} has been rejected.`);
      } else {
        Alert.alert('Rejected', `${approval.type} has been rejected.`);
      }
    } catch (error) {
      console.error('❌ Error in reject:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to reject. Check console for details.');
      } else {
        Alert.alert('Error', 'Failed to reject. Check console for details.');
      }
    }
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
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Generate last 6 months for display
      const months: MonthlyStats[] = [];
      const monthKeys: string[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const displayMonth = date.toLocaleString('default', { month: 'long' });

        months.push({
          month: displayMonth,
          events: 0,
          attendance: 0,
          announcements: 0
        });
        monthKeys.push(monthKey);
      }

      const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
      const nextMonth = new Date(currentYear, currentMonth + 1, 1);

      const eventsSnapshot = await getDocs(collection(db, 'events'));

      console.log('🔍 CHECKING ALL EVENTS:');

      // Count events that are APPROVED or AUTO-APPROVED (no status = main admin created)
      const approvedEvents = eventsSnapshot.docs.filter(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate?.() || data.date;

        // Check if approved: either status='approved' OR no status field (main admin auto-approved)
        const status = data.status;
        const isApproved = status === 'approved' || status === undefined || status === null || status === '';

        // Also exclude rejected events
        const isRejected = status === 'rejected';

        const inRange = eventDate && eventDate >= sixMonthsAgo && eventDate < nextMonth;

        console.log(`  "${data.title}": status=${status} (type: ${typeof status}), isApproved=${isApproved}, isRejected=${isRejected}, inRange=${inRange}`);

        return isApproved && !isRejected && inRange;
      });

      console.log('✅ Total approved+auto-approved events in range:', approvedEvents.length);

      let totalAttendance = 0;

      approvedEvents.forEach(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate?.() || data.date;

        if (!eventDate) return;

        const monthKey = eventDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const monthIndex = monthKeys.indexOf(monthKey);

        if (monthIndex !== -1) {
          months[monthIndex].events += 1;
          const attendees = data.attendees?.length || 0;
          totalAttendance += attendees;
          months[monthIndex].attendance += attendees;
          console.log(`📊 Added "${data.title}" to ${monthKey}`);
        }
      });

      console.log('📊 Final monthly stats:', months);

      setMonthlyStats(months);
      setDashboardStats(prev => ({
        ...prev,
        totalAttendance
      }));

    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const calculateYearlyStats = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Generate last 12 months for display
      const months: MonthlyStats[] = [];
      const monthKeys: string[] = [];

      for (let i = 11; i >= 0; i--) { // Changed from 5 to 11 for 12 months
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const displayMonth = date.toLocaleString('default', { month: 'short' }); // Short month name for space

        months.push({
          month: displayMonth,
          events: 0,
          attendance: 0,
          announcements: 0
        });
        monthKeys.push(monthKey);
      }

      const twelveMonthsAgo = new Date(currentYear, currentMonth - 11, 1);
      const nextMonth = new Date(currentYear, currentMonth + 1, 1);

      const eventsSnapshot = await getDocs(collection(db, 'events'));

      // Count events that are APPROVED or AUTO-APPROVED
      const approvedEvents = eventsSnapshot.docs.filter(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate?.() || data.date;

        const status = data.status;
        const isApproved = status === 'approved' || status === undefined || status === null || status === '';
        const isRejected = status === 'rejected';

        const inRange = eventDate && eventDate >= twelveMonthsAgo && eventDate < nextMonth;

        return isApproved && !isRejected && inRange;
      });

      let totalYearlyAttendance = 0;

      approvedEvents.forEach(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate?.() || data.date;

        if (!eventDate) return;

        const monthKey = eventDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const monthIndex = monthKeys.indexOf(monthKey);

        if (monthIndex !== -1) {
          months[monthIndex].events += 1;
          const attendees = data.attendees?.length || 0;
          totalYearlyAttendance += attendees;
          months[monthIndex].attendance += attendees;
        }
      });

      setYearlyStats(months);

      // Also update dashboard stats with yearly attendance if needed
      setDashboardStats(prev => ({
        ...prev,
        yearlyAttendance: totalYearlyAttendance
      }));

    } catch (error) {
      console.error('❌ Error calculating yearly stats:', error);
    }
  };

  // Update useEffect to include yearly stats
  useEffect(() => {
    fetchDashboardStats();
    fetchUserRoleStats();

    const unsubscribeActivities = setupRealtimeActivities();
    const unsubscribeEvents = fetchUpcomingEvents();
    const unsubscribeAnnouncements = fetchRecentAnnouncements();

    calculateMonthlyStats();
    calculateYearlyStats(); // NEW: Calculate 12 months data

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
    calculateYearlyStats(); // NEW: Calculate 12 months data

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
  const calculateGrowth = (data: MonthlyStats[], key: 'events' | 'attendance') => {
    if (data.length < 2) return 0;

    const firstValue = data[0][key];
    const lastValue = data[data.length - 1][key];

    if (firstValue === 0) return lastValue > 0 ? 100 : 0;

    const growth = ((lastValue - firstValue) / firstValue) * 100;
    return Math.round(growth);
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

      // Get users first
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter(doc =>
        doc.data().active !== false
      ).length;

      const eventsSnapshot = await getDocs(collection(db, 'events'));

      let totalEvents = 0;
      let approvedEvents = 0;
      let pendingEvents = 0;
      let rejectedEvents = 0;
      let upcomingEvents = 0;
      let totalAttendanceAllTime = 0;

      const now = new Date();

      eventsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        totalEvents++;

        const status = data.status;
        const isApproved = status === 'approved' || status === undefined || status === null || status === '';
        const isPending = status === 'pending';
        const isRejected = status === 'rejected';

        if (isApproved) approvedEvents++;
        if (isPending) pendingEvents++;
        if (isRejected) rejectedEvents++;

        // Check if upcoming (approved and future date)
        if (isApproved) {
          const eventDate = data.date?.toDate?.() || data.date;
          if (eventDate && eventDate > now) {
            upcomingEvents++;
          }

          // Count all-time attendance
          const attendees = data.attendees?.length || 0;
          totalAttendanceAllTime += attendees;
        }
      });

      const pastEvents = approvedEvents - upcomingEvents;

      console.log('📈 Dashboard Stats:', {
        totalInDB: totalEvents,
        approved: approvedEvents,
        pending: pendingEvents,
        rejected: rejectedEvents,
        upcoming: upcomingEvents,
        past: pastEvents
      });

      const announcementsSnapshot = await getDocs(collection(db, 'updates'));
      const totalAnnouncements = announcementsSnapshot.size;

      const pendingAnnouncements = announcementsSnapshot.docs.filter(
        doc => doc.data().status === 'pending'
      ).length;
      const approvedAnnouncements = announcementsSnapshot.docs.filter(
        doc => doc.data().status === 'approved'
      ).length;
      const rejectedAnnouncements = announcementsSnapshot.docs.filter(
        doc => doc.data().status === 'rejected'
      ).length;

      // Calculate pending verifications - FIXED to use isApproved logic
      let pendingVerifications = 0;
      eventsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status;
        const isApproved = status === 'approved' || status === undefined || status === null || status === '';

        if (isApproved && data.coordinates && data.attendees) {
          const unverified = data.attendees.filter((a: any) => !a.location?.isWithinRadius).length;
          pendingVerifications += unverified;
        }
      });

      // Calculate growth percentages (handle division by zero)
      const userGrowth = totalUsers > 0 ? ((activeUsers - totalUsers * 0.8) / (totalUsers * 0.8)) * 100 : 0;
      const eventGrowth = approvedEvents > 0 ? ((upcomingEvents - approvedEvents * 0.3) / (approvedEvents * 0.3)) * 100 : 0;

      setDashboardStats({
        totalUsers,
        totalEvents: approvedEvents, // Now counts auto-approved too!
        totalAnnouncements,
        activeAttendees: totalAttendanceAllTime,
        upcomingEvents,
        pendingVerifications,
        activeUsers,
        totalAttendance: totalAttendanceAllTime,
        userGrowth,
        eventGrowth,
        pendingAnnouncements,
        approvedAnnouncements,
        rejectedAnnouncements
      });
    } catch (error) {
      console.error('❌ Error:', error);
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
  const getDynamicStyles = () => ({
    headerGradient: isDark
      ? ['#0f172a', '#1e293b'] as const
      : ['#1e40af', '#3b82f6'] as const,
    chartBackground: isDark
      ? ['#1e293b', '#121e39'] as const
      : ['#f0f9ff', '#ffffff'] as const,
    statCardBorder: isDark ? '#3b82f6' : '#1266d4',
    textPrimary: colors.text,
    textSecondary: colors.sidebar.text.secondary,
    textMuted: colors.sidebar.text.muted,
    cardBg: colors.card,
    borderColor: colors.border,
  });

  const dynamic = getDynamicStyles();


  const renderStatCard = (title: string, value: string | number, icon: any, color: string, trend?: number, subtitle?: string) => (
    <TouchableOpacity style={[styles.statCard, {
      backgroundColor: dynamic.cardBg,
      borderLeftColor: color,
      borderRightColor: dynamic.statCardBorder,
      shadowColor: isDark ? '#000' : '#000',
      shadowOpacity: isDark ? 0.3 : 0.05,
    }]}>
      <View style={styles.statCardHeader}>
        <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        {trend !== undefined && (
          <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#10b98120' : '#ef444420' }]}>
            <Feather name={trend >= 0 ? 'trending-up' : 'trending-down'} size={12} color={trend >= 0 ? '#10b981' : '#ef4444'} />
            <Text style={[styles.trendText, { color: trend >= 0 ? '#10b981' : '#ef4444' }]}>
              {Math.abs(trend).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.statNumber, { color: dynamic.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: dynamic.textSecondary }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtext, { color: dynamic.textMuted }]}>{subtitle}</Text>}

      {selectedStat === title && (
        <View style={[styles.statExpand, { borderTopColor: dynamic.borderColor }]}>
          <View style={[styles.statProgress, { backgroundColor: dynamic.borderColor }]}>
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
      style={[styles.overviewContainer, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.primary} />
      }
    >
      {/* Header Gradient */}
      <LinearGradient
        colors={dynamic.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greetingText, { color: dynamic.textMuted }]}>Welcome back,</Text>
            <Text style={styles.userName}>{userData?.name || 'Admin'}</Text>
            <Text style={[styles.roleText, { color: dynamic.textMuted }]}>Administrator</Text>
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
            <Feather name="calendar" size={12} color={dynamic.textMuted} />
            <Text style={[styles.dateText, { color: isDark ? dynamic.textSecondary : '#ffffff' }]}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.headerAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)' }]} onPress={handleDownloadReport} disabled={downloadLoading}>
              {downloadLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Feather name="download" size={18} color="#ffffff" />}
            </TouchableOpacity>

            <TouchableOpacity style={[styles.headerAction, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)' }]} onPress={() => setNotificationModalVisible(true)}>
              <Feather name="bell" size={18} color="#ffffff" />
              {(unreadCount > 0) && (
                <View style={[styles.notificationBadge, approvalCount > 0 && styles.approvalBadge]}>
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
        pendingApprovals={pendingApprovals}
        onApprove={handleApprove}
        onReject={handleReject}
        approvalCount={approvalCount}
      />

      {/* Charts Grid - Two Column Layout: Line Chart Left, Donut Chart Right */}
      <View style={styles.chartsGrid}>
        <View style={[styles.chartColumn, styles.lineChartColumn]}>
          <View style={[styles.chartsContainer, {
            backgroundColor: dynamic.cardBg,
            shadowColor: isDark ? '#000' : '#0ea5e9',
            shadowOpacity: isDark ? 0.3 : 0.08,
            marginHorizontal: 0,
          }]}>

            <View style={styles.chartHeader}>
              <View>
                <Text style={[styles.chartsTitle, { color: dynamic.textPrimary }]}>Analytics Overview</Text>
                <Text style={[styles.chartsSubtitle, { color: dynamic.textSecondary }]}>Last 6 months activity</Text>
              </View>

              <View style={styles.chartLegend}>
                <TouchableOpacity
                  style={[
                    styles.legendItem,
                    styles.legendButton,
                    { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
                    selectedDataset === 'events' && { backgroundColor: isDark ? '#0ea5e930' : '#0ea5e915', borderColor: '#0ea5e9' }
                  ]}
                  onPress={() => setSelectedDataset(selectedDataset === 'events' ? null : 'events')}
                >
                  <View style={[styles.legendDot, { backgroundColor: '#0ea5e9' }]} />
                  <Text style={[styles.legendText, { color: selectedDataset === 'events' ? colors.accent.primary : dynamic.textSecondary }]}>Events</Text>
                  <View style={[styles.legendValue, { backgroundColor: isDark ? '#0ea5e930' : '#0ea5e915' }]}>
                    <Text style={[styles.legendValueText, { color: '#0ea5e9' }]}>{monthlyStats.reduce((sum, s) => sum + s.events, 0)}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.legendItem,
                    styles.legendButton,
                    { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
                    selectedDataset === 'attendance' && { backgroundColor: isDark ? '#10b98130' : '#10b98115', borderColor: '#10b981' }
                  ]}
                  onPress={() => setSelectedDataset(selectedDataset === 'attendance' ? null : 'attendance')}
                >
                  <View style={[styles.legendDot, { backgroundColor: '#a855f7' }]} />
                  <Text style={[styles.legendText, { color: selectedDataset === 'attendance' ? '#a855f7' : dynamic.textSecondary }]}>Attendance</Text>
                  <View style={[styles.legendValue, { backgroundColor: isDark ? '#10b98130' : '#10b98115' }]}>
                    <Text style={[styles.legendValueText, { color: '#a855f7' }]}>{monthlyStats.reduce((sum, s) => sum + s.attendance, 0)}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {monthlyStats.length > 0 && (
              <View style={styles.chartWrapper}>
                <LinearGradient
                  colors={dynamic.chartBackground}
                  style={styles.chartBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chartScrollContent}
                >
                  <LineChart
                    data={{
                      labels: monthlyStats.map(s => s.month),
                      datasets: [
                        {
                          data: monthlyStats.map(s => s.events),
                          color: (opacity = 1) => selectedDataset === 'attendance'
                            ? `rgba(14, 165, 233, ${opacity * 0.7})`
                            : `rgba(14, 165, 233, ${opacity})`,
                          strokeWidth: 4
                        },
                        {
                          data: monthlyStats.map(s => s.attendance),
                          color: (opacity = 1) => selectedDataset === 'events'
                            ? `rgba(139, 92, 246, ${opacity * 0.7})`
                            : `rgba(139, 92, 246, ${opacity})`,
                          strokeWidth: 4
                        }
                      ]
                    }}
                    width={Math.max(chartWidth, 400)}
                    height={280}
                    chartConfig={{
                      backgroundColor: 'transparent',
                      backgroundGradientFrom: 'transparent',
                      backgroundGradientTo: 'transparent',
                      decimalPlaces: 0,
                      color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(15, 23, 42, ${opacity})`,
                      labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
                      style: { borderRadius: 16 },
                      propsForDots: {
                        r: '0',
                        strokeWidth: '0',
                        stroke: isDark ? '#1e293b' : '#ffffff',
                        fill: isDark ? '#1e293b' : '#ffffff'
                      },
                      propsForBackgroundLines: {
                        stroke: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
                        strokeWidth: 1,
                        strokeDasharray: '5, 5'
                      },
                      propsForLabels: {
                        fontSize: 12,
                        fontWeight: '600',
                        fontFamily: 'System'
                      },
                      fillShadowGradientFrom: '#0ea5e9',
                      fillShadowGradientFromOpacity: 0.9,
                      fillShadowGradientTo: '#0ea5e9',
                      fillShadowGradientToOpacity: 0.05,
                      useShadowColorFromDataset: true
                    }}
                    bezier
                    style={styles.chart}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLines={true}
                    withHorizontalLines={true}
                    fromZero={true}
                    yAxisInterval={1}
                    segments={5}
                    formatYLabel={(value) => {
                      const num = parseInt(value);
                      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
                      return value.toString();
                    }}
                    withShadow={true}
                    getDotColor={(dataPoint, index) => {
                      return isDark ? '#ffffff' : '#0ea5e9';
                    }}
                  />
                </ScrollView>

                <View style={styles.axisLabelContainer}>
                  <Text style={[styles.axisLabel, { color: dynamic.textMuted }]}>Timeline (Last 6 Months)</Text>
                </View>


              </View>
            )}
          </View>
          {/* Chart Summary - Top Stats Cards */}
          <View style={styles.chartsGrid}>
            <View style={[styles.summaryItem, {
              backgroundColor: isDark ? '#0ea5e920' : '#f0f9ff',
              borderColor: isDark ? '#0ea5e940' : '#0ea5e920'
            }]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: isDark ? '#0ea5e930' : '#ffffff' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#0ea5e9" />
              </View>
              <Text style={[styles.summaryValue, { color: '#0ea5e9' }]}>{dashboardStats.totalEvents}</Text>
              <Text style={[styles.summaryLabel, { color: dynamic.textSecondary }]}>Total Events</Text>
            </View>

            <View style={[styles.summaryItem, {
              backgroundColor: isDark ? '#10b98120' : '#f0fdf4',
              borderColor: isDark ? '#10b98140' : '#10b98120'
            }]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: isDark ? '#10b98130' : '#ffffff' }]}>
                <Ionicons name="people" size={20} color="#10b981" />
              </View>
              <Text style={[styles.summaryValue, { color: '#10b981', fontSize: 16 }]}>
                {monthlyStats.length > 0 ? monthlyStats.reduce((max, stat) => stat.attendance > max.attendance ? stat : max, monthlyStats[0]).month : '-'}
              </Text>
              <Text style={[styles.summaryLabel, { color: dynamic.textSecondary }]}>
                Peak Attendance ({monthlyStats.length > 0 ? Math.max(...monthlyStats.map(s => s.attendance)) : 0})
              </Text>
            </View>

            <View style={[styles.summaryItem, {
              backgroundColor: isDark ? '#8b5cf620' : '#faf5ff',
              borderColor: isDark ? '#8b5cf640' : '#8b5cf620'
            }]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: isDark ? '#8b5cf630' : '#ffffff' }]}>
                <Ionicons name={calculateGrowth(monthlyStats, 'attendance') >= 0 ? "trending-up" : "trending-down"} size={20} color="#8b5cf6" />
              </View>
              <Text style={[styles.summaryValue, { color: '#8b5cf6' }]}>
                {calculateGrowth(monthlyStats, 'attendance') > 0 ? '+' : ''}{calculateGrowth(monthlyStats, 'attendance')}%
              </Text>
              <Text style={[styles.summaryLabel, { color: dynamic.textSecondary }]}>Attendance Growth</Text>
            </View>
          </View>
        </View>

        {/* Right Column - Donut Chart (User Distribution) */}
        <View style={[styles.chartColumn, styles.donutChartColumn]}>
          <DonutChart
            userRoleStats={userRoleStats}
            totalUsers={dashboardStats.totalUsers}
            dynamic={dynamic}
            colors={colors}
            isDark={isDark}
            styles={styles}
          />
        </View>
      </View>


      {/* Two Column Layout - Monthly Activity (Left) + Stats Grid (Right) */}
      <View style={styles.twoColumnLayout}>

        <View style={[styles.column, styles.monthlyActivityColumn]}>
          <View style={[styles.customBarChartContainer, {
            backgroundColor: dynamic.cardBg,
            borderColor: dynamic.borderColor,
            height: '100%',
          }]}>
            {/* Header */}
            <View style={styles.customBarChartHeader}>
              <View style={styles.customBarChartHeaderLeft}>
                <Ionicons name="bar-chart" size={18} color={colors.accent.primary} />
                <Text style={[styles.customBarChartTitle, { color: dynamic.textPrimary }]}>
                  Monthly Activity
                </Text>
              </View>
              <Text style={[styles.customBarChartTotalBadge, {
                backgroundColor: isDark ? colors.accent.primary + '30' : colors.accent.primary + '15',
                color: colors.accent.primary
              }]}>
                {yearlyStats.reduce((sum, s) => sum + s.events, 0)} events
              </Text>
            </View>

            {/* Legend */}
            <View style={styles.customBarChartLegend}>
              <View style={styles.customLegendItem}>
                <View style={[styles.customLegendDot, { backgroundColor: '#0ea5e9' }]} />
                <Text style={[styles.customLegendText, { color: dynamic.textSecondary }]}>
                  Events ({yearlyStats.reduce((sum, s) => sum + s.events, 0)})
                </Text>
              </View>
              <View style={styles.customLegendItem}>
                <View style={[styles.customLegendDot, { backgroundColor: '#a855f7' }]} />
                <Text style={[styles.customLegendText, { color: dynamic.textSecondary }]}>
                  Attendance ({yearlyStats.reduce((sum, s) => sum + s.attendance, 0)})
                </Text>
              </View>
            </View>

            {/* Chart Area - 12 Months */}
            {yearlyStats.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.yearlyBarChartScrollContent}
              >
                <View style={styles.yearlyBarsContainer}>
                  {yearlyStats.map((stat, index) => {
                    const maxValue = Math.max(
                      ...yearlyStats.flatMap(s => [s.events, s.attendance])
                    ) || 1;
                    const maxBarHeight = 140;
                    const eventsHeight = (stat.events / maxValue) * maxBarHeight;
                    const attendanceHeight = (stat.attendance / maxValue) * maxBarHeight;

                    return (
                      <View key={index} style={styles.yearlyMonthColumn}>
                        {/* Month Label - Show full month name for yearly view */}
                        <Text style={[styles.yearlyMonthLabel, { color: dynamic.textSecondary }]}>
                          {stat.month}
                        </Text>

                        {/* Bars */}
                        <View style={styles.yearlyBarsWrapper}>
                          <View style={styles.yearlyBarPair}>
                            {/* Events Bar */}
                            <View style={styles.yearlyBarItem}>
                              <View
                                style={[
                                  styles.yearlyBar,
                                  {
                                    backgroundColor: '#0ea5e9',
                                    height: Math.max(eventsHeight, 4),
                                  },
                                ]}
                              >
                                {stat.events > 0 && (
                                  <Text style={styles.yearlyBarValue}>{stat.events}</Text>
                                )}
                              </View>
                            </View>

                            {/* Attendance Bar */}
                            <View style={styles.yearlyBarItem}>
                              <View
                                style={[
                                  styles.yearlyBar,
                                  {
                                    backgroundColor: '#a855f7',
                                    height: Math.max(attendanceHeight, 4),
                                  },
                                ]}
                              >
                                {stat.attendance > 0 && (
                                  <Text style={styles.yearlyBarValue}>{stat.attendance}</Text>
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}

            {/* Footer */}
            <View style={[styles.customBarChartFooter, { borderTopColor: dynamic.borderColor }]}>
              <Text style={[styles.customBarChartFooterText, { color: dynamic.textSecondary }]}>
                Last 12 months overview
              </Text>
            </View>
          </View>
        </View>

        {/* Right Side - Stats Grid (2x2) - Same Content, New Style */}
        <View style={[styles.column, styles.statsColumn]}>
          <View style={[styles.statsGridContainer, {
            backgroundColor: dynamic.cardBg,
            height: '100%',
          }]}>
            <View style={styles.statsGridEnhanced}>
              {/* Total Users - Same Content, Centered Style */}
              <TouchableOpacity
                style={[styles.statCardEnhanced, {
                  backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#f0f9ff',
                  borderColor: isDark ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.2)',
                  borderWidth: 1,
                }]}
                onPress={() => navigateTo('users')}
                activeOpacity={0.9}
              >
                <View style={[styles.statCardHeaderEnhanced, { justifyContent: 'center' }]}>
                  <View style={[styles.statIconEnhanced, {
                    backgroundColor: isDark ? 'rgba(14, 165, 233, 0.25)' : '#ffffff',
                    shadowColor: '#0ea5e9',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }]}>
                    <FontAwesome6 name="users" size={22} color="#0ea5e9" />
                  </View>
                  {dashboardStats.userGrowth !== 0 && (
                    <View style={[styles.trendBadgeEnhanced, {
                      backgroundColor: dashboardStats.userGrowth >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                    }]}>
                      <Feather
                        name={dashboardStats.userGrowth >= 0 ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={dashboardStats.userGrowth >= 0 ? '#10b981' : '#ef4444'}
                      />
                      <Text style={[styles.trendTextEnhanced, { color: dashboardStats.userGrowth >= 0 ? '#10b981' : '#ef4444' }]}>
                        {Math.abs(dashboardStats.userGrowth).toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.statNumberEnhanced, { color: '#0ea5e9', textAlign: 'center' }]}>{dashboardStats.totalUsers}</Text>
                <Text style={[styles.statLabelEnhanced, { color: dynamic.textSecondary, textAlign: 'center' }]}>Total Users</Text>
                <Text style={[styles.statSubtextEnhanced, { color: dynamic.textMuted, textAlign: 'center' }]}>
                  {dashboardStats.activeUsers} currently active
                </Text>
              </TouchableOpacity>

              {/* Total Events - Same Content, Centered Style */}
              <TouchableOpacity
                style={[styles.statCardEnhanced, {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                  borderWidth: 1,
                }]}
                onPress={() => navigateTo('events')}
                activeOpacity={0.9}
              >
                <View style={[styles.statCardHeaderEnhanced, { justifyContent: 'center' }]}>
                  <View style={[styles.statIconEnhanced, {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#ffffff',
                    shadowColor: '#f59e0b',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }]}>
                    <Ionicons name="calendar" size={22} color="#f59e0b" />
                  </View>
                </View>
                <Text style={[styles.statNumberEnhanced, { color: '#f59e0b', textAlign: 'center' }]}>{dashboardStats.totalEvents}</Text>
                <Text style={[styles.statLabelEnhanced, { color: dynamic.textSecondary, textAlign: 'center' }]}>Total Events</Text>
                <View style={[styles.statStatsRow, { justifyContent: 'center' }]}>
                  <Text style={[styles.statSubtextEnhanced, { color: '#10b981' }]}>
                    {dashboardStats.upcomingEvents} upcoming
                  </Text>
                  <Text style={styles.statSubtextEnhanced}>•</Text>
                  <Text style={styles.statSubtextEnhanced}>
                    {dashboardStats.totalEvents - dashboardStats.upcomingEvents} past
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Announcements - Same Content, Centered Style */}
              <TouchableOpacity
                style={[styles.statCardEnhanced, {
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#faf5ff',
                  borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                  borderWidth: 1,
                }]}
                onPress={() => navigateTo('announcements')}
                activeOpacity={0.9}
              >
                <View style={[styles.statCardHeaderEnhanced, { justifyContent: 'center' }]}>
                  <View style={[styles.statIconEnhanced, {
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.25)' : '#ffffff',
                    shadowColor: '#8b5cf6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }]}>
                    <FontAwesome6 name="bullhorn" size={22} color="#8b5cf6" />
                  </View>
                </View>
                <Text style={[styles.statNumberEnhanced, { color: '#8b5cf6', textAlign: 'center' }]}>{dashboardStats.totalAnnouncements}</Text>
                <Text style={[styles.statLabelEnhanced, { color: dynamic.textSecondary, textAlign: 'center' }]}>Announcements</Text>
                <View style={[styles.statStatsRow, { justifyContent: 'center' }]}>
                  <Text style={[styles.statSubtextEnhanced, { color: '#f59e0b' }]}>
                    {dashboardStats.pendingAnnouncements} pending
                  </Text>
                  <Text style={styles.statSubtextEnhanced}>•</Text>
                  <Text style={[styles.statSubtextEnhanced, { color: '#10b981' }]}>
                    {dashboardStats.approvedAnnouncements} approved
                  </Text>
                  <Text style={styles.statSubtextEnhanced}>•</Text>
                  <Text style={[styles.statSubtextEnhanced, { color: '#ef4444' }]}>
                    {dashboardStats.rejectedAnnouncements} rejected
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Need Approval - Same Content, Centered Style */}
              <TouchableOpacity
                style={[styles.statCardEnhanced, {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                  borderWidth: 1,
                }]}
                onPress={() => setNotificationModalVisible(true)}
                activeOpacity={0.9}
              >
                <View style={[styles.statCardHeaderEnhanced, { justifyContent: 'center' }]}>
                  <View style={[styles.statIconEnhanced, {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#ffffff',
                    shadowColor: '#ef4444',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }]}>
                    <Ionicons name="time" size={22} color="#ef4444" />
                  </View>
                  {pendingApprovals.length > 0 && (
                    <View style={[styles.approvalBadgeEnhanced, {
                      position: 'absolute',
                      top: 0,
                      right: 0,
                    }]}>
                      <Text style={styles.approvalBadgeText}>
                        {pendingApprovals.length > 9 ? '9+' : pendingApprovals.length}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.statNumberEnhanced, { color: '#ef4444', textAlign: 'center' }]}>{pendingApprovals.length}</Text>
                <Text style={[styles.statLabelEnhanced, { color: dynamic.textSecondary, textAlign: 'center' }]}>Need Approval</Text>
                <Text style={[styles.statSubtextEnhanced, { color: dynamic.textMuted, textAlign: 'center' }]}>
                  {pendingApprovals.filter(p => p.type === 'event').length} events •{' '}
                  {pendingApprovals.filter(p => p.type === 'announcement').length} updates
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Two Column Layout - Recent Activity + Upcoming Events/Announcements */}
      <View style={styles.twoColumnLayout}>
        <View style={[styles.column, styles.activityColumn]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: dynamic.textPrimary }]}>Recent Activity</Text>
            {activitiesLoading && <ActivityIndicator size="small" color={colors.accent.primary} />}
          </View>

          <View style={[styles.activityList, {
            backgroundColor: dynamic.cardBg,
            borderColor: dynamic.borderColor,
            shadowColor: isDark ? '#000' : '#000',
            shadowOpacity: isDark ? 0.3 : 0.05,
          }]}>
            {displayedActivities.length > 0 ? (
              <>
                {displayedActivities.map((activity, index) => (
                  <View key={activity.id} style={[
                    styles.activityItem,
                    { borderBottomColor: dynamic.borderColor },
                    index === displayedActivities.length - 1 && styles.lastActivityItem
                  ]}>
                    <View style={[styles.activityIcon, { backgroundColor: `${activity.color}${isDark ? '30' : '15'}` }]}>
                      {getActivityIcon(activity)}
                    </View>
                    <View style={styles.activityContent}>
                      <View style={styles.activityHeader}>
                        <Text style={[styles.activityTitle, { color: dynamic.textPrimary }]}>{activity.title}</Text>
                        <Text style={[styles.activityTime, { color: dynamic.textMuted }]}>{formatTimeAgo(activity.timestamp)}</Text>
                      </View>
                      <Text style={[styles.activityDescription, { color: dynamic.textSecondary }]}>{activity.description}</Text>
                    </View>
                  </View>
                ))}
                {renderPagination()}
              </>
            ) : (
              <View style={styles.emptyActivity}>
                <Feather name="activity" size={32} color={dynamic.textMuted} />
                <Text style={[styles.emptyActivityText, { color: dynamic.textMuted }]}>No recent activity</Text>
              </View>
            )}
          </View>
        </View>

        {/* Upcoming Events & Announcements */}
        <View style={[styles.column, styles.upcomingColumn]}>
          <View style={[styles.upcomingCard, {
            backgroundColor: dynamic.cardBg,
            borderColor: dynamic.borderColor,
            shadowColor: isDark ? '#000' : '#000',
            shadowOpacity: isDark ? 0.3 : 0.05,
          }]}>
            <View style={styles.upcomingHeader}>
              <Text style={[styles.upcomingTitle, { color: dynamic.textPrimary }]}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => navigateTo('events')}>
                <Text style={[styles.viewAllText, { color: colors.accent.primary }]}>View all</Text>
              </TouchableOpacity>
            </View>

            {eventsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent.primary} />
                <Text style={[styles.loadingText, { color: dynamic.textSecondary }]}>Loading events...</Text>
              </View>
            ) : upcomingEvents.length > 0 ? (
              <View style={styles.upcomingList}>
                {upcomingEvents.map((event) => {
                  const eventDate = event.date;
                  const day = eventDate.getDate().toString().padStart(2, '0');
                  const month = eventDate.toLocaleString('default', { month: 'long' }).toUpperCase();
                  const timeString = event.time || eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <TouchableOpacity key={event.id} style={styles.upcomingItem} onPress={() => navigateTo('events', event.id)}>
                      <View style={[styles.eventDate, {
                        backgroundColor: isDark ? '#334155' : '#f8fafc',
                        borderColor: isDark ? '#475569' : '#e2e8f0'
                      }]}>
                        <Text style={[styles.eventDay, { color: dynamic.textPrimary }]}>{day}</Text>
                        <Text style={[styles.eventMonth, { color: dynamic.textSecondary }]}>{month}</Text>
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={[styles.eventName, { color: dynamic.textPrimary }]} numberOfLines={1}>{event.title}</Text>
                        <Text style={[styles.eventTime, { color: dynamic.textSecondary }]} numberOfLines={1}>
                          {timeString} • {event.location || 'TBA'}
                        </Text>
                        {event.attendees && (
                          <Text style={[styles.eventAttendees, { color: '#10b981' }]}>{event.attendees.length} attending</Text>
                        )}
                      </View>
                      <TouchableOpacity style={[styles.eventAction, {
                        backgroundColor: isDark ? '#334155' : '#f8fafc',
                        borderColor: isDark ? '#475569' : '#e2e8f0'
                      }]}>
                        <Feather name="chevron-right" size={20} color={dynamic.textMuted} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="calendar" size={32} color={dynamic.textMuted} />
                <Text style={[styles.emptyText, { color: dynamic.textMuted }]}>No upcoming events</Text>
                <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.accent.primary }]} onPress={() => navigateTo('events')}>
                  <Text style={styles.createButtonText}>Create Event</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Recent Announcements */}
          <View style={[styles.announcementCard, {
            backgroundColor: dynamic.cardBg,
            borderColor: dynamic.borderColor,
            shadowColor: isDark ? '#000' : '#000',
            shadowOpacity: isDark ? 0.3 : 0.05,
          }]}>
            <View style={styles.announcementHeader}>
              <Text style={[styles.announcementTitle, { color: dynamic.textPrimary }]}>Recent Announcements</Text>
              <TouchableOpacity onPress={() => navigateTo('announcements')}>
                <Text style={[styles.viewAllText, { color: colors.accent.primary }]}>View all</Text>
              </TouchableOpacity>
            </View>

            {announcementsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent.primary} />
                <Text style={[styles.loadingText, { color: dynamic.textSecondary }]}>Loading announcements...</Text>
              </View>
            ) : recentAnnouncements.length > 0 ? (
              <View style={styles.announcementList}>
                {recentAnnouncements.map((announcement) => {
                  const timeAgo = formatTimeAgo(announcement.createdAt);
                  const priorityColor = announcement.priority === 'high' ? '#ef4444' : announcement.priority === 'medium' ? '#f59e0b' : '#10b981';

                  return (
                    <TouchableOpacity key={announcement.id} style={[styles.announcementItem, { borderBottomColor: dynamic.borderColor }]} onPress={() => navigateTo('announcements', announcement.id)}>
                      <View style={[styles.announcementBadge, { backgroundColor: `${priorityColor}${isDark ? '30' : '20'}` }]}>
                        <FontAwesome6 name="bullhorn" size={12} color={priorityColor} />
                      </View>
                      <View style={styles.announcementContent}>
                        <Text style={[styles.announcementText, { color: dynamic.textPrimary }]} numberOfLines={1}>{announcement.title}</Text>
                        <Text style={[styles.announcementTime, { color: dynamic.textMuted }]}>{timeAgo} • {announcement.author}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Feather name="bell" size={32} color={dynamic.textMuted} />
                <Text style={[styles.emptyText, { color: dynamic.textMuted }]}>No announcements yet</Text>
                <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.accent.primary }]} onPress={() => navigateTo('announcements')}>
                  <Text style={styles.createButtonText}>Create Announcement</Text>
                </TouchableOpacity>
              </View>
            )}
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentArea}>
        {renderContent()}
      </View>
    </View>
  );
}

