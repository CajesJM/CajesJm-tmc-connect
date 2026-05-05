import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from 'firebase/storage'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Clipboard,
  Easing,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { useAuth } from '../../src/Controller/context/AuthContext'
import { useTheme } from '../../src/Controller/context/ThemeContext'
import { useConfirm } from '../../src/Controller/hooks/useConfirm'
import { useToast } from '../../src/Controller/hooks/useToast'
import { auth, db } from '../../src/Model/lib/firebaseConfig'
import { ConfirmDialog } from '../../src/View/components/ConfirmDialog'
import { Toast } from '../../src/View/components/Toast'
import { createProfileStyles } from '../../src/View/styles/main-admin/profileStyles'

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
function useCountUp(
  target: number,
  duration: number = 800,
  isLoading: boolean = false
) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)

  useEffect(() => {
    if (isLoading || target === 0) {
      setCount(0)
      return
    }

    const startValue = prevTarget.current
    const diff = target - startValue
    const steps = 30
    const stepDuration = duration / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(startValue + diff * easedProgress))

      if (currentStep >= steps) {
        clearInterval(timer)
        setCount(target)
        prevTarget.current = target
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [target, isLoading])

  return count
}

function AnimatedStat({
  value,
  isLoading,
  color,
  style,
}: {
  value: number
  isLoading: boolean
  color: string
  style?: any
}) {
  const count = useCountUp(value, 800, isLoading)
  if (isLoading)
    return (
      <ActivityIndicator size='small' color={color} style={{ marginTop: 8 }} />
    )
  return <Text style={style}>{count}</Text>
}
export default function MainAdminProfile() {
  const { logout, userData, refreshUserData } = useAuth()
  const router = useRouter()
  const { colors, isDark, toggleTheme } = useTheme()
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const isTablet = width >= 640 && width < 1024
  const isDesktop = width >= 1024

  const styles = useMemo(
    () => createProfileStyles(colors, isDark, isMobile, isTablet, isDesktop),
    [colors, isDark, isMobile, isTablet, isDesktop]
  )

  const [photoURL, setPhotoURL] = useState<string | null>(
    userData?.photoURL ?? null
  )
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)

  const { toast, showToast, hideToast } = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()

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

  const [isThemeToggling, setIsThemeToggling] = useState(false)
  const themeSpinAnim = useRef(new Animated.Value(0)).current

  const handleThemeToggle = () => {
    if (isThemeToggling) return

    setIsThemeToggling(true)
    themeSpinAnim.setValue(0)

    Animated.timing(themeSpinAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsThemeToggling(false)
    })

    toggleTheme()
  }

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
  const copyToClipboard = async (text: string, label: string = 'Email') => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(text)
      } else {
        Clipboard.setString(text)
      }
      showToast(`${label} copied to clipboard.`, 'success')
    } catch (err) {
      showToast('Failed to copy. Please try again.', 'error')
    }
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

      showToast('Your password has been updated successfully.', 'success')
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

  const contentApprovalRate = useMemo(() => {
    const totalContent = stats.totalEvents + stats.totalAnnouncements
    const approvedContent = stats.combinedApproved
    if (totalContent === 0) return 0
    return Math.round((approvedContent / totalContent) * 100)
  }, [stats])

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

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const pastEvents = allEventsSnap.docs.filter((d) => {
          const data = d.data()
          const s = data.status
          const isApproved =
            s === 'approved' || s === undefined || s === null || s === ''
          const eventDate =
            data.date?.toDate?.() ?? (data.date ? new Date(data.date) : null)
          return isApproved && eventDate && eventDate < todayStart
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

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      confirmLabel: 'Log Out',
      cancelLabel: 'Cancel',
      confirmDestructive: true,
    })
    if (!confirmed) return
    logout()
    router.replace('/super-admin-login')
  }

  const renderChangePasswordModal = () => (
    <Modal
      visible={showChangePasswordModal}
      transparent
      animationType='fade'
      onRequestClose={() => {
        setShowChangePasswordModal(false)
        resetChangePasswordForm()
      }}
    >
      <TouchableOpacity
        style={styles.glassModalOverlay}
        activeOpacity={1}
        onPress={() => {
          setShowChangePasswordModal(false)
          resetChangePasswordForm()
        }}
      >
        <TouchableOpacity
          style={[
            styles.glassModalContent,
            isMobile && styles.glassModalContentMobile,
            { maxHeight: useWindowDimensions().height * 0.9 },
          ]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.glassModalHeader}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <Feather
                name='arrow-right'
                size={20}
                color={colors.accent.primary}
              />
              <Text
                style={[
                  styles.glassModalTitle,
                  isMobile && styles.glassModalTitleMobile,
                ]}
              >
                Change Password
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setShowChangePasswordModal(false)
                resetChangePasswordForm()
              }}
              style={styles.glassModalClose}
            >
              <Feather
                name='x'
                size={isMobile ? 22 : 26}
                color={colors.sidebar.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Scrollable body */}
          <ScrollView
            style={styles.glassModalBody}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Current Password */}
            <View style={styles.glassFormGroup}>
              <Text style={[styles.glassFormLabel, { color: colors.text }]}>
                Current Password *
              </Text>
              <View
                style={[
                  styles.glassFormInput,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                  },
                ]}
              >
                <TextInput
                  style={{ flex: 1, color: colors.text, paddingVertical: 12 }}
                  placeholder='Enter current password'
                  placeholderTextColor={colors.sidebar.text.muted}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  editable={!isUpdatingPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Feather
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.sidebar.text.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.glassFormGroup}>
              <Text style={[styles.glassFormLabel, { color: colors.text }]}>
                New Password *
              </Text>
              <View
                style={[
                  styles.glassFormInput,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                  },
                ]}
              >
                <TextInput
                  style={{ flex: 1, color: colors.text, paddingVertical: 12 }}
                  placeholder='Enter new password'
                  placeholderTextColor={colors.sidebar.text.muted}
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
                  <Feather
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.sidebar.text.muted}
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
                        color: colors.sidebar.text.muted,
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
                      color: colors.sidebar.text.muted,
                      fontSize: 10,
                      marginTop: 4,
                    }}
                  >
                    Use at least 8 characters with uppercase, lowercase, number,
                    and symbol.
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.glassFormGroup}>
              <Text style={[styles.glassFormLabel, { color: colors.text }]}>
                Confirm New Password *
              </Text>
              <View
                style={[
                  styles.glassFormInput,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                  },
                ]}
              >
                <TextInput
                  style={{ flex: 1, color: colors.text, paddingVertical: 12 }}
                  placeholder='Confirm new password'
                  placeholderTextColor={colors.sidebar.text.muted}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isUpdatingPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={colors.sidebar.text.muted}
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
                <Feather name='alert-circle' size={16} color='#EF4444' />
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
            )}

            <View
              style={[
                styles.glassFormActions,
                isMobile && styles.glassFormActionsMobile,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.glassSubmitButton,
                  (!isChangePasswordFormValid() || isUpdatingPassword) &&
                    styles.glassSubmitButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={!isChangePasswordFormValid() || isUpdatingPassword}
              >
                {isUpdatingPassword ? (
                  <ActivityIndicator size='small' color='#ffffff' />
                ) : (
                  <>
                    <Feather
                      name='check-circle'
                      size={isMobile ? 16 : 18}
                      color='#ffffff'
                    />
                    <Text style={styles.glassSubmitButtonText}>
                      Update Password
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.glassCancelButton}
                onPress={() => {
                  setShowChangePasswordModal(false)
                  resetChangePasswordForm()
                }}
              >
                <Text style={styles.glassCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )

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
          showToast('Please allow access to your photo library.', 'error')
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
      showToast('Failed to select image. Please try again.', 'error')
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
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error('No authenticated user')

      const fileName = `profile_${currentUser.uid}.jpg`
      const storageRef = ref(storage, `profileImages/${fileName}`)
      await uploadBytes(storageRef, blob)
      const downloadUrl = await getDownloadURL(storageRef)

      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, { photoURL: downloadUrl })
      await refreshUserData()
      await deleteOldProfileImages(currentUser.uid, userData.email)

      setPhotoURL(downloadUrl)
      showToast('Profile photo updated!', 'success')
    } catch (err) {
      console.error('Upload error:', err)
      showToast('Failed to upload photo. Please try again.', 'error')
    } finally {
      setUploadingImage(false)
    }
  }

  const deleteOldProfileImages = async (uid: string, email: string) => {
    const storage = getStorage()
    const listRef = ref(storage, 'profileImages')
    try {
      const result = await listAll(listRef)
      const oldFiles = result.items.filter((itemRef) => {
        const name = itemRef.name

        const emailPattern = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`^profile_${emailPattern}_\\d+\\.jpg$`)
        return regex.test(name) && name !== `profile_${uid}.jpg`
      })
      await Promise.all(oldFiles.map((fileRef) => deleteObject(fileRef)))
      if (oldFiles.length > 0) {
        console.log(`Deleted ${oldFiles.length} old profile image(s)`)
      }
    } catch (err) {
      console.warn('Failed to clean up old profile images:', err)
    }
  }

  const displayName = (() => {
    const name = userData?.name
    const surname = userData?.surname
    const email = userData?.email
    if (name) {
      return `${name} ${surname || ''}`.trim() || name
    }
    return email?.split('@')[0] || 'Admin'
  })()

  const initials = getInitials(userData?.name, userData?.email)
  const memberSince = userData?.createdAt
    ? new Date(
        typeof userData.createdAt === 'object' && userData.createdAt.seconds
          ? userData.createdAt.seconds * 1000
          : userData.createdAt
      ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  const headerGradient = isDark
    ? (['#060c18', '#0a1a3a', '#10254e'] as const)
    : (['#ffffff', '#f5f9ff', '#eaf2ff'] as const)

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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[
            styles.headerGradient,
            { marginHorizontal: isMobile ? -12 : -20 },
          ]}
        >
          <View style={styles.headerContent}>
            <View>
              <Text
                style={[
                  styles.greetingText,
                  { color: isDark ? '#cbd5e1' : '#475569' },
                ]}
              >
                Welcome Back,
              </Text>
              <Text
                style={[
                  styles.userName,
                  { color: isDark ? '#ffffff' : '#0f172a' },
                ]}
              >
                {userData
                  ? `${userData.name} ${userData.surname || ''}`.trim() ||
                    userData.name
                  : 'Admin'}
              </Text>
              <Text
                style={[
                  styles.roleText,
                  { color: isDark ? '#94a3b8' : '#64748b' },
                ]}
              >
                My Profile
              </Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setShowProfileMenu(true)}
              disabled={uploadingImage}
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
                  { color: isDark ? '#cbd5e1' : '#334155' },
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
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.05)',
                  },
                ]}
                onPress={handleThemeToggle}
                disabled={isThemeToggling}
                activeOpacity={0.75}
              >
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: themeSpinAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                      {
                        scale: themeSpinAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 1.2, 1],
                        }),
                      },
                    ],
                  }}
                >
                  <Feather
                    name={isDark ? 'sun' : 'moon'}
                    size={18}
                    color={isDark ? '#fff' : '#1e293b'}
                  />
                </Animated.View>
              </TouchableOpacity>

              {/* Change Password Button */}
              <TouchableOpacity
                style={[
                  styles.headerAction,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.05)',
                  },
                ]}
                onPress={() => setShowChangePasswordModal(true)}
              >
                <Feather
                  name='lock'
                  size={18}
                  color={isDark ? '#fff' : '#1e293b'}
                />
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity
                style={[
                  styles.headerAction,
                  styles.logoutHeaderButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.05)',
                  },
                ]}
                onPress={handleLogout}
              >
                <Feather name='log-out' size={18} color='#ef4444' />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

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
              <Text style={styles.identityName}>
                {''}
                {userData
                  ? `${userData.name} ${userData.surname || ''}`.trim() ||
                    userData.name
                  : 'Admin'}
              </Text>
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
                value: stats.totalAnnouncements,
                label: 'Announcements',
                icon: 'bell',
                color: '#8b5cf6',
              },
              {
                value: stats.pastEvents,
                label: 'Past Events',
                icon: 'calendar',
                color: '#f59e0b',
              },
              {
                value: stats.approvedEvents,
                label: 'Approved Events',
                icon: 'check-circle',
                color: '#3b82f6',
              },
              {
                value: stats.activeEvents,
                label: 'Upcoming Events',
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
                label: 'Penalties Sent',
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
                <AnimatedStat
                  value={stat.value}
                  isLoading={loadingStats}
                  color={stat.color}
                  style={styles.statValue}
                />
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

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
                value:
                  userData?.username || userData?.email?.split('@')[0] || '—',
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
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyToClipboard(item.value, item.label)}
                    >
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
            <View style={styles.metricsRow}>
              <LinearGradient
                colors={['#1dd396', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.metricCard, styles.metricCardLarge]}
              >
                <View style={styles.metricHeader}>
                  <View
                    style={[
                      styles.metricIconBox,
                      { backgroundColor: 'rgba(255,255,255,0.2)' },
                    ]}
                  >
                    <Feather name='check-square' size={18} color='#ffffff' />
                  </View>
                  <View
                    style={[
                      styles.metricTrend,
                      { backgroundColor: 'rgba(255,255,255,0.2)' },
                    ]}
                  >
                    <Feather name='trending-up' size={12} color='#ffffff' />
                    <Text
                      style={[styles.metricTrendText, { color: '#ffffff' }]}
                    >
                      {attendanceRate}%
                    </Text>
                  </View>
                </View>
                <View style={styles.metricBody}>
                  {loadingStats ? (
                    <ActivityIndicator color='#ffffff' />
                  ) : (
                    <AnimatedStat
                      value={stats.totalAttendance}
                      isLoading={loadingStats}
                      color='#ffffff'
                      style={[styles.metricValue, { color: '#ffffff' }]}
                    />
                  )}
                  <Text style={[styles.metricLabel, { color: '#ffffffcc' }]}>
                    Total Attendance
                  </Text>
                </View>
                <View style={styles.metricFooter}>
                  <View style={styles.metricBar}>
                    <View
                      style={[
                        styles.metricBarFill,
                        {
                          width: `${attendanceRate}%`,
                          backgroundColor: '#ffffffcc',
                        },
                      ]}
                    />
                  </View>
                </View>
              </LinearGradient>

              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.metricCard, styles.metricCardLarge]}
              >
                <View style={styles.metricHeader}>
                  <View
                    style={[
                      styles.metricIconBox,
                      { backgroundColor: 'rgba(255,255,255,0.2)' },
                    ]}
                  >
                    <Feather name='bell' size={18} color='#ffffff' />
                  </View>
                  <View
                    style={[
                      styles.metricTrend,
                      { backgroundColor: 'rgba(255,255,255,0.2)' },
                    ]}
                  >
                    <Feather name='trending-up' size={12} color='#ffffff' />
                    <Text
                      style={[styles.metricTrendText, { color: '#ffffff' }]}
                    >
                      {contentApprovalRate}%
                    </Text>
                  </View>
                </View>
                <View style={styles.metricBody}>
                  {loadingStats ? (
                    <ActivityIndicator color='#ffffff' />
                  ) : (
                    <AnimatedStat
                      value={stats.totalEvents + stats.totalAnnouncements}
                      isLoading={loadingStats}
                      color='#ffffff'
                      style={[styles.metricValue, { color: '#ffffff' }]}
                    />
                  )}
                  <Text style={[styles.metricLabel, { color: '#ffffffcc' }]}>
                    Total Posts
                  </Text>
                </View>
                <View style={styles.metricFooter}>
                  <View style={styles.metricBar}>
                    <View
                      style={[
                        styles.metricBarFill,
                        {
                          width: `${contentApprovalRate}%`,
                          backgroundColor: '#ffffffcc',
                        },
                      ]}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.statusGrid}>
              <LinearGradient
                colors={['#11e9a1', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statusItem}
              >
                <View style={styles.statusHeader}>
                  <Feather name='check-circle' size={14} color='#ffffff' />
                  <AnimatedStat
                    value={stats.combinedApproved}
                    isLoading={loadingStats}
                    color='#ffffff'
                    style={[styles.statusValue, { color: '#ffffff' }]}
                  />
                </View>
                <Text style={[styles.statusLabel, { color: '#ffffffcc' }]}>
                  Approved
                </Text>
              </LinearGradient>

              {/* Pending */}
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statusItem}
              >
                <View style={styles.statusHeader}>
                  <Feather name='clock' size={14} color='#ffffff' />
                  <AnimatedStat
                    value={stats.combinedPending}
                    isLoading={loadingStats}
                    color='#ffffff'
                    style={[styles.statusValue, { color: '#ffffff' }]}
                  />
                </View>
                <Text style={[styles.statusLabel, { color: '#ffffffcc' }]}>
                  Pending
                </Text>
              </LinearGradient>

              {/* Rejected */}
              <LinearGradient
                colors={['#ef4444', '#b91c1c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statusItem}
              >
                <View style={styles.statusHeader}>
                  <Feather name='x-circle' size={14} color='#ffffff' />
                  <AnimatedStat
                    value={stats.combinedRejected}
                    isLoading={loadingStats}
                    color='#ffffff'
                    style={[styles.statusValue, { color: '#ffffff' }]}
                  />
                </View>
                <Text style={[styles.statusLabel, { color: '#ffffffcc' }]}>
                  Rejected
                </Text>
              </LinearGradient>
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
      </ScrollView>

      <Modal
        visible={showProfileMenu}
        transparent
        animationType='fade'
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay1}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={styles.profileMenuContainer}>
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={() => {
                setShowProfileMenu(false)
                setShowImageViewer(true)
              }}
            >
              <Feather name='eye' size={20} color={colors.text} />
              <Text style={styles.profileMenuItemText}>View Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileMenuItem}
              onPress={() => {
                setShowProfileMenu(false)
                handlePickImage()
              }}
            >
              <Feather name='camera' size={20} color={colors.text} />
              <Text style={styles.profileMenuItemText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
            <Feather name='x' size={28} color='#fff' />
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
                <Feather name='user' size={80} color='#fff' />
                <Text style={{ color: '#fff', marginTop: 16 }}>
                  No profile photo
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {renderChangePasswordModal()}

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
      />
      <ConfirmDialog
        visible={confirmState.visible}
        title={confirmState.options.title}
        message={confirmState.options.message}
        confirmLabel={confirmState.options.confirmLabel}
        cancelLabel={confirmState.options.cancelLabel}
        confirmDestructive={confirmState.options.confirmDestructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </View>
  )
}
