import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from 'firebase/storage'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../../../src/Controller/context/AuthContext'
import { useTheme } from '../../../src/Controller/context/ThemeContext'
import { auth, db } from '../../../src/Model/lib/firebaseConfig'
import { createAssistantProfileStyles } from '../../../src/View/styles/assistant-admin/profileStyles'

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title)
  } else {
    Alert.alert(title, message)
  }
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const commaIndex = name.indexOf(',')
    if (commaIndex !== -1) {
      return name.charAt(0).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }
  if (email) return email[0].toUpperCase()
  return 'A'
}

export default function AssistantAdminProfile() {
  const { logout, userData, user, refreshUserData } = useAuth()
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
  const [showImageOptions, setShowImageOptions] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)

  // Change Password State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number
    label: string
    color: string
  }>({ score: 0, label: 'Weak', color: '#EF4444' })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [eventsData, setEventsData] = useState<any[]>([])
  const [usersData, setUsersData] = useState<any[]>([])
  const [penaltiesData, setPenaltiesData] = useState<any[]>([])
  const [announcementsData, setAnnouncementsData] = useState<any[]>([])

  useEffect(() => {
    if (userData?.photoURL) setPhotoURL(userData.photoURL)
  }, [userData?.photoURL])

  const calculatePasswordStrength = (password: string) => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    let label = 'Weak'
    let color = '#EF4444'
    if (score >= 4) {
      label = 'Strong'
      color = '#10B981'
    } else if (score >= 3) {
      label = 'Good'
      color = '#3B82F6'
    } else if (score >= 2) {
      label = 'Fair'
      color = '#F59E0B'
    }

    setPasswordStrength({ score, label, color })
  }

  const isChangePasswordFormValid = () => {
    if (!currentPassword.trim()) return false
    if (!newPassword.trim() || passwordStrength.score < 3) return false
    if (newPassword !== confirmPassword) return false
    return true
  }

  const resetChangePasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
    setPasswordStrength({ score: 0, label: 'Weak', color: '#EF4444' })
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const handleChangePassword = async () => {
    setPasswordError(null)

    if (!isChangePasswordFormValid()) {
      setPasswordError('Please fill all fields correctly.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    const currentUser = auth.currentUser
    if (!currentUser || !currentUser.email) {
      setPasswordError('User not authenticated.')
      return
    }

    setIsUpdatingPassword(true)

    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      )
      await reauthenticateWithCredential(currentUser, credential)
      await updatePassword(currentUser, newPassword)

      Alert.alert('Success', 'Your password has been updated successfully.')
      setShowChangePasswordModal(false)
      resetChangePasswordForm()
    } catch (error: any) {
      console.error('Password change error:', error)
      if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
      ) {
        setPasswordError('Current password is incorrect.')
      } else if (error.code === 'auth/weak-password') {
        setPasswordError(
          'New password is too weak. Please choose a stronger password.'
        )
      } else if (error.code === 'auth/too-many-requests') {
        setPasswordError('Too many attempts. Please try again later.')
      } else {
        setPasswordError('Failed to update password. Please try again.')
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

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

  const deleteOldProfileImages = async (uid: string, email: string) => {
    const storage = getStorage()
    const listRef = ref(storage, 'profile-photos')
    try {
      const result = await listAll(listRef)
      const oldFiles = result.items.filter((itemRef) => {
        const name = itemRef.name
        const emailPattern = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`^profile_${emailPattern}_\\d+\\.jpg$`)
        return (
          (regex.test(name) || name.includes(email.replace(/[@.]/g, '_'))) &&
          name !== uid
        )
      })
      await Promise.all(oldFiles.map((fileRef) => deleteObject(fileRef)))
      if (oldFiles.length > 0) {
        console.log(`Deleted ${oldFiles.length} old profile image(s)`)
      }
    } catch (err: any) {
      if (err.code === 'storage/unauthorized') {
        console.log('List permission not granted, skipping old file cleanup')
      } else {
        console.warn('Failed to clean up old profile images:', err)
      }
    }
  }

  const uploadImage = async (source: string | File) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      showAlert('Error', 'User not authenticated.')
      return
    }
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
      const fileName = currentUser.uid
      const storageRef = ref(storage, `profile-photos/${fileName}`)
      await uploadBytes(storageRef, blob)
      const downloadUrl = await getDownloadURL(storageRef)

      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, { photoURL: downloadUrl })

      await refreshUserData()
      setPhotoURL(downloadUrl)
      showAlert('Success', 'Profile photo updated!')

      if (currentUser.email) {
        deleteOldProfileImages(currentUser.uid, currentUser.email).catch(
          () => {}
        )
      }
    } catch (err) {
      console.error('Upload error:', err)
      showAlert('Error', 'Failed to upload photo.')
    } finally {
      setUploadingImage(false)
    }
  }

  const pickImage = async (useCamera = false) => {
    try {
      setShowImageOptions(false)

      if (Platform.OS === 'web') {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0]
          if (file) await uploadImage(file)
        }
        input.click()
        return
      }

      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permissionResult.granted) {
        showAlert('Permission Required', 'Please allow access to proceed.')
        return
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
          })

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error picking image:', error)
      showAlert('Error', 'Failed to pick image. Please try again.')
    }
  }

  const removeProfileImage = async () => {
    try {
      setShowImageOptions(false)

      const currentUser = auth.currentUser
      if (!currentUser) return

      try {
        const storage = getStorage()
        const storageRef = ref(storage, `profile-photos/${currentUser.uid}`)
        await deleteObject(storageRef)
      } catch (storageError) {
        console.warn(
          'Could not delete from storage, might not exist:',
          storageError
        )
      }

      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, { photoURL: null })

      await refreshUserData()
      setPhotoURL(null)
      showAlert('Success', 'Profile photo removed successfully!')
    } catch (error) {
      console.error('Error removing profile image:', error)
      showAlert('Error', 'Failed to remove profile photo.')
    }
  }

  const fullName =
    userData?.surname && userData?.name
      ? `${userData.surname}, ${userData.name}`
      : userData?.name || userData?.email?.split('@')[0] || 'Assistant Admin'

  const displayName = fullName

  const nameInitial = userData?.name
    ? userData.name.charAt(0).toUpperCase()
    : 'A'
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

  const SUPPORT_EMAIL = 'developertmcconnect@gmail.com'

  const handleContactSupport = () => {
    const subject = encodeURIComponent(
      'Support Request - Assistant Admin - TMC Connect'
    )
    const body = encodeURIComponent(
      `Hello TMC Support Team,\n\n` +
        `I need assistance with the following:\n\n` +
        `[Please describe your issue here]\n\n` +
        `---\n` +
        `Assistant Admin: ${userData?.name || userData?.email || 'N/A'}\n` +
        `Email: ${userData?.email || ''}\n` +
        `App Version: 2.0\n` +
        `Platform: ${Platform.OS}`
    )
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`

    Linking.openURL(mailtoUrl).catch((err) => {
      Alert.alert(
        'Email Not Configured',
        'Unable to open email client. Please manually email us at ' +
          SUPPORT_EMAIL
      )
    })
  }

  const renderHelpModal = () => {
    const faqs = [
      {
        id: '1',
        question: 'How do I create an event?',
        answer:
          'Go to Events tab and tap "+ New". Fill in details and set attendance deadline.',
        icon: 'calendar-plus',
      },
      {
        id: '2',
        question: 'How do I manage attendance?',
        answer:
          'Select an event and view the student who attended and missed the events.',
        icon: 'account-check',
      },
      {
        id: '3',
        question: 'How do I create announcements?',
        answer:
          'Go to Announcement tab and tap "+ New" and fill the needed field.',
        icon: 'bullhorn',
      },
      {
        id: '4',
        question: 'How do I generate PDF file?',
        answer:
          'Go to the main dashboard and tap the download button icon at the top.',
        icon: 'file-pdf-box',
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
                <TouchableOpacity
                  style={styles.contactSupportButton}
                  onPress={handleContactSupport}
                >
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
                  © 2026 TMC Connect. jmx9f2a.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    )
  }

  const renderChangePasswordModal = () => (
    <Modal
      visible={showChangePasswordModal}
      transparent
      animationType='slide'
      onRequestClose={() => {
        setShowChangePasswordModal(false)
        resetChangePasswordForm()
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity
              onPress={() => {
                setShowChangePasswordModal(false)
                resetChangePasswordForm()
              }}
            >
              <Icon name='close' size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ padding: 16 }}>
              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Current Password *
                </Text>
                <View
                  style={[
                    styles.passwordInputContainer,
                    { borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder='Enter current password'
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    editable={!isUpdatingPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Icon
                      name={showCurrentPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  New Password *
                </Text>
                <View
                  style={[
                    styles.passwordInputContainer,
                    { borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder='Enter new password'
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={(text) => {
                      setNewPassword(text)
                      calculatePasswordStrength(text)
                    }}
                    editable={!isUpdatingPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Icon
                      name={showNewPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {newPassword.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          marginRight: 8,
                        }}
                      >
                        Strength:
                      </Text>
                      <Text
                        style={{
                          color: passwordStrength.color,
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {passwordStrength.label}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: colors.border,
                        borderRadius: 2,
                      }}
                    >
                      <View
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                          height: '100%',
                          backgroundColor: passwordStrength.color,
                          borderRadius: 2,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 10,
                        marginTop: 4,
                      }}
                    >
                      Use at least 8 characters with uppercase, lowercase,
                      number, and symbol.
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Confirm New Password *
                </Text>
                <View
                  style={[
                    styles.passwordInputContainer,
                    { borderColor: colors.border },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordInput, { color: colors.text }]}
                    placeholder='Confirm new password'
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!isUpdatingPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Icon
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword.length > 0 &&
                  newPassword !== confirmPassword && (
                    <Text
                      style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}
                    >
                      Passwords do not match.
                    </Text>
                  )}
              </View>

              {passwordError && (
                <View style={styles.errorBanner}>
                  <Icon name='alert-circle' size={16} color='#EF4444' />
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor:
                      isChangePasswordFormValid() && !isUpdatingPassword
                        ? colors.accent.primary
                        : colors.border,
                    marginTop: 24,
                  },
                ]}
                onPress={handleChangePassword}
                disabled={!isChangePasswordFormValid() || isUpdatingPassword}
              >
                {isUpdatingPassword ? (
                  <ActivityIndicator size='small' color='#FFFFFF' />
                ) : (
                  <Text style={styles.submitButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

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
            onPress={() => setShowImageOptions(true)}
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
                <Text style={styles.profileInitials}>{nameInitial}</Text>
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
                onPress={() => setShowImageOptions(true)}
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
                    <Text style={styles.avatarInitials}>{nameInitial}</Text>
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
            <Text style={styles.sectionTitle1}>Account & Preferences</Text>
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
              onPress={() => setShowChangePasswordModal(true)}
            >
              <View style={styles.menuItemLeft}>
                <Icon name='lock-reset' size={18} color='#8B5CF6' />
                <Text style={styles.menuItemText}>Change Password</Text>
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
            <Text style={styles.sectionTitle1}>Your Analytics</Text>
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
                  {computedStats.stats.approvedEvents > 0
                    ? `${Math.round((computedStats.stats.totalAttendance / (computedStats.stats.approvedEvents * 30)) * 100)}% avg`
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
                          computedStats.stats.approvedEvents > 0
                            ? `${Math.min(100, Math.round((computedStats.stats.totalAttendance / (computedStats.stats.approvedEvents * 30)) * 100))}%`
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
      {renderChangePasswordModal()}
      {renderAboutModal()}
      {renderHelpModal()}

      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowImageOptions(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowImageOptions(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.imageOptionsModal}>
                <Text style={styles.imageOptionsTitle}>Profile Photo</Text>

                <TouchableOpacity
                  style={styles.imageOptionButton}
                  onPress={() => pickImage(false)}
                >
                  <Icon name='image' size={24} color='#3B82F6' />
                  <Text style={styles.imageOptionText}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageOptionButton}
                  onPress={() => pickImage(true)}
                >
                  <Icon name='camera' size={24} color='#10B981' />
                  <Text style={styles.imageOptionText}>Take Photo</Text>
                </TouchableOpacity>

                {photoURL && (
                  <>
                    <TouchableOpacity
                      style={styles.imageOptionButton}
                      onPress={() => {
                        setShowImageOptions(false)
                        setShowImageViewer(true)
                      }}
                    >
                      <Icon name='eye' size={24} color='#8B5CF6' />
                      <Text style={styles.imageOptionText}>View Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.imageOptionButton,
                        styles.imageOptionRemove,
                      ]}
                      onPress={removeProfileImage}
                    >
                      <Icon name='delete' size={24} color='#DC2626' />
                      <Text
                        style={[
                          styles.imageOptionText,
                          styles.imageOptionRemoveText,
                        ]}
                      >
                        Remove Photo
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={styles.imageOptionCancel}
                  onPress={() => setShowImageOptions(false)}
                >
                  <Text style={styles.imageOptionCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Full-screen image viewer */}
      <Modal
        visible={showImageViewer}
        transparent={false}
        animationType='fade'
        onRequestClose={() => setShowImageViewer(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}
            onPress={() => setShowImageViewer(false)}
          >
            <Icon name='close' size={28} color='#fff' />
          </TouchableOpacity>
          <View
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            {photoURL ? (
              <Image
                source={{ uri: photoURL }}
                style={{ width: '90%', height: '90%', resizeMode: 'contain' }}
              />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Icon name='account' size={80} color='#fff' />
                <Text style={{ color: '#fff', marginTop: 16 }}>
                  No profile photo
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}
