import { Feather, Ionicons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { usePathname, useRouter } from 'expo-router'
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { PieChart } from 'react-native-gifted-charts'
import Svg, { Line, Polyline } from 'react-native-svg'
import { AnimatedStatCard } from '../../components/AnimatedStatCard'
import { NotificationModal } from '../../components/NotificationModal'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { db } from '../../lib/firebaseConfig'
import { createDashboardStyles } from '../../styles/main-admin/dashboardStyles'
import { Notification, notificationService } from '../../utils/notifications'
import { generateDashboardPDF, sharePDF } from '../../utils/pdfGenerator'
import MainAdminAnnouncements from './announcements'
import MainAdminAttendance from './attendance'
import MainAdminEvents from './events'
import MainAdminProfile from './profile'
import UserManagement from './users'
dayjs.extend(relativeTime)

interface Activity {
  id: string
  type: 'event' | 'attendance' | 'announcement' | 'user'
  title: string
  description: string
  timestamp: Date
  icon: string
  color: string
  data?: any
}

interface MonthlyStats {
  month: string
  events: number
  attendance: number
  announcements: number
}
interface PendingApproval {
  id: string
  type: 'announcement' | 'event'
  title: string
  description: string
  requestedBy: string
  requestedAt: Date
  data: any
}
interface AnimatedActivityItemProps {
  activity: Activity
  index: number
  styles: any
  dynamic: any
  isDark: boolean
  getActivityIcon: (activity: Activity) => React.ReactNode
  formatTimeAgo: (date: Date) => string
  isLast?: boolean
  onPress?: () => void
}

interface Event {
  id: string
  title: string
  description?: string
  date: Date
  time?: string
  location?: string
  attendees?: any[]
  createdAt?: Date
}
interface UserRoleStat {
  role: 'student' | 'assistant_admin' | 'main_admin' | 'inactive'
  label: string
  count: number
  percentage: number
  color: string
  icon: 'school' | 'shield-checkmark' | 'star' | 'ban'
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: Date
  priority?: 'normal' | 'important' | 'urgent'
  author?: string
}
interface DonutChartProps {
  userRoleStats: UserRoleStat[]
  totalUsers: number
  dynamic: {
    headerGradient: readonly [string, string]
    chartBackground: readonly [string, string]
    statCardBorder: string
    textPrimary: string
    textSecondary: string
    textMuted: string
    cardBg: string
    borderColor: string
  }
  colors: {
    accent: { primary: string }
  }
  isDark: boolean
  styles: any
  onExplore?: () => void
}

interface AnimatedBarProps {
  height: number
  color: string
  value: number
  maxHeight?: number
}
const Sparkline = ({
  data,
  color,
  width = 80,
  height = 40,
}: {
  data: number[]
  color: string
  width?: number
  height?: number
}) => {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Polyline points={points} fill='none' stroke={color} strokeWidth='2' />
      <Line
        x1='0'
        y1={height - 0.5}
        x2={width}
        y2={height - 0.5}
        stroke='rgba(255,255,255,0.2)'
        strokeWidth='0.5'
      />
    </Svg>
  )
}
const AnimatedActivityItem = memo(function AnimatedActivityItem({
  activity,
  index,
  styles,
  dynamic,
  isDark,
  getActivityIcon,
  formatTimeAgo,
  onPress,
}: AnimatedActivityItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

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
    ]).start()
  }, [index])

  const getActivityGradient = (type: string): readonly [string, string] => {
    switch (type) {
      case 'event':
        return isDark
          ? (['#0ea5e920', '#0f172a'] as const)
          : (['#e0f2fe', '#ffffff'] as const)
      case 'announcement':
        return isDark
          ? (['#f59e0b20', '#0f172a'] as const)
          : (['#fef3c7', '#ffffff'] as const)
      case 'user':
        return isDark
          ? (['#8b5cf620', '#0f172a'] as const)
          : (['#f3e8ff', '#ffffff'] as const)
      default:
        return isDark
          ? (['#334155', '#0f172a'] as const)
          : (['#f1f5f9', '#ffffff'] as const)
    }
  }

  return (
    <Animated.View
      style={[
        styles.activityCard,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <LinearGradient
          colors={getActivityGradient(activity.type)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activityCardGradient}
        >
          <View style={styles.activityCardInner}>
            <View style={styles.activityCardLeft}>
              <LinearGradient
                colors={[activity.color, `${activity.color}cc`]}
                style={styles.activityCardIcon}
              >
                {getActivityIcon(activity)}
              </LinearGradient>
            </View>
            <View style={styles.activityCardCenter}>
              <Text
                style={[
                  styles.activityCardTitle,
                  { color: dynamic.textPrimary },
                ]}
              >
                {activity.title}
              </Text>
              <Text
                style={[
                  styles.activityCardDesc,
                  { color: dynamic.textSecondary },
                ]}
              >
                {activity.description}
              </Text>
              <View style={styles.activityCardMeta}>
                <Feather name='clock' size={12} color={dynamic.textMuted} />
                <Text
                  style={[
                    styles.activityCardTime,
                    { color: dynamic.textMuted },
                  ]}
                >
                  {formatTimeAgo(activity.timestamp)}
                </Text>
                {activity.type === 'event' && activity.data?.location && (
                  <>
                    <View style={styles.metaDot} />
                    <Feather
                      name='map-pin'
                      size={12}
                      color={dynamic.textMuted}
                    />
                    <Text
                      style={[
                        styles.activityCardMetaText,
                        { color: dynamic.textMuted },
                      ]}
                    >
                      {activity.data.location}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.activityCardRight}>
              <Feather
                name='chevron-right'
                size={18}
                color={dynamic.textMuted}
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
})
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
  monthlyStats: MonthlyStats[]
  chartWidth: number
  isDark: boolean
  dynamic: any
  styles: any
  chartFadeAnim: Animated.Value
  chartContainerRef: React.RefObject<View | null>
  panResponder: any
  calculateGrowth: (
    data: MonthlyStats[],
    key: 'events' | 'attendance'
  ) => number
  dashboardTotalEvents: number
}) {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    index: number
    month: string
    events: number
    attendance: number
  }>({
    visible: false,
    x: 0,
    y: 0,
    index: -1,
    month: '',
    events: 0,
    attendance: 0,
  })

  const eventSparklineData = monthlyStats.map((stat) => stat.events)

  return (
    <Animated.View style={{ opacity: chartFadeAnim, flex: 1 }}>
      <View
        style={[
          styles.chartsContainer,
          {
            backgroundColor: dynamic.cardBg,
            shadowColor: isDark ? '#000' : '#0ea5e9',
            marginHorizontal: 0,
            flex: 1,
          },
        ]}
      >
        <View style={styles.chartHeader}>
          <View>
            <Text style={[styles.chartsTitle, { color: dynamic.textPrimary }]}>
              Analytics Overview
            </Text>
            <Text
              style={[styles.chartsSubtitle, { color: dynamic.textSecondary }]}
            >
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
                  borderColor:
                    selectedDataset === 'events'
                      ? '#0ea5e9'
                      : dynamic.borderColor,
                },
                selectedDataset === 'events' && {
                  backgroundColor: isDark ? '#0ea5e920' : '#f0f9ff',
                },
              ]}
              onPress={() =>
                setSelectedDataset(
                  selectedDataset === 'events' ? null : 'events'
                )
              }
            >
              <View
                style={[styles.legendDot, { backgroundColor: '#0ea5e9' }]}
              />
              <Text
                style={[
                  styles.legendText,
                  {
                    color:
                      selectedDataset === 'events'
                        ? '#0ea5e9'
                        : dynamic.textSecondary,
                  },
                ]}
              >
                Events
              </Text>
              <View
                style={[
                  styles.legendValue,
                  { backgroundColor: isDark ? '#0ea5e920' : '#0ea5e915' },
                ]}
              >
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
                  borderColor:
                    selectedDataset === 'attendance'
                      ? '#a855f7'
                      : dynamic.borderColor,
                },
                selectedDataset === 'attendance' && {
                  backgroundColor: isDark ? '#a855f720' : '#faf5ff',
                },
              ]}
              onPress={() =>
                setSelectedDataset(
                  selectedDataset === 'attendance' ? null : 'attendance'
                )
              }
            >
              <View
                style={[styles.legendDot, { backgroundColor: '#a855f7' }]}
              />
              <Text
                style={[
                  styles.legendText,
                  {
                    color:
                      selectedDataset === 'attendance'
                        ? '#a855f7'
                        : dynamic.textSecondary,
                  },
                ]}
              >
                Attendance
              </Text>
              <View
                style={[
                  styles.legendValue,
                  { backgroundColor: isDark ? '#a855f720' : '#a855f715' },
                ]}
              >
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
              {...(Platform.OS === 'web'
                ? ({
                    onMouseMove: (e: React.MouseEvent) => {
                      if (!monthlyStats.length) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const touchX = e.clientX - rect.left
                      const touchY = e.clientY - rect.top
                      if (touchX < 0 || touchX > rect.width) return
                      const step = rect.width / monthlyStats.length
                      const index = Math.min(
                        monthlyStats.length - 1,
                        Math.max(0, Math.floor(touchX / step))
                      )
                      setTooltip({
                        visible: true,
                        x: touchX,
                        y: touchY,
                        index,
                        month: monthlyStats[index].month,
                        events: monthlyStats[index].events,
                        attendance: monthlyStats[index].attendance,
                      })
                    },
                    onMouseLeave: () =>
                      setTooltip((prev) => ({ ...prev, visible: false })),
                  } as any)
                : {})}
              {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
            >
              <LinearGradient
                colors={dynamic.chartBackground}
                style={styles.chartBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart
                  data={{
                    labels: monthlyStats.map((s) => s.month.slice(0, 3)),
                    datasets: [
                      {
                        data: monthlyStats.map((s) => s.events),
                        color: (opacity = 1) =>
                          `rgba(14, 165, 233, ${opacity})`,
                        strokeWidth: 3,
                      },
                      {
                        data: monthlyStats.map((s) => s.attendance),
                        color: (opacity = 1) =>
                          `rgba(168, 85, 247, ${opacity})`,
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
                      isDark
                        ? `rgba(255,255,255,${opacity})`
                        : `rgba(15,23,42,${opacity})`,
                    labelColor: (opacity = 1) =>
                      isDark
                        ? `rgba(148,163,184,${opacity})`
                        : `rgba(100,116,139,${opacity})`,
                    style: { borderRadius: 14 },
                    propsForDots: {
                      r: '5',
                      strokeWidth: '2',
                      stroke: isDark ? '#1e293b' : '#ffffff',
                    },
                    propsForBackgroundLines: {
                      stroke: isDark
                        ? 'rgba(51,65,85,0.4)'
                        : 'rgba(226,232,240,0.7)',
                      strokeWidth: 1,
                      strokeDasharray: '4,4',
                    },
                    propsForLabels: { fontSize: 11, fontWeight: '600' },
                    fillShadowGradientFrom: '#0ea5e9',
                    fillShadowGradientTo: '#0ea5e9',
                    fillShadowGradientFromOpacity: 0.7,
                    fillShadowGradientToOpacity: 0.2,
                    useShadowColorFromDataset: true,
                  }}
                  bezier
                  style={styles.chart}
                  withInnerLines
                  withOuterLines={false}
                  fromZero
                  segments={4}
                  withShadow
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
                  <Text
                    style={[
                      styles.tooltipMonth,
                      { color: dynamic.textPrimary },
                    ]}
                  >
                    {tooltip.month}
                  </Text>
                  <View style={styles.tooltipRow}>
                    <View
                      style={[
                        styles.tooltipDot,
                        { backgroundColor: '#0ea5e9' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.tooltipText,
                        { color: dynamic.textSecondary },
                      ]}
                    >
                      Events: {tooltip.events}
                    </Text>
                  </View>
                  <View style={styles.tooltipRow}>
                    <View
                      style={[
                        styles.tooltipDot,
                        { backgroundColor: '#a855f7' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.tooltipText,
                        { color: dynamic.textSecondary },
                      ]}
                    >
                      Attendance: {tooltip.attendance}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>
          </>
        )}

        <View style={styles.chartSummary}>
          {/* Total Events Card */}
          <TouchableOpacity
            style={[styles.summaryCard, { flex: 1 }]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#0ea5e9', '#0284c7']}
              style={styles.summaryCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryContent}>
                <View style={styles.summaryIconRow}>
                  <Ionicons name='calendar' size={16} color='#ffffff' />
                  <Text style={styles.summaryCardLabel}>Total Events</Text>
                </View>
                <Text style={styles.summaryCardValue}>
                  {dashboardTotalEvents}
                </Text>
                <View style={styles.summaryTrend}>
                  <Feather name='trending-up' size={12} color='#ffffff' />
                  <Text style={styles.summaryTrendText}>
                    +{calculateGrowth(monthlyStats, 'events')}%
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Peak Month Card */}
          <TouchableOpacity
            style={[styles.summaryCard, { flex: 1 }]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.summaryCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryContent}>
                <View style={styles.summaryIconRow}>
                  <Ionicons name='trophy' size={16} color='#ffffff' />
                  <Text style={styles.summaryCardLabel}>Peak Month</Text>
                </View>
                <Text style={styles.summaryCardValue}>
                  {monthlyStats.length > 0
                    ? monthlyStats.reduce(
                        (mx, s) => (s.attendance > mx.attendance ? s : mx),
                        monthlyStats[0]
                      ).month
                    : '–'}
                </Text>
                <Text style={styles.summarySubText}>Highest attendance</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Attendance Δ Card */}
          <TouchableOpacity
            style={[styles.summaryCard, { flex: 1 }]}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.summaryCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryContent}>
                <View style={styles.summaryIconRow}>
                  <Ionicons name='stats-chart' size={16} color='#ffffff' />
                  <Text style={styles.summaryCardLabel}>Attendance Δ</Text>
                </View>
                <Text style={styles.summaryCardValue}>
                  {calculateGrowth(monthlyStats, 'attendance') > 0 ? '+' : ''}
                  {calculateGrowth(monthlyStats, 'attendance')}%
                </Text>
                <View style={styles.summaryTrend}>
                  <Feather
                    name={
                      calculateGrowth(monthlyStats, 'attendance') >= 0
                        ? 'trending-up'
                        : 'trending-down'
                    }
                    size={12}
                    color='#ffffff'
                  />
                  <Text style={styles.summaryTrendText}>vs last 6 months</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )
})

