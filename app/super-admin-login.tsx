import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../src/Controller/context/AuthContext'
import { db } from '../src/Model/lib/firebaseConfig'
import LoadingScreen from '../src/View/components/LoadingScreen'

// ─── Forgot Password Modal ────────────────────────────────────────────────────
const ForgotPasswordModal: React.FC<{
  visible: boolean
  onClose: () => void
  forgotUsername: string
  setForgotUsername: (v: string) => void
  forgotLoading: boolean
  forgotMessage: string | null
  forgotCooldownUntil: number | null
  forgotCooldownSeconds: number
  onSubmit: () => void
}> = ({
  visible,
  onClose,
  forgotUsername,
  setForgotUsername,
  forgotLoading,
  forgotMessage,
  forgotCooldownUntil,
  forgotCooldownSeconds,
  onSubmit,
}) => {
  const slideAnim = useRef(new Animated.Value(60)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 90,
          friction: 14,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 60,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [visible])

  const isSuccess = forgotMessage?.startsWith('✓')
  const isCoolingDown = !!(
    forgotCooldownUntil && forgotCooldownUntil > Date.now()
  )

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      onRequestClose={onClose}
    >
      <Animated.View style={[forgotStyles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            forgotStyles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Top accent bar */}
          <View style={forgotStyles.accentBar} />

          <View style={forgotStyles.iconWrap}>
            <View style={forgotStyles.iconCircle}>
              <Ionicons name='key-outline' size={26} color='#1D4ED8' />
            </View>
          </View>

          <Text style={forgotStyles.title}>Reset Password</Text>
          <Text style={forgotStyles.subtitle}>
            Enter your admin username and we'll send a secure reset link to the
            registered email.
          </Text>

          <View style={forgotStyles.inputWrap}>
            <Ionicons
              name='person-outline'
              size={16}
              color='#94A3B8'
              style={forgotStyles.inputIcon}
            />
            <TextInput
              style={forgotStyles.input}
              placeholder='Admin username'
              placeholderTextColor='#94A3B8'
              value={forgotUsername}
              onChangeText={setForgotUsername}
              autoCapitalize='none'
              editable={!forgotLoading}
            />
          </View>

          {forgotMessage ? (
            <View
              style={[
                forgotStyles.messageBox,
                isSuccess ? forgotStyles.successBox : forgotStyles.errorBox,
              ]}
            >
              <Ionicons
                name={
                  isSuccess
                    ? 'checkmark-circle-outline'
                    : 'alert-circle-outline'
                }
                size={15}
                color={isSuccess ? '#16A34A' : '#DC2626'}
              />
              <Text
                style={[
                  forgotStyles.messageText,
                  { color: isSuccess ? '#16A34A' : '#DC2626' },
                ]}
              >
                {forgotMessage}
              </Text>
            </View>
          ) : null}

          <View style={forgotStyles.btnRow}>
            <TouchableOpacity
              style={forgotStyles.cancelBtn}
              onPress={onClose}
              disabled={forgotLoading}
            >
              <Text style={forgotStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                forgotStyles.submitBtn,
                (forgotLoading || isCoolingDown) && forgotStyles.disabledBtn,
              ]}
              onPress={onSubmit}
              disabled={forgotLoading || isCoolingDown}
            >
              {forgotLoading ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : isCoolingDown ? (
                <Text style={forgotStyles.submitText}>
                  Wait {forgotCooldownSeconds}s
                </Text>
              ) : (
                <Text style={forgotStyles.submitText}>Send Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  )
}

const forgotStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  accentBar: {
    height: 4,
    backgroundColor: '#1D4ED8',
    marginHorizontal: -28,
    marginBottom: 24,
  },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: '#0F172A',
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    borderWidth: 1,
  },
  successBox: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  errorBox: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  messageText: { fontSize: 12.5, flex: 1, lineHeight: 18, fontWeight: '500' },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  submitBtn: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disabledBtn: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
})

