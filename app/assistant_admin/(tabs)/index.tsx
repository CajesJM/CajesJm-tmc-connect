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
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  PanResponder,
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
import { useTheme } from '../../../context/ThemeContext';
import { db } from '../../../lib/firebaseConfig';
import { styles } from '../../../styles/assistant-admin/dashboardStyles';
import { Notification, notificationService } from '../../../utils/notifications';
import { generateDashboardPDF, sharePDF } from '../../../utils/pdfGenerator';

// Types (unchanged)
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

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1500, color = '#ffffff' }: { value: number; duration?: number; color?: string }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: value,
      duration: duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.floor(value));
    });

    return () => animatedValue.removeListener(listener);
  }, [value]);

  return (
    <Text style={[styles.counterText, { color }]}>{displayValue}</Text>
  );
};

// Interactive Stat Card Component
const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
  delay = 0,
  onPress
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  subtitle?: string;
  trend?: number;
  delay?: number;
  onPress?: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Subtle pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.statCard,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[color + '20', color + '05'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCardGradient}
        >
          <View style={styles.statCardHeader}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '30' }]}>
              <Feather name={icon as any} size={20} color={color} />
            </View>
            {trend !== undefined && (
              <View style={[styles.trendBadge, { backgroundColor: trend >= 0 ? '#10b98120' : '#ef444420' }]}>
                <Feather
                  name={trend >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={trend >= 0 ? '#10b981' : '#ef4444'}
                />
                <Text style={[styles.trendText, { color: trend >= 0 ? '#10b981' : '#ef4444' }]}>
                  {Math.abs(trend)}%
                </Text>
              </View>
            )}
          </View>
          <AnimatedCounter value={value} color="#ffffff" />
          <Text style={styles.statLabel}>{title}</Text>
          {subtitle && <Text style={styles.statSubtext}>{subtitle}</Text>}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Interactive Chart Component with Gestures - FIXED FOR MOBILE
const InteractiveChart = ({
  monthlyStats,
  colors,
  isDark,
  chartWidth
}: {
  monthlyStats: MonthlyStats[];
  colors: any;
  isDark: boolean;
  chartWidth: number;
}) => {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const chartScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(chartScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX } = evt.nativeEvent;
        const chartAreaWidth = Math.max(chartWidth, 350);
        const dataPointWidth = chartAreaWidth / monthlyStats.length;
        const index = Math.min(
          Math.max(Math.floor(locationX / dataPointWidth), 0),
          monthlyStats.length - 1
        );
        setTooltipIndex(index);
        setTooltipPosition({ x: locationX, y: 50 });
      },
      onPanResponderMove: (evt) => {
        const { locationX } = evt.nativeEvent;
        const chartAreaWidth = Math.max(chartWidth, 350);
        const dataPointWidth = chartAreaWidth / monthlyStats.length;
        const index = Math.min(
          Math.max(Math.floor(locationX / dataPointWidth), 0),
          monthlyStats.length - 1
        );
        setTooltipIndex(index);
        setTooltipPosition({ x: locationX, y: 50 });
      },
      onPanResponderRelease: () => {
        setTimeout(() => setTooltipIndex(null), 3000);
      },
    })
  ).current;

  // FIXED: Explicit colors for mobile compatibility
  const chartData = {
    labels: monthlyStats.map(s => s.month),
    datasets: [
      {
        data: monthlyStats.map(s => s.events),
        color: (opacity = 1) => selectedDataset === 'attendance'
          ? `rgba(59, 130, 246, ${opacity * 0.3})`  // Blue with reduced opacity when filtered
          : `rgba(59, 130, 246, ${opacity})`,        // Solid blue
        strokeWidth: selectedDataset === 'attendance' ? 2 : 4,
      },
      {
        data: monthlyStats.map(s => s.attendance),
        color: (opacity = 1) => selectedDataset === 'events'
          ? `rgba(16, 185, 129, ${opacity * 0.3})`  // Green with reduced opacity when filtered
          : `rgba(16, 185, 129, ${opacity})`,        // Solid green
        strokeWidth: selectedDataset === 'events' ? 2 : 4,
      },
    ],
  };

  const totalEvents = monthlyStats.reduce((sum, s) => sum + s.events, 0);
  const totalAttendance = monthlyStats.reduce((sum, s) => sum + s.attendance, 0);

  // FIXED: Ensure colors work on mobile by using explicit hex values
  const getBackgroundColor = () => isDark ? '#1e293b' : '#ffffff';
  const getSecondaryBackgroundColor = () => isDark ? '#0f172a' : '#f8fafc';

  // FIXED: Label colors with full opacity for mobile visibility
  const labelColor = isDark ? '#94a3b8' : '#475569';  // slate-400 / slate-600
  const gridColor = isDark ? '#334155' : '#e2e8f0';   // slate-700 / slate-200

  return (
    <Animated.View
      style={[
        styles.chartContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.chartGradient,
          {
            backgroundColor: getBackgroundColor(),
            borderRadius: 24,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
          }
        ]}
      >
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
              Analytics Overview
            </Text>
            <Text style={[styles.chartSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Interactive chart • Tap to filter • Drag to explore
            </Text>
          </View>
        </View>

        {/* Interactive Legend */}
        <View style={styles.legendContainer}>
          <TouchableOpacity
            style={[
              styles.legendButton,
              selectedDataset === 'events' && styles.legendButtonActive,
              {
                borderColor: '#3b82f6',
                backgroundColor: selectedDataset === 'events' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
              },
            ]}
            onPress={() => setSelectedDataset(selectedDataset === 'events' ? null : 'events')}
            activeOpacity={0.8}
          >
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.legendText, { color: isDark ? '#ffffff' : '#1e293b' }]}>
              Events
            </Text>
            <View style={[styles.legendValue, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <Text style={[styles.legendValueText, { color: '#3b82f6' }]}>
                {totalEvents}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.legendButton,
              selectedDataset === 'attendance' && styles.legendButtonActive,
              {
                borderColor: '#10b981',
                backgroundColor: selectedDataset === 'attendance' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
              },
            ]}
            onPress={() => setSelectedDataset(selectedDataset === 'attendance' ? null : 'attendance')}
            activeOpacity={0.8}
          >
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.legendText, { color: isDark ? '#ffffff' : '#1e293b' }]}>
              Attendance
            </Text>
            <View style={[styles.legendValue, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Text style={[styles.legendValueText, { color: '#10b981' }]}>
                {totalAttendance}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Chart with Gesture Handling */}
        <View style={styles.chartWrapper} {...panResponder.panHandlers}>
          <Animated.View style={{ transform: [{ scale: chartScale }] }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            >
              <LineChart
                data={chartData}
                width={Math.max(chartWidth, 350)}
                height={220}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  // FIXED: Use explicit color values instead of opacity-based rgba
                  color: (opacity = 1) => isDark ? '#ffffff' : '#1e293b',
                  labelColor: (opacity = 1) => labelColor,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: tooltipIndex !== null ? '8' : '6',
                    strokeWidth: '3',
                    stroke: isDark ? '#1e293b' : '#ffffff',
                  },
                  propsForBackgroundLines: {
                    stroke: gridColor,
                    strokeWidth: 1,
                    strokeDasharray: '5, 5',
                  },
                  // FIXED: Explicit line colors for mobile
                  propsForLabels: {
                    fontSize: 12,
                    fontWeight: '500',
                  },
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
              // onDataPointClick might not work on all mobile versions, use panResponder instead
              />
            </ScrollView>
          </Animated.View>

          {/* Custom Tooltip */}
          {tooltipIndex !== null && (
            <Animated.View
              style={[
                styles.tooltip,
                {
                  left: Math.min(Math.max(tooltipPosition.x - 60, 10), chartWidth - 130),
                  top: tooltipPosition.y - 80,
                },
              ]}
            >
              <View
                style={[
                  styles.tooltipGradient,
                  {
                    backgroundColor: '#3b82f6',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 12,
                    alignItems: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 10,
                  }
                ]}
              >
                <Text style={[styles.tooltipMonth, { color: '#ffffff', fontWeight: '700' }]}>
                  {monthlyStats[tooltipIndex]?.month}
                </Text>
                <Text style={[styles.tooltipValue, { color: '#ffffff', opacity: 0.9 }]}>
                  Events: {monthlyStats[tooltipIndex]?.events}
                </Text>
                <Text style={[styles.tooltipValue, { color: '#ffffff', opacity: 0.9 }]}>
                  Attendance: {monthlyStats[tooltipIndex]?.attendance}
                </Text>
              </View>
              <View style={[styles.tooltipArrow, { borderTopColor: '#3b82f6' }]} />
            </Animated.View>
          )}
        </View>

        <View style={styles.chartFooter}>
          <Text style={[styles.axisLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>
            ← Drag to explore data →
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};
// Animated Activity Item
const ActivityItem = ({ activity, index, isLast }: { activity: Activity; index: number; isLast: boolean }) => {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [index]);

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'event': return <Ionicons name="calendar" size={18} color={activity.color} />;
      case 'attendance': return <Feather name="check-square" size={18} color={activity.color} />;
      case 'announcement': return <Feather name="bell" size={18} color={activity.color} />;
      case 'user': return <Feather name="user-plus" size={18} color={activity.color} />;
      default: return <Feather name="activity" size={18} color={activity.color} />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        styles.activityItem,
        !isLast && styles.activityItemBorder,
        {
          opacity: opacityAnim,
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <View style={[styles.activityIconContainer, { backgroundColor: activity.color + '15' }]}>
        {getActivityIcon()}
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: '#ffffff' }]}>{activity.title}</Text>
          <Text style={styles.activityTime}>{formatTimeAgo(activity.timestamp)}</Text>
        </View>
        <Text style={[styles.activityDescription, { color: '#94a3b8' }]}>
          {activity.description}
        </Text>
      </View>
      <View style={[styles.activityIndicator, { backgroundColor: activity.color }]} />
    </Animated.View>
  );
};

