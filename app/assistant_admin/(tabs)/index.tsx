import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
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
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
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

import { NotificationModal } from '../../../components/NotificationModal'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { db } from '../../../lib/firebaseConfig'
import { styles } from '../../../styles/assistant-admin/dashboardStyles'
import { Notification, notificationService } from '../../../utils/notifications'
import { generateDashboardPDF, sharePDF } from '../../../utils/pdfGenerator'

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

interface Event {
  id: string
  title: string
  description?: string
  date: Date
  time?: string
  location?: string
  attendees?: any[]
  createdAt?: Date
  status?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  createdAt: Date
  priority?: 'high' | 'medium' | 'low'
  author?: string
  status?: string
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

const AnimatedCounter = ({
  value,
  duration = 1500,
  color = '#ffffff',
}: {
  value: number
  duration?: number
  color?: string
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    animatedValue.setValue(0)
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(Math.floor(value))
    })
    return () => animatedValue.removeListener(listener)
  }, [value])

  return <Text style={[styles.counterText, { color }]}>{displayValue}</Text>
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
  delay = 0,
  onPress,
}: {
  title: string
  value: number
  icon: string
  color: string
  subtitle?: string
  trend?: number
  delay?: number
  onPress?: () => void
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

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
    ]).start()
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
    ).start()
  }, [delay])

  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 5,
      useNativeDriver: true,
    }).start()
  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start()

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
          { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={[color + '20', color + '05'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCardGradient}
        >
          <View style={styles.statCardHeader}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: color + '30' },
              ]}
            >
              <Feather name={icon as any} size={20} color={color} />
            </View>
            {trend !== undefined && (
              <View
                style={[
                  styles.trendBadge,
                  { backgroundColor: trend >= 0 ? '#10b98120' : '#ef444420' },
                ]}
              >
                <Feather
                  name={trend >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={trend >= 0 ? '#10b981' : '#ef4444'}
                />
                <Text
                  style={[
                    styles.trendText,
                    { color: trend >= 0 ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {Math.abs(trend)}%
                </Text>
              </View>
            )}
          </View>
          <AnimatedCounter value={value} color='#ffffff' />
          <Text style={styles.statLabel}>{title}</Text>
          {subtitle && <Text style={styles.statSubtext}>{subtitle}</Text>}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  )
}

const AdminContentDistribution = ({
  donutData,
  isDark,
  colors,
}: {
  donutData: {
    upcoming: number
    past: number
    pending: number
    rejected: number
    announcements: number
  }
  isDark: boolean
  colors: any
}) => {
  const [selectedSlice, setSelectedSlice] = useState<number | null>(null)
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start()
  }, [])

  const total =
    donutData.upcoming +
    donutData.past +
    donutData.pending +
    donutData.rejected +
    donutData.announcements

  const segments = [
    {
      value: donutData.upcoming,
      color: '#3b82f6',
      gradientColor: '#2563eb',
      label: 'Upcoming Events',
      icon: 'time-outline' as const,
      description: 'Approved & upcoming events',
    },
    {
      value: donutData.past,
      color: '#64748b',
      gradientColor: '#475569',
      label: 'Past Events',
      icon: 'calendar-outline' as const,
      description: 'Concluded events',
    },
    {
      value: donutData.pending,
      color: '#f59e0b',
      gradientColor: '#d97706',
      label: 'Pending Review',
      icon: 'hourglass-outline' as const,
      description: 'Awaiting admin approval',
    },
    {
      value: donutData.rejected,
      color: '#ef4444',
      gradientColor: '#dc2626',
      label: 'Rejected',
      icon: 'close-circle-outline' as const,
      description: 'Rejected by admin',
    },
    {
      value: donutData.announcements,
      color: '#8b5cf6',
      gradientColor: '#7c3aed',
      label: 'Announcements',
      icon: 'megaphone-outline' as const,
      description: 'Active announcements',
    },
  ].filter((s) => s.value > 0) // hide zero segments

  if (total === 0) {
    return (
      <View
        style={{
          margin: 16,
          padding: 24,
          borderRadius: 20,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          alignItems: 'center',
        }}
      >
        <Ionicons
          name='pie-chart-outline'
          size={40}
          color={isDark ? '#475569' : '#cbd5e1'}
        />
        <Text
          style={{
            color: isDark ? '#94a3b8' : '#64748b',
            marginTop: 10,
            fontSize: 14,
          }}
        >
          No data yet
        </Text>
      </View>
    )
  }

  const pct = (v: number) =>
    total > 0 ? `${Math.round((v / total) * 100)}%` : '0%'

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        margin: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 12,
        elevation: 5,
      }}
    >
      <LinearGradient
        colors={isDark ? ['#1e293b', '#0f172a'] : ['#ffffff', '#f8fafc']}
        style={{ padding: 20 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#3b82f618',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name='pie-chart' size={18} color='#3b82f6' />
            </View>
            <View>
              <Text
                style={{
                  color: isDark ? '#ffffff' : '#1e293b',
                  fontWeight: '700',
                  fontSize: 16,
                }}
              >
                Content Distribution
              </Text>
              <Text
                style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: 12,
                  marginTop: 1,
                }}
              >
                Tap segments for details
              </Text>
            </View>
          </View>
          <View
            style={{
              backgroundColor: isDark ? '#334155' : '#f1f5f9',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 6,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: isDark ? '#ffffff' : '#1e293b',
                fontWeight: '700',
                fontSize: 16,
              }}
            >
              {total}
            </Text>
            <Text
              style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
            >
              Total
            </Text>
          </View>
        </View>

        {/* Donut */}
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <PieChart
            data={segments.map((s, i) => ({
              value: s.value,
              color: s.color,
              gradientColor: s.gradientColor,
              text: pct(s.value),
              onPress: () => setSelectedSlice(selectedSlice === i ? null : i),
              strokeWidth: selectedSlice === i ? 4 : 2,
              strokeColor: selectedSlice === i ? '#ffffff' : 'transparent',
            }))}
            donut
            showText
            textColor={isDark ? '#ffffff' : '#1e293b'}
            fontWeight='bold'
            innerRadius={55}
            innerCircleColor={isDark ? '#0f172a' : '#ffffff'}
            radius={95}
            focusOnPress
            centerLabelComponent={() => (
              <View style={{ alignItems: 'center' }}>
                {selectedSlice !== null && segments[selectedSlice] ? (
                  <>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '800',
                        color: segments[selectedSlice].color,
                      }}
                    >
                      {segments[selectedSlice].value}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: isDark ? '#94a3b8' : '#64748b',
                        textAlign: 'center',
                      }}
                    >
                      {segments[selectedSlice].label.split(' ')[0]}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: '800',
                        color: isDark ? '#ffffff' : '#1e293b',
                      }}
                    >
                      {total}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: isDark ? '#94a3b8' : '#64748b',
                      }}
                    >
                      Total
                    </Text>
                  </>
                )}
              </View>
            )}
          />
        </View>

        {/* Legend grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
          }}
        >
          {segments.map((s, i) => (
            <Pressable
              key={i}
              onPress={() => setSelectedSlice(selectedSlice === i ? null : i)}
              onHoverIn={() => setHoveredSlice(i)}
              onHoverOut={() => setHoveredSlice(null)}
              style={{
                flex: 1,
                minWidth: 90,
                borderRadius: 12,
                overflow: 'hidden',
                borderWidth: selectedSlice === i ? 2 : 1,
                borderColor: selectedSlice === i ? s.color : 'transparent',
                opacity: hoveredSlice !== null && hoveredSlice !== i ? 0.7 : 1,
              }}
            >
              <LinearGradient
                colors={[s.color, s.gradientColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 10 }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Ionicons name={s.icon} size={14} color='#ffffff' />
                  <Text
                    style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}
                  >
                    {pct(s.value)}
                  </Text>
                </View>
                <Text
                  style={{
                    color: '#ffffffdd',
                    fontSize: 11,
                    marginTop: 4,
                    fontWeight: '600',
                  }}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
                <Text style={{ color: '#ffffffaa', fontSize: 11 }}>
                  {s.value} items
                </Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        {/* Selected detail */}
        {selectedSlice !== null && segments[selectedSlice] && (
          <View style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
            <LinearGradient
              colors={[segments[selectedSlice].color + '20', 'transparent']}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                gap: 10,
              }}
            >
              <Ionicons
                name={segments[selectedSlice].icon}
                size={22}
                color={segments[selectedSlice].color}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: segments[selectedSlice].color,
                    fontWeight: '700',
                    fontSize: 14,
                  }}
                >
                  {segments[selectedSlice].label}
                </Text>
                <Text
                  style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  {segments[selectedSlice].description}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  )
}

// ─── FIX 1: Analytics Overview

const InteractiveChart = ({
  monthlyStats,
  colors,
  isDark,
  chartWidth,
}: {
  monthlyStats: MonthlyStats[]
  colors: any
  isDark: boolean
  chartWidth: number
}) => {
  const [selectedDataset, setSelectedDataset] = useState<
    'events' | 'attendance' | null
  >(null)
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    ]).start()
    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    }
  }, [])

  const totalEvents = monthlyStats.reduce((s, m) => s + m.events, 0)
  const totalAttendance = monthlyStats.reduce((s, m) => s + m.attendance, 0)

  const bgColor = isDark ? '#1e293b' : '#ffffff'
  const labelColor = isDark ? '#94a3b8' : '#475569'
  const gridColor = isDark ? '#33415580' : '#e2e8f080'

  const eventsColor = (opacity = 1) =>
    selectedDataset === 'attendance'
      ? `rgba(59,130,246,${opacity * 0.25})`
      : `rgba(59,130,246,${opacity})`

  const attendanceColor = (opacity = 1) =>
    selectedDataset === 'events'
      ? `rgba(16,185,129,${opacity * 0.25})`
      : `rgba(16,185,129,${opacity})`

  const chartData = {
    labels: monthlyStats.map((s) => s.month),
    datasets: [
      {
        data: monthlyStats.map((s) => s.events),
        color: eventsColor,
        strokeWidth: selectedDataset === 'attendance' ? 2 : 4,
      },
      {
        data: monthlyStats.map((s) => s.attendance),
        color: attendanceColor,
        strokeWidth: selectedDataset === 'events' ? 2 : 4,
      },
    ],
  }

  const handleDataPointClick = (data: any) => {
    setTooltipIndex(data.index)
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    tooltipTimer.current = setTimeout(() => setTooltipIndex(null), 3000)
  }

  return (
    <Animated.View
      style={[
        styles.chartContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View
        style={[
          styles.chartGradient,
          {
            backgroundColor: bgColor,
            borderRadius: 24,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.08,
            shadowRadius: 12,
            elevation: 5,
          },
        ]}
      >
        <View style={styles.chartHeader}>
          <View>
            <Text
              style={[
                styles.chartTitle,
                { color: isDark ? '#ffffff' : '#1e293b' },
              ]}
            >
              Analytics Overview
            </Text>
            <Text
              style={[
                styles.chartSubtitle,
                { color: isDark ? '#94a3b8' : '#64748b' },
              ]}
            >
              Tap legend to filter • Tap points for details
            </Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {[
            {
              key: 'events',
              label: 'Events',
              total: totalEvents,
              hex: '#3b82f6',
            },
            {
              key: 'attendance',
              label: 'Attendance',
              total: totalAttendance,
              hex: '#10b981',
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.legendButton,
                selectedDataset === item.key && styles.legendButtonActive,
                {
                  borderColor: item.hex,
                  backgroundColor:
                    selectedDataset === item.key
                      ? item.hex + '18'
                      : '#64748b18',
                },
              ]}
              onPress={() =>
                setSelectedDataset(
                  selectedDataset === item.key ? null : (item.key as any)
                )
              }
              activeOpacity={0.8}
            >
              <View style={[styles.legendDot, { backgroundColor: item.hex }]} />
              <Text
                style={[
                  styles.legendText,
                  { color: isDark ? '#ffffff' : '#1e293b' },
                ]}
              >
                {item.label}
              </Text>
              <View
                style={[
                  styles.legendValue,
                  { backgroundColor: item.hex + '25' },
                ]}
              >
                <Text style={[styles.legendValueText, { color: item.hex }]}>
                  {item.total}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart — no PanResponder wrapper, use horizontal ScrollView only */}
        <View style={styles.chartWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
            // prevent nested scroll conflicts
            nestedScrollEnabled
          >
            <LineChart
              data={chartData}
              width={Math.max(chartWidth, 350)}
              height={220}
              chartConfig={{
                backgroundColor: bgColor,
                backgroundGradientFrom: bgColor,
                backgroundGradientTo: bgColor,
                backgroundGradientFromOpacity: 1,
                backgroundGradientToOpacity: 1,
                decimalPlaces: 0,
                color: (opacity = 1) =>
                  isDark
                    ? `rgba(148,163,184,${opacity})`
                    : `rgba(71,85,105,${opacity})`,
                labelColor: () => labelColor,
                style: { borderRadius: 16 },
                propsForDots: { r: '6', strokeWidth: '3', stroke: bgColor },
                propsForBackgroundLines: {
                  stroke: gridColor,
                  strokeWidth: 1,
                  strokeDasharray: '4,4',
                },
                propsForLabels: { fontSize: 11, fontWeight: '500' },
              }}
              bezier
              style={styles.chart}
              withInnerLines
              withOuterLines={false}
              withShadow={false}
              fromZero
              segments={4}
              onDataPointClick={handleDataPointClick}
            />
          </ScrollView>

          {/* Tooltip */}
          {tooltipIndex !== null && monthlyStats[tooltipIndex] && (
            <View
              style={[
                styles.tooltip,
                { position: 'absolute', top: 10, right: 16 },
              ]}
            >
              <View
                style={{
                  backgroundColor: '#3b82f6',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 10,
                }}
              >
                <Text
                  style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}
                >
                  {monthlyStats[tooltipIndex].month}
                </Text>
                <Text
                  style={{ color: '#ffffffcc', fontSize: 12, marginTop: 2 }}
                >
                  Events: {monthlyStats[tooltipIndex].events}
                </Text>
                <Text style={{ color: '#ffffffcc', fontSize: 12 }}>
                  Attendance: {monthlyStats[tooltipIndex].attendance}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.chartFooter}>
          <Text
            style={[
              styles.axisLabel,
              { color: isDark ? '#64748b' : '#94a3b8' },
            ]}
          >
            ← Scroll to explore months →
          </Text>
        </View>
      </View>
    </Animated.View>
  )
}

// ─── FIX 2: Content Distribution donut (with pending + rejected) ──────────────

// ─── Activity Item ─────────────────────────────────────────────────────────────

const ActivityItem = ({
  activity,
  index,
  isLast,
}: {
  activity: Activity
  index: number
  isLast: boolean
}) => {
  const slideAnim = useRef(new Animated.Value(-50)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

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
    ]).start()
  }, [index])

  const getIcon = () => {
    switch (activity.type) {
      case 'event':
        return <Ionicons name='calendar' size={18} color={activity.color} />
      case 'attendance':
        return <Feather name='check-square' size={18} color={activity.color} />
      case 'announcement':
        return <Feather name='bell' size={18} color={activity.color} />
      case 'user':
        return <Feather name='user-plus' size={18} color={activity.color} />
      default:
        return <Feather name='activity' size={18} color={activity.color} />
    }
  }

  const timeAgo = (date: Date) => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000)
    if (s < 60) return 'Just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`
    return date.toLocaleDateString()
  }

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
      <View
        style={[
          styles.activityIconContainer,
          { backgroundColor: activity.color + '15' },
        ]}
      >
        {getIcon()}
      </View>
      <View style={styles.activityContent}>
        <View style={styles.activityHeader}>
          <Text style={[styles.activityTitle, { color: '#ffffff' }]}>
            {activity.title}
          </Text>
          <Text style={styles.activityTime}>{timeAgo(activity.timestamp)}</Text>
        </View>
        <Text style={[styles.activityDescription, { color: '#94a3b8' }]}>
          {activity.description}
        </Text>
      </View>
      <View
        style={[styles.activityIndicator, { backgroundColor: activity.color }]}
      />
    </Animated.View>
  )
}

// ─── Quick Action Button ───────────────────────────────────────────────────────

const QuickActionButton = ({
  title,
  icon,
  colors: btnColors,
  onPress,
  delay = 0,
}: {
  title: string
  icon: string
  colors: readonly [string, string]
  onPress: () => void
  delay?: number
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [delay])

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg'],
  })

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={() => {
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
        ]).start()
      }}
      onPressOut={() => {
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
        ]).start()
      }}
    >
      <Animated.View
        style={[
          styles.quickActionCard,
          { transform: [{ scale: scaleAnim }, { rotate }] },
        ]}
      >
        <LinearGradient
          colors={btnColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickActionGradient}
        >
          <View style={styles.quickActionIconContainer}>
            <Feather name={icon as any} size={24} color='#ffffff' />
          </View>
          <Text style={styles.quickActionText}>{title}</Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AssistantAdminDashboard() {
  const { width } = useWindowDimensions()
  const { colors, isDark } = useTheme()
  const router = useRouter()
  const { userData } = useAuth()

  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const chartWidth = React.useMemo(() => {
    const base = isMobile ? width - 64 : isTablet ? width / 2 - 48 : width - 400
    return Math.max(base, 300)
  }, [width, isMobile, isTablet])

  const headerAnim = useRef(new Animated.Value(0)).current
  const statsAnim = useRef(new Animated.Value(0)).current

  // ── State ──
  const [dashboardStats, setDashboardStats] = useState({
    myEvents: 0,
    myAnnouncements: 0,
    upcomingEvents: 0,
    totalAttendance: 0,
    pendingMyEvents: 0,
    pendingMyAnnouncements: 0,
  })
  // FIX 2: donut data includes pending + rejected
  const [adminDonutData, setAdminDonutData] = useState({
    upcoming: 0,
    past: 0,
    pending: 0,
    rejected: 0,
    announcements: 0,
  })
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [displayedActivities, setDisplayedActivities] = useState<Activity[]>([])
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(5)
  const [refreshing, setRefreshing] = useState(false)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
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
  const [uploadingImage, setUploadingImage] = useState(false)

  // ── Entry animation ──
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
    ]).start()
  }, [])

  // ── Data fetching ──
  const fetchDashboardStats = async () => {
    try {
      if (!userData?.email) return
      const myEventsQuery = query(
        collection(db, 'events'),
        where('createdBy', '==', userData.email)
      )
      const myEventsSnap = await getDocs(myEventsQuery)
      const myEvents = myEventsSnap.docs
      const pendingMyEvents = myEvents.filter(
        (d) => d.data().status === 'pending'
      ).length

      const myAnnouncementsQuery = query(
        collection(db, 'announcements'),
        where('createdBy', '==', userData.email)
      )
      const myAnnouncementsSnap = await getDocs(myAnnouncementsQuery)
      const pendingMyAnnouncements = myAnnouncementsSnap.docs.filter(
        (d) => d.data().status === 'pending'
      ).length

      const allEventsSnap = await getDocs(collection(db, 'events'))
      const now = new Date()
      let upcomingApproved = 0,
        totalAttendance = 0
      allEventsSnap.docs.forEach((doc) => {
        const data = doc.data()
        const eventDate = data.date?.toDate()
        const isApproved =
          data.status === 'approved' || data.status === undefined
        if (isApproved && eventDate && eventDate > now) upcomingApproved++
        if (Array.isArray(data.attendees))
          totalAttendance += data.attendees.length
      })

      setDashboardStats({
        myEvents: myEvents.length,
        myAnnouncements: myAnnouncementsSnap.size,
        upcomingEvents: upcomingApproved,
        totalAttendance,
        pendingMyEvents,
        pendingMyAnnouncements,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // FIX 2: fetch donut data with pending + rejected
  const fetchAdminDonutData = async () => {
    try {
      const now = new Date()
      const eventsSnap = await getDocs(collection(db, 'events'))
      let upcoming = 0,
        past = 0,
        pending = 0,
        rejected = 0

      eventsSnap.docs.forEach((doc) => {
        const data = doc.data()
        const eventDate = data.date?.toDate?.() || data.date
        const status = data.status
        if (status === 'pending') {
          pending++
          return
        }
        if (status === 'rejected') {
          rejected++
          return
        }
        if (!eventDate) return
        if (eventDate > now) upcoming++
        else past++
      })

      const announcementsSnap = await getDocs(collection(db, 'announcements'))
      let announcements = 0
      announcementsSnap.docs.forEach((doc) => {
        const data = doc.data()
        if (data.status === 'approved' || !data.status) announcements++
      })

      setAdminDonutData({ upcoming, past, pending, rejected, announcements })
    } catch (error) {
      console.error('Error fetching donut data:', error)
    }
  }

  const fetchUpcomingEvents = () => {
    setEventsLoading(true)
    const now = new Date()
    return onSnapshot(
      query(collection(db, 'events'), orderBy('date', 'asc')),
      (snapshot) => {
        const events = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            const eventDate = data.date?.toDate()
            const isApproved =
              data.status === 'approved' || data.status === undefined
            if (isApproved && eventDate && eventDate >= now) {
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
            }
            return null
          })
          .filter(Boolean)
          .sort((a, b) => a!.date.getTime() - b!.date.getTime())
          .slice(0, 3) as Event[]
        setUpcomingEvents(events)
        setEventsLoading(false)
      },
      (error) => {
        console.error('Events error:', error)
        setEventsLoading(false)
      }
    )
  }

  const fetchRecentAnnouncements = () => {
    setAnnouncementsLoading(true)
    return onSnapshot(
      query(collection(db, 'announcements'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const announcements = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            const isApproved =
              data.status === 'approved' || data.status === undefined
            if (isApproved) {
              return {
                id: doc.id,
                title: data.title || 'Announcement',
                content: data.content || data.message || '',
                createdAt: data.createdAt?.toDate() || new Date(),
                priority: data.priority || 'medium',
                author: data.author || 'Admin',
              }
            }
            return null
          })
          .filter(Boolean)
          .slice(0, 3) as Announcement[]
        setRecentAnnouncements(announcements)
        setAnnouncementsLoading(false)
      },
      (error) => {
        console.error('Announcements error:', error)
        setAnnouncementsLoading(false)
      }
    )
  }

  const setupRealtimeActivities = () => {
    setActivitiesLoading(true)
    const updateActivities = (newItems: Activity[], type: string) => {
      setRecentActivities((prev) => {
        const filtered = prev.filter((a) => a.type !== type)
        return [...filtered, ...newItems]
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 50)
      })
      setActivitiesLoading(false)
    }

    const u1 = onSnapshot(
      query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(20)),
      (snap) => {
        updateActivities(
          snap.docs.map((doc) => ({
            id: `event-${doc.id}`,
            type: 'event' as const,
            title: 'New Event Created',
            description: doc.data().title || 'New event added',
            timestamp: doc.data().createdAt?.toDate() || new Date(),
            icon: 'calendar',
            color: '#3b82f6',
            data: doc.data(),
          })),
          'event'
        )
      }
    )

    const u2 = onSnapshot(
      query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc'),
        limit(20)
      ),
      (snap) => {
        updateActivities(
          snap.docs.map((doc) => ({
            id: `announcement-${doc.id}`,
            type: 'announcement' as const,
            title: 'New Announcement',
            description: doc.data().title || 'New announcement posted',
            timestamp: doc.data().createdAt?.toDate() || new Date(),
            icon: 'bell',
            color: '#f59e0b',
            data: doc.data(),
          })),
          'announcement'
        )
      }
    )

    const u3 = onSnapshot(
      query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20)),
      (snap) => {
        updateActivities(
          snap.docs.map((doc) => ({
            id: `user-${doc.id}`,
            type: 'user' as const,
            title: 'New User Registered',
            description:
              doc.data().name || doc.data().email || 'New user joined',
            timestamp: doc.data().createdAt
              ? new Date(doc.data().createdAt)
              : new Date(),
            icon: 'user-plus',
            color: '#8b5cf6',
            data: doc.data(),
          })),
          'user'
        )
      }
    )

    return () => {
      u1()
      u2()
      u3()
    }
  }

  const calculateMonthlyStats = async () => {
    try {
      const now = new Date()
      const months: MonthlyStats[] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({
          month: d.toLocaleString('default', { month: 'short' }),
          events: 0,

          attendance: 0,
          announcements: 0,
        })
      }
      // Fetch events from last 6 months and count
      const eventsSnap = await getDocs(collection(db, 'events'))
      eventsSnap.docs.forEach((doc) => {
        const data = doc.data()
        const eventDate = data.date?.toDate()
        if (
          eventDate &&
          eventDate >= new Date(now.getFullYear(), now.getMonth() - 5, 1)
        ) {
          const monthName = eventDate.toLocaleString('default', {
            month: 'short',
          })
          const monthIdx = months.findIndex((m) => m.month === monthName)
          if (monthIdx !== -1) {
            months[monthIdx].events++
            months[monthIdx].attendance += data.attendees?.length || 0
          }
        }
      })
      setMonthlyStats(months)
    } catch (error) {
      console.error('Error calculating monthly stats:', error)
    }
  }
  useEffect(() => {
    fetchDashboardStats()
    fetchAdminDonutData()
    const u1 = setupRealtimeActivities()
    const u2 = fetchUpcomingEvents()
    const u3 = fetchRecentAnnouncements()
    calculateMonthlyStats()

    if (userData?.email) {
      const u4 = notificationService.listenForNotifications(
        userData.email,
        (notifs) => {
          setNotifications(notifs)
          setUnreadCount(notifs.filter((n) => !n.read).length)
        }
      )
      return () => {
        u1()
        u2()
        u3()
        u4()
        notificationService.cleanup()
      }
    }
    return () => {
      u1()
      u2()
      u3()
    }
  }, [userData])

  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage
    setDisplayedActivities(recentActivities.slice(start, start + itemsPerPage))
    setTotalPages(Math.ceil(recentActivities.length / itemsPerPage))
  }, [recentActivities, currentPage])

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    Promise.all([
      fetchDashboardStats(),
      fetchAdminDonutData(),
      calculateMonthlyStats(),
    ]).finally(() => setRefreshing(false))
  }, [])

  // FIX 4: download with proper web fallback and error recovery
  const handleDownloadReport = async () => {
    try {
      setDownloadLoading(true)

      // Ensure monthlyStats is fetched (if not already)
      if (!monthlyStats || monthlyStats.length === 0) {
        await calculateMonthlyStats()
      }

      const pdfData = {
        stats: {
          totalUsers: 0, // assistant admin doesn't track all users
          totalEvents: dashboardStats.myEvents,
          totalAnnouncements: dashboardStats.myAnnouncements,
          activeAttendees: dashboardStats.totalAttendance,
          upcomingEvents: dashboardStats.upcomingEvents,
          pendingVerifications:
            dashboardStats.pendingMyEvents +
            dashboardStats.pendingMyAnnouncements,
          activeUsers: 0,
          totalAttendance: dashboardStats.totalAttendance,
        },
        monthlyStats: monthlyStats || [],
        recentActivities: recentActivities.slice(0, 10),
        upcomingEvents: upcomingEvents,
      }

      const fileUri = await generateDashboardPDF(pdfData)
      await sharePDF(fileUri)
      Alert.alert('Success', 'Report generated successfully!')
    } catch (error) {
      console.error('Report error:', error)
      Alert.alert('Error', 'Failed to generate report.')
    } finally {
      setDownloadLoading(false)
    }
  }
  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read)
      await notificationService.markAsRead(notification.id)
    switch (notification.type) {
      case 'event':
        router.push(
          notification.data?.eventId
            ? `/assistant_admin/events?id=${notification.data.eventId}`
            : '/assistant_admin/events'
        )
        break
      case 'announcement':
        router.push(
          notification.data?.announcementId
            ? `/assistant_admin/announcements?id=${notification.data.announcementId}`
            : '/assistant_admin/announcements'
        )
        break
      case 'attendance':
        router.push('/assistant_admin/attendance')
        break
    }
  }

  const handleMarkAllRead = async () => {
    if (userData?.email) await notificationService.markAllAsRead(userData.email)
  }

  const handleProfileImagePress = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e: any) => {
          const f = e.target.files[0]
          if (f) await uploadProfileImage(f)
        }
        input.click()
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!perm.granted) {
          Alert.alert(
            'Permission Required',
            'Camera roll permission is required.'
          )
          return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
        })
        if (!result.canceled) await uploadProfileImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Image pick error:', error)
      Alert.alert('Error', 'Failed to pick image.')
    }
  }

  const uploadProfileImage = async (imageUri: string | File) => {
    try {
      setUploadingImage(true)
      const blob: Blob =
        imageUri instanceof File
          ? imageUri
          : await (await fetch(imageUri)).blob()
      const storage = getStorage()
      const storageRef = ref(
        storage,
        `profileImages/profile_${userData?.email}_${Date.now()}.jpg`
      )
      await uploadBytes(storageRef, blob)
      const downloadUrl = await getDownloadURL(storageRef)
      if (userData?.email) {
        await updateDoc(doc(db, 'users', userData.email), {
          photoURL: downloadUrl,
        })
        Alert.alert('Success', 'Profile image updated!')
      }
    } catch (error) {
      console.error('Upload error:', error)
      Alert.alert('Error', 'Failed to upload image.')
    } finally {
      setUploadingImage(false)
    }
  }

  const navigateTo = (screen: string, id?: string) => {
    switch (screen) {
      case 'events':
        router.push(
          id ? `/assistant_admin/events?id=${id}` : '/assistant_admin/events'
        )
        break
      case 'attendance':
        router.push('/assistant_admin/attendance')
        break
      case 'announcements':
        router.push(
          id
            ? `/assistant_admin/announcements?id=${id}`
            : '/assistant_admin/announcements'
        )
        break
      case 'profile':
        router.push('/assistant_admin/profile')
        break
    }
  }

  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  })

  // ── FIX 3: Header background + text adapts to light/dark correctly ──
  const headerGradient: readonly [string, string, string] = isDark
    ? ['#0f172a', '#1e293b', '#334155']
    : ['#1e40af', '#3b82f6', '#60a5fa']

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor='#3b82f6'
            colors={['#3b82f6', '#10b981']}
          />
        }
      >
        {/* ── FIX 3: Animated Header with proper dark/light theming ── */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: headerAnim,
              transform: [{ translateY: headerTranslateY }],
            },
          ]}
        >
          <LinearGradient
            colors={headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.greetingContainer}>
                  <Text
                    style={[
                      styles.greetingLabel,
                      { color: 'rgba(255,255,255,0.8)' },
                    ]}
                  >
                    Welcome back,
                  </Text>
                  <Text style={[styles.userName, { color: '#ffffff' }]}>
                    {userData?.name || 'Assistant'}
                  </Text>
                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                      },
                    ]}
                  >
                    <Text style={[styles.roleText, { color: '#ffffff' }]}>
                      {' '}
                      <Ionicons
                        name='shield-checkmark-outline'
                        size={12}
                        color='#ffffff'
                      />{' '}
                      Assistant Admin
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerRight}>
                {/* FIX 5: Notification bell — opens modal, badge shows unreadCount */}
                <TouchableOpacity
                  style={[styles.iconButton, { position: 'relative' }]}
                  onPress={() => setNotificationModalVisible(true)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconButtonInner,
                      {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: 12,
                        padding: 8,
                      },
                    ]}
                  >
                    <Feather name='bell' size={20} color='#ffffff' />
                    {unreadCount > 0 && (
                      <View
                        style={[
                          styles.notificationBadge,
                          {
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            backgroundColor: '#ef4444',
                            borderRadius: 10,
                            minWidth: 18,
                            height: 18,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 2,
                            borderColor: '#1e40af',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.notificationBadgeText,
                            { color: '#fff', fontSize: 10, fontWeight: '700' },
                          ]}
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* FIX 4: Download with loading state and proper styling */}
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleDownloadReport}
                  disabled={downloadLoading}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.iconButtonInner,
                      {
                        backgroundColor: downloadLoading
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(255,255,255,0.15)',
                        borderRadius: 12,
                        padding: 8,
                      },
                    ]}
                  >
                    {downloadLoading ? (
                      <ActivityIndicator size='small' color='#ffffff' />
                    ) : (
                      <Feather name='download' size={20} color='#ffffff' />
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileButton}
                  onPress={handleProfileImagePress}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <View
                      style={[
                        styles.profileFallback,
                        { backgroundColor: 'rgba(255,255,255,0.2)' },
                      ]}
                    >
                      <ActivityIndicator size='small' color='#ffffff' />
                    </View>
                  ) : userData?.photoURL ? (
                    <Image
                      source={{ uri: userData.photoURL }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <View
                      style={[
                        styles.profileFallback,
                        { backgroundColor: 'rgba(255,255,255,0.2)' },
                      ]}
                    >
                      <Text
                        style={[styles.profileInitials, { color: '#ffffff' }]}
                      >
                        {userData?.name
                          ? userData.name.charAt(0).toUpperCase()
                          : 'A'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                styles.dateContainer,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 8,
                },
              ]}
            >
              <Feather
                name='calendar'
                size={13}
                color='rgba(255,255,255,0.7)'
              />
              <Text
                style={[styles.dateText, { color: 'rgba(255,255,255,0.7)' }]}
              >
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* FIX 1: Analytics Overview */}
        {monthlyStats.length > 0 && (
          <InteractiveChart
            monthlyStats={monthlyStats}
            colors={colors}
            isDark={isDark}
            chartWidth={chartWidth}
          />
        )}

        {/* FIX 2: Content Distribution with pending + rejected */}
        <AdminContentDistribution
          donutData={adminDonutData}
          isDark={isDark}
          colors={colors}
        />

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#ffffff' : '#1e293b' },
            ]}
          >
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            <QuickActionButton
              title='Announcement'
              icon='mic'
              colors={['#f59e0b', '#d97706'] as const}
              onPress={() => navigateTo('announcements')}
              delay={0}
            />
            <QuickActionButton
              title='New Event'
              icon='plus-circle'
              colors={['#3b82f6', '#2563eb'] as const}
              onPress={() => navigateTo('events')}
              delay={100}
            />
            <QuickActionButton
              title='QR Check-in'
              icon='maximize'
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
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#ffffff' : '#1e293b' },
                ]}
              >
                Recent Activity
              </Text>
              {activitiesLoading && (
                <ActivityIndicator size='small' color='#3b82f6' />
              )}
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
              ]}
            >
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
                        style={[
                          styles.paginationButton,
                          currentPage === 1 && styles.paginationButtonDisabled,
                        ]}
                        onPress={() =>
                          currentPage > 1 && setCurrentPage((p) => p - 1)
                        }
                        disabled={currentPage === 1}
                      >
                        <Feather
                          name='chevron-left'
                          size={18}
                          color={currentPage === 1 ? '#64748b' : '#3b82f6'}
                        />
                      </TouchableOpacity>
                      <Text style={styles.paginationText}>
                        {currentPage} / {totalPages}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          currentPage === totalPages &&
                            styles.paginationButtonDisabled,
                        ]}
                        onPress={() =>
                          currentPage < totalPages &&
                          setCurrentPage((p) => p + 1)
                        }
                        disabled={currentPage === totalPages}
                      >
                        <Feather
                          name='chevron-right'
                          size={18}
                          color={
                            currentPage === totalPages ? '#64748b' : '#3b82f6'
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Feather name='activity' size={40} color='#64748b' />
                  <Text style={styles.emptyStateText}>No recent activity</Text>
                </View>
              )}
            </View>
          </View>

          {/* Upcoming Events + Announcements */}
          <View style={styles.column}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#ffffff' : '#1e293b' },
                ]}
              >
                Upcoming Events
              </Text>
              <TouchableOpacity onPress={() => navigateTo('events')}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
              ]}
            >
              {eventsLoading ? (
                <ActivityIndicator
                  size='large'
                  color='#3b82f6'
                  style={styles.loader}
                />
              ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, index) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventItem,
                      index !== upcomingEvents.length - 1 &&
                        styles.eventItemBorder,
                    ]}
                    onPress={() => navigateTo('events', event.id)}
                  >
                    <View style={styles.eventDateBox}>
                      <Text style={styles.eventDay}>
                        {event.date.getDate().toString().padStart(2, '0')}
                      </Text>
                      <Text style={styles.eventMonth}>
                        {event.date
                          .toLocaleString('default', { month: 'short' })
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text
                        style={[
                          styles.eventTitle,
                          { color: isDark ? '#ffffff' : '#1e293b' },
                        ]}
                        numberOfLines={1}
                      >
                        {event.title}
                      </Text>
                      <Text style={styles.eventMeta}>
                        {event.time ||
                          event.date.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                        • {event.location || 'TBA'}
                      </Text>
                      <Text style={styles.eventAttendees}>
                        {event.attendees?.length || 0} attending
                      </Text>
                    </View>
                    <Feather name='chevron-right' size={20} color='#64748b' />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Feather name='calendar' size={40} color='#64748b' />
                  <Text style={styles.emptyStateText}>No upcoming events</Text>
                </View>
              )}
            </View>

            <View style={[styles.sectionHeader, styles.announcementHeader]}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDark ? '#ffffff' : '#1e293b' },
                ]}
              >
                Announcements
              </Text>
              <TouchableOpacity onPress={() => navigateTo('announcements')}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? '#1e293b' : '#ffffff' },
              ]}
            >
              {announcementsLoading ? (
                <ActivityIndicator
                  size='large'
                  color='#3b82f6'
                  style={styles.loader}
                />
              ) : recentAnnouncements.length > 0 ? (
                recentAnnouncements.map((ann, index) => {
                  const pc =
                    ann.priority === 'high'
                      ? '#ef4444'
                      : ann.priority === 'medium'
                        ? '#f59e0b'
                        : '#10b981'
                  return (
                    <TouchableOpacity
                      key={ann.id}
                      style={[
                        styles.announcementItem,
                        index !== recentAnnouncements.length - 1 &&
                          styles.announcementItemBorder,
                      ]}
                      onPress={() => navigateTo('announcements', ann.id)}
                    >
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: pc + '20' },
                        ]}
                      >
                        <FontAwesome6 name='bullhorn' size={12} color={pc} />
                      </View>
                      <View style={styles.announcementInfo}>
                        <Text
                          style={[
                            styles.announcementTitle,
                            { color: isDark ? '#ffffff' : '#1e293b' },
                          ]}
                          numberOfLines={1}
                        >
                          {ann.title}
                        </Text>
                        <Text style={styles.announcementMeta}>
                          {new Date(ann.createdAt).toLocaleDateString()} •{' '}
                          {ann.author}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                })
              ) : (
                <View style={styles.emptyState}>
                  <Feather name='bell' size={40} color='#64748b' />
                  <Text style={styles.emptyStateText}>No announcements</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* FIX 5: Notification modal — properly triggered by bell */}
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
  )
}