// ─── Left Panel Feature Item ──────────────────────────────────────────────────
const FeaturePill: React.FC<{
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  delay: number
}> = ({ icon, label, delay }) => {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay,
      useNativeDriver: true,
    }).start()
  }, [])
  return (
    <Animated.View
      style={[
        panelStyles.pill,
        {
          opacity: anim,
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-16, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={panelStyles.pillIconBox}>
        <Ionicons name={icon} size={14} color='#60A5FA' />
      </View>
      <Text style={panelStyles.pillLabel}>{label}</Text>
    </Animated.View>
  )
}

const panelStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flex: 1,
  },
  pillIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(96,165,250,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12.5,
    fontWeight: '500',
  },
})

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SuperAdminLogin() {
  const router = useRouter()
  const { login, loading: authLoading } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('')
  const [usernameFocused, setUsernameFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [forgotModalVisible, setForgotModalVisible] = useState(false)
  const [forgotUsername, setForgotUsername] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState<string | null>(null)
  const [forgotCooldownUntil, setForgotCooldownUntil] = useState<number | null>(
    null
  )
  const [forgotCooldownSeconds, setForgotCooldownSeconds] = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [remainingLockoutSeconds, setRemainingLockoutSeconds] = useState(0)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(32)).current
  const shakeAnim = useRef(new Animated.Value(0)).current

  const saveLockoutState = (attempts: number, lockoutTime: number | null) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'superAdminLoginAttempts',
        JSON.stringify({ failedAttempts: attempts, lockoutUntil: lockoutTime })
      )
    }
  }
  const restoreLockoutState = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('superAdminLoginAttempts')
      if (stored) {
        try {
          const { failedAttempts: sa, lockoutUntil: sl } = JSON.parse(stored)
          if (sl && sl > Date.now()) {
            setFailedAttempts(sa)
            setLockoutUntil(sl)
          } else {
            localStorage.removeItem('superAdminLoginAttempts')
            setFailedAttempts(0)
            setLockoutUntil(null)
          }
        } catch {
          localStorage.removeItem('superAdminLoginAttempts')
        }
      }
    }
  }
  const saveForgotCooldown = (cooldownTime: number | null) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'superAdminForgotCooldown',
        JSON.stringify({ cooldownUntil: cooldownTime })
      )
    }
  }
  const restoreForgotCooldown = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('superAdminForgotCooldown')
      if (stored) {
        try {
          const { cooldownUntil } = JSON.parse(stored)
          if (cooldownUntil && cooldownUntil > Date.now())
            setForgotCooldownUntil(cooldownUntil)
          else {
            localStorage.removeItem('superAdminForgotCooldown')
            setForgotCooldownUntil(null)
          }
        } catch {
          localStorage.removeItem('superAdminForgotCooldown')
        }
      }
    }
  }

  useEffect(() => {
    restoreLockoutState()
    restoreForgotCooldown()
  }, [])

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  useEffect(() => {
    let interval: number
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const update = () => {
        const rem = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000))
        setRemainingLockoutSeconds(rem)
        if (rem === 0) {
          setLockoutUntil(null)
          setFailedAttempts(0)
          setRemainingLockoutSeconds(0)
          localStorage.removeItem('superAdminLoginAttempts')
          setError(null)
        }
      }
      update()
      interval = setInterval(update, 1000)
      return () => clearInterval(interval)
    } else if (lockoutUntil && lockoutUntil <= Date.now()) {
      setLockoutUntil(null)
      setFailedAttempts(0)
      setRemainingLockoutSeconds(0)
      localStorage.removeItem('superAdminLoginAttempts')
      setError(null)
    }
  }, [lockoutUntil])

  useEffect(() => {
    let interval: number
    if (forgotCooldownUntil && forgotCooldownUntil > Date.now()) {
      const update = () => {
        const rem = Math.max(
          0,
          Math.ceil((forgotCooldownUntil - Date.now()) / 1000)
        )
        setForgotCooldownSeconds(rem)
        if (rem === 0) {
          setForgotCooldownUntil(null)
          setForgotCooldownSeconds(0)
          localStorage.removeItem('superAdminForgotCooldown')
        }
      }
      update()
      interval = window.setInterval(update, 1000)
      return () => clearInterval(interval)
    } else if (forgotCooldownUntil && forgotCooldownUntil <= Date.now()) {
      setForgotCooldownUntil(null)
      setForgotCooldownSeconds(0)
      localStorage.removeItem('superAdminForgotCooldown')
    }
  }, [forgotCooldownUntil])

  useEffect(() => {
    if (
      lockoutUntil &&
      lockoutUntil > Date.now() &&
      remainingLockoutSeconds > 0
    ) {
      setError(
        `Too many failed attempts. Try again in ${remainingLockoutSeconds}s.`
      )
    }
  }, [remainingLockoutSeconds, lockoutUntil])

  const triggerShake = () => {
    shakeAnim.setValue(0)
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const isOnline = (): boolean =>
    typeof navigator !== 'undefined' ? navigator.onLine : true

  const handleLogin = async () => {
    if (busy || authLoading) return
    setError(null)
    if (lockoutUntil && lockoutUntil > Date.now()) return
    else if (lockoutUntil && lockoutUntil <= Date.now()) {
      setLockoutUntil(null)
      setFailedAttempts(0)
      setRemainingLockoutSeconds(0)
      localStorage.removeItem('superAdminLoginAttempts')
    }
    if (!username || !password) {
      setError('Please enter your username and password.')
      triggerShake()
      return
    }
    if (!isOnline()) {
      setError('No internet connection. Please check your network.')
      triggerShake()
      return
    }

    setBusy(true)
    setLoadingMessage('Verifying credentials')

    try {
      const usersCollection = collection(db, 'users')
      const q = query(usersCollection, where('username', '==', username))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) throw new Error('Invalid username or password')

      const userDoc = querySnapshot.docs[0]
      const userData = userDoc.data()
      const isActive =
        (userData.status ? userData.status !== 'inactive' : true) &&
        userData.active !== false
      if (!isActive) {
        setError(
          'Your account has been deactivated. Contact the system administrator.'
        )
        setBusy(false)
        return
      }
      if (userData.role !== 'main_admin') {
        setError('Access denied. This portal is for main administrators only.')
        setBusy(false)
        return
      }

      await login(userData.email, password)
      setFailedAttempts(0)
      setLockoutUntil(null)
      setRemainingLockoutSeconds(0)
      setError(null)
      localStorage.removeItem('superAdminLoginAttempts')
      setLoadingMessage('Access granted! Loading dashboard')
      try {
        await router.replace('/main_admin')
      } catch (navError) {
        console.error('Navigation error:', navError)
        setError('Unable to open the dashboard. Please restart the app.')
        setBusy(false)
      }
    } catch (err: any) {
      const isNetworkError =
        err?.code === 'unavailable' ||
        err?.code === 'failed-precondition' ||
        err?.message?.toLowerCase().includes('network') ||
        err?.message?.toLowerCase().includes('offline') ||
        err?.message?.toLowerCase().includes('fetch')
      if (isNetworkError) {
        setError('No internet connection. Please check your network.')
        setBusy(false)
        triggerShake()
        return
      }

      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)
      if (newAttempts >= 3) {
        const lockoutTime = Date.now() + 60 * 1000
        setLockoutUntil(lockoutTime)
        setRemainingLockoutSeconds(60)
        saveLockoutState(newAttempts, lockoutTime)
        setError(
          'Too many failed attempts. Please wait 60 seconds before trying again.'
        )
      } else {
        setError(
          `Invalid username or password. ${3 - newAttempts} attempt${3 - newAttempts !== 1 ? 's' : ''} remaining.`
        )
      }
      triggerShake()
    } finally {
      setBusy(false)
    }
  }

  const isValidEmail = (email: string) =>
    /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email)

  const handleForgotPassword = async () => {
    if (!forgotUsername.trim()) {
      setForgotMessage('Please enter your username.')
      return
    }
    if (forgotCooldownUntil && forgotCooldownUntil > Date.now()) {
      setForgotMessage(
        `Please wait ${forgotCooldownSeconds}s before requesting again.`
      )
      return
    }

    setForgotLoading(true)
    setForgotMessage(null)
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '==', forgotUsername.trim()))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        setForgotMessage('Username not found.')
        setForgotLoading(false)
        return
      }

      const userData = querySnapshot.docs[0].data()
      if (userData.role !== 'main_admin') {
        setForgotMessage('This account does not have admin privileges.')
        setForgotLoading(false)
        return
      }
      if (!userData.email) {
        setForgotMessage(
          'No email associated with this account. Contact support.'
        )
        setForgotLoading(false)
        return
      }
      if (!isValidEmail(userData.email)) {
        setForgotMessage('Email on file is invalid. Contact support.')
        setForgotLoading(false)
        return
      }

      const auth = getAuth()
      await sendPasswordResetEmail(auth, userData.email)
      const cooldownTime = Date.now() + 60 * 1000
      setForgotCooldownUntil(cooldownTime)
      setForgotCooldownSeconds(60)
      saveForgotCooldown(cooldownTime)
      setForgotMessage(
        '✓ Reset link sent! Check your inbox. The link expires in 1 hour.'
      )
    } catch (error: any) {
      const msg =
        error.code === 'auth/user-not-found'
          ? 'No account found. Contact support.'
          : error.code === 'auth/invalid-email'
            ? 'Invalid email on file. Contact support.'
            : error.code === 'auth/too-many-requests'
              ? 'Too many requests. Try again later.'
              : 'Failed to send reset email. Try again later.'
      setForgotMessage(msg)
    } finally {
      setForgotLoading(false)
    }
  }

  const isLoading = busy || authLoading
  const isLockedOut = !!(lockoutUntil && lockoutUntil > Date.now())

  const features: {
    icon: React.ComponentProps<typeof Ionicons>['name']
    label: string
  }[] = [
    { icon: 'people-outline', label: 'User Management' },
    { icon: 'calendar-outline', label: 'Event Scheduler' },
    { icon: 'megaphone-outline', label: 'Announcements' },
    { icon: 'checkmark-circle-outline', label: 'Attendance' },
    { icon: 'bar-chart-outline', label: 'Analytics' },
    { icon: 'shield-checkmark-outline', label: 'Admin Controls' },
  ]

  return (
    <ScrollView
      contentContainerStyle={loginStyles.scrollContainer}
      keyboardShouldPersistTaps='handled'
    >
      <StatusBar barStyle='light-content' />

      {/* Loading Modal */}
      <Modal transparent visible={isLoading} animationType='fade'>
        <LoadingScreen
          message={loadingMessage || 'Loading Dashboard'}
          subMessage='Please wait while we prepare your workspace'
        />
      </Modal>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={forgotModalVisible}
        onClose={() => {
          setForgotModalVisible(false)
          setForgotMessage(null)
          setForgotUsername('')
        }}
        forgotUsername={forgotUsername}
        setForgotUsername={setForgotUsername}
        forgotLoading={forgotLoading}
        forgotMessage={forgotMessage}
        forgotCooldownUntil={forgotCooldownUntil}
        forgotCooldownSeconds={forgotCooldownSeconds}
        onSubmit={handleForgotPassword}
      />

      <KeyboardAvoidingView
        style={loginStyles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={loginStyles.container}>
          {/* ── LEFT PANEL ────────────────────────────────── */}
          <LinearGradient
            colors={['#060D1F', '#0A1A3D', '#0D2966']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={loginStyles.leftPanel}
          >
            {/* Decorative blobs */}
            <View
              style={[
                loginStyles.blob,
                {
                  width: 380,
                  height: 380,
                  top: -100,
                  right: -100,
                  backgroundColor: 'rgba(29,78,216,0.12)',
                },
              ]}
            />
            <View
              style={[
                loginStyles.blob,
                {
                  width: 280,
                  height: 280,
                  bottom: -60,
                  left: -60,
                  backgroundColor: 'rgba(29,78,216,0.08)',
                },
              ]}
            />
            <View
              style={[
                loginStyles.blob,
                {
                  width: 180,
                  height: 180,
                  bottom: '35%',
                  right: -40,
                  backgroundColor: 'rgba(96,165,250,0.07)',
                },
              ]}
            />

            {/* Horizontal separator line glow */}
            <View style={loginStyles.glowLine} />

            {/* Logo */}
            <View style={loginStyles.leftLogoRow}>
              <Image
                source={require('../assets/images/Logo/TMC_Connect.png')}
                style={loginStyles.leftLogoImage}
                resizeMode='contain'
              />
              <View>
                <Text style={loginStyles.leftLogoTitle}>TMC Connect</Text>
                <Text style={loginStyles.leftLogoSub}>Admin Portal</Text>
              </View>
            </View>

            {/* Badge */}
            <View style={loginStyles.leftBadge}>
              <View style={loginStyles.leftBadgeDot} />
              <Text style={loginStyles.leftBadgeText}>Main Administrator</Text>
            </View>

            {/* Headline */}
            <Text style={loginStyles.leftHeadline}>
              Command your{'\n'}campus{' '}
              <Text style={loginStyles.leftHeadlineAccent}>operations</Text>
              {'\n'}from one place.
            </Text>

            <Text style={loginStyles.leftSub}>
              The full administrative suite for managing users, events,
              attendance, announcements, and system-wide approvals.
            </Text>

            {/* Feature pills grid — strict 3×2 */}
            <View style={loginStyles.pillsGrid}>
              {[0, 1].map((row) => (
                <View key={row} style={loginStyles.pillsRow}>
                  {features.slice(row * 3, row * 3 + 3).map((f, i) => (
                    <FeaturePill
                      key={f.label}
                      icon={f.icon}
                      label={f.label}
                      delay={300 + (row * 3 + i) * 80}
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* Bottom version badge */}
            <View style={loginStyles.versionBadge}>
              <Ionicons
                name='shield-checkmark'
                size={11}
                color='rgba(96,165,250,0.7)'
              />
              <Text style={loginStyles.versionText}>
                TMC Connect v2.0 · End-to-end encrypted
              </Text>
            </View>
          </LinearGradient>

          {/* ── RIGHT PANEL ───────────────────────────────── */}
          <Animated.View
            style={[
              loginStyles.rightPanel,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={loginStyles.rightInner}>
              {/* Card header */}
              <View style={loginStyles.cardHeader}>
                <Image
                  source={require('../assets/images/Logo/TMC-Coonect-V.2.png')}
                  style={loginStyles.cardLogo}
                  resizeMode='contain'
                />
                <View style={loginStyles.secureTag}>
                  <Ionicons name='lock-closed' size={9} color='#1D4ED8' />
                  <Text style={loginStyles.secureTagText}>Secure Portal</Text>
                </View>
              </View>

              <Text style={loginStyles.cardTitle}>Administrator Login</Text>
              <Text style={loginStyles.cardSubtitle}>
                Restricted access · Main administrators only
              </Text>

              <View style={loginStyles.divider} />

              {/* Username Field */}
              <View style={loginStyles.fieldGroup}>
                <Text style={loginStyles.fieldLabel}>Username</Text>
                <View
                  style={[
                    loginStyles.inputRow,
                    usernameFocused && loginStyles.inputRowFocused,
                    !!error && !usernameFocused && loginStyles.inputRowError,
                  ]}
                >
                  <Ionicons
                    name='person-outline'
                    size={16}
                    color={usernameFocused ? '#1D4ED8' : '#94A3B8'}
                    style={loginStyles.fieldIcon}
                  />
                  <TextInput
                    style={loginStyles.textInput}
                    placeholder='Enter your username'
                    placeholderTextColor='#94A3B8'
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize='none'
                    editable={!isLoading && !isLockedOut}
                    onFocus={() => setUsernameFocused(true)}
                    onBlur={() => setUsernameFocused(false)}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={loginStyles.fieldGroup}>
                <Text style={loginStyles.fieldLabel}>Password</Text>
                <View
                  style={[
                    loginStyles.inputRow,
                    passwordFocused && loginStyles.inputRowFocused,
                    !!error && !passwordFocused && loginStyles.inputRowError,
                  ]}
                >
                  <Ionicons
                    name='lock-closed-outline'
                    size={16}
                    color={passwordFocused ? '#1D4ED8' : '#94A3B8'}
                    style={loginStyles.fieldIcon}
                  />
                  <TextInput
                    style={loginStyles.textInput}
                    placeholder='Enter your password'
                    placeholderTextColor='#94A3B8'
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isLoading && !isLockedOut}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    style={loginStyles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading || isLockedOut}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={17}
                      color={passwordFocused ? '#1D4ED8' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Options row */}
              <View style={loginStyles.optionsRow}>
                <TouchableOpacity
                  style={loginStyles.checkboxRow}
                  onPress={() => setKeepLoggedIn(!keepLoggedIn)}
                  disabled={isLoading || isLockedOut}
                >
                  <View
                    style={[
                      loginStyles.checkbox,
                      keepLoggedIn && loginStyles.checkboxOn,
                    ]}
                  >
                    {keepLoggedIn && (
                      <Ionicons name='checkmark' size={11} color='#fff' />
                    )}
                  </View>
                  <Text style={loginStyles.keepLoggedText}>
                    Keep me signed in
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setForgotModalVisible(true)}
                  disabled={isLoading || isLockedOut}
                >
                  <Text style={loginStyles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              {/* Error banner */}
              {error ? (
                <Animated.View
                  style={[
                    loginStyles.errorBanner,
                    { transform: [{ translateX: shakeAnim }] },
                  ]}
                >
                  <Ionicons name='alert-circle' size={15} color='#DC2626' />
                  <Text style={loginStyles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              {/* Submit button */}
              <TouchableOpacity
                style={[
                  loginStyles.loginBtn,
                  (isLoading || isLockedOut) && loginStyles.loginBtnDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading || isLockedOut}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    isLockedOut
                      ? ['#93C5FD', '#93C5FD']
                      : ['#1D4ED8', '#2563EB']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                {isLockedOut ? (
                  <>
                    <Ionicons name='time-outline' size={18} color='#fff' />
                    <Text style={loginStyles.loginBtnText}>
                      Locked · {remainingLockoutSeconds}s
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name='log-in-outline' size={18} color='#fff' />
                    <Text style={loginStyles.loginBtnText}>Enter Portal</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Attempt pips */}
              {failedAttempts > 0 && !isLockedOut && (
                <View style={loginStyles.attemptsRow}>
                  {[0, 1, 2].map((i) => (
                    <View
                      key={i}
                      style={[
                        loginStyles.attemptPip,
                        i < failedAttempts && loginStyles.attemptPipFilled,
                      ]}
                    />
                  ))}
                  <Text style={loginStyles.attemptsText}>
                    {3 - failedAttempts} attempt
                    {3 - failedAttempts !== 1 ? 's' : ''} remaining
                  </Text>
                </View>
              )}

              {/* Footer */}
              <View style={loginStyles.cardFooter}>
                <TouchableOpacity
                  onPress={() => router.push('/')}
                  disabled={isLoading || isLockedOut}
                  style={loginStyles.backBtn}
                >
                  <Ionicons
                    name='arrow-back-outline'
                    size={14}
                    color='#64748B'
                  />
                  <Text style={loginStyles.backBtnText}>Back to Home</Text>
                </TouchableOpacity>
                <View style={loginStyles.securityNote}>
                  <Ionicons
                    name='shield-checkmark-outline'
                    size={11}
                    color='#CBD5E1'
                  />
                  <Text style={loginStyles.securityNoteText}>
                    End-to-end encrypted
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
export const loginStyles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#F0F7FF',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100%' as any,
  },

  // ── Left panel
  leftPanel: {
    flex: 1.1,
    paddingVertical: 52,
    paddingHorizontal: 44,
    overflow: 'hidden',
    justifyContent: 'center',
    minWidth: 320,
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(96,165,250,0.2)',
  },
  leftLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  leftLogoImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  leftLogoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  leftLogoSub: {
    color: 'rgba(148,163,184,0.8)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  leftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(29,78,216,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  leftBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
  },
  leftBadgeText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  leftHeadline: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 16,
  },
  leftHeadlineAccent: {
    color: '#60A5FA',
  },
  leftSub: {
    fontSize: 13.5,
    color: 'rgba(148,163,184,0.85)',
    lineHeight: 23,
    marginBottom: 32,
    maxWidth: 380,
  },
  pillsGrid: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 40,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  versionText: {
    color: 'rgba(100,116,139,0.8)',
    fontSize: 11,
    fontWeight: '500',
  },

  // ── Right panel
  rightPanel: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  rightInner: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 36,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardLogo: {
    width: 110,
    height: 44,
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  secureTagText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 24,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 7,
    letterSpacing: 0.2,
    textTransform: 'uppercase' as any,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
  },
  inputRowFocused: {
    borderColor: '#1D4ED8',
    backgroundColor: '#fff',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  inputRowError: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 4,
  },

  // Options
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  keepLoggedText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  forgotLink: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
  },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Button
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 15,
    marginBottom: 12,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
  },
  loginBtnDisabled: {
    shadowOpacity: 0,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Attempt pips
  attemptsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 12,
  },
  attemptPip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  attemptPipFilled: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  attemptsText: {
    fontSize: 11.5,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 2,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  securityNoteText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
  },
})
