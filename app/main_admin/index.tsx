import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { collection, doc, getDocs, limit, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { PieChart } from 'react-native-gifted-charts';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { AnimatedStatCard } from '../../components/AnimatedStatCard';
import { NotificationModal } from '../../components/NotificationModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../lib/firebaseConfig';
import { createDashboardStyles } from '../../styles/main-admin/dashboardStyles';
import { Notification, notificationService } from '../../utils/notifications';
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
  };
  isDark: boolean;
  styles: any;
}

interface AnimatedBarProps {
  height: number;
  color: string;
  value: number;
  maxHeight?: number;
}
const Sparkline = ({ data, color, width = 80, height = 40 }: {
  data: number[]; color: string; width?: number; height?: number;
}) => {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth="2" />
      <Line x1="0" y1={height - 0.5} x2={width} y2={height - 0.5}
        stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
    </Svg>
  );
};
const AnimatedActivityItem = memo(function AnimatedActivityItem({
  activity,
  index,
  styles,
  dynamic,
  isDark,
  getActivityIcon,
  formatTimeAgo,
  isLast,
}: {
  activity: Activity;
  index: number;
  styles: any;
  dynamic: any;
  isDark: boolean;
  getActivityIcon: (activity: Activity) => React.ReactNode;
  formatTimeAgo: (date: Date) => string;
  isLast: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={[
        styles.activityItem,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          borderBottomColor: dynamic.borderColor,
        },
        isLast && { borderBottomWidth: 0 },
      ]}
    >
      <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
        {getActivityIcon(activity)}
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, { color: dynamic.textPrimary }]}>
          {activity.title}
        </Text>
        <Text style={[styles.activityDescription, { color: dynamic.textSecondary }]}>
          {activity.description}
        </Text>
      </View>
      <Text style={[styles.activityTime, { color: dynamic.textMuted }]}>
        {formatTimeAgo(activity.timestamp)}
      </Text>
    </Animated.View>
  );
});

const AnalyticsLineChart = memo(function AnalyticsLineChart({
  monthlyStats,
  chartWidth,
  isDark,
  dynamic,
  styles,
  chartFadeAnim,
  chartContainerRef,
  panResponder,
  calculateGrowth,
  dashboardTotalEvents,
}: {
  monthlyStats: MonthlyStats[];
  chartWidth: number;
  isDark: boolean;
  dynamic: any;
  styles: any;
  chartFadeAnim: Animated.Value;
  chartContainerRef: React.RefObject<View | null>;
  panResponder: any;
  calculateGrowth: (data: MonthlyStats[], key: 'events' | 'attendance') => number;
  dashboardTotalEvents: number;
}) {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean; x: number; y: number; index: number;
    month: string; events: number; attendance: number;
  }>({ visible: false, x: 0, y: 0, index: -1, month: '', events: 0, attendance: 0 });

  const eventSparklineData = monthlyStats.map(stat => stat.events);

  return (
    <Animated.View style={{ opacity: chartFadeAnim, flex: 1 }}>
      <View style={[styles.chartsContainer, {
        backgroundColor: dynamic.cardBg,
        shadowColor: isDark ? '#000' : '#0ea5e9',
        marginHorizontal: 0,
        flex: 1,
      }]}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartsTitle, { color: dynamic.textPrimary }]}>
              Analytics Overview
            </Text>
            <Text style={[styles.chartsSubtitle, { color: dynamic.textSecondary }]}>
              Last 6 months activity
            </Text>
          </View>

          <View style={styles.chartLegend}>
            <TouchableOpacity
              style={[
                styles.legendItem,
                styles.legendButton,
                {
                  backgroundColor: dynamic.cardBg,
                  borderColor: selectedDataset === 'events' ? '#0ea5e9' : dynamic.borderColor,
                },
                selectedDataset === 'events' && {
                  backgroundColor: isDark ? '#0ea5e920' : '#f0f9ff',
                },
              ]}
              onPress={() => setSelectedDataset(selectedDataset === 'events' ? null : 'events')}
            >
              <View style={[styles.legendDot, { backgroundColor: '#0ea5e9' }]} />
              <Text style={[styles.legendText, { color: selectedDataset === 'events' ? '#0ea5e9' : dynamic.textSecondary }]}>
                Events
              </Text>
              <View style={[styles.legendValue, { backgroundColor: isDark ? '#0ea5e920' : '#0ea5e915' }]}>
                <Text style={[styles.legendValueText, { color: '#0ea5e9' }]}>
                  {monthlyStats.reduce((s, m) => s + m.events, 0)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.legendItem,
                styles.legendButton,
                {
                  backgroundColor: dynamic.cardBg,
                  borderColor: selectedDataset === 'attendance' ? '#a855f7' : dynamic.borderColor,
                },
                selectedDataset === 'attendance' && {
                  backgroundColor: isDark ? '#a855f720' : '#faf5ff',
                },
              ]}
              onPress={() => setSelectedDataset(selectedDataset === 'attendance' ? null : 'attendance')}
            >
              <View style={[styles.legendDot, { backgroundColor: '#a855f7' }]} />
              <Text style={[styles.legendText, { color: selectedDataset === 'attendance' ? '#a855f7' : dynamic.textSecondary }]}>
                Attendance
              </Text>
              <View style={[styles.legendValue, { backgroundColor: isDark ? '#a855f720' : '#a855f715' }]}>
                <Text style={[styles.legendValueText, { color: '#a855f7' }]}>
                  {monthlyStats.reduce((s, m) => s + m.attendance, 0)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {monthlyStats.length > 0 && (
          <>
            <View
              ref={chartContainerRef}
              style={styles.chartWrapper}
              {...(Platform.OS === 'web' ? ({
                onMouseMove: (e: React.MouseEvent) => {
                  if (!monthlyStats.length) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touchX = e.clientX - rect.left;
                  const touchY = e.clientY - rect.top;
                  if (touchX < 0 || touchX > rect.width) return;
                  const step = rect.width / monthlyStats.length;
                  const index = Math.min(monthlyStats.length - 1, Math.max(0, Math.floor(touchX / step)));
                  setTooltip({
                    visible: true,
                    x: touchX,
                    y: touchY,
                    index,
                    month: monthlyStats[index].month,
                    events: monthlyStats[index].events,
                    attendance: monthlyStats[index].attendance,
                  });
                },
                onMouseLeave: () => setTooltip((prev) => ({ ...prev, visible: false })),
              } as any) : {})}
              {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
            >
              <LinearGradient
                colors={dynamic.chartBackground}
                style={styles.chartBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <LineChart
                  data={{
                    labels: monthlyStats.map(s => s.month.slice(0, 3)),
                    datasets: [
                      {
                        data: monthlyStats.map(s => s.events),
                        color: (opacity = 1) =>
                          selectedDataset === 'attendance'
                            ? `rgba(14,165,233,${opacity * 0.5})`
                            : `rgba(14,165,233,${opacity})`,
                        strokeWidth: 3,
                      },
                      {
                        data: monthlyStats.map(s => s.attendance),
                        color: (opacity = 1) =>
                          selectedDataset === 'events'
                            ? `rgba(168,85,247,${opacity * 0.5})`
                            : `rgba(168,85,247,${opacity})`,
                        strokeWidth: 3,
                      },
                    ],
                  }}
                  width={Math.min(monthlyStats.length * 135, 800)}
                  height={240}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: 'transparent',
                    backgroundGradientTo: 'transparent',
                    decimalPlaces: 0,
                    color: (opacity = 1) =>
                      isDark ? `rgba(255,255,255,${opacity})` : `rgba(15,23,42,${opacity})`,
                    labelColor: (opacity = 1) =>
                      isDark ? `rgba(148,163,184,${opacity})` : `rgba(100,116,139,${opacity})`,
                    style: { borderRadius: 14 },
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                      stroke: isDark ? '#1e293b' : '#ffffff',
                    },
                    propsForBackgroundLines: {
                      stroke: isDark ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.7)',
                      strokeWidth: 1,
                      strokeDasharray: '4,4',
                    },
                    propsForLabels: { fontSize: 11, fontWeight: '600' },
                    fillShadowGradientFrom: '#0ea5e9',
                    fillShadowGradientFromOpacity: 0.25,
                    fillShadowGradientTo: '#0ea5e9',
                    fillShadowGradientToOpacity: 0.02,
                    useShadowColorFromDataset: true,
                  }}
                  bezier
                  style={styles.chart}
                  withInnerLines
                  withOuterLines={false}
                  fromZero
                  segments={4}
                  withShadow
                  getDotColor={(_, index) => index % 2 === 0 ? '#0ea5e9' : '#a855f7'}
                />
              </ScrollView>

              <View style={styles.axisLabelContainer}>
                <Text style={[styles.axisLabel, { color: dynamic.textMuted }]}>
                  Timeline · Last 6 Months
                </Text>
              </View>

              {tooltip.visible && (
                <Animated.View
                  style={[
                    styles.tooltipContainer,
                    {
                      position: 'absolute',
                      left: tooltip.x - 60,
                      top: tooltip.y - 70,
                      backgroundColor: dynamic.cardBg,
                      borderColor: dynamic.borderColor,
                      shadowColor: '#000',
                    },
                  ]}
                >
                  <Text style={[styles.tooltipMonth, { color: dynamic.textPrimary }]}>
                    {tooltip.month}
                  </Text>
                  <View style={styles.tooltipRow}>
                    <View style={[styles.tooltipDot, { backgroundColor: '#0ea5e9' }]} />
                    <Text style={[styles.tooltipText, { color: dynamic.textSecondary }]}>
                      Events: {tooltip.events}
                    </Text>
                  </View>
                  <View style={styles.tooltipRow}>
                    <View style={[styles.tooltipDot, { backgroundColor: '#a855f7' }]} />
                    <Text style={[styles.tooltipText, { color: dynamic.textSecondary }]}>
                      Attendance: {tooltip.attendance}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>
          </>
        )}

        <View style={styles.chartSummary}>
          <TouchableOpacity style={[styles.summaryCard, styles.summaryCardBlue]} activeOpacity={0.8}>
            <View style={styles.summaryLeft}>
              <Text style={[styles.summaryLabel, { color: dynamic.textSecondary }]}>Total Events</Text>
              <Text style={[styles.summaryValue, { color: '#0ea5e9' }]}>{dashboardTotalEvents}</Text>
              <View style={styles.summaryTrend}>
                <Feather name="trending-up" size={12} color="#0ea5e9" />
                <Text style={[styles.summaryTrendText, { color: '#0ea5e9' }]}>
                  +{calculateGrowth(monthlyStats, 'events')}%
                </Text>
              </View>
            </View>
            <View style={styles.summaryRight1}>
              <Sparkline data={eventSparklineData} color="#0ea5e9" width={80} height={40} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.summaryCard, styles.summaryCardGreen]} activeOpacity={0.8}>
            <View style={styles.summaryLeft}>
              <Text style={[styles.summaryLabel, { color: dynamic.textSecondary }]}>Peak Month</Text>
              <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                {monthlyStats.length > 0
                  ? monthlyStats.reduce((mx, s) => s.attendance > mx.attendance ? s : mx, monthlyStats[0]).month
                  : '–'}
              </Text>
              <Text style={[styles.summarySub, { color: dynamic.textMuted }]}>Highest attendance</Text>
            </View>
            <View style={styles.summaryRight}>
              <Ionicons name="trophy" size={28} color="#10b981" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.summaryCard, styles.summaryCardPurple]} activeOpacity={0.8}>
            <View style={styles.summaryLeft}>
              <Text style={[styles.summaryLabel, { color: dynamic.textSecondary }]}>Attendance Δ</Text>
              <Text style={[styles.summaryValue, { color: '#8b5cf6' }]}>
                {calculateGrowth(monthlyStats, 'attendance') > 0 ? '+' : ''}
                {calculateGrowth(monthlyStats, 'attendance')}%
              </Text>
              <View style={styles.summaryTrend}>
                <Feather
                  name={calculateGrowth(monthlyStats, 'attendance') >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={calculateGrowth(monthlyStats, 'attendance') >= 0 ? '#8b5cf6' : '#ef4444'}
                />
                <Text style={[styles.summaryTrendText, {
                  color: calculateGrowth(monthlyStats, 'attendance') >= 0 ? '#8b5cf6' : '#ef4444'
                }]}>
                  vs last 6 months
                </Text>
              </View>
            </View>
            <View style={styles.summaryRight}>
              <Ionicons name="stats-chart" size={28} color="#8b5cf6" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
});