const MonthlyActivityChart = memo(function MonthlyActivityChart({
  yearlyStats = [],
  dynamic,
  colors,
  isDark,
  styles,
}: {
  yearlyStats?: MonthlyStats[]
  dynamic: any
  colors: any
  isDark: boolean
  styles: any
}) {
  if (!Array.isArray(yearlyStats) || yearlyStats.length === 0) {
    return (
      <View
        style={[
          styles.customBarChartContainer,
          { backgroundColor: dynamic.cardBg, borderColor: dynamic.borderColor },
        ]}
      >
        <Text
          style={{
            color: dynamic.textSecondary,
            textAlign: 'center',
            padding: 20,
          }}
        >
          No monthly activity data available
        </Text>
      </View>
    )
  }

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 })
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null)
  const barRefs = useRef<(View | null)[]>([])
  const chartContainerRef = useRef<View>(null)

  const [animatedValues] = useState(() =>
    yearlyStats.map(() => ({
      events: new Animated.Value(0),
      attendance: new Animated.Value(0),
    }))
  )

  useEffect(() => {
    yearlyStats.forEach((stat, index) => {
      const maxValue =
        Math.max(...yearlyStats.flatMap((s) => [s.events, s.attendance])) || 1
      const maxBarHeight = 250
      const eventsHeight = (stat.events / maxValue) * maxBarHeight
      const attendanceHeight = (stat.attendance / maxValue) * maxBarHeight

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
      ]).start()
    })
  }, [yearlyStats])

  const maxValue =
    Math.max(...yearlyStats.flatMap((s) => [s.events, s.attendance])) || 1
  const maxBarHeight = 140

  const handleBarHover = (index: number) => {
    if (hoverTimeout) clearTimeout(hoverTimeout)

    if (barRefs.current[index] && chartContainerRef.current) {
      barRefs.current[index]?.measure(
        (barX, barY, barWidth, barHeight, barPageX, barPageY) => {
          chartContainerRef.current?.measure(
            (
              containerX,
              containerY,
              containerWidth,
              containerHeight,
              containerPageX,
              containerPageY
            ) => {
              // Calculate relative position inside the chart container
              const relativeLeft = barPageX - containerPageX + barWidth / 2
              const relativeTop = barPageY - containerPageY - 10 // 10px above bar
              setTooltipPosition({ left: relativeLeft, top: relativeTop })
            }
          )
        }
      )
    }
    setHoveredIndex(index)
  }

  const handleBarLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredIndex(null)
    }, 100)
    setHoverTimeout(timeout)
  }

  return (
    <View
      ref={chartContainerRef}
      style={[
        styles.customBarChartContainer,
        {
          backgroundColor: dynamic.cardBg,
          borderColor: dynamic.borderColor,
          height: '100%',
          position: 'relative',
          overflow: 'visible',
        },
      ]}
    >
      <View style={styles.customBarChartHeader}>
        <View style={styles.customBarChartHeaderLeft}>
          <Ionicons name='bar-chart' size={18} color={colors.accent.primary} />
          <Text
            style={[styles.customBarChartTitle, { color: dynamic.textPrimary }]}
          >
            Monthly Activity
          </Text>
        </View>
        <Text
          style={[
            styles.customBarChartTotalBadge,
            {
              backgroundColor: isDark
                ? colors.accent.primary + '30'
                : colors.accent.primary + '15',
              color: colors.accent.primary,
            },
          ]}
        >
          {yearlyStats.reduce((sum, s) => sum + s.events, 0)} events
        </Text>
      </View>

      <View style={styles.customBarChartLegend}>
        <View style={styles.customLegendItem}>
          <View
            style={[styles.customLegendDot, { backgroundColor: '#0ea5e9' }]}
          />
          <Text
            style={[styles.customLegendText, { color: dynamic.textSecondary }]}
          >
            Events ({yearlyStats.reduce((sum, s) => sum + s.events, 0)})
          </Text>
        </View>
        <View style={styles.customLegendItem}>
          <View
            style={[styles.customLegendDot, { backgroundColor: '#a855f7' }]}
          />
          <Text
            style={[styles.customLegendText, { color: dynamic.textSecondary }]}
          >
            Attendance ({yearlyStats.reduce((sum, s) => sum + s.attendance, 0)})
          </Text>
        </View>
      </View>

      {yearlyStats.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearlyBarChartScrollContent}
        >
          <View style={styles.yearlyBarsContainer}>
            {yearlyStats.map((stat, index) => {
              const isHovered = hoveredIndex === index
              return (
                <View
                  key={index}
                  ref={(ref) => {
                    barRefs.current[index] = ref
                  }}
                  style={[
                    styles.yearlyMonthColumn,
                    isHovered && {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(0,0,0,0.03)',
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
                      {
                        color: isHovered
                          ? colors.accent.primary
                          : dynamic.textSecondary,
                      },
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
                          {stat.events > 0 && (
                            <Text style={styles.yearlyBarValue}>
                              {stat.events}
                            </Text>
                          )}
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
                          {stat.attendance > 0 && (
                            <Text style={styles.yearlyBarValue}>
                              {stat.attendance}
                            </Text>
                          )}
                        </Animated.View>
                      </View>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}

      {/* Tooltip - rendered inside the chart container with absolute positioning */}
      {hoveredIndex !== null && yearlyStats[hoveredIndex] && (
        <View
          pointerEvents='none'
          style={{
            position: 'absolute',
            left: tooltipPosition.left - 65, // center horizontally (half of 130px width)
            top: tooltipPosition.top - 50, // adjust to sit above the bar
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
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
                Events:{' '}
                <Text style={{ color: '#0ea5e9', fontWeight: '700' }}>
                  {yearlyStats[hoveredIndex].events}
                </Text>
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
                <Text style={{ color: '#a855f7', fontWeight: '700' }}>
                  {yearlyStats[hoveredIndex].attendance}
                </Text>
              </Text>
            </View>
          </View>
        </View>
      )}

      <View
        style={[
          styles.customBarChartFooter,
          { borderTopColor: dynamic.borderColor },
        ]}
      >
        <Text
          style={[
            styles.customBarChartFooterText,
            { color: dynamic.textSecondary },
          ]}
        >
          Last 12 months overview
        </Text>
      </View>
    </View>
  )
})

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
  })

  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [displayedActivities, setDisplayedActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const pageSizeOptions = [5, 10, 15, 20]
  const [refreshing, setRefreshing] = useState(false)

  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  const [yearlyStats, setYearlyStats] = useState<MonthlyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStat, setSelectedStat] = useState<string | null>(null)

  const { width } = useWindowDimensions()

  const router = useRouter()
  const pathname = usePathname()
  const { userData } = useAuth()
  const { colors, isDark } = useTheme()

  const styles = useMemo(
    () => createDashboardStyles(colors, isDark),
    [colors, isDark]
  )

  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const chartWidth = isMobile
    ? width - 32
    : isTablet
      ? width / 2 - 48
      : Math.min(width - 400, 800)

  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [recentAnnouncements, setRecentAnnouncements] = useState<
    Announcement[]
  >([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [announcementsLoading, setAnnouncementsLoading] = useState(true)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileModalVisible, setProfileModalVisible] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(
    []
  )
  const [approvalCount, setApprovalCount] = useState(0)
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [chartDataReady, setChartDataReady] = useState(false)
  const chartContainerRef = useRef<View>(null)
  const pageFadeAnim = useRef(new Animated.Value(0)).current
  const pageSlideAnim = useRef(new Animated.Value(20)).current
  const chartFadeAnim = useRef(new Animated.Value(0)).current
  const [animatedMonthlyStats, setAnimatedMonthlyStats] = useState([])
  const eventSparklineData = monthlyStats.map((stat) => stat.events)
  const attendanceSparklineData = monthlyStats.map((stat) => stat.attendance)

  const handleTouch = (event: any) => {
    if (!monthlyStats.length || !chartContainerRef.current) return
    chartContainerRef.current.measure((fx, fy, width, height, px, py) => {
      const touchX = event.pageX - px
      const touchY = event.pageY - py
      if (touchX < 0 || touchX > width) return
      const step = width / monthlyStats.length
      const index = Math.min(
        monthlyStats.length - 1,
        Math.max(0, Math.floor(touchX / step))
      )
      setTooltip({
        visible: true,
        x: touchX,
        y: touchY,
        index,
        month: monthlyStats[index].month,
        events: monthlyStats[index].events,
        attendance: monthlyStats[index].attendance,
      })
    })
  }
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleTouch(evt.nativeEvent),
      onPanResponderMove: (evt) => handleTouch(evt.nativeEvent),
      onPanResponderRelease: () =>
        setTooltip((prev) => ({ ...prev, visible: false })),
    })
  ).current

  const [userRoleStats, setUserRoleStats] = useState<UserRoleStat[]>([
    {
      role: 'student',
      label: 'Students',
      count: 0,
      percentage: 0,
      color: '#0ea5e9',
      icon: 'school',
    },
    {
      role: 'assistant_admin',
      label: 'Assistants',
      count: 0,
      percentage: 0,
      color: '#f59e0b',
      icon: 'shield-checkmark',
    },
    {
      role: 'main_admin',
      label: 'Admins',
      count: 0,
      percentage: 0,
      color: '#8b5cf6',
      icon: 'star',
    },
    {
      role: 'inactive',
      label: 'Inactive',
      count: 0,
      percentage: 0,
      color: '#94a3b8',
      icon: 'ban',
    },
  ])

  const fetchUserRoleStats = useCallback(async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const users = usersSnapshot.docs.map((doc) => doc.data())

      const total = users.length
      if (total === 0) return

      // A user is inactive if active === false (explicit flag)
      const inactiveUsers = users.filter((u) => u.active === false)
      const activeUsers = users.filter((u) => u.active !== false)

      const roleCounts: Record<string, number> = {
        student: activeUsers.filter((u) => u.role === 'student' || !u.role)
          .length,
        assistant_admin: activeUsers.filter((u) => u.role === 'assistant_admin')
          .length,
        main_admin: activeUsers.filter((u) => u.role === 'main_admin').length,
        inactive: inactiveUsers.length,
      }

      setUserRoleStats((prev) => {
        const newStats = prev.map((role) => ({
          ...role,
          count: roleCounts[role.role] ?? 0,
          percentage: Math.round(((roleCounts[role.role] ?? 0) / total) * 100),
        }))

        const hasChanges = prev.some(
          (role, idx) =>
            role.count !== newStats[idx].count ||
            role.percentage !== newStats[idx].percentage
        )

        return hasChanges ? newStats : prev
      })
    } catch (error) {
      console.error('fetchUserRoleStats error:', error)
    }
  }, [])

  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    index: number
    month: string
    events: number
    attendance: number
  }>({
    visible: false,
    x: 0,
    y: 0,
    index: -1,
    month: '',
    events: 0,
    attendance: 0,
  })
  const [chartLayout, setChartLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  // ─── CHANGE 1: AnimatedBar replaced with AnimatedBarEnhanced ──────────────
  const AnimatedBarEnhanced: React.FC<AnimatedBarProps> = ({
    height,
    color,
    value,
    maxHeight = 140,
  }) => {
    const barHeightAnim = useRef(new Animated.Value(0)).current
    const glowAnim = useRef(new Animated.Value(0)).current

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
      ]).start()
    }, [height])

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
        {value > 0 && <Text style={styles.yearlyBarValue}>{value}</Text>}
      </Animated.View>
    )
  }

  const getActiveTabFromPath = () => {
    if (pathname.includes('/main_admin/events')) return 'events'
    if (pathname.includes('/main_admin/attendance')) return 'attendance'
    if (pathname.includes('/main_admin/announcements')) return 'announcements'
    if (pathname.includes('/main_admin/users')) return 'users'
    if (pathname.includes('/main_admin/profile')) return 'profile'
    return 'overview'
  }

  const activeTab = getActiveTabFromPath()

  const fetchUpcomingEvents = () => {
    setEventsLoading(true)
    const now = new Date()

    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'asc'),
      limit(20)
    )

    return onSnapshot(
      eventsQuery,
      (snapshot) => {
        const allEvents = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            const eventDate = data.date?.toDate()
            const status = data.status
            const isApproved = status === 'approved' || !status
            if (!isApproved) return null
            if (!eventDate) return null
            if (eventDate < now) return null

            return {
              id: doc.id,
              title: data.title || 'Untitled Event',
              description: data.description,
              date: eventDate,
              time: data.time,
              location: data.location,
              attendees: data.attendees || [],
              createdAt: data.createdAt?.toDate(),
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 3) as Event[]

        setUpcomingEvents(allEvents)
        setEventsLoading(false)
      },
      (error) => {
        setEventsLoading(false)
      }
    )
  }

  const DonutChart = memo(
    function DonutChart({
      userRoleStats,
      totalUsers,
      dynamic,
      colors,
      isDark,
      styles,
    }: DonutChartProps) {
      const [selectedSlice, setSelectedSlice] = useState<number | null>(0)
      const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)
      const fadeAnim = useRef(new Animated.Value(0)).current
      const scaleAnim = useRef(new Animated.Value(0.9)).current

      useEffect(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
        ]).start()
      }, [])

      const total = totalUsers
      if (total === 0) {
        return (
          <Animated.View
            style={[
              styles.donutChartContainer,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <LinearGradient
              colors={dynamic.chartBackground}
              style={styles.donutGradient}
            >
              <View style={styles.donutChartEmptyContainer}>
                <Ionicons
                  name='people-outline'
                  size={48}
                  color={colors.accent.primary}
                />
                <Text style={styles.donutChartEmptyText}>No user data</Text>
                <Text style={styles.donutChartEmptySubtext}>
                  Users will appear here
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )
      }

      // Build chart data for PieChart
      const chartData = userRoleStats.map((role) => ({
        value: role.count,
        color: role.color,
        gradientColor: role.color,
        text: `${role.percentage}%`,
        label: role.label,
        icon: role.icon,
        description:
          role.role === 'student'
            ? 'Active student accounts'
            : role.role === 'assistant_admin'
              ? 'Assistant administrators'
              : role.role === 'main_admin'
                ? 'Main administrators'
                : 'Deactivated user accounts',
      }))

      const handleSlicePress = (index: number) => {
        setSelectedSlice(selectedSlice === index ? null : index)
      }

      const navigateToUsers = () => {
        // Navigate to the user management screen (adjust route as needed)
        // Assuming router is available; we'll need to pass it or use useRouter
        // For simplicity, we'll call a navigation function passed from parent.
        // Since DonutChart is inside MainAdminDashboard, we can use the navigateTo function from props or context.
        // We'll add a prop `onExplore` or use a global router.
        // For now, we'll assume the parent passes a `onNavigate` callback.
        // Actually we can use the router from the outer scope because this component is defined inside MainAdminDashboard.
        // However, because it's memoized and defined inside the same file, we can capture the router from the outer function.
        // We'll add a `navigation` prop to DonutChart or simply use the parent's navigateTo function.
        // To keep it simple, we'll pass `onExplore` as a prop.
        if (selectedSlice !== null) {
          // Navigate to users page, optionally with a filter
          // For now just go to users
          // We'll need to get the router instance. We'll pass it as a prop.
        }
      }

      return (
        <Animated.View
          style={[
            styles.donutChartContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={dynamic.chartBackground}
            style={styles.donutGradient}
          >
            <View style={styles.donutHeader}>
              <View style={styles.donutHeaderLeft}>
                <View
                  style={[
                    styles.donutIconContainer,
                    { backgroundColor: `${colors.accent.primary}20` },
                  ]}
                >
                  <Ionicons
                    name='pie-chart'
                    size={20}
                    color={colors.accent.primary}
                  />
                </View>
                <View>
                  <Text style={styles.donutTitle}>User Distribution</Text>
                  <Text style={styles.donutSubtitle}>
                    Tap segments for details
                  </Text>
                </View>
              </View>
              <View style={styles.donutTotalBadge}>
                <Text style={styles.donutTotalBadgeText}>{total}</Text>
                <Text style={styles.donutTotalBadgeLabel}>Total Users</Text>
              </View>
            </View>

            <View style={styles.donutChartWrapper}>
              <PieChart
                data={chartData.map((item, index) => ({
                  ...item,
                  onPress: () => handleSlicePress(index),
                  strokeWidth: selectedSlice === index ? 4 : 2,
                  strokeColor:
                    selectedSlice === index ? '#ffffff' : 'transparent',
                }))}
                donut
                showText
                textColor={isDark ? '#ffffff' : '#1e293b'}
                fontWeight='bold'
                innerRadius={60}
                innerCircleColor={isDark ? '#1e293b' : '#ffffff'}
                radius={120}
                focusOnPress
                centerLabelComponent={() => (
                  <View style={styles.donutCenterLabel}>
                    {selectedSlice !== null ? (
                      <>
                        <Text
                          style={[
                            styles.donutCenterValue,
                            { color: chartData[selectedSlice].color },
                          ]}
                        >
                          {chartData[selectedSlice].value}
                        </Text>
                        <Text style={styles.donutCenterText}>
                          {chartData[selectedSlice].label.split(' ')[0]}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.donutCenterValue}>{total}</Text>
                        <Text style={styles.donutCenterText}>Total Users</Text>
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
                    selectedSlice === index &&
                      styles.interactiveLegendItemSelected,
                    hoveredSlice === index &&
                      styles.interactiveLegendItemHovered,
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
                        <Ionicons
                          name={item.icon as any}
                          size={16}
                          color='#ffffff'
                        />
                        <Text style={styles.legendPercent}>{item.text}</Text>
                      </View>
                      <Text style={styles.legendLabel}>{item.label}</Text>
                      <Text style={styles.legendCount}>{item.value} users</Text>
                    </View>
                    {selectedSlice === index && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons
                          name='checkmark-circle'
                          size={20}
                          color='#ffffff'
                        />
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              ))}
            </View>

            {/* Selected Item Details - with default fallback */}
            {selectedSlice !== null ? (
              <Animated.View style={styles.selectedDetailsContainer}>
                <LinearGradient
                  colors={[
                    `${chartData[selectedSlice].color}20`,
                    'transparent',
                  ]}
                  style={styles.selectedDetailsGradient}
                >
                  <Ionicons
                    name={chartData[selectedSlice].icon as any}
                    size={24}
                    color={chartData[selectedSlice].color}
                  />
                  <View style={styles.selectedDetailsText}>
                    <Text
                      style={[
                        styles.selectedDetailsTitle,
                        { color: chartData[selectedSlice].color },
                      ]}
                    >
                      {chartData[selectedSlice].label}
                    </Text>
                    <Text style={styles.selectedDetailsDescription}>
                      {chartData[selectedSlice].description}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.exploreButton,
                      { backgroundColor: chartData[selectedSlice].color },
                    ]}
                    onPress={() => {
                      router.push('/main_admin/users')
                    }}
                  >
                    <Text style={styles.exploreButtonText}>Manage Users</Text>
                    <Ionicons name='arrow-forward' size={16} color='#ffffff' />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            ) : (
              /* Default panel when no slice is selected */
              <Animated.View style={styles.selectedDetailsContainer}>
                <LinearGradient
                  colors={[`${colors.accent.primary}20`, 'transparent']}
                  style={styles.selectedDetailsGradient}
                >
                  <Ionicons
                    name='people'
                    size={24}
                    color={colors.accent.primary}
                  />
                  <View style={styles.selectedDetailsText}>
                    <Text
                      style={[
                        styles.selectedDetailsTitle,
                        { color: colors.accent.primary },
                      ]}
                    >
                      User Distribution
                    </Text>
                    <Text style={styles.selectedDetailsDescription}>
                      Tap segment for details.
                    </Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>
      )
    },
    (prevProps, nextProps) => {
      // Custom comparison to avoid unnecessary re-renders
      if (prevProps.totalUsers !== nextProps.totalUsers) return false
      if (prevProps.isDark !== nextProps.isDark) return false
      const prevStats = prevProps.userRoleStats
      const nextStats = nextProps.userRoleStats
      if (prevStats.length !== nextStats.length) return false
      for (let i = 0; i < prevStats.length; i++) {
        if (
          prevStats[i].count !== nextStats[i].count ||
          prevStats[i].percentage !== nextStats[i].percentage
        ) {
          return false
        }
      }
      return true
    }
  )
  const fetchPendingApprovals = () => {
    const pendingAnnouncementsQuery = query(
      collection(db, 'announcements'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )

    const pendingEventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribeAnnouncements = onSnapshot(
      pendingAnnouncementsQuery,
      (snapshot) => {
        const announcements = snapshot.docs.map((doc) => ({
          id: doc.id,
          type: 'announcement' as const,
          title: doc.data().title || 'New Announcement',
          description: `Created by ${doc.data().createdByName || doc.data().createdBy || 'Assistant Admin'}`,
          requestedBy:
            doc.data().createdByName ||
            doc.data().createdBy ||
            'Assistant Admin',
          requestedAt: doc.data().createdAt?.toDate() || new Date(),
          data: { ...doc.data(), id: doc.id },
        }))

        updatePendingApprovals(announcements, 'announcement')
      }
    )

    const unsubscribeEvents = onSnapshot(pendingEventsQuery, (snapshot) => {
      const events = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: 'event' as const,
        title: doc.data().title || 'New Event',
        description: `Created by ${doc.data().createdByName || doc.data().createdBy || 'Assistant Admin'}`,
        requestedBy:
          doc.data().createdByName || doc.data().createdBy || 'Assistant Admin',
        requestedAt: doc.data().createdAt?.toDate() || new Date(),
        data: { ...doc.data(), id: doc.id },
      }))

      updatePendingApprovals(events, 'event')
    })

    return () => {
      unsubscribeAnnouncements()
      unsubscribeEvents()
    }
  }

  const updatePendingApprovals = (
    newItems: PendingApproval[],
    type: string
  ) => {
    setPendingApprovals((prev) => {
      const filtered = prev.filter((item) => item.type !== type)
      const combined = [...filtered, ...newItems]
      return combined.sort(
        (a, b) => b.requestedAt.getTime() - a.requestedAt.getTime()
      )
    })
  }

  const fetchRecentAnnouncements = () => {
    setAnnouncementsLoading(true)

    const announcementsQuery = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )

    return onSnapshot(
      announcementsQuery,
      (snapshot) => {
        const approvedAnnouncements = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            const status = data.status
            const isApproved = status === 'approved' || !status
            if (!isApproved) return null

            return {
              id: doc.id,
              title: data.title || 'Announcement',
              content: data.content || data.message || 'No content',
              createdAt: data.createdAt?.toDate() || new Date(),
              priority: data.priority || 'normal',
              author: data.createdByName || data.author || 'Admin',
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .slice(0, 3) as Announcement[]

        setRecentAnnouncements(approvedAnnouncements)
        setAnnouncementsLoading(false)
      },
      (error) => {
        setAnnouncementsLoading(false)
      }
    )
  }

  useEffect(() => {
    fetchDashboardStats()
    fetchUserRoleStats()

    const unsubscribeActivities = setupRealtimeActivities()
    const unsubscribeEvents = fetchUpcomingEvents()
    const unsubscribeAnnouncements = fetchRecentAnnouncements()

    calculateMonthlyStats()
    calculateYearlyStats()

    return () => {
      unsubscribeActivities()
      unsubscribeEvents()
      unsubscribeAnnouncements()
    }
  }, [])

  useEffect(() => {
    fetchDashboardStats()
    const unsubscribeActivities = setupRealtimeActivities()
    const unsubscribeEvents = fetchUpcomingEvents()
    const unsubscribeAnnouncements = fetchRecentAnnouncements()
    const unsubscribeApprovals = fetchPendingApprovals()
    calculateMonthlyStats()
    calculateYearlyStats()

    if (userData?.email) {
      const unsubscribeNotifications =
        notificationService.listenForNotifications(userData.email, (notifs) => {
          setNotifications(notifs)
          setUnreadCount(
            notifs.filter((n) => !n.read).length + pendingApprovals.length
          )
        })

      return () => {
        unsubscribeActivities()
        unsubscribeEvents()
        unsubscribeAnnouncements()
        unsubscribeApprovals()
        unsubscribeNotifications()
        notificationService.cleanup()
      }
    }
    return () => {
      unsubscribeActivities()
      unsubscribeEvents()
      unsubscribeAnnouncements()
      unsubscribeApprovals()
    }
  }, [userData, pendingApprovals.length])

  const handleApprove = async (approval: PendingApproval) => {
    try {
      const collectionName =
        approval.type === 'announcement' ? 'announcements' : 'events'
      const docRef = doc(db, collectionName, approval.id)

      // 1. Update status to approved
      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userData?.email,
      })

      // 2. Notify the creator (assistant admin) that it's approved
      if (approval.data?.createdBy) {
        await notificationService.createNotification({
          userId: approval.data.createdBy,
          title: `${approval.type === 'announcement' ? 'Announcement' : 'Event'} Approved`,
          message: `Your "${approval.title}" has been approved by the main admin.`,
          type: approval.type,
          timestamp: new Date(),
          data: { [`${approval.type}Id`]: approval.id },
        })
      }

      // 3. 🔥 NEW: Notify ALL students
      // Fetch all student userIds from the 'users' collection
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      )
      const studentSnap = await getDocs(studentsQuery)
      const studentIds = studentSnap.docs.map((doc) => doc.id)

      if (studentIds.length > 0) {
        // Prepare notification data based on type
        const notificationPromises = studentIds.map((studentId) =>
          notificationService.createNotification({
            userId: studentId,
            title:
              approval.type === 'announcement'
                ? `New Announcement: ${approval.title}`
                : `New Event: ${approval.title}`,
            message:
              approval.type === 'announcement'
                ? approval.data?.message || approval.description
                : approval.data?.description ||
                  `${approval.title} is happening soon!`,
            type: approval.type, // 'announcement' or 'event'
            timestamp: new Date(),
            priority:
              approval.data?.priority === 'urgent'
                ? 'high'
                : approval.data?.priority === 'important'
                  ? 'medium'
                  : 'low',
            data: {
              [`${approval.type}Id`]: approval.id,
              approvedBy: userData?.email,
            },
          })
        )
        await Promise.all(notificationPromises)
      }

      // Success feedback (web or native)
      if (Platform.OS === 'web') {
        window.alert(
          `${approval.type} approved and ${studentIds.length} student(s) notified!`
        )
      } else {
        Alert.alert(
          'Success',
          `${approval.type} approved and ${studentIds.length} student(s) notified!`
        )
      }
    } catch (error) {
      console.error('Approval error:', error)
      if (Platform.OS === 'web') {
        window.alert('Failed to approve. Please try again.')
      } else {
        Alert.alert('Error', 'Failed to approve. Please try again.')
      }
    }
  }
  const handleReject = (approval: PendingApproval) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to reject "${approval.title}"?`
      )
      if (confirmed) {
        performReject(approval)
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
      )
    }
  }

  const performReject = async (approval: PendingApproval) => {
    try {
      const collectionName =
        approval.type === 'announcement' ? 'announcements' : 'events'
      const docRef = doc(db, collectionName, approval.id)

      await updateDoc(docRef, {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: userData?.email || 'unknown',
      })

      if (approval.data?.createdBy) {
        try {
          await notificationService.createNotification({
            userId: approval.data.createdBy,
            title: `${approval.type === 'announcement' ? 'Announcement' : 'Event'} Rejected`,
            message: `Your "${approval.title}" has been rejected by the main admin.`,
            type: approval.type,
            timestamp: new Date(),
            data: { [`${approval.type}Id`]: approval.id },
          })
        } catch (notifyError) {}
      }

      if (Platform.OS === 'web') {
        window.alert(`${approval.type} has been rejected.`)
      } else {
        Alert.alert('Rejected', `${approval.type} has been rejected.`)
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Failed to reject. Check console for details.')
      } else {
        Alert.alert('Error', 'Failed to reject. Check console for details.')
      }
    }
  }

  useEffect(() => {
    const unreadNotifications = notifications.filter((n) => !n.read).length
    setUnreadCount(unreadNotifications + pendingApprovals.length)
    setApprovalCount(pendingApprovals.length)
  }, [pendingApprovals, notifications])

  useEffect(() => {
    updateDisplayedActivities()
  }, [recentActivities, currentPage, itemsPerPage])

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    Promise.all([fetchDashboardStats(), calculateMonthlyStats()]).finally(() =>
      setRefreshing(false)
    )
  }, [])

  const updateDisplayedActivities = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedActivities(recentActivities.slice(startIndex, endIndex))
    setTotalPages(Math.ceil(recentActivities.length / itemsPerPage))
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const setupRealtimeActivities = () => {
    setActivitiesLoading(true)

    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const announcementsQuery = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(20)
    )

    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const events = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: `event-${doc.id}`,
          type: 'event' as const,
          title: 'New Event Created',
          description: data.title || 'New event added',
          timestamp: data.createdAt?.toDate() || new Date(),
          icon: 'calendar',
          color: '#0ea5e9',
          data: data,
        }
      })
      updateActivities(events, 'event')
    })

    const unsubscribeAnnouncements = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        const announcements = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: `announcement-${doc.id}`,
            type: 'announcement' as const,
            title: 'New Announcement',
            description: data.title || 'New announcement posted',
            timestamp: data.createdAt?.toDate() || new Date(),
            icon: 'bell',
            color: '#f59e0b',
            data: data,
          }
        })
        updateActivities(announcements, 'announcement')
      }
    )

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: `user-${doc.id}`,
          type: 'user' as const,
          title: 'New User Registered',
          description: data.name || data.email || 'New user joined',
          timestamp: data.createdAt ? new Date(data.createdAt) : new Date(),
          icon: 'user-plus',
          color: '#8b5cf6',
          data: data,
        }
      })
      updateActivities(users, 'user')
    })

    const updateActivities = (newActivities: Activity[], type: string) => {
      setRecentActivities((prev) => {
        const filtered = prev.filter((a) => a.type !== type)
        const combined = [...filtered, ...newActivities]
        const sorted = combined.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
        )
        return sorted.slice(0, 50)
      })
      setActivitiesLoading(false)
    }

    return () => {
      unsubscribeEvents()
      unsubscribeAnnouncements()
      unsubscribeUsers()
    }
  }

  const calculateMonthlyStats = async () => {
    try {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      const months: MonthlyStats[] = []
      const monthKeys: string[] = []

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1)
        const monthKey = date.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })
        const displayMonth = date.toLocaleString('default', { month: 'long' })
        months.push({
          month: displayMonth,
          events: 0,
          attendance: 0,
          announcements: 0,
        })
        monthKeys.push(monthKey)
      }

      const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1)
      const nextMonth = new Date(currentYear, currentMonth + 1, 1)

      const eventsSnapshot = await getDocs(collection(db, 'events'))

      const approvedEvents = eventsSnapshot.docs.filter((doc) => {
        const data = doc.data()
        const eventDate = data.date?.toDate?.() || data.date
        const status = data.status
        const isApproved =
          status === 'approved' ||
          status === undefined ||
          status === null ||
          status === ''
        const isRejected = status === 'rejected'
        const inRange =
          eventDate && eventDate >= sixMonthsAgo && eventDate < nextMonth
        return isApproved && !isRejected && inRange
      })

      let totalAttendance = 0

      approvedEvents.forEach((doc) => {
        const data = doc.data()
        const eventDate = data.date?.toDate?.() || data.date
        if (!eventDate) return

        const monthKey = eventDate.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })
        const monthIndex = monthKeys.indexOf(monthKey)

        if (monthIndex !== -1) {
          months[monthIndex].events += 1
          const attendees = data.attendees?.length || 0
          totalAttendance += attendees
          months[monthIndex].attendance += attendees
        }
      })

      setMonthlyStats(months)
      setChartDataReady(true)
      setDashboardStats((prev) => ({ ...prev, totalAttendance }))
    } catch (error) {}
  }

  const calculateYearlyStats = async () => {
    try {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const months: MonthlyStats[] = []
      const monthKeys: string[] = []

      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1)
        const monthKey = date.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })
        const displayMonth = date.toLocaleString('default', { month: 'long' })
        months.push({
          month: displayMonth,
          events: 0,
          attendance: 0,
          announcements: 0,
        })
        monthKeys.push(monthKey)
      }

      const twelveMonthsAgo = new Date(currentYear, currentMonth - 11, 1)
      const nextMonth = new Date(currentYear, currentMonth + 1, 1)

      const eventsSnapshot = await getDocs(collection(db, 'events'))
      const approvedEvents = eventsSnapshot.docs.filter((doc) => {
        const data = doc.data()
        const eventDate = data.date?.toDate?.() || data.date
        const status = data.status
        const isApproved =
          status === 'approved' ||
          status === undefined ||
          status === null ||
          status === ''
        const isRejected = status === 'rejected'
        const inRange =
          eventDate && eventDate >= twelveMonthsAgo && eventDate < nextMonth
        return isApproved && !isRejected && inRange
      })

      let totalYearlyAttendance = 0

      approvedEvents.forEach((doc) => {
        const data = doc.data()
        const eventDate = data.date?.toDate?.() || data.date
        if (!eventDate) return

        const monthKey = eventDate.toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })
        const monthIndex = monthKeys.indexOf(monthKey)

        if (monthIndex !== -1) {
          months[monthIndex].events += 1
          const attendees = data.attendees?.length || 0
          totalYearlyAttendance += attendees
          months[monthIndex].attendance += attendees
        }
      })

      setYearlyStats(months)
      setDashboardStats((prev) => ({
        ...prev,
        yearlyAttendance: totalYearlyAttendance,
      }))
    } catch (error) {}
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    if (chartDataReady) {
      Animated.timing(chartFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start()
    }
  }, [chartDataReady])

  const handleDownloadReport = async () => {
    console.log('Main admin monthlyStats length:', monthlyStats?.length)
    try {
      setDownloadLoading(true)
      const pdfData = {
        stats: dashboardStats,
        monthlyStats: monthlyStats,
        recentActivities: recentActivities.slice(0, 10),
        upcomingEvents: upcomingEvents,
      }
      const fileUri = await generateDashboardPDF(pdfData)
      await sharePDF(fileUri)
      if (Platform.OS !== 'web') {
        Alert.alert('Success', '✅ Report generated successfully!', [
          { text: 'OK' },
        ])
      }
    } catch (error) {
      Alert.alert('Error', '❌ Failed to generate report. Please try again.', [
        { text: 'OK' },
      ])
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id)
    }
    switch (notification.type) {
      case 'event':
        if (notification.data?.eventId) {
          router.push(`/main_admin/events?id=${notification.data.eventId}`)
        } else {
          navigateTo('events')
        }
        break
      case 'announcement':
        if (notification.data?.announcementId) {
          router.push(
            `/main_admin/announcements?id=${notification.data.announcementId}`
          )
        } else {
          navigateTo('announcements')
        }
        break
      case 'attendance':
        navigateTo('attendance')
        break
      case 'user':
        navigateTo('users')
        break
      default:
        break
    }
  }

  const handleMarkAllRead = async () => {
    if (userData?.email) {
      await notificationService.markAllAsRead(userData.email)
    }
  }

  const handleProfileImagePress = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e: any) => {
          const file = e.target.files[0]
          if (file) {
            await uploadProfileImage(file)
          }
        }
        input.click()
      } else {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (permissionResult.granted === false) {
          Alert.alert(
            'Permission Required',
            'Permission to access camera roll is required!',
            [{ text: 'OK' }]
          )
          return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        })
        if (!result.canceled) {
          await uploadProfileImage(result.assets[0].uri)
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.', [
        { text: 'OK' },
      ])
    }
  }

  const calculateGrowth = (
    data: MonthlyStats[],
    key: 'events' | 'attendance'
  ) => {
    if (data.length < 2) return 0
    const firstValue = data[0][key]
    const lastValue = data[data.length - 1][key]
    if (firstValue === 0) return lastValue > 0 ? 100 : 0
    const growth = ((lastValue - firstValue) / firstValue) * 100
    return Math.round(growth)
  }

  const isNewAnnouncement = (createdAt: Date) => {
    return dayjs(createdAt).isAfter(dayjs().subtract(1, 'day'))
  }

  const isUrgentAnnouncement = (item: Announcement) => {
    return item.priority === 'urgent'
  }

  const isImportantAnnouncement = (item: Announcement) => {
    return item.priority === 'important'
  }

  const getPriorityColor = (item: Announcement) => {
    if (item.priority === 'urgent') return '#ef4444'
    if (item.priority === 'important') return '#f59e0b'
    return '#0ea5e9' // normal
  }

  const uploadProfileImage = async (imageUri: string | File) => {
    try {
      setUploadingImage(true)
      let blob: Blob
      if (imageUri instanceof File) {
        blob = imageUri
      } else {
        const response = await fetch(imageUri)
        blob = await response.blob()
      }
      const storage = getStorage()
      const fileName = `profile_${userData?.email}_${Date.now()}.jpg`
      const storageRef = ref(storage, `profileImages/${fileName}`)
      await uploadBytes(storageRef, blob)
      const downloadUrl = await getDownloadURL(storageRef)
      if (userData?.email) {
        const userRef = doc(db, 'users', userData.email)
        await updateDoc(userRef, { photoURL: downloadUrl })
        Alert.alert('Success', 'Profile image updated successfully!', [
          { text: 'OK' },
        ])
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image. Please try again.', [
        { text: 'OK' },
      ])
    }
  }

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const totalUsers = usersSnapshot.size
      const activeUsers = usersSnapshot.docs.filter(
        (doc) => doc.data().active !== false
      ).length

      const eventsSnapshot = await getDocs(collection(db, 'events'))

      let totalEvents = 0
      let approvedEvents = 0
      let pendingEvents = 0
      let rejectedEvents = 0
      let upcomingEvents = 0
      let totalAttendanceAllTime = 0

      const now = new Date()

      eventsSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        const status = data.status
        const isApproved =
          status === 'approved' ||
          status === undefined ||
          status === null ||
          status === ''
        const isPending = status === 'pending'
        const isRejected = status === 'rejected'
        totalEvents++
        if (isApproved) approvedEvents++
        if (isPending) pendingEvents++
        if (isRejected) rejectedEvents++
        if (isApproved) {
          const eventDate = data.date?.toDate?.() || data.date
          if (eventDate && eventDate > now) upcomingEvents++
          const attendees = data.attendees?.length || 0
          totalAttendanceAllTime += attendees
        }
      })

      const announcementsSnapshot = await getDocs(
        collection(db, 'announcements')
      )
      const totalAnnouncements = announcementsSnapshot.size
      const pendingAnnouncements = announcementsSnapshot.docs.filter(
        (doc) => doc.data().status === 'pending'
      ).length
      const approvedAnnouncements = announcementsSnapshot.docs.filter(
        (doc) => doc.data().status === 'approved'
      ).length
      const rejectedAnnouncements = announcementsSnapshot.docs.filter(
        (doc) => doc.data().status === 'rejected'
      ).length

      let pendingVerifications = 0
      eventsSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        const status = data.status
        const isApproved =
          status === 'approved' ||
          status === undefined ||
          status === null ||
          status === ''
        if (isApproved && data.coordinates && data.attendees) {
          const unverified = data.attendees.filter(
            (a: any) => !a.location?.isWithinRadius
          ).length
          pendingVerifications += unverified
        }
      })

      const userGrowth =
        totalUsers > 0
          ? ((activeUsers - totalUsers * 0.8) / (totalUsers * 0.8)) * 100
          : 0
      const eventGrowth =
        approvedEvents > 0
          ? ((upcomingEvents - approvedEvents * 0.3) / (approvedEvents * 0.3)) *
            100
          : 0

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
      })
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const navigateTo = (screen: string, id?: string) => {
    switch (screen) {
      case 'events':
        router.push(id ? `/main_admin/events?id=${id}` : '/main_admin/events')
        break
      case 'attendance':
        router.push('/main_admin/attendance')
        break
      case 'announcements':
        router.push(
          id
            ? `/main_admin/announcements?id=${id}`
            : '/main_admin/announcements'
        )
        break
      case 'users':
        router.push('/main_admin/users')
        break
      case 'profile':
        router.push('/main_admin/profile')
        break
      default:
        break
    }
  }

  const getActivityIcon = (activity: Activity) => {
    switch (activity.type) {
      case 'event':
        return <Ionicons name='calendar' size={16} color='#ffffff' />
      case 'attendance':
        return <Feather name='check-square' size={16} color='#ffffff' />
      case 'announcement':
        return <Feather name='bell' size={16} color='#ffffff' />
      case 'user':
        return <Feather name='user-plus' size={16} color='#ffffff' />
      default:
        return <Feather name='activity' size={16} color='#ffffff' />
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getDynamicStyles = () => ({
    headerGradient: isDark
      ? (['#0f172a', '#1e293b'] as const)
      : (['#1e40af', '#3b82f6'] as const),
    chartBackground: isDark
      ? (['#1e293b', '#121e39'] as const)
      : (['#f0f9ff', '#ffffff'] as const),
    statCardBorder: isDark ? '#3b82f6' : '#1266d4',
    textPrimary: colors.text,
    textSecondary: colors.sidebar.text.secondary,
    textMuted: colors.sidebar.text.muted,
    cardBg: colors.card,
    borderColor: colors.border,
  })

  const dynamic = useMemo(() => getDynamicStyles(), [isDark, colors])

  const renderStatCard = (
    title: string,
    value: string | number,
    icon: any,
    color: string,
    trend?: number,
    subtitle?: string
  ) => (
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
  )

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.paginationButtonDisabled,
          ]}
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        >
          <Feather
            name='chevron-left'
            size={18}
            color={currentPage === 1 ? '#cbd5e1' : '#0ea5e9'}
          />
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === 1 && styles.paginationButtonTextDisabled,
            ]}
          >
            Prev
          </Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={[styles.pageInfoText, { color: dynamic.textPrimary }]}>
            {currentPage}/{totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.paginationButtonDisabled,
          ]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === totalPages && styles.paginationButtonTextDisabled,
            ]}
          >
            Next
          </Text>
          <Feather
            name='chevron-right'
            size={18}
            color={currentPage === totalPages ? '#cbd5e1' : '#0ea5e9'}
          />
        </TouchableOpacity>
      </View>
    )
  }

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
  )

  const renderOverview = () => (
    <Animated.View
      style={[
        styles.overviewContainer,
        {
          backgroundColor: colors.background,
          opacity: pageFadeAnim,
          transform: [{ translateY: pageSlideAnim }],
        },
      ]}
    >
      <ScrollView
        style={[
          styles.overviewContainer,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
          />
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
              <Text
                style={[
                  styles.greetingText,
                  { color: isDark ? dynamic.textSecondary : '#ffffff' },
                ]}
              >
                Welcome back,
              </Text>
              <Text style={styles.userName}>{userData?.name || 'Admin'}</Text>
              <Text
                style={[
                  styles.roleText,
                  { color: isDark ? dynamic.textMuted : '#ffffff' },
                ]}
              >
                Administrator
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfileImagePress}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <View style={[styles.profileImage, styles.profileFallback]}>
                  <ActivityIndicator size='small' color='#ffffff' />
                </View>
              ) : userData?.photoURL ? (
                <Image
                  source={{ uri: userData.photoURL }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={[styles.profileImage, styles.profileFallback]}>
                  <Text style={styles.profileInitials}>
                    {userData?.name
                      ? userData.name.charAt(0).toUpperCase()
                      : 'A'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dateSection}>
            <View style={styles.dateContainer}>
              <Text
                style={[
                  styles.dateText,
                  { color: isDark ? dynamic.textSecondary : '#ffffff' },
                ]}
              >
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
                style={[
                  styles.headerAction,
                  { backgroundColor: 'rgba(255,255,255,0.1)' },
                ]}
                onPress={handleDownloadReport}
                disabled={downloadLoading}
              >
                {downloadLoading ? (
                  <ActivityIndicator size='small' color='#ffffff' />
                ) : (
                  <Feather name='download' size={18} color='#ffffff' />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.headerAction,
                  { backgroundColor: 'rgba(255,255,255,0.1)' },
                ]}
                onPress={() => setNotificationModalVisible(true)}
              >
                <Feather name='bell' size={18} color='#ffffff' />
                {unreadCount > 0 && (
                  <View
                    style={[
                      styles.notificationBadge,
                      approvalCount > 0 && styles.approvalBadge,
                    ]}
                  >
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
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
            <View
              style={[
                styles.statsGridContainer,
                {
                  backgroundColor: dynamic.cardBg,
                  borderRadius: 20,
                  padding: 16,
                },
              ]}
            >
              <View style={styles.interactiveLegendContainer}>
                {/* Total Users */}
                <Pressable
                  style={[styles.interactiveLegendItem, { minWidth: '45%' }]}
                  onPress={() => navigateTo('users')}
                >
                  <LinearGradient
                    colors={['#0ea5e9', '#0284c7']}
                    style={styles.legendGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.legendContent}>
                      <View style={styles.legendIconRow}>
                        <Ionicons name='people' size={16} color='#ffffff' />
                        <Text style={styles.legendPercent}>
                          {dashboardStats.totalUsers}
                        </Text>
                      </View>
                      <Text style={styles.legendLabel}>Total Users</Text>
                      <Text style={styles.legendCount}>
                        {dashboardStats.userGrowth > 0 ? '+' : ''}
                        {dashboardStats.userGrowth.toFixed(1)}% growth
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Total Events */}
                <Pressable
                  style={styles.interactiveLegendItem}
                  onPress={() => navigateTo('events')}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    style={styles.legendGradient}
                  >
                    <View style={styles.legendContent}>
                      <View style={styles.legendIconRow}>
                        <Ionicons name='calendar' size={16} color='#ffffff' />
                        <Text style={styles.legendPercent}>
                          {dashboardStats.totalEvents}
                        </Text>
                      </View>
                      <Text style={styles.legendLabel}>Total Events</Text>
                      <Text style={styles.legendCount}>
                        {calculateGrowth(monthlyStats, 'events') > 0 ? '+' : ''}
                        {calculateGrowth(monthlyStats, 'events')}% trend
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Announcements */}
                <Pressable
                  style={styles.interactiveLegendItem}
                  onPress={() => navigateTo('announcements')}
                >
                  <LinearGradient
                    colors={['#8b5cf6', '#7c3aed']}
                    style={styles.legendGradient}
                  >
                    <View style={styles.legendContent}>
                      <View style={styles.legendIconRow}>
                        <Ionicons name='megaphone' size={16} color='#ffffff' />
                        <Text style={styles.legendPercent}>
                          {dashboardStats.totalAnnouncements}
                        </Text>
                      </View>
                      <Text style={styles.legendLabel}>Announcements</Text>
                      <Text style={styles.legendCount}>
                        {dashboardStats.pendingAnnouncements} pending approval
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>

                {/* Need Approval */}
                <Pressable
                  style={styles.interactiveLegendItem}
                  onPress={() => setNotificationModalVisible(true)}
                >
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    style={styles.legendGradient}
                  >
                    <View style={styles.legendContent}>
                      <View style={styles.legendIconRow}>
                        <Ionicons
                          name='alert-circle'
                          size={16}
                          color='#ffffff'
                        />
                        <Text style={styles.legendPercent}>
                          {pendingApprovals.length}
                        </Text>
                      </View>
                      <Text style={styles.legendLabel}>Need Approval</Text>
                      <Text style={styles.legendCount}>
                        {
                          pendingApprovals.filter((p) => p.type === 'event')
                            .length
                        }{' '}
                        events •{' '}
                        {
                          pendingApprovals.filter(
                            (p) => p.type === 'announcement'
                          ).length
                        }{' '}
                        updates
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.activityHeaderRow}>
          <Text style={[styles.sectionTitle, { color: dynamic.textPrimary }]}>
            Recent Activity
          </Text>
          <View style={styles.pageSizeSelector}>
            <Text style={{ color: dynamic.textSecondary, marginRight: 8 }}>
              Show:
            </Text>
            <View style={styles.pageSizeOptions}>
              {[5, 10, 15, 20].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.pageSizeOption,
                    itemsPerPage === size && styles.pageSizeOptionActive,
                  ]}
                  onPress={() => {
                    setItemsPerPage(size)
                    setCurrentPage(1)
                  }}
                >
                  <Text
                    style={[
                      styles.pageSizeOptionText,
                      itemsPerPage === size && { color: '#fff' },
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.twoColumnLayout}>
          <View style={[styles.column, styles.activityColumn]}>
            <View
              style={[
                styles.activityList,
                {
                  backgroundColor: dynamic.cardBg,
                  borderColor: dynamic.borderColor,
                },
              ]}
            >
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
                      onPress={() => {
                        if (activity.type === 'event')
                          navigateTo('events', activity.data?.id)
                        else if (activity.type === 'announcement')
                          navigateTo('announcements', activity.data?.id)
                        else if (activity.type === 'user') navigateTo('users')
                      }}
                    />
                  ))}
                  {renderPagination()}
                </>
              ) : (
                <View style={styles.emptyActivity}>
                  <Feather
                    name='activity'
                    size={32}
                    color={dynamic.textMuted}
                  />
                  <Text
                    style={[
                      styles.emptyActivityText,
                      { color: dynamic.textMuted },
                    ]}
                  >
                    No recent activity
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/*  <View style={[styles.column, styles.upcomingColumn]}>
            <View
              style={[
                styles.upcomingCard,
                {
                  backgroundColor: dynamic.cardBg,
                  borderColor: dynamic.borderColor,
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOpacity: isDark ? 0.3 : 0.05,
                },
              ]}
            >
              <View style={styles.upcomingHeader}>
                <Text
                  style={[styles.upcomingTitle, { color: dynamic.textPrimary }]}
                >
                  Upcoming Events
                </Text>
                <TouchableOpacity onPress={() => navigateTo('events')}>
                  <Text
                    style={[
                      styles.viewAllText,
                      { color: colors.accent.primary },
                    ]}
                  >
                    View all
                  </Text>
                </TouchableOpacity>
              </View>

              {eventsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size='small'
                    color={colors.accent.primary}
                  />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: dynamic.textSecondary },
                    ]}
                  >
                    Loading events...
                  </Text>
                </View>
              ) : upcomingEvents.length > 0 ? (
                <View style={styles.upcomingList}>
                  {upcomingEvents.map((event) => {
                    const eventDate = event.date
                    const day = eventDate.getDate().toString().padStart(2, '0')
                    const month = eventDate
                      .toLocaleString('default', { month: 'short' })
                      .toUpperCase()
                    const timeString =
                      event.time ||
                      eventDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })

                    // Countdown
                    const diffDays = Math.ceil(
                      (eventDate.getTime() - Date.now()) / (1000 * 3600 * 24)
                    )
                    const countdownText =
                      diffDays === 0
                        ? 'Today'
                        : diffDays === 1
                          ? 'Tomorrow'
                          : `In ${diffDays} days`

                    // Attendee avatars (first 3)
                    const attendees = event.attendees || []
                    const displayAvatars = attendees.slice(0, 3)

                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={styles.upcomingItemCard}
                        onPress={() => navigateTo('events', event.id)}
                        activeOpacity={0.9}
                      >
                        <LinearGradient
                          colors={
                            isDark
                              ? ['#1e293b', '#0f172a']
                              : ['#ffffff', '#f8fafc']
                          }
                          style={styles.upcomingItemGradient}
                        >
                          <View style={styles.upcomingItemLeft}>
                            <LinearGradient
                              colors={['#0ea5e9', '#0284c7']}
                              style={styles.eventDateBadge}
                            >
                              <Text style={styles.eventDayLarge}>{day}</Text>
                              <Text style={styles.eventMonthSmall}>
                                {month}
                              </Text>
                            </LinearGradient>
                            <View style={styles.eventDetails}>
                              <Text
                                style={[
                                  styles.eventName,
                                  { color: dynamic.textPrimary },
                                ]}
                                numberOfLines={1}
                              >
                                {event.title}
                              </Text>
                              <View style={styles.eventMeta}>
                                <Ionicons
                                  name='time-outline'
                                  size={12}
                                  color={dynamic.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.eventMetaText,
                                    { color: dynamic.textSecondary },
                                  ]}
                                >
                                  {timeString}
                                </Text>
                                <View style={styles.metaDivider} />
                                <Ionicons
                                  name='location-outline'
                                  size={12}
                                  color={dynamic.textSecondary}
                                />
                                <Text
                                  style={[
                                    styles.eventMetaText,
                                    { color: dynamic.textSecondary },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {event.location || 'TBA'}
                                </Text>
                              </View>
                              <View style={styles.countdownContainer}>
                                <Feather
                                  name='clock'
                                  size={10}
                                  color='#f59e0b'
                                />
                                <Text style={styles.countdownText}>
                                  {countdownText}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View style={styles.upcomingItemRight}>
                            {displayAvatars.length > 0 && (
                              <View style={styles.avatarStack}>
                                {displayAvatars.map((attendee, idx) => (
                                  <View
                                    key={idx}
                                    style={[
                                      styles.avatarCircle,
                                      { zIndex: displayAvatars.length - idx },
                                    ]}
                                  >
                                    <Text style={styles.avatarInitial}>
                                      {(typeof attendee === 'string'
                                        ? attendee.charAt(0)
                                        : 'U'
                                      ).toUpperCase()}
                                    </Text>
                                  </View>
                                ))}
                                {attendees.length > 3 && (
                                  <View style={styles.avatarMore}>
                                    <Text style={styles.avatarMoreText}>
                                      +{attendees.length - 3}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}
                            <Feather
                              name='chevron-right'
                              size={20}
                              color={dynamic.textMuted}
                            />
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Feather
                    name='calendar'
                    size={32}
                    color={dynamic.textMuted}
                  />
                  <Text
                    style={[styles.emptyText, { color: dynamic.textMuted }]}
                  >
                    No upcoming events
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.createButton,
                      { backgroundColor: colors.accent.primary },
                    ]}
                    onPress={() => navigateTo('events')}
                  >
                    <Text style={styles.createButtonText}>Create Event</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View
              style={[
                styles.announcementCard,
                {
                  backgroundColor: dynamic.cardBg,
                  borderColor: dynamic.borderColor,
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOpacity: isDark ? 0.3 : 0.05,
                },
              ]}
            >
              <View style={styles.announcementHeader}>
                <Text
                  style={[
                    styles.announcementTitle,
                    { color: dynamic.textPrimary },
                  ]}
                >
                  Recent Announcements
                </Text>
                <TouchableOpacity onPress={() => navigateTo('announcements')}>
                  <Text
                    style={[
                      styles.viewAllText,
                      { color: colors.accent.primary },
                    ]}
                  >
                    View all
                  </Text>
                </TouchableOpacity>
              </View>

              {announcementsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size='small'
                    color={colors.accent.primary}
                  />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: dynamic.textSecondary },
                    ]}
                  >
                    Loading announcements...
                  </Text>
                </View>
              ) : recentAnnouncements.length > 0 ? (
                <View style={styles.announcementList}>
                  {recentAnnouncements.map((announcement) => {
                    const priorityColor = getPriorityColor(announcement)
                    const isNew = isNewAnnouncement(announcement.createdAt)
                    const isUrgent = isUrgentAnnouncement(announcement)
                    const isImportant = isImportantAnnouncement(announcement)
                    const timeAgo = dayjs(announcement.createdAt).fromNow()
                    const preview =
                      announcement.content.substring(0, 70) +
                      (announcement.content.length > 70 ? '...' : '')

                    return (
                      <TouchableOpacity
                        key={announcement.id}
                        style={[
                          styles.announcementItemModern,
                          {
                            borderLeftColor: priorityColor,
                            borderLeftWidth: 4,
                          },
                        ]}
                        onPress={() =>
                          navigateTo('announcements', announcement.id)
                        }
                        activeOpacity={0.7}
                      >
                        <LinearGradient
                          colors={
                            isDark
                              ? ['#1e293b', '#0f172a']
                              : ['#ffffff', '#faf5ff']
                          }
                          style={styles.announcementGradientModern}
                        >
                          <View style={styles.announcementContentModern}>
                            <View style={styles.announcementHeaderModern}>
                              <Text
                                style={[
                                  styles.announcementTitleModern,
                                  { color: dynamic.textPrimary },
                                ]}
                                numberOfLines={1}
                              >
                                {announcement.title}
                              </Text>
                              <View style={styles.badgeContainer}>
                                {isNew && (
                                  <View
                                    style={[
                                      styles.badge,
                                      { backgroundColor: '#3b82f6' },
                                    ]}
                                  >
                                    <Text style={styles.badgeText}>NEW</Text>
                                  </View>
                                )}
                                {isUrgent && (
                                  <View
                                    style={[
                                      styles.badge,
                                      { backgroundColor: '#ef4444' },
                                    ]}
                                  >
                                    <Text style={styles.badgeText}>URGENT</Text>
                                  </View>
                                )}
                                {isImportant && !isUrgent && (
                                  <View
                                    style={[
                                      styles.badge,
                                      { backgroundColor: '#f59e0b' },
                                    ]}
                                  >
                                    <Text style={styles.badgeText}>
                                      IMPORTANT
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            <Text
                              style={[
                                styles.announcementPreviewModern,
                                { color: dynamic.textSecondary },
                              ]}
                              numberOfLines={2}
                            >
                              {preview}
                            </Text>
                            <View style={styles.announcementFooterModern}>
                              <Text
                                style={[
                                  styles.announcementTimeModern,
                                  { color: dynamic.textMuted },
                                ]}
                              >
                                {timeAgo} • {announcement.author}
                              </Text>
                              <Feather
                                name='chevron-right'
                                size={16}
                                color={dynamic.textMuted}
                              />
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Feather name='bell' size={32} color={dynamic.textMuted} />
                  <Text
                    style={[styles.emptyText, { color: dynamic.textMuted }]}
                  >
                    No announcements yet
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.createButton,
                      { backgroundColor: colors.accent.primary },
                    ]}
                    onPress={() => navigateTo('announcements')}
                  >
                    <Text style={styles.createButtonText}>
                      Create Announcement
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View> 
            */}
        </View>
      </ScrollView>
    </Animated.View>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return <MainAdminEvents />
      case 'attendance':
        return <MainAdminAttendance />
      case 'announcements':
        return <MainAdminAnnouncements />
      case 'users':
        return <UserManagement />
      case 'profile':
        return <MainAdminProfile />
      case 'overview':
      default:
        return renderOverview()
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentArea}>{renderContent()}</View>
    </View>
  )
}
