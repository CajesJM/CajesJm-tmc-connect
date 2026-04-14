import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { db } from '../../../lib/firebaseConfig'
import { createAssistantProfileStyles } from '../../../styles/assistant-admin/profileStyles'

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title)
  } else {
    Alert.alert(title, message)
  }
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name.charAt(0).toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return 'A'
}

export default function AssistantAdminProfile() {
  const { logout, userData, user } = useAuth()
  const router = useRouter()
  const { theme, setTheme, colors, isDark } = useTheme()
  const { width } = useWindowDimensions()

  const styles = useMemo(
    () => createAssistantProfileStyles(colors, isDark),
    [colors, isDark]
  )

  const [photoURL, setPhotoURL] = useState<string | null>(
    userData?.photoURL ?? null
  )
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loadingStats, setLoadingStats] = useState(true)

  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

  const [eventsData, setEventsData] = useState<any[]>([])
  const [usersData, setUsersData] = useState<any[]>([])
  const [penaltiesData, setPenaltiesData] = useState<any[]>([])
  const [announcementsData, setAnnouncementsData] = useState<any[]>([])

  useEffect(() => {
    if (userData?.photoURL) setPhotoURL(userData.photoURL)
  }, [userData?.photoURL])

  useEffect(() => {
    setLoadingStats(true)

    const eventsUnsub = onSnapshot(
      collection(db, 'events'),
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setEventsData(docs)
      },
      (error) => console.error('Events listener error:', error)
    )

    const usersUnsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setUsersData(docs)
      },
      (error) => console.error('Users listener error:', error)
    )

    const penaltiesUnsub = onSnapshot(
      collection(db, 'penalties'),
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setPenaltiesData(docs)
      },
      (error) => {
        setPenaltiesData([])
      }
    )

    const announcementsUnsub = onSnapshot(
      collection(db, 'announcements'),
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setAnnouncementsData(docs)
      },
      (error) => console.error('Announcements listener error:', error)
    )
    const timer = setTimeout(() => setLoadingStats(false), 300)

    return () => {
      eventsUnsub()
      usersUnsub()
      penaltiesUnsub()
      announcementsUnsub()
      clearTimeout(timer)
    }
  }, [])

  const computedStats = useMemo(() => {
    // System-wide stats
    let totalEvents = eventsData.length
    let sysApprovedEvents = 0
    let sysPendingEvents = 0
    let sysRejectedEvents = 0
    let sysTotalAttendance = 0

    // Personal stats for events
    let myApprovedEvents = 0
    let myPendingEvents = 0
    let myRejectedEvents = 0
    let myTotalAttendance = 0

    eventsData.forEach((data) => {
      const status = data.status
      const isApproved = status === 'approved' || !status

      if (isApproved) {
        sysApprovedEvents++
        sysTotalAttendance += data.attendees?.length ?? 0
      } else if (status === 'pending') {
        sysPendingEvents++
      } else if (status === 'rejected') {
        sysRejectedEvents++
      }

      const createdBy = data.createdBy
      const isMyEvent =
        (user?.uid && createdBy === user.uid) ||
        (userData?.email && createdBy === userData.email)

      if (isMyEvent) {
        if (isApproved) {
          myApprovedEvents++
          myTotalAttendance += data.attendees?.length ?? 0
        } else if (status === 'pending') {
          myPendingEvents++
        } else if (status === 'rejected') {
          myRejectedEvents++
        }
      }
    })

    // Users stats
    const activeStudents = usersData.filter(
      (d) => d.role === 'student' || !d.role
    ).length

    // Penalties stats
    const pendingPenalties = penaltiesData.filter(
      (d) => d.status === 'pending'
    ).length

    // Announcements stats
    const totalAnnouncements = announcementsData.length

    // Personal stats from announcements (only count if not already counted as events)
    let myAnnouncementsApproved = 0
    let myAnnouncementsPending = 0
    let myAnnouncementsRejected = 0

    announcementsData.forEach((data) => {
      const createdBy = data.createdBy
      const isMyAnnouncement =
        (user?.uid && createdBy === user.uid) ||
        (userData?.email && createdBy === userData.email)

      if (isMyAnnouncement) {
        const status = data.status
        if (status === 'approved' || !status) {
          myAnnouncementsApproved++
        } else if (status === 'pending') {
          myAnnouncementsPending++
        } else if (status === 'rejected') {
          myAnnouncementsRejected++
        }
      }
    })

    // Combine personal stats (events + announcements)
    const totalMyApproved = myApprovedEvents + myAnnouncementsApproved
    const totalMyPending = myPendingEvents + myAnnouncementsPending
    const totalMyRejected = myRejectedEvents + myAnnouncementsRejected

    return {
      stats: {
        managedEvents: totalEvents,
        totalAttendance: sysTotalAttendance,
        activeStudents,
        pendingPenalties,
        totalAnnouncements,
        approvedEvents: sysApprovedEvents,
        pendingEvents: sysPendingEvents,
        rejectedEvents: sysRejectedEvents,
      },
      personalStats: {
        approvedEvents: totalMyApproved,
        pendingEvents: totalMyPending,
        rejectedEvents: totalMyRejected,
        totalAttendance: myTotalAttendance,
      },
    }
  }, [eventsData, usersData, penaltiesData, announcementsData, user, userData])

  const handleLogout = () => {
    const confirmLogout = () => {
      logout()
      router.replace('/login')
    }

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        confirmLogout()
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: confirmLogout },
      ])
    }
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
      showAlert('Error', 'Failed to select image.')
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
      showAlert('Error', 'Failed to upload photo.')
    } finally {
      setUploadingImage(false)
    }
  }

  const displayName =
    userData?.name || userData?.email?.split('@')[0] || 'Assistant Admin'
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

  const quickActions = [
    {
      label: 'Events',
      icon: 'calendar',
      color: '#0ea5e9',
      route: '/assistant_admin/events',
    },
    {
      label: 'Attendance',
      icon: 'check-square',
      color: '#10b981',
      route: '/assistant_admin/attendance',
    },
    {
      label: 'Announcements',
      icon: 'bell',
      color: '#f59e0b',
      route: '/assistant_admin/announcements',
    },
    {
      label: 'Penalties',
      icon: 'alert-circle',
      color: '#ef4444',
      route: '/assistant_admin/penalties',
    },
    {
      label: 'Reports',
      icon: 'bar-chart-2',
      color: '#8b5cf6',
      route: '/assistant_admin/reports',
    },
    {
      label: 'Students',
      icon: 'users',
      color: '#ec4899',
      route: '/assistant_admin/students',
    },
  ]
  const renderSettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      transparent
      animationType='slide'
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Icon name='close' size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Theme Preferences</Text>
              {[
                { label: 'Light Mode', value: 'light', icon: 'weather-sunny' },
                { label: 'Dark Mode', value: 'dark', icon: 'weather-night' },
                { label: 'System Default', value: 'system', icon: 'cellphone' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={styles.settingsOption}
                  onPress={() => setTheme(opt.value as any)}
                >
                  <View style={styles.settingsOptionLeft}>
                    <Icon
                      name={opt.icon}
                      size={20}
                      color={colors.accent.primary}
                    />
                    <Text style={styles.settingsOptionText}>{opt.label}</Text>
                  </View>
                  {theme === opt.value && (
                    <Icon
                      name='check-circle'
                      size={18}
                      color={colors.accent.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Preferences</Text>
              <View style={styles.settingsOption}>
                <View style={styles.settingsOptionLeft}>
                  <Icon
                    name='bell-outline'
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.settingsOptionText}>Notifications</Text>
                </View>
                <Text style={styles.settingsOptionValue}>Enabled</Text>
              </View>
              <View style={styles.settingsOption}>
                <View style={styles.settingsOptionLeft}>
                  <Icon
                    name='language'
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.settingsOptionText}>Language</Text>
                </View>
                <Text style={styles.settingsOptionValue}>English</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>About</Text>
              <View style={styles.settingsOption}>
                <View style={styles.settingsOptionLeft}>
                  <Icon
                    name='information'
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.settingsOptionText}>Version</Text>
                </View>
                <Text style={styles.settingsOptionValue}>2.0</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  const renderAboutModal = () => {
    const aboutInfo = {
      appName: 'TMC Connect Admin',
      version: '2.0',
      description:
        'Assistant admin dashboard for managing campus events and student engagement.',
      developers: [
        {
          id: '1',
          name: 'John Mark Cajes',
          profilePhoto: require('../../../assets/images/Profile/Jm.jpg'),
          role: 'Lead Developer',
          email: 'markcajes@gmail.com',
        },
        {
          id: '2',
          name: 'Ken Suarez',
          profilePhoto: require('../../../assets/images/Profile/ken.jpg'),
          role: 'Lead Developer',
          email: 'kensuarez31@gmail.com',
        },
        {
          id: '3',
          name: 'Denmerk Apa',
          profilePhoto: require('../../../assets/images/Profile/denmerk.jpg'),
          role: 'QA Tester',
          email: 'denmerk@gmail.com',
        },
        {
          id: '4',
          name: 'Sherylann Inanod',
          profilePhoto: require('../../../assets/images/Profile/Jm.jpg'),
          role: 'UI/UX Designer',
          email: 'inanodsherylann@gmail.com',
        },
        {
          id: '5',
          name: 'Karl James Ayuban',
          profilePhoto: require('../../../assets/images/Profile/jim.jpg'),
          role: '',
          email: 'ayubankarljames@gmail.com',
        },
      ],
      organization: 'TMC Connect Developers',
    }

    return (
      <Modal
        visible={showAboutModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About This App</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Icon name='close' size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.aboutSection}>
                <Text style={styles.aboutDescription}>
                  {aboutInfo.description}
                </Text>
              </View>

              <View style={styles.aboutSection}>
                <Text style={styles.sectionLabel}>
                  {aboutInfo.organization}
                </Text>
                <View style={styles.membersList}>
                  {aboutInfo.developers.map((member, index) => (
                    <View key={index} style={styles.memberItem}>
                      <View style={styles.memberAvatar}>
                        {member.profilePhoto ? (
                          <Image
                            source={member.profilePhoto}
                            style={styles.memberAvatarImage}
                          />
                        ) : (
                          <Text style={styles.memberAvatarText}>
                            {member.name.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        {member.role && (
                          <Text style={styles.memberRole}>{member.role}</Text>
                        )}
                        {member.email && (
                          <Text style={styles.memberEmail}>{member.email}</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.versionSection}>
                <Text style={styles.versionText}>
                  Version {aboutInfo.version}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  const renderHelpModal = () => {
    const faqs = [
      {
        id: '1',
        question: 'How do I create an event?',
        answer:
          'Go to Events and tap "+". Fill in details and set attendance deadline.',
        icon: 'calendar-plus',
      },
      {
        id: '2',
        question: 'How do I scan attendance?',
        answer: 'Select an active event and tap "Scan QR Code".',
        icon: 'qrcode-scan',
      },
      {
        id: '3',
        question: 'How do I manage penalties?',
        answer: 'Go to Penalties to view and update penalty status.',
        icon: 'alert-circle',
      },
      {
        id: '4',
        question: 'How do I view reports?',
        answer: 'Navigate to Reports for analytics and trends.',
        icon: 'chart-line',
      },
    ]

    return (
      <Modal
        visible={showHelpModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Help & Support</Text>
                <Text style={styles.modalSubtitle}>How can we help you?</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <Icon name='close' size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.supportBanner}>
                <Icon name='headset' size={40} color={colors.accent.primary} />
                <Text style={styles.supportBannerTitle}>
                  Need Immediate Help?
                </Text>
                <TouchableOpacity style={styles.contactSupportButton}>
                  <Icon name='headset' size={18} color='#FFFFFF' />
                  <Text style={styles.contactSupportText}>Contact Support</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>
                Frequently Asked Questions
              </Text>
              <View style={styles.faqList}>
                {faqs.map((faq) => {
                  const [expanded, setExpanded] = useState(false)
                  return (
                    <View key={faq.id} style={styles.faqItem}>
                      <TouchableOpacity
                        style={styles.faqQuestion}
                        onPress={() => setExpanded(!expanded)}
                      >
                        <View style={styles.faqQuestionLeft}>
                          <Icon
                            name={faq.icon}
                            size={18}
                            color={colors.accent.primary}
                          />
                          <Text style={styles.faqQuestionText}>
                            {faq.question}
                          </Text>
                        </View>
                        <Icon
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                      {expanded && (
                        <View style={styles.faqAnswer}>
                          <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>

              <View style={styles.versionInfo}>
                <Text style={styles.versionText}>TMC Connect v2.0</Text>
                <Text style={styles.copyrightText}>
                  © 2026 TMC Connect. All rights reserved.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>My Profile</Text>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.role}>Assistant Admin</Text>
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

        <View style={styles.headerBottom}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Feather name='log-out' size={18} color='#ef4444' />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Card with Stats */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <View style={styles.avatarFallback}>
                    <ActivityIndicator size='small' color='#0ea5e9' />
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
                <View style={styles.avatarEditBadge}>
                  <Feather name='camera' size={10} color='#fff' />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarLabel}>Assistant Admin</Text>
            </View>

            <View style={styles.identitySection}>
              <Text style={styles.identityName}>{displayName}</Text>
              <Text style={styles.identityEmail}>{userData?.email || '—'}</Text>
              <View style={styles.memberSinceRow}>
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
                value: computedStats.stats.managedEvents,
                label: 'Events',
                icon: 'calendar',
                color: '#0ea5e9',
              },
              {
                value: computedStats.stats.totalAttendance,
                label: 'Attendance',
                icon: 'check-square',
                color: '#10b981',
              },
              {
                value: computedStats.stats.totalAnnouncements,
                label: 'Announcements',
                icon: 'bell',
                color: '#8b5cf6',
              },
              {
                value: computedStats.stats.pendingPenalties,
                label: 'Penalties',
                icon: 'alert-circle',
                color: '#ef4444',
              },
            ].map((stat, i) => (
              <View
                key={stat.label}
                style={[styles.statItem, i === 3 && styles.statItemLast]}
              >
                <View
                  style={[
                    styles.statIconBox,
                    { backgroundColor: `${stat.color}15` },
                  ]}
                >
                  <Feather
                    name={stat.icon as any}
                    size={14}
                    color={stat.color}
                  />
                </View>
                {loadingStats ? (
                  <ActivityIndicator size='small' color={stat.color} />
                ) : (
                  <Text style={styles.statValue}>{stat.value}</Text>
                )}
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account Details & Menu */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account & Preferences</Text>
          </View>

          <View style={styles.menuList}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowSettingsModal(true)}
            >
              <View style={styles.menuItemLeft}>
                <Icon name='cog' size={18} color={colors.accent.primary} />
                <Text style={styles.menuItemText}>Settings</Text>
              </View>
              <Icon
                name='chevron-right'
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowAboutModal(true)}
            >
              <View style={styles.menuItemLeft}>
                <Icon
                  name='information'
                  size={18}
                  color={colors.accent.primary}
                />
                <Text style={styles.menuItemText}>About</Text>
              </View>
              <Icon
                name='chevron-right'
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowHelpModal(true)}
            >
              <View style={styles.menuItemLeft}>
                <Icon
                  name='help-circle'
                  size={18}
                  color={colors.accent.primary}
                />
                <Text style={styles.menuItemText}>Help & Support</Text>
              </View>
              <Icon
                name='chevron-right'
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics Summary */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Analytics</Text>
          </View>
          <View style={styles.analyticsContent}>
            {/* Event Status Pills */}
            <View style={styles.statusRow}>
              {[
                {
                  label: 'Approved',
                  value: computedStats.personalStats.approvedEvents,
                  color: '#10b981',
                },
                {
                  label: 'Pending',
                  value: computedStats.personalStats.pendingEvents,
                  color: '#f59e0b',
                },
                {
                  label: 'Rejected',
                  value: computedStats.personalStats.rejectedEvents,
                  color: '#ef4444',
                },
              ].map((s) => (
                <View
                  key={s.label}
                  style={[
                    styles.statusPill,
                    { backgroundColor: `${s.color}15` },
                  ]}
                >
                  <Text style={[styles.statusValue, { color: s.color }]}>
                    {loadingStats ? '—' : s.value}
                  </Text>
                  <Text style={[styles.statusLabel, { color: s.color }]}>
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Attendance Rate based on personal events */}
            <View style={styles.rateRow}>
              <View style={styles.rateInfo}>
                <Text style={styles.rateTitle}>Attendance Rate</Text>
                <Text style={styles.rateSub}>
                  {computedStats.personalStats.approvedEvents > 0
                    ? `${Math.round((computedStats.personalStats.totalAttendance / (computedStats.personalStats.approvedEvents * 30)) * 100)}% avg`
                    : 'No events yet'}
                </Text>
              </View>
              <View style={styles.rateBarContainer}>
                <View style={styles.rateBarTrack}>
                  <View
                    style={[
                      styles.rateBarFill,
                      {
                        width:
                          computedStats.personalStats.approvedEvents > 0
                            ? `${Math.min(100, Math.round((computedStats.personalStats.totalAttendance / (computedStats.personalStats.approvedEvents * 30)) * 100))}%`
                            : '0%',
                        backgroundColor: '#10b981',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <Feather name='log-out' size={20} color='#ef4444' />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TMC Connect</Text>
          <Text style={styles.footerSub}>Assistant Admin Panel</Text>
        </View>
      </ScrollView>

      {renderSettingsModal()}
      {renderAboutModal()}
      {renderHelpModal()}
    </View>
  )
}