const MonthlyActivityChart = memo(function MonthlyActivityChart({
  yearlyStats = [],
  dynamic,
  colors,
  isDark,
  styles,
}: {
  yearlyStats?: MonthlyStats[];
  dynamic: any;
  colors: any;
  isDark: boolean;
  styles: any;
}) {
  if (!Array.isArray(yearlyStats) || yearlyStats.length === 0) {
    return (
      <View style={[styles.customBarChartContainer, { backgroundColor: dynamic.cardBg, borderColor: dynamic.borderColor }]}>
        <Text style={{ color: dynamic.textSecondary, textAlign: 'center', padding: 20 }}>
          No monthly activity data available
        </Text>
      </View>
    );
  }

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const barRefs = useRef<(View | null)[]>([]);
  const chartContainerRef = useRef<View>(null);

  const [animatedValues] = useState(() =>
    yearlyStats.map(() => ({
      events: new Animated.Value(0),
      attendance: new Animated.Value(0),
    }))
  );

  useEffect(() => {
    yearlyStats.forEach((stat, index) => {
      const maxValue = Math.max(...yearlyStats.flatMap(s => [s.events, s.attendance])) || 1;
      const maxBarHeight = 140;
      const eventsHeight = (stat.events / maxValue) * maxBarHeight;
      const attendanceHeight = (stat.attendance / maxValue) * maxBarHeight;

      Animated.parallel([
        Animated.timing(animatedValues[index].events, {
          toValue: eventsHeight,
          duration: 900,
          delay: 80,
          useNativeDriver: false,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(animatedValues[index].attendance, {
          toValue: attendanceHeight,
          duration: 900,
          delay: 80,
          useNativeDriver: false,
          easing: Easing.out(Easing.exp),
        }),
      ]).start();
    });
  }, [yearlyStats]);

  const maxValue = Math.max(...yearlyStats.flatMap(s => [s.events, s.attendance])) || 1;
  const maxBarHeight = 140;

  const handleBarHover = (index: number) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);

    if (barRefs.current[index] && chartContainerRef.current) {
      barRefs.current[index]?.measure((barX, barY, barWidth, barHeight, barPageX, barPageY) => {
        chartContainerRef.current?.measure((containerX, containerY, containerWidth, containerHeight, containerPageX, containerPageY) => {
          // Calculate relative position inside the chart container
          const relativeLeft = barPageX - containerPageX + barWidth / 2;
          const relativeTop = barPageY - containerPageY - 10; // 10px above bar
          setTooltipPosition({ left: relativeLeft, top: relativeTop });
        });
      });
    }
    setHoveredIndex(index);
  };

  const handleBarLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredIndex(null);
    }, 100);
    setHoverTimeout(timeout);
  };

  return (
    <View
      ref={chartContainerRef}
      style={[
        styles.customBarChartContainer,
        {
          backgroundColor: dynamic.cardBg,
          borderColor: dynamic.borderColor,
          height: '100%',
          position: 'relative',   // Required for absolute positioning
          overflow: 'visible',    // Prevent clipping
        },
      ]}
    >
      <View style={styles.customBarChartHeader}>
        <View style={styles.customBarChartHeaderLeft}>
          <Ionicons name="bar-chart" size={18} color={colors.accent.primary} />
          <Text style={[styles.customBarChartTitle, { color: dynamic.textPrimary }]}>
            Monthly Activity
          </Text>
        </View>
        <Text
          style={[
            styles.customBarChartTotalBadge,
            {
              backgroundColor: isDark ? colors.accent.primary + '30' : colors.accent.primary + '15',
              color: colors.accent.primary,
            },
          ]}
        >
          {yearlyStats.reduce((sum, s) => sum + s.events, 0)} events
        </Text>
      </View>

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

      {yearlyStats.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearlyBarChartScrollContent}>
          <View style={styles.yearlyBarsContainer}>
            {yearlyStats.map((stat, index) => {
              const isHovered = hoveredIndex === index;
              return (
                <View
                  key={index}
                  ref={(ref) => {
                    barRefs.current[index] = ref;
                  }}
                  style={[
                    styles.yearlyMonthColumn,
                    isHovered && {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderRadius: 8,
                    },
                  ]}
                  {...(Platform.OS === 'web'
                    ? {
                      onMouseEnter: () => handleBarHover(index),
                      onMouseLeave: handleBarLeave,
                    }
                    : {
                      onTouchStart: () => handleBarHover(index),
                      onTouchEnd: handleBarLeave,
                    })}
                >
                  <Text
                    style={[
                      styles.yearlyMonthLabel,
                      { color: isHovered ? colors.accent.primary : dynamic.textSecondary },
                    ]}
                  >
                    {stat.month.slice(0, 3)}
                  </Text>
                  <View style={styles.yearlyBarsWrapper}>
                    <View style={styles.yearlyBarPair}>
                      <View style={styles.yearlyBarItem}>
                        <Animated.View
                          style={[
                            styles.yearlyBar,
                            {
                              backgroundColor: '#0ea5e9',
                              height: animatedValues[index].events,
                              shadowColor: '#0ea5e9',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: isHovered ? 0.8 : 0.55,
                              shadowRadius: isHovered ? 10 : 6,
                              elevation: isHovered ? 8 : 4,
                              opacity: isHovered ? 1 : 0.85,
                            },
                          ]}
                        >
                          {stat.events > 0 && <Text style={styles.yearlyBarValue}>{stat.events}</Text>}
                        </Animated.View>
                      </View>
                      <View style={styles.yearlyBarItem}>
                        <Animated.View
                          style={[
                            styles.yearlyBar,
                            {
                              backgroundColor: '#a855f7',
                              height: animatedValues[index].attendance,
                              shadowColor: '#a855f7',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: isHovered ? 0.8 : 0.55,
                              shadowRadius: isHovered ? 10 : 6,
                              elevation: isHovered ? 8 : 4,
                              opacity: isHovered ? 1 : 0.85,
                            },
                          ]}
                        >
                          {stat.attendance > 0 && <Text style={styles.yearlyBarValue}>{stat.attendance}</Text>}
                        </Animated.View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Tooltip - rendered inside the chart container with absolute positioning */}
      {hoveredIndex !== null && yearlyStats[hoveredIndex] && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: tooltipPosition.left - 65, // center horizontally (half of 130px width)
            top: tooltipPosition.top - 50,   // adjust to sit above the bar
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              borderColor: dynamic.borderColor,
              borderWidth: 1,
              borderRadius: 10,
              padding: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 10,
              elevation: 12,
              width: 130,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: dynamic.textPrimary,
                marginBottom: 6,
                textAlign: 'center',
              }}
            >
              {yearlyStats[hoveredIndex].month}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#0ea5e9',
                  marginRight: 6,
                }}
              />
              <Text style={{ fontSize: 12, color: dynamic.textSecondary }}>
                Events: <Text style={{ color: '#0ea5e9', fontWeight: '700' }}>{yearlyStats[hoveredIndex].events}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#a855f7',
                  marginRight: 6,
                }}
              />
              <Text style={{ fontSize: 12, color: dynamic.textSecondary }}>
                Attendance:{' '}
                <Text style={{ color: '#a855f7', fontWeight: '700' }}>{yearlyStats[hoveredIndex].attendance}</Text>
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.customBarChartFooter, { borderTopColor: dynamic.borderColor }]}>
        <Text style={[styles.customBarChartFooterText, { color: dynamic.textSecondary }]}>Last 12 months overview</Text>
      </View>
    </View>
  );
});

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
    pendingEvents: 0,
    rejectedEvents: 0,
  });

  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [displayedActivities, setDisplayedActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(6);
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

  const styles = useMemo(() => createDashboardStyles(colors, isDark), [colors, isDark]);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const chartWidth = isMobile ? width - 32 : isTablet ? width / 2 - 48 : Math.min(width - 400, 800);

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
  const [chartDataReady, setChartDataReady] = useState(false);
  const chartContainerRef = useRef<View>(null);
  const pageFadeAnim = useRef(new Animated.Value(0)).current;
  const pageSlideAnim = useRef(new Animated.Value(20)).current;
  const chartFadeAnim = useRef(new Animated.Value(0)).current;
  const [animatedMonthlyStats, setAnimatedMonthlyStats] = useState([]);
  const eventSparklineData = monthlyStats.map(stat => stat.events);
  const attendanceSparklineData = monthlyStats.map(stat => stat.attendance);


  const handleTouch = (event: any) => {
    if (!monthlyStats.length || !chartContainerRef.current) return;
    chartContainerRef.current.measure((fx, fy, width, height, px, py) => {
      const touchX = event.pageX - px;
      const touchY = event.pageY - py;
      if (touchX < 0 || touchX > width) return;
      const step = width / monthlyStats.length;
      const index = Math.min(monthlyStats.length - 1, Math.max(0, Math.floor(touchX / step)));
      setTooltip({
        visible: true,
        x: touchX,
        y: touchY,
        index,
        month: monthlyStats[index].month,
        events: monthlyStats[index].events,
        attendance: monthlyStats[index].attendance,
      });
    });
  };
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent),
      onPanResponderRelease: () => setTooltip(prev => ({ ...prev, visible: false })),
    })
  ).current;

  const [userRoleStats, setUserRoleStats] = useState<UserRoleStat[]>([
    { role: 'student', label: 'Students', count: 0, percentage: 0, color: '#0ea5e9', icon: 'school' },
    { role: 'assistant_admin', label: 'Assistants', count: 0, percentage: 0, color: '#f59e0b', icon: 'shield-checkmark' },
    { role: 'main_admin', label: 'Admins', count: 0, percentage: 0, color: '#8b5cf6', icon: 'star' },
  ]);

  const fetchUserRoleStats = useCallback(async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => doc.data());

      const total = users.length;
      if (total === 0) return;

      const roleCounts: Record<string, number> = {
        student: users.filter(u => u.role === 'student' || !u.role).length,
        assistant_admin: users.filter(u => u.role === 'assistant_admin').length,
        main_admin: users.filter(u => u.role === 'main_admin').length,
      };

      setUserRoleStats(prev => {
        const newStats = prev.map(role => ({
          ...role,
          count: roleCounts[role.role] || 0,
          percentage: Math.round(((roleCounts[role.role] || 0) / total) * 100)
        }));

        const hasChanges = prev.some((role, idx) =>
          role.count !== newStats[idx].count ||
          role.percentage !== newStats[idx].percentage
        );

        return hasChanges ? newStats : prev;
      });
    } catch (error) {

    }
  }, []);

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    index: number;
    month: string;
    events: number;
    attendance: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    index: -1,
    month: '',
    events: 0,
    attendance: 0,
  });
  const [chartLayout, setChartLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });


  // ─── CHANGE 1: AnimatedBar replaced with AnimatedBarEnhanced ──────────────
  const AnimatedBarEnhanced: React.FC<AnimatedBarProps> = ({ height, color, value, maxHeight = 140 }) => {
    const barHeightAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.sequence([
        Animated.timing(barHeightAnim, {
          toValue: height,
          duration: 900,
          delay: 80,
          useNativeDriver: false,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }, [height]);

    return (
      <Animated.View
        style={[
          styles.yearlyBar,
          {
            backgroundColor: color,
            height: barHeightAnim,
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.55],
            }),
            shadowRadius: 6,
            elevation: 4,
          },
        ]}
      >
        {value > 0 && (
          <Text style={styles.yearlyBarValue}>{value}</Text>
        )}
      </Animated.View>
    );
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
        .slice(0, 3) as Event[];

      setUpcomingEvents(allEvents);
      setEventsLoading(false);
    }, (error) => {

      setEventsLoading(false);
    });
  };

  const DonutChart = memo(function DonutChart({
    userRoleStats,
    totalUsers,
    dynamic,
    colors,
    isDark,
    styles
  }: DonutChartProps) {
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

    const hasAnimatedEntrance = useRef(false);
    const hasInitialDataLoaded = useRef(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const percentageAnimations = useRef<{ [key: string]: Animated.Value }>({});
    const animationsRef = useRef({
      positions: userRoleStats.map(() => new Animated.Value(0)),
      scales: userRoleStats.map(() => new Animated.Value(0)),
      opacities: userRoleStats.map(() => new Animated.Value(0)),
    });
    const { positions, scales, opacities } = animationsRef.current;

    const progressAnimations = useRef<{ [key: string]: Animated.Value }>({});

    useEffect(() => {
      if (hasAnimatedEntrance.current) return;
      hasAnimatedEntrance.current = true;

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    }, []);

    useEffect(() => {
      const hasData = userRoleStats.some(role => role.count > 0);
      if (!hasData && !hasInitialDataLoaded.current) {
        return;
      }
      hasInitialDataLoaded.current = true;
      userRoleStats.forEach((role, index) => {
        const key = `${role.role}-${index}`;
        if (!percentageAnimations.current[key]) {
          percentageAnimations.current[key] = new Animated.Value(0);
        }
        const anim = percentageAnimations.current[key];
        Animated.timing(anim, {
          toValue: role.percentage,
          duration: 800,
          useNativeDriver: false,
        }).start();
      });
    }, [userRoleStats]);

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

    const pieData = userRoleStats.map((role, index) => ({
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

    return (
      <Animated.View
        style={[
          styles.donutChartContainer,
          {
            backgroundColor: dynamic.cardBg,
            borderColor: dynamic.borderColor,
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
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

          {userRoleStats.map((role, index) => {
            const position = getLabelPosition(index, role.percentage);
            return (
              <Animated.View
                key={`label-${role.role}-${index}`}
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
            const progressKey = `${role.role}-${index}`;

            if (!progressAnimations.current[progressKey]) {
              progressAnimations.current[progressKey] = new Animated.Value(0);
            }
            const progressAnim = progressAnimations.current[progressKey];

            useEffect(() => {
              if (hasInitialDataLoaded.current) {
                Animated.timing(progressAnim, {
                  toValue: role.percentage,
                  duration: 800,
                  useNativeDriver: false,
                }).start();
              } else {
                progressAnim.setValue(role.percentage);
              }
            }, [role.percentage]);

            return (
              <TouchableOpacity
                key={progressKey}
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
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: role.color,
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      }
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    );
  }, (prevProps, nextProps) => {
    if (prevProps.totalUsers !== nextProps.totalUsers) return false;
    if (prevProps.isDark !== nextProps.isDark) return false;

    const prevStats = prevProps.userRoleStats;
    const nextStats = nextProps.userRoleStats;
    if (prevStats.length !== nextStats.length) return false;
    for (let i = 0; i < prevStats.length; i++) {
      if (prevStats[i].count !== nextStats[i].count ||
        prevStats[i].percentage !== nextStats[i].percentage) {
        return false;
      }
    }
    return true;
  });

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
        .slice(0, 3) as Announcement[];

      setRecentAnnouncements(approvedAnnouncements);
      setAnnouncementsLoading(false);
    }, (error) => {

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
    calculateYearlyStats();

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
    calculateYearlyStats();

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

      if (Platform.OS === 'web') {
        window.alert('Failed to approve. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to approve. Please try again.');
      }
    }
  };

  const handleReject = (approval: PendingApproval) => {
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
    try {
      const collectionName = approval.type === 'announcement' ? 'updates' : 'events';
      const docRef = doc(db, collectionName, approval.id);

      await updateDoc(docRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: userData?.email || 'unknown',
      });

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
        } catch (notifyError) {

        }
      }

      if (Platform.OS === 'web') {
        window.alert(`${approval.type} has been rejected.`);
      } else {
        Alert.alert('Rejected', `${approval.type} has been rejected.`);
      }
    } catch (error) {

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
      const months: MonthlyStats[] = [];
      const monthKeys: string[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const displayMonth = date.toLocaleString('default', { month: 'long' });
        months.push({ month: displayMonth, events: 0, attendance: 0, announcements: 0 });
        monthKeys.push(monthKey);
      }

      const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
      const nextMonth = new Date(currentYear, currentMonth + 1, 1);

      const eventsSnapshot = await getDocs(collection(db, 'events'));

      const approvedEvents = eventsSnapshot.docs.filter(doc => {
        const data = doc.data();
        const eventDate = data.date?.toDate?.() || data.date;
        const status = data.status;
        const isApproved = status === 'approved' || status === undefined || status === null || status === '';
        const isRejected = status === 'rejected';
        const inRange = eventDate && eventDate >= sixMonthsAgo && eventDate < nextMonth;
        return isApproved && !isRejected && inRange;
      });

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
        }
      });

      setMonthlyStats(months);
      setChartDataReady(true);
      setDashboardStats(prev => ({ ...prev, totalAttendance }));
    } catch (error) {

    }
  };

  const calculateYearlyStats = async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const months: MonthlyStats[] = [];
      const monthKeys: string[] = [];

      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthKey = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        const displayMonth = date.toLocaleString('default', { month: 'long' });
        months.push({ month: displayMonth, events: 0, attendance: 0, announcements: 0 });
        monthKeys.push(monthKey);
      }

      const twelveMonthsAgo = new Date(currentYear, currentMonth - 11, 1);
      const nextMonth = new Date(currentYear, currentMonth + 1, 1);

      const eventsSnapshot = await getDocs(collection(db, 'events'));
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
      setDashboardStats(prev => ({ ...prev, yearlyAttendance: totalYearlyAttendance }));
    } catch (error) {

    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pageFadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(pageSlideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (chartDataReady) {
      Animated.timing(chartFadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }
  }, [chartDataReady]);

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
        Alert.alert('Success', '✅ Report generated successfully!', [{ text: 'OK' }]);
      }
    } catch (error) {

      Alert.alert('Error', '❌ Failed to generate report. Please try again.', [{ text: 'OK' }]);
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
          Alert.alert('Permission Required', 'Permission to access camera roll is required!', [{ text: 'OK' }]);
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

      Alert.alert('Error', 'Failed to pick image. Please try again.', [{ text: 'OK' }]);
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
        await updateDoc(userRef, { photoURL: downloadUrl });
        Alert.alert('Success', 'Profile image updated successfully!', [{ text: 'OK' }]);
      }
    } catch (error) {

      Alert.alert('Error', 'Failed to upload image. Please try again.', [{ text: 'OK' }]);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter(doc => doc.data().active !== false).length;

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
        const status = data.status;
        const isApproved = status === 'approved' || status === undefined || status === null || status === '';
        const isPending = status === 'pending';
        const isRejected = status === 'rejected';
        totalEvents++;
        if (isApproved) approvedEvents++;
        if (isPending) pendingEvents++;
        if (isRejected) rejectedEvents++;
        if (isApproved) {
          const eventDate = data.date?.toDate?.() || data.date;
          if (eventDate && eventDate > now) upcomingEvents++;
          const attendees = data.attendees?.length || 0;
          totalAttendanceAllTime += attendees;
        }
      });

      const announcementsSnapshot = await getDocs(collection(db, 'updates'));
      const totalAnnouncements = announcementsSnapshot.size;
      const pendingAnnouncements = announcementsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
      const approvedAnnouncements = announcementsSnapshot.docs.filter(doc => doc.data().status === 'approved').length;
      const rejectedAnnouncements = announcementsSnapshot.docs.filter(doc => doc.data().status === 'rejected').length;

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

      const userGrowth = totalUsers > 0 ? ((activeUsers - totalUsers * 0.8) / (totalUsers * 0.8)) * 100 : 0;
      const eventGrowth = approvedEvents > 0 ? ((upcomingEvents - approvedEvents * 0.3) / (approvedEvents * 0.3)) * 100 : 0;

      setDashboardStats({
        totalUsers,
        totalEvents: totalEvents,
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
        rejectedAnnouncements,
        pendingEvents,
        rejectedEvents,
      });
    } catch (error) {

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
      default:
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

  const dynamic = useMemo(() => getDynamicStyles(), [isDark, colors]);

  const renderStatCard = (title: string, value: string | number, icon: any, color: string, trend?: number, subtitle?: string) => (
    <AnimatedStatCard
      title={title}
      value={value}
      icon={icon}
      color={color}
      trend={trend}
      subtitle={subtitle}
      onPress={() => setSelectedStat(selectedStat === title ? null : title)}
      styles={styles}
      dynamic={dynamic}
      isDark={isDark}
    />
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
          <Text style={[styles.pageInfoText, { color: dynamic.textPrimary }]}>
            {currentPage}/{totalPages}
          </Text>
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


  const renderChartsSection = () => (
    <View style={styles.chartsGrid}>
      {/* COL 1: use the memoized component instead of the inline duplicate */}
      <View style={[styles.chartColumn, styles.lineChartColumn]}>
        <AnalyticsLineChart
          monthlyStats={monthlyStats}
          chartWidth={chartWidth}
          isDark={isDark}
          dynamic={dynamic}
          styles={styles}
          chartFadeAnim={chartFadeAnim}
          chartContainerRef={chartContainerRef}
          panResponder={panResponder}
          calculateGrowth={calculateGrowth}
          dashboardTotalEvents={dashboardStats.totalEvents}
        />
      </View>

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
  );

  const renderOverview = () => (
    <Animated.View
      style={[
        styles.overviewContainer,
        {
          backgroundColor: colors.background,
          opacity: pageFadeAnim,
          transform: [{ translateY: pageSlideAnim }],
        }
      ]}
    >
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
              <Text style={[styles.greetingText, { color: isDark ? dynamic.textSecondary : '#ffffff' }]}>Welcome back,</Text>
              <Text style={styles.userName}>{userData?.name || 'Admin'}</Text>
              <Text style={[styles.roleText, { color: isDark ? dynamic.textMuted : '#ffffff' }]}>Administrator</Text>
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
              <Text style={[styles.dateText, { color: isDark ? dynamic.textSecondary : '#ffffff' }]}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerAction, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={handleDownloadReport}
                disabled={downloadLoading}
              >
                {downloadLoading
                  ? <ActivityIndicator size="small" color="#ffffff" />
                  : <Feather name="download" size={18} color="#ffffff" />
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerAction, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setNotificationModalVisible(true)}
              >
                <Feather name="bell" size={18} color="#ffffff" />
                {unreadCount > 0 && (
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

        {renderChartsSection()}

        <View style={styles.twoColumnLayout}>
          <View style={[styles.column, styles.monthlyActivityColumn]}>
            <MonthlyActivityChart
              yearlyStats={yearlyStats}
              dynamic={dynamic}
              colors={colors}
              isDark={isDark}
              styles={styles}
            />
          </View>

          {/* Right Side - Stats Grid (2x2) */}
          <View style={[styles.column, styles.statsColumn]}>
            <View style={[styles.statsGridContainer, {
              backgroundColor: dynamic.cardBg,
              height: '100%',
            }]}>
              <View style={styles.statsGridEnhanced}>
                {/* Total Users */}
                <TouchableOpacity
                  style={[styles.statCardEnhanced, {
                    backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : '#f0f9ff',
                    borderColor: isDark ? 'rgba(14, 165, 233, 0.3)' : 'rgba(14, 165, 233, 0.2)',
                  }]}
                  onPress={() => navigateTo('users')}
                  activeOpacity={0.9}
                >
                  <View style={styles.statLeftColumn}>
                    <Text style={[styles.statLabelEnhanced, { color: dynamic.textSecondary }]}>Total Users</Text>
                    <Text style={[styles.statNumberEnhanced, { color: '#0ea5e9' }]}>{dashboardStats.totalUsers}</Text>
                    {dashboardStats.userGrowth !== 0 && (
                      <View style={styles.trendRow}>
                        <Feather name={dashboardStats.userGrowth >= 0 ? 'trending-up' : 'trending-down'} size={12} color="#0ea5e9" />
                        <Text style={[styles.trendText, { color: "#0ea5e9" }]}>
                          {Math.abs(dashboardStats.userGrowth).toFixed(1)}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statRightColumn}>
                    <Svg width="46" height="46" viewBox="0 0 24 24">
                      <Rect x="4" y="12" width="4" height="10" fill="#0ea5e9" />
                      <Rect x="10" y="8" width="4" height="14" fill="#3b82f6" />
                      <Rect x="16" y="4" width="4" height="18" fill="#60a5fa" />
                    </Svg>
                  </View>
                </TouchableOpacity>

                {/* Total Events */}
                <TouchableOpacity
                  style={[styles.statCardEnhanced, {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                    borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)',
                  }]}
                  onPress={() => navigateTo('events')}
                  activeOpacity={0.9}
                >
                  <View style={styles.statLeftColumn}>
                    <Text style={[styles.statLabelEnhanced, { color: dynamic.textSecondary }]}>Total Events</Text>
                    <Text style={[styles.statNumberEnhanced, { color: '#f59e0b' }]}>{dashboardStats.totalEvents}</Text>
                    {eventSparklineData.length > 0 && (
                      <View style={styles.trendRow}>
                        <Text style={[styles.trendText, { color: '#f59e0b' }]}>
                          {calculateGrowth(monthlyStats, 'events') > 0 ? '+' : ''}{calculateGrowth(monthlyStats, 'events')}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.statRightColumn}>
                    {eventSparklineData.length > 0 ? (
                      <Sparkline data={eventSparklineData} color="#f59e0b" width={80} height={40} />
                    ) : (
                      <View style={[styles.statIconWrapper, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#ffffff' }]}>
                        <Ionicons name="calendar" size={32} color="#f59e0b" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Announcements */}
                <TouchableOpacity
                  style={[styles.statCardEnhanced, {
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#faf5ff',
                    borderColor: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)',
                  }]}
                  onPress={() => navigateTo('announcements')}
                  activeOpacity={0.9}
                >
                  <View style={styles.statLeftColumn}>
                    <Text style={[styles.statLabelEnhanced, { color: dynamic.textSecondary }]}>Announcements</Text>
                    <Text style={[styles.statNumberEnhanced, { color: '#8b5cf6' }]}>{dashboardStats.totalAnnouncements}</Text>
                    <View style={styles.trendRow}>
                      <Text style={[styles.trendText, { color: dynamic.textMuted }]}>
                        {dashboardStats.pendingAnnouncements} pending
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statRightColumn}>
                    <Svg width="46" height="46" viewBox="0 0 24 24">
                      <Path d="M12 2C8 2 6 5 6 8v4l-2 2v2h16v-2l-2-2V8c0-3-2-6-6-6z" fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
                      <Circle cx="12" cy="19" r="2" fill="#8b5cf6" />
                      <Rect x="9" y="12" width="1.5" height="4" fill="#c084fc" />
                      <Rect x="11" y="10" width="1.5" height="6" fill="#a855f7" />
                      <Rect x="13" y="8" width="1.5" height="8" fill="#8b5cf6" />
                    </Svg>
                  </View>
                </TouchableOpacity>

                {/* Need Approval */}
                <TouchableOpacity
                  style={[styles.statCardEnhanced, {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
                  }]}
                  onPress={() => setNotificationModalVisible(true)}
                  activeOpacity={0.9}
                >
                  <View style={styles.statLeftColumn}>
                    <Text style={[styles.statLabelEnhanced, { color: dynamic.textSecondary }]}>Need Approval</Text>
                    <Text style={[styles.statNumberEnhanced, { color: '#ef4444' }]}>{pendingApprovals.length}</Text>
                    <View style={styles.trendRow}>
                      <Text style={[styles.trendText, { color: dynamic.textMuted }]}>
                        {pendingApprovals.filter(p => p.type === 'event').length} events • {pendingApprovals.filter(p => p.type === 'announcement').length} updates
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statRightColumn}>
                    <Svg width="46" height="46" viewBox="0 0 24 24">
                      <Rect x="4" y="12" width="4" height="8" fill="#ef4444" />
                      <Rect x="10" y="8" width="4" height="12" fill="#f97316" />
                      <Rect x="16" y="4" width="4" height="16" fill="#facc15" />
                      <Polyline points="20,10 18,12 16,10" fill="none" stroke="#10b981" strokeWidth="2" />
                    </Svg>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Two Column Layout - Recent Activity + Upcoming Events/Announcements */}
        <View style={styles.twoColumnLayout}>
          <View style={[styles.column, styles.activityColumn]}>
            <View style={[styles.activityList, {
              backgroundColor: dynamic.cardBg,
              borderColor: dynamic.borderColor,
              shadowColor: isDark ? '#000' : '#000',
              shadowOpacity: isDark ? 0.3 : 0.05,
            }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: dynamic.textPrimary }]}>Recent Activity</Text>
                {activitiesLoading && <ActivityIndicator size="small" color={colors.accent.primary} />}
              </View>
              {displayedActivities.length > 0 ? (
                <>
                  {displayedActivities.map((activity, index) => (
                    <AnimatedActivityItem
                      key={activity.id}
                      activity={activity}
                      index={index}
                      styles={styles}
                      dynamic={dynamic}
                      isDark={isDark}
                      getActivityIcon={getActivityIcon}
                      formatTimeAgo={formatTimeAgo}
                      isLast={index === displayedActivities.length - 1}
                    />
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
                      <TouchableOpacity
                        key={announcement.id}
                        style={[styles.announcementItem, { borderBottomColor: dynamic.borderColor }]}
                        onPress={() => navigateTo('announcements', announcement.id)}
                      >
                        <View style={[styles.announcementBadge, { backgroundColor: `${priorityColor}${isDark ? '30' : '20'}` }]}>
                          <FontAwesome6 name="bullhorn" size={12} color={priorityColor} />
                        </View>
                        <View style={styles.announcementContent}>
                          <Text style={[styles.announcementText, { color: dynamic.textPrimary }]} numberOfLines={1}>
                            {announcement.title}
                          </Text>
                          <Text style={[styles.announcementTime, { color: dynamic.textMuted }]}>
                            {timeAgo} • {announcement.author}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.eventAction, {
                            backgroundColor: isDark ? '#334155' : '#f8fafc',
                            borderColor: isDark ? '#475569' : '#e2e8f0'
                          }]}
                          onPress={() => navigateTo('announcements', announcement.id)}
                        >
                          <Feather name="chevron-right" size={20} color={dynamic.textMuted} />
                        </TouchableOpacity>
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
    </Animated.View>
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