// MainAdminProfile.tsx
import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { db } from '../../lib/firebaseConfig'
import { createProfileStyles } from '../../styles/main-admin/profileStyles'

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title)
  } else {
    Alert.alert(title, message)
  }
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  if (email) return email[0].toUpperCase()
  return 'A'
}

export default function MainAdminProfile() {
  const { logout, userData } = useAuth()
  const router = useRouter()
  const { colors, isDark } = useTheme()
  const { width } = useWindowDimensions()

  const styles = useMemo(
    () => createProfileStyles(colors, isDark),
    [colors, isDark]
  )

  const [photoURL, setPhotoURL] = useState<string | null>(
    userData?.photoURL ?? null
  )
  const [uploadingImage, setUploadingImage] = useState(false)

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    activeEvents: 0,
    totalAnnouncements: 0,
    mainAdmins: 0,
    assistantAdmins: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    rejectedEvents: 0,
    totalEvents: 0,
    totalAttendance: 0,
    approvedAnnouncements: 0,
    pendingAnnouncements: 0,
    rejectedAnnouncements: 0,
    combinedPending: 0,
    combinedRejected: 0,
    combinedApproved: 0,
    pastEvents: 0,
    pendingPenalties: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (userData?.photoURL) setPhotoURL(userData.photoURL)
  }, [userData?.photoURL])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true)

        const usersSnap = await getDocs(collection(db, 'users'))
        const totalUsers = usersSnap.size
        const totalStudents = usersSnap.docs.filter(
          (d) => d.data().role === 'student' || !d.data().role
        ).length
        const mainAdmins = usersSnap.docs.filter(
          (d) => d.data().role === 'main_admin'
        ).length
        const assistantAdmins = usersSnap.docs.filter(
          (d) => d.data().role === 'assistant_admin'
        ).length

        const allEventsSnap = await getDocs(collection(db, 'events'))
        const totalEvents = allEventsSnap.size
        let approvedEvents = 0
        let pendingEvents = 0
        let rejectedEvents = 0
        let totalAttendance = 0

        allEventsSnap.docs.forEach((d) => {
          const data = d.data()
          const s = data.status
          const isApproved =
            s === 'approved' || s === undefined || s === null || s === ''
          if (isApproved) approvedEvents++
          else if (s === 'pending') pendingEvents++
          else if (s === 'rejected') rejectedEvents++
          if (isApproved) totalAttendance += data.attendees?.length ?? 0
        })

        const now = new Date()
        const activeEvents = allEventsSnap.docs.filter((d) => {
          const data = d.data()
          const s = data.status
          const isApproved =
            s === 'approved' || s === undefined || s === null || s === ''
          const eventDate =
            data.date?.toDate?.() ?? (data.date ? new Date(data.date) : null)
          return isApproved && eventDate && eventDate > now
        }).length

        const annSnap = await getDocs(collection(db, 'announcements'))
        const totalAnnouncements = annSnap.size
        const approvedAnnouncements = annSnap.docs.filter(
          (d) => d.data().status === 'approved' || !d.data().status
        ).length
        const pendingAnnouncements = annSnap.docs.filter(
          (d) => d.data().status === 'pending'
        ).length
        const rejectedAnnouncements = annSnap.docs.filter(
          (d) => d.data().status === 'rejected'
        ).length

        const combinedPending = pendingEvents + pendingAnnouncements
        const combinedRejected = rejectedEvents + rejectedAnnouncements
        const combinedApproved = approvedEvents + approvedAnnouncements

        const pastEvents = allEventsSnap.docs.filter((d) => {
          const data = d.data()
          const s = data.status
          const isApproved =
            s === 'approved' || s === undefined || s === null || s === ''
          const eventDate =
            data.date?.toDate?.() ?? (data.date ? new Date(data.date) : null)
          return isApproved && eventDate && eventDate < now
        }).length

        let pendingPenalties = 0
        try {
          const penaltiesSnap = await getDocs(collection(db, 'penalties'))
          pendingPenalties = penaltiesSnap.docs.filter(
            (d) => d.data().status === 'pending'
          ).length
        } catch (e) {
          // Collection may not exist
        }

        setStats({
          totalUsers,
          totalStudents,
          activeEvents,
          totalAnnouncements,
          mainAdmins,
          assistantAdmins,
          approvedEvents,
          pendingEvents,
          rejectedEvents,
          totalEvents,
          totalAttendance,
          approvedAnnouncements,
          pendingAnnouncements,
          rejectedAnnouncements,
          combinedPending,
          combinedRejected,
          combinedApproved,
          pastEvents,
          pendingPenalties,
        })
      } catch (err) {
        console.error('Profile stats error:', err)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Are you sure you want to log out?')
      if (!ok) return
    } else {
    }

    if (Platform.OS !== 'web') {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout()
            router.replace('/login')
          },
        },
      ])
      return
    }

    logout()
    router.replace('/login')
  }

  const handlePickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0]
          if (file) await uploadImage(file)
        }
        input.click()
      } else {
        const { granted } =
          await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!granted) {
          showAlert(
            'Permission Required',
            'Please allow access to your photo library.'
          )
          return
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.6,
        })
        if (!result.canceled) await uploadImage(result.assets[0].uri)
      }
    } catch (err) {
      console.error('Image pick error:', err)
      showAlert('Error', 'Failed to select image. Please try again.')
    }
  }

  const uploadImage = async (source: string | File) => {
    if (!userData?.email) return
    try {
      setUploadingImage(true)
      let blob: Blob
      if (source instanceof File) {
        blob = source
      } else {
        const res = await fetch(source)
        blob = await res.blob()
      }
      const storage = getStorage()
      const fileName = `profile_${userData.email}_${Date.now()}.jpg`
      const storageRef = ref(storage, `profileImages/${fileName}`)
      await uploadBytes(storageRef, blob)
      const downloadUrl = await getDownloadURL(storageRef)
      const userRef = doc(db, 'users', userData.email)
      await updateDoc(userRef, { photoURL: downloadUrl })

      setPhotoURL(downloadUrl)
      showAlert('Success', 'Profile photo updated!')
    } catch (err) {
      console.error('Upload error:', err)
      showAlert('Error', 'Failed to upload photo. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const displayName =
    userData?.name || userData?.email?.split('@')[0] || 'Admin'
  const initials = getInitials(userData?.name, userData?.email)
  const memberSince = userData?.createdAt
    ? new Date(
        typeof userData.createdAt === 'object' && userData.createdAt.seconds
          ? userData.createdAt.seconds * 1000
          : userData.createdAt
      ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  const headerGradient = isDark
    ? (['#0f172a', '#1e293b'] as const)
    : (['#1e40af', '#3b82f6'] as const)

  // Quick actions with enhanced metadata
  const quickActions = [
    {
      label: 'Events',
      icon: 'calendar',
      color: '#0ea5e9',
      gradient: ['#0ea5e9', '#0284c7'] as const,
      route: '/main_admin/events',
    },
    {
      label: 'Attendance',
      icon: 'check-square',
      color: '#10b981',
      gradient: ['#10b981', '#059669'] as const,
      route: '/main_admin/attendance',
    },
    {
      label: 'Announcements',
      icon: 'bell',
      color: '#f59e0b',
      gradient: ['#f59e0b', '#d97706'] as const,
      route: '/main_admin/announcements',
    },
    {
      label: 'Users',
      icon: 'users',
      color: '#8b5cf6',
      gradient: ['#8b5cf6', '#7c3aed'] as const,
      route: '/main_admin/users',
    },
  ]

  // Calculate attendance rate for display
  const attendanceRate = useMemo(() => {
    if (stats.totalStudents > 0 && stats.totalAttendance > 0) {
      return Math.min(
        100,
        Math.round(
          (stats.totalAttendance /
            (stats.totalStudents * Math.max(stats.approvedEvents, 1))) *
            100
        )
      )
    }
    return 0
  }, [stats])

  return (
    <View style={styles.container}>
      {/* Header Gradient – PRESERVED EXACTLY AS REQUESTED */}
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text
              style={[
                styles.greetingText,
                {
                  color: isDark
                    ? 'rgba(148,163,184,0.85)'
                    : 'rgba(255,255,255,0.75)',
                },
              ]}
            >
              My Profile
            </Text>
            <Text style={styles.userName}>{displayName}</Text>
            <Text
              style={[
                styles.roleText,
                {
                  color: isDark
                    ? 'rgba(148,163,184,0.6)'
                    : 'rgba(255,255,255,0.65)',
                },
              ]}
            >
              System Administrator
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={handlePickImage}
            disabled={uploadingImage}
            activeOpacity={0.8}
          >
            {uploadingImage ? (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <ActivityIndicator size='small' color='#ffffff' />
              </View>
            ) : photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={styles.profileInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dateSection}>
          <View style={styles.dateContainer}>
            <Text
              style={[
                styles.dateText,
                {
                  color: isDark
                    ? colors.sidebar?.text?.muted || '#94a3b8'
                    : '#ffffff',
                },
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
              style={[styles.headerAction, styles.logoutHeaderButton]}
              onPress={handleLogout}
            >
              <Feather name='log-out' size={18} color='#ef4444' />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Enhanced Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardContent}>
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={handlePickImage}
                disabled={uploadingImage}
                activeOpacity={0.9}
              >
                {uploadingImage ? (
                  <View style={styles.avatarFallback}>
                    <ActivityIndicator size='large' color='#0ea5e9' />
                  </View>
                ) : photoURL ? (
                  <Image
                    source={{ uri: photoURL }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.avatarEditOverlay}>
                  <Feather name='camera' size={16} color='#ffffff' />
                </View>
              </TouchableOpacity>

              <View style={styles.avatarMeta}>
                <View style={styles.statusIndicator} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

            <View style={styles.identitySection}>
              <Text style={styles.identityName}>{displayName}</Text>
              <Text style={styles.identityEmail}>{userData?.email || '—'}</Text>

              <View style={styles.roleBadge}>
                <LinearGradient
                  colors={['#0ea5e9', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.roleBadgeGradient}
                >
                  <Feather name='shield' size={12} color='#ffffff' />
                  <Text style={styles.roleBadgeText}>Main Administrator</Text>
                </LinearGradient>
              </View>

              <View style={styles.memberSince}>
                <Text style={styles.memberSinceText}>
                  Member since {memberSince}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {[
              {
                value: stats.totalUsers,
                label: 'Total Users',
                icon: 'users',
                color: '#0ea5e9',
              },
              {
                value: stats.totalStudents,
                label: 'Students',
                icon: 'user',
                color: '#10b981',
              },
              {
                value: stats.pastEvents,
                label: 'Past Events',
                icon: 'calendar',
                color: '#f59e0b',
              },
              {
                value: stats.totalAnnouncements,
                label: 'Announcements',
                icon: 'bell',
                color: '#8b5cf6',
              },
              {
                value: stats.activeEvents,
                label: 'Active Events',
                icon: 'calendar',
                color: '#f59e0b',
              },
              {
                value: stats.totalEvents + stats.totalAnnouncements,
                label: 'Total Posts',
                icon: 'layers',
                color: '#8b5cf6',
              },
              {
                value: stats.pendingPenalties,
                label: 'Penalties',
                icon: 'alert-circle',
                color: '#ec4899',
              },
            ].map((stat, index) => (
              <View
                key={stat.label}
                style={[
                  styles.statItem,
                  index === 0 && styles.statItemFirst,
                  index === 3 && styles.statItemLast,
                ]}
              >
                <View
                  style={[
                    styles.statIconContainer,
                    { backgroundColor: `${stat.color}15` },
                  ]}
                >
                  <Feather
                    name={stat.icon as any}
                    size={16}
                    color={stat.color}
                  />
                </View>
                {loadingStats ? (
                  <ActivityIndicator
                    size='small'
                    color={stat.color}
                    style={{ marginTop: 8 }}
                  />
                ) : (
                  <Text style={styles.statValue}>{stat.value}</Text>
                )}
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Navigation Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Feather
                  name='grid'
                  size={14}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
              </View>
              <Text style={styles.sectionTitle}>Quick Access</Text>
            </View>
          </View>

          <View style={styles.quickGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.label}
                style={styles.quickTile}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={action.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.quickTileIcon}
                >
                  <Feather
                    name={action.icon as any}
                    size={24}
                    color='#ffffff'
                  />
                </LinearGradient>
                <Text style={styles.quickTileLabel}>{action.label}</Text>
                <View style={styles.quickTileArrow}>
                  <Feather
                    name='chevron-right'
                    size={16}
                    color={isDark ? '#475569' : '#cbd5e1'}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Feather
                  name='user'
                  size={14}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
              </View>
              <Text style={styles.sectionTitle}>Account Information</Text>
            </View>
          </View>

          <View style={styles.infoList}>
            {[
              { label: 'Display Name', value: displayName, icon: 'user' },
              {
                label: 'Email Address',
                value: userData?.email || '—',
                icon: 'mail',
                copyable: true,
              },
              {
                label: 'Account Type',
                value: 'Main Administrator',
                icon: 'shield',
                highlight: true,
              },
              {
                label: 'Username',
                value: userData?.email?.split('@')[0] || '—',
                icon: 'at-sign',
              },
              { label: 'Member Since', value: memberSince, icon: 'calendar' },
            ].map((item, index, arr) => (
              <View
                key={item.label}
                style={[
                  styles.infoItem,
                  index === arr.length - 1 && styles.infoItemLast,
                ]}
              >
                <View style={styles.infoItemLeft}>
                  <View
                    style={[
                      styles.infoIconContainer,
                      item.highlight && styles.infoIconContainerHighlight,
                    ]}
                  >
                    <Feather
                      name={item.icon as any}
                      size={14}
                      color={
                        item.highlight
                          ? '#0ea5e9'
                          : isDark
                            ? '#64748b'
                            : '#94a3b8'
                      }
                    />
                  </View>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                </View>
                <View style={styles.infoItemRight}>
                  <Text
                    style={[
                      styles.infoValue,
                      item.highlight && styles.infoValueHighlight,
                    ]}
                    numberOfLines={1}
                  >
                    {item.value}
                  </Text>
                  {item.copyable && (
                    <TouchableOpacity style={styles.copyButton}>
                      <Feather
                        name='copy'
                        size={14}
                        color={isDark ? '#64748b' : '#94a3b8'}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Analytics Dashboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Feather
                  name='bar-chart-2'
                  size={14}
                  color={isDark ? '#94a3b8' : '#64748b'}
                />
              </View>
              <Text style={styles.sectionTitle}>System Analytics</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton}>
              <Feather
                name='refresh-cw'
                size={14}
                color={isDark ? '#64748b' : '#94a3b8'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.analyticsContent}>
            {/* Top Metrics */}
            <View style={styles.metricsRow}>
              {/* Attendance Card */}
              <View style={[styles.metricCard, styles.metricCardLarge]}>
                <View style={styles.metricHeader}>
                  <View
                    style={[
                      styles.metricIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16,185,129,0.15)'
                          : '#d1fae5',
                      },
                    ]}
                  >
                    <Feather name='check-square' size={18} color='#10b981' />
                  </View>
                  <View
                    style={[
                      styles.metricTrend,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16,185,129,0.15)'
                          : '#d1fae5',
                      },
                    ]}
                  >
                    <Feather name='trending-up' size={12} color='#10b981' />
                    <Text
                      style={[styles.metricTrendText, { color: '#10b981' }]}
                    >
                      +12%
                    </Text>
                  </View>
                </View>
                <View style={styles.metricBody}>
                  {loadingStats ? (
                    <ActivityIndicator color='#10b981' />
                  ) : (
                    <Text style={styles.metricValue}>
                      {stats.totalAttendance}
                    </Text>
                  )}
                  <Text style={styles.metricLabel}>Total Attendance</Text>
                </View>
                <View style={styles.metricFooter}>
                  <View style={styles.metricBar}>
                    <View
                      style={[
                        styles.metricBarFill,
                        { width: '75%', backgroundColor: '#10b981' },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* Posts Card */}
              <View style={[styles.metricCard, styles.metricCardLarge]}>
                <View style={styles.metricHeader}>
                  <View
                    style={[
                      styles.metricIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(245,158,11,0.15)'
                          : '#fef3c7',
                      },
                    ]}
                  >
                    <Feather name='bell' size={18} color='#f59e0b' />
                  </View>
                  <View
                    style={[
                      styles.metricTrend,
                      {
                        backgroundColor: isDark
                          ? 'rgba(245,158,11,0.15)'
                          : '#fef3c7',
                      },
                    ]}
                  >
                    <Feather name='trending-up' size={12} color='#f59e0b' />
                    <Text
                      style={[styles.metricTrendText, { color: '#f59e0b' }]}
                    >
                      +5%
                    </Text>
                  </View>
                </View>
                <View style={styles.metricBody}>
                  {loadingStats ? (
                    <ActivityIndicator color='#f59e0b' />
                  ) : (
                    <Text style={styles.metricValue}>
                      {stats.totalEvents + stats.totalAnnouncements}
                    </Text>
                  )}
                  <Text style={styles.metricLabel}>Total Posts</Text>
                </View>
                <View style={styles.metricFooter}>
                  <View style={styles.metricBar}>
                    <View
                      style={[
                        styles.metricBarFill,
                        { width: '60%', backgroundColor: '#f59e0b' },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Status Breakdown */}
            <View style={styles.statusGrid}>
              {[
                {
                  label: 'Approved',
                  value: stats.combinedApproved,
                  color: '#10b981',
                  icon: 'check-circle',
                },
                {
                  label: 'Pending',
                  value: stats.combinedPending,
                  color: '#f59e0b',
                  icon: 'clock',
                },
                {
                  label: 'Rejected',
                  value: stats.combinedRejected,
                  color: '#ef4444',
                  icon: 'x-circle',
                },
              ].map((status) => (
                <View
                  key={status.label}
                  style={[
                    styles.statusItem,
                    { backgroundColor: `${status.color}10` },
                  ]}
                >
                  <View style={styles.statusHeader}>
                    <Feather
                      name={status.icon as any}
                      size={14}
                      color={status.color}
                    />
                    <Text style={[styles.statusValue, { color: status.color }]}>
                      {loadingStats ? '—' : status.value}
                    </Text>
                  </View>
                  <Text style={[styles.statusLabel, { color: status.color }]}>
                    {status.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* User Distribution Chart */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>User Distribution</Text>
                <Text style={styles.chartSubtitle}>
                  {loadingStats
                    ? 'Loading...'
                    : `${stats.totalUsers} total accounts`}
                </Text>
              </View>

              <View style={styles.chartContent}>
                {[
                  {
                    label: 'Students',
                    value: stats.totalStudents,
                    color: '#0ea5e9',
                    total: stats.totalUsers,
                  },
                  {
                    label: 'Assistant Admins',
                    value: stats.assistantAdmins,
                    color: '#8b5cf6',
                    total: stats.totalUsers,
                  },
                  {
                    label: 'Main Admins',
                    value: stats.mainAdmins,
                    color: '#f59e0b',
                    total: stats.totalUsers,
                  },
                ].map((item) => {
                  const percentage =
                    item.total > 0
                      ? Math.round((item.value / item.total) * 100)
                      : 0
                  return (
                    <View key={item.label} style={styles.chartRow}>
                      <View style={styles.chartRowHeader}>
                        <View style={styles.chartRowMeta}>
                          <View
                            style={[
                              styles.chartDot,
                              { backgroundColor: item.color },
                            ]}
                          />
                          <Text style={styles.chartRowLabel}>{item.label}</Text>
                        </View>
                        <Text style={styles.chartRowValue}>
                          {loadingStats
                            ? '—'
                            : `${item.value} (${percentage}%)`}
                        </Text>
                      </View>
                      <View style={styles.chartTrack}>
                        <View
                          style={[
                            styles.chartFill,
                            {
                              width: loadingStats ? '0%' : `${percentage}%`,
                              backgroundColor: item.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Attendance Rate Ring */}
            <View style={styles.rateContainer}>
              <View style={styles.rateVisual}>
                <View
                  style={[
                    styles.rateRing,
                    {
                      borderColor:
                        attendanceRate >= 70
                          ? '#10b981'
                          : attendanceRate >= 40
                            ? '#f59e0b'
                            : '#ef4444',
                      backgroundColor:
                        attendanceRate >= 70
                          ? isDark
                            ? 'rgba(16,185,129,0.1)'
                            : 'rgba(16,185,129,0.05)'
                          : attendanceRate >= 40
                            ? isDark
                              ? 'rgba(245,158,11,0.1)'
                              : 'rgba(245,158,11,0.05)'
                            : isDark
                              ? 'rgba(239,68,68,0.1)'
                              : 'rgba(239,68,68,0.05)',
                    },
                  ]}
                >
                  {loadingStats ? (
                    <ActivityIndicator
                      size='small'
                      color={
                        attendanceRate >= 70
                          ? '#10b981'
                          : attendanceRate >= 40
                            ? '#f59e0b'
                            : '#ef4444'
                      }
                    />
                  ) : (
                    <Text
                      style={[
                        styles.ratePercent,
                        {
                          color:
                            attendanceRate >= 70
                              ? '#10b981'
                              : attendanceRate >= 40
                                ? '#f59e0b'
                                : '#ef4444',
                        },
                      ]}
                    >
                      {attendanceRate}%
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.rateDetails}>
                <Text style={styles.rateTitle}>Average Attendance Rate</Text>
                <Text style={styles.rateDescription}>
                  {loadingStats
                    ? 'Calculating metrics...'
                    : `Across ${stats.approvedEvents} approved event${stats.approvedEvents !== 1 ? 's' : ''} with ${stats.totalAttendance} total records`}
                </Text>
                <View style={styles.rateProgress}>
                  <View style={styles.rateTrack}>
                    <View
                      style={[
                        styles.rateFill,
                        {
                          width: `${attendanceRate}%`,
                          backgroundColor:
                            attendanceRate >= 70
                              ? '#10b981'
                              : attendanceRate >= 40
                                ? '#f59e0b'
                                : '#ef4444',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Action */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={styles.logoutContent}>
            <View style={styles.logoutIconContainer}>
              <Feather name='log-out' size={20} color='#ef4444' />
            </View>
            <View style={styles.logoutTextContainer}>
              <Text style={styles.logoutTitle}>Sign Out</Text>
              <Text style={styles.logoutSubtitle}>
                Securely end your session
              </Text>
            </View>
            <Feather
              name='chevron-right'
              size={20}
              color={isDark ? '#475569' : '#94a3b8'}
            />
          </View>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>Campus Hub</Text>
          <Text style={styles.footerVersion}>Administration Panel v2.0</Text>
        </View>
      </ScrollView>
    </View>
  )
}