// Quick Action Button with Animation
const QuickActionButton = ({
  title,
  icon,
  colors,
  onPress,
  delay = 0
}: {
  title: string;
  icon: string;
  colors: readonly [string, string];
  onPress: () => void;
  delay?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.quickActionCard,
          {
            transform: [{ scale: scaleAnim }, { rotate }],
          },
        ]}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionGradient}
        >
          <View style={styles.quickActionIconContainer}>
            <Feather name={icon as any} size={24} color="#ffffff" />
          </View>
          <Text style={styles.quickActionText}>{title}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function AssistantAdminDashboard() {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { userData } = useAuth();

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const chartWidth = React.useMemo(() => {
    const base = isMobile ? width - 64 : isTablet ? width / 2 - 48 : width - 400;
    return Math.max(base, 300);
  }, [width, isMobile, isTablet]);

  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  // State
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
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Header animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Data fetching functions (same as before)
  const fetchDashboardStats = async () => {
    try {
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

      const allEventsSnap = await getDocs(collection(db, 'events'));
      const now = new Date();
      let upcomingApproved = 0;
      let totalAttendance = 0;

      allEventsSnap.docs.forEach(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate();
        const status = data.status;
        const isApproved = status === 'approved' || status === undefined;
        if (isApproved && eventDate && eventDate > now) {
          upcomingApproved++;
        }
        const attendees = data.attendees;
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
    }
  };

  const fetchUpcomingEvents = () => {
    setEventsLoading(true);
    const now = new Date();
    const eventsQuery = query(collection(db, 'events'), orderBy('date', 'asc'));

    return onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const eventDate = data.date?.toDate();
          const status = data.status;
          const isApproved = status === 'approved' || status === undefined;
          if (isApproved && eventDate && eventDate >= now) {
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
    const announcementsQuery = query(collection(db, 'updates'), orderBy('createdAt', 'desc'));

    return onSnapshot(announcementsQuery, (snapshot) => {
      const announcements = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const status = data.status;
          const isApproved = status === 'approved' || status === undefined;
          if (isApproved) {
            return {
              id: doc.id,
              title: data.title || 'Announcement',
              content: data.content || data.message || 'No content',
              createdAt: data.createdAt?.toDate() || new Date(),
              priority: data.priority || 'medium',
              author: data.author || 'Admin'
            };
          }
          return null;
        })
        .filter(ann => ann !== null)
        .slice(0, 3);
      setRecentAnnouncements(announcements as Announcement[]);
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
        color: '#3b82f6',
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
      const announcementsSnap = await getDocs(collection(db, 'updates'));

      const eventsByMonth: { [key: string]: number } = {};
      const attendanceByMonth: { [key: string]: number } = {};
      const announcementsByMonth: { [key: string]: number } = {};

      eventsSnap.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status;
        const isApproved = status === 'approved' || status === undefined;
        if (isApproved) {
          const eventDate = data.date?.toDate();
          if (eventDate && eventDate >= sixMonthsAgo) {
            const monthKey = eventDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            eventsByMonth[monthKey] = (eventsByMonth[monthKey] || 0) + 1;
            const attendees = data.attendees?.length || 0;
            attendanceByMonth[monthKey] = (attendanceByMonth[monthKey] || 0) + attendees;
          }
        }
      });

      announcementsSnap.docs.forEach(doc => {
        const data = doc.data();
        const status = data.status;
        const isApproved = status === 'approved' || status === undefined;
        if (isApproved) {
          const createdAt = data.createdAt?.toDate();
          if (createdAt && createdAt >= sixMonthsAgo) {
            const monthKey = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
            announcementsByMonth[monthKey] = (announcementsByMonth[monthKey] || 0) + 1;
          }
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

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const headerOpacity = headerAnim;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6', '#10b981']}
          />
        }
      >
        {/* Animated Header */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={isDark ? ['#1e40af', '#3b82f6', '#1e3a8a'] : ['#2563eb', '#3b82f6', '#60a5fa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.greetingContainer}>
                  <Text style={styles.greetingLabel}>Welcome back,</Text>
                  <Text style={styles.userName}>{userData?.name || 'Assistant'}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>Assistant Admin</Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => setNotificationModalVisible(true)}
                >
                  <View style={styles.iconButtonInner}>
                    <Feather name="bell" size={20} color="#ffffff" />
                    {unreadCount > 0 && (
                      <View style={styles.notificationBadge}>
                        <Text style={styles.notificationBadgeText}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleDownloadReport}
                  disabled={downloadLoading}
                >
                  <View style={styles.iconButtonInner}>
                    {downloadLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Feather name="download" size={20} color="#ffffff" />
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={handleProfileImagePress}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : userData?.photoURL ? (
                    <Image source={{ uri: userData.photoURL }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profileFallback}>
                      <Text style={styles.profileInitials}>
                        {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dateContainer}>
              <Feather name="calendar" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Interactive Chart */}
        {monthlyStats.length > 0 && (
          <InteractiveChart
            monthlyStats={monthlyStats}
            colors={colors}
            isDark={isDark}
            chartWidth={chartWidth}
          />
        )}
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              title="Announcement"
              icon="mic"
              colors={['#f59e0b', '#d97706'] as const}
              onPress={() => navigateTo('announcements')}
              delay={0}
            />
            <QuickActionButton
              title="New Event"
              icon="plus-circle"
              colors={['#3b82f6', '#2563eb'] as const}
              onPress={() => navigateTo('events')}
              delay={100}
            />
            <QuickActionButton
              title="QR Check-in"
              icon="maximize"
              colors={['#10b981', '#059669'] as const}
              onPress={() => navigateTo('attendance')}
              delay={200}
            />
          </View>
        </View>

        {/* Two Column Layout */}
        <View style={styles.twoColumnLayout}>
          {/* Recent Activity */}
          <View style={styles.column}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
              {activitiesLoading && <ActivityIndicator size="small" color="#3b82f6" />}
            </View>
            <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              {displayedActivities.length > 0 ? (
                <>
                  {displayedActivities.map((activity, index) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      index={index}
                      isLast={index === displayedActivities.length - 1}
                    />
                  ))}
                  {totalPages > 1 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity
                        style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                        onPress={handlePrevPage}
                        disabled={currentPage === 1}
                      >
                        <Feather
                          name="chevron-left"
                          size={18}
                          color={currentPage === 1 ? '#64748b' : '#3b82f6'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.paginationText}>
                        {currentPage} / {totalPages}
                      </Text>
                      <TouchableOpacity
                        style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                        onPress={handleNextPage}
                        disabled={currentPage === totalPages}
                      >
                        <Feather
                          name="chevron-right"
                          size={18}
                          color={currentPage === totalPages ? '#64748b' : '#3b82f6'}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="activity" size={40} color="#64748b" />
                  <Text style={styles.emptyStateText}>No recent activity</Text>
                </View>
              )}
            </View>
          </View>

          {/* Upcoming & Announcements */}
          <View style={styles.column}>
            {/* Upcoming Events */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
              <TouchableOpacity onPress={() => navigateTo('events')}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              {eventsLoading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventItem,
                      index !== upcomingEvents.length - 1 && styles.eventItemBorder,
                    ]}
                    onPress={() => navigateTo('events', event.id)}
                  >
                    <View style={styles.eventDateBox}>
                      <Text style={styles.eventDay}>
                        {event.date.getDate().toString().padStart(2, '0')}
                      </Text>
                      <Text style={styles.eventMonth}>
                        {event.date.toLocaleString('default', { month: 'short' }).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.eventMeta}>
                        {event.time || event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location || 'TBA'}
                      </Text>
                      <Text style={styles.eventAttendees}>
                        {event.attendees?.length || 0} attending
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#64748b" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="calendar" size={40} color="#64748b" />
                  <Text style={styles.emptyStateText}>No upcoming events</Text>
                </View>
              )}
            </View>

            {/* Recent Announcements */}
            <View style={[styles.sectionHeader, styles.announcementHeader]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Announcements</Text>
              <TouchableOpacity onPress={() => navigateTo('announcements')}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              {announcementsLoading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
              ) : recentAnnouncements.length > 0 ? (
                recentAnnouncements.map((announcement, index) => {
                  const priorityColor = announcement.priority === 'high'
                    ? '#ef4444'
                    : announcement.priority === 'medium'
                      ? '#f59e0b'
                      : '#10b981';
                  return (
                    <TouchableOpacity
                      key={announcement.id}
                      style={[
                        styles.announcementItem,
                        index !== recentAnnouncements.length - 1 && styles.announcementItemBorder,
                      ]}
                      onPress={() => navigateTo('announcements', announcement.id)}
                    >
                      <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                        <FontAwesome6
                          name="bullhorn"
                          size={12}
                          color={priorityColor}
                        />
                      </View>
                      <View style={styles.announcementInfo}>
                        <Text style={[styles.announcementTitle, { color: colors.text }]} numberOfLines={1}>
                          {announcement.title}
                        </Text>
                        <Text style={styles.announcementMeta}>
                          {new Date(announcement.createdAt).toLocaleDateString()} • {announcement.author}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Feather name="bell" size={40} color="#64748b" />
                  <Text style={styles.emptyStateText}>No announcements</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
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
    </View>
  );
}