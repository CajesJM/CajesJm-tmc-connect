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
import Svg, { Polyline, Rect } from 'react-native-svg'
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

  const quickActions: {
    label: string
    icon: any
    color: string
    bg: string
    route: string
  }[] = [
    {
      label: 'Events',
      icon: 'calendar',
      color: '#0ea5e9',
      bg: isDark ? 'rgba(14,165,233,0.15)' : '#e0f2fe',
      route: '/main_admin/events',
    },
    {
      label: 'Attendance',
      icon: 'check-square',
      color: '#10b981',
      bg: isDark ? 'rgba(16,185,129,0.15)' : '#d1fae5',
      route: '/main_admin/attendance',
    },
    {
      label: 'Announcements',
      icon: 'bell',
      color: '#f59e0b',
      bg: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7',
      route: '/main_admin/announcements',
    },
    {
      label: 'Users',
      icon: 'users',
      color: '#8b5cf6',
      bg: isDark ? 'rgba(139,92,246,0.15)' : '#ede9fe',
      route: '/main_admin/users',
    },
  ]

  return (
    <View style={styles.container}>
      {/* Header Gradient – full width, no gaps */}
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

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.identityCard}>
          <LinearGradient
            colors={['#0ea5e9', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.identityAccent}
          />

          <View style={styles.identityBody}>
            {/* Large avatar */}
            <View style={styles.largeAvatarWrapper}>
              <TouchableOpacity
                style={styles.largeAvatarButton}
                onPress={handlePickImage}
                disabled={uploadingImage}
                activeOpacity={0.85}
              >
                {uploadingImage ? (
                  <View style={styles.largeAvatarFallback}>
                    <ActivityIndicator size='large' color='#0ea5e9' />
                  </View>
                ) : photoURL ? (
                  <Image
                    source={{ uri: photoURL }}
                    style={styles.largeAvatarImage}
                  />
                ) : (
                  <View style={styles.largeAvatarFallback}>
                    <Text style={styles.largeAvatarInitials}>{initials}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.largeAvatarEditBadge}>
                <Feather name='camera' size={11} color='#ffffff' />
              </View>
            </View>

            <View style={styles.identityDetails}>
              <Text style={styles.identityName}>{displayName}</Text>
              <Text style={styles.identityEmail}>{userData?.email || '—'}</Text>
              <View style={styles.rolePill}>
                <View style={styles.rolePillDot} />
                <Text style={styles.rolePillText}>Main Admin</Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            {[
              {
                value: loadingStats ? '—' : stats.totalUsers,
                label: 'Total Users',
              },
              {
                value: loadingStats ? '—' : stats.totalStudents,
                label: 'Students',
              },
              {
                value: loadingStats ? '—' : stats.activeEvents,
                label: 'Active Events',
              },
              {
                value: loadingStats
                  ? '—'
                  : stats.totalAnnouncements + stats.totalEvents,
                label: 'Posts',
              },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <View style={styles.statCell}>
                  {loadingStats ? (
                    <ActivityIndicator
                      size='small'
                      color={colors.accent?.primary || '#0ea5e9'}
                    />
                  ) : (
                    <Text style={styles.statValue}>{s.value}</Text>
                  )}
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Navigate</Text>
          </View>
          <View style={styles.quickGrid}>
            {quickActions.map((a) => (
              <TouchableOpacity
                key={a.label}
                style={styles.quickTile}
                onPress={() => router.push(a.route as any)}
                activeOpacity={0.75}
              >
                <View style={[styles.quickTileIcon, { backgroundColor: a.bg }]}>
                  <Feather name={a.icon} size={18} color={a.color} />
                </View>
                <Text style={styles.quickTileLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Details</Text>
          </View>

          {[
            {
              label: 'Full Name',
              value: displayName,
              icon: 'user',
              last: false,
            },
            {
              label: 'Email',
              value: userData?.email || '—',
              icon: 'mail',
              last: false,
            },
            {
              label: 'Role',
              value: 'Main Administrator',
              icon: 'shield',
              last: false,
            },
            {
              label: 'Username',
              value: userData?.email?.split('@')[0] || '—',
              icon: 'at-sign',
              last: false,
            },
            {
              label: 'Member Since',
              value: memberSince,
              icon: 'calendar',
              last: true,
            },
          ].map((row, i) => (
            <View
              key={row.label}
              style={[styles.infoRow, row.last && styles.infoRowLast]}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <Feather
                  name={row.icon as any}
                  size={14}
                  color={colors.sidebar?.text?.muted || '#94a3b8'}
                />
                <Text style={styles.infoLabel}>{row.label}</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>System Analytics</Text>
          </View>

          <View style={styles.analyticsGrid}>
            <View style={[styles.highlightCard, styles.highlightCardRow]}>
              <View style={styles.highlightCardLeft}>
                <View style={styles.highlightIconRow}>
                  <View
                    style={[
                      styles.highlightIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16,185,129,0.15)'
                          : '#d1fae5',
                      },
                    ]}
                  >
                    <Feather name='check-square' size={16} color='#10b981' />
                  </View>
                  <View
                    style={[
                      styles.highlightTrend,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16,185,129,0.15)'
                          : '#d1fae5',
                      },
                    ]}
                  >
                    <Feather name='users' size={9} color='#10b981' />
                    <Text
                      style={[styles.highlightTrendText, { color: '#10b981' }]}
                    >
                      total
                    </Text>
                  </View>
                </View>
                {loadingStats ? (
                  <ActivityIndicator color='#10b981' style={{ marginTop: 8 }} />
                ) : (
                  <Text style={styles.highlightValue}>
                    {stats.totalAttendance}
                  </Text>
                )}
                <Text style={styles.highlightLabel}>Attendance</Text>
              </View>

              <View style={styles.highlightCardRight}>
                <Svg width='50' height='50' viewBox='0 0 24 24'>
                  <Rect x='4' y='12' width='4' height='10' fill='#10b981' />
                  <Rect x='10' y='8' width='4' height='14' fill='#34d399' />
                  <Rect x='16' y='4' width='4' height='18' fill='#6ee7b7' />
                </Svg>
              </View>
            </View>

            <View style={[styles.highlightCard, styles.highlightCardRow]}>
              <View style={styles.highlightCardLeft}>
                <View style={styles.highlightIconRow}>
                  <View
                    style={[
                      styles.highlightIconBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(245,158,11,0.15)'
                          : '#fef3c7',
                      },
                    ]}
                  >
                    <Feather name='bell' size={16} color='#f59e0b' />
                  </View>
                  <View
                    style={[
                      styles.highlightTrend,
                      {
                        backgroundColor: isDark
                          ? 'rgba(245,158,11,0.15)'
                          : '#fef3c7',
                      },
                    ]}
                  >
                    <Feather name='clock' size={9} color='#f59e0b' />
                    <Text
                      style={[styles.highlightTrendText, { color: '#f59e0b' }]}
                    >
                      {loadingStats
                        ? '—'
                        : `${stats.pendingEvents + stats.pendingAnnouncements} pend.`}
                    </Text>
                  </View>
                </View>
                {loadingStats ? (
                  <ActivityIndicator color='#f59e0b' style={{ marginTop: 8 }} />
                ) : (
                  <Text style={styles.highlightValue}>
                    {stats.totalEvents + stats.totalAnnouncements}
                  </Text>
                )}
                <Text style={styles.highlightLabel}>Posts</Text>
              </View>

              <View style={styles.highlightCardRight}>
                <Svg width='50' height='50' viewBox='0 0 24 24'>
                  <Rect x='4' y='12' width='4' height='8' fill='#f59e0b' />
                  <Rect x='10' y='8' width='4' height='12' fill='#fbbf24' />
                  <Rect x='16' y='4' width='4' height='16' fill='#fcd34d' />
                  <Polyline
                    points='20,10 18,12 16,10'
                    fill='none'
                    stroke='#10b981'
                    strokeWidth='2'
                  />
                </Svg>
              </View>
            </View>

            <View style={styles.statusRow}>
              {[
                {
                  label: 'Approved',
                  value: stats.combinedApproved,
                  color: '#10b981',
                  bg: isDark ? 'rgba(16,185,129,0.12)' : '#d1fae5',
                },
                {
                  label: 'Pending',
                  value: stats.combinedPending,
                  color: '#f59e0b',
                  bg: isDark ? 'rgba(245,158,11,0.12)' : '#fef3c7',
                },
                {
                  label: 'Rejected',
                  value: stats.combinedRejected,
                  color: '#ef4444',
                  bg: isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2',
                },
              ].map((s) => (
                <View
                  key={s.label}
                  style={[styles.statusCell, { backgroundColor: s.bg }]}
                >
                  {loadingStats ? (
                    <ActivityIndicator size='small' color={s.color} />
                  ) : (
                    <Text style={[styles.statusCellValue, { color: s.color }]}>
                      {s.value}
                    </Text>
                  )}
                  <Text style={[styles.statusCellLabel, { color: s.color }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.combinedNote}>(Events + Announcements)</Text>

            <View style={styles.chartBlock}>
              <Text style={styles.chartBlockTitle}>User Breakdown</Text>
              <Text style={styles.chartBlockSub}>
                {loadingStats ? '—' : `${stats.totalUsers} total accounts`}
              </Text>

              {[
                {
                  label: 'Students',
                  value: stats.totalStudents,
                  color: '#0ea5e9',
                },
                {
                  label: 'Assistant Admins',
                  value: stats.assistantAdmins,
                  color: '#8b5cf6',
                },
                {
                  label: 'Main Admins',
                  value: stats.mainAdmins,
                  color: '#f59e0b',
                },
              ].map((row) => {
                const pct =
                  stats.totalUsers > 0
                    ? Math.round((row.value / stats.totalUsers) * 100)
                    : 0
                return (
                  <View key={row.label} style={styles.barRow}>
                    <View style={styles.barMeta}>
                      <View style={styles.barMetaLeft}>
                        <View
                          style={[
                            styles.barDot,
                            { backgroundColor: row.color },
                          ]}
                        />
                        <Text style={styles.barLabel}>{row.label}</Text>
                      </View>
                      <Text style={styles.barValueText}>
                        {loadingStats ? '—' : `${row.value} · ${pct}%`}
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: loadingStats ? '0%' : `${pct}%`,
                            backgroundColor: row.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )
              })}
            </View>

            {(() => {
              const rate =
                stats.totalStudents > 0 && stats.totalAttendance > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (stats.totalAttendance /
                          (stats.totalStudents *
                            Math.max(stats.approvedEvents, 1))) *
                          100
                      )
                    )
                  : 0
              const ringColor =
                rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444'
              return (
                <View style={styles.rateBlock}>
                  <View
                    style={[
                      styles.rateRing,
                      {
                        borderColor: ringColor,
                        backgroundColor: isDark
                          ? `${ringColor}18`
                          : `${ringColor}12`,
                      },
                    ]}
                  >
                    {loadingStats ? (
                      <ActivityIndicator size='small' color={ringColor} />
                    ) : (
                      <Text
                        style={[styles.rateRingValue, { color: ringColor }]}
                      >
                        {rate}%
                      </Text>
                    )}
                  </View>
                  <View style={styles.rateInfo}>
                    <Text style={styles.rateTitle}>Avg. Attendance Rate</Text>
                    <Text style={styles.rateSub}>
                      {loadingStats
                        ? 'Calculating…'
                        : `${stats.totalAttendance} records across ${stats.approvedEvents} approved event${stats.approvedEvents !== 1 ? 's' : ''}`}
                    </Text>
                    <View style={styles.rateBarTrack}>
                      <View
                        style={[
                          styles.rateBarFill,
                          { width: `${rate}%`, backgroundColor: ringColor },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              )
            })()}
          </View>
        </View>

        <View style={styles.logoutCard}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Feather name='log-out' size={24} color='#f50000' />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Campus Hub</Text>
          <Text style={styles.footerSub}>Main Administration Panel</Text>
        </View>
      </ScrollView>
    </View>
  )
}
