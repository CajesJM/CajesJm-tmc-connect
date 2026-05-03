import { Feather } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import { LinearGradient } from 'expo-linear-gradient'
import * as Print from 'expo-print'
import { useRouter } from 'expo-router'
import * as Sharing from 'expo-sharing'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useAuth } from '../../src/Controller/context/AuthContext'
import { useTheme } from '../../src/Controller/context/ThemeContext'
import { useConfirm } from '../../src/Controller/hooks/useConfirm'
import { useToast } from '../../src/Controller/hooks/useToast'
import { notificationService } from '../../src/Controller/utils/notifications'
import { auth, db } from '../../src/Model/lib/firebaseConfig'
import { ConfirmDialog } from '../../src/View/components/ConfirmDialog'
import PenaltyAnnouncementModal from '../../src/View/components/PenaltyAnnouncementModal'
import { Toast } from '../../src/View/components/Toast'
import { createAttendanceStyles } from '../../src/View/styles/main-admin/attendanceStyles'

interface PenaltyStatus {
  status: 'pending' | 'paid' | 'completed' | 'cancelled'
  sentAt?: string
  completedAt?: string
  cancelledAt?: string
  completedBy?: string
  cancelledBy?: string
}

const FormTextInput = ({
  style,
  value,
  onChangeText,
  placeholder,
  inputStyle,
  ...props
}: {
  style?: any
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  inputStyle?: any
  [key: string]: any
}) => (
  <RNTextInput
    style={[inputStyle, style]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor='#94a3b8'
    {...props}
  />
)

interface Event {
  id: string
  title: string
  location: string
  date: string | { seconds: number; nanoseconds: number }
  coordinates?: {
    latitude: number
    longitude: number
    radius: number
  }
  qrExpiration?: string | null
  isActive?: boolean
  status?: 'pending' | 'approved' | 'rejected'
}

interface AttendanceRecord {
  studentName: string
  studentID: string
  yearLevel: string
  block: string
  course: string
  gender: string
  timestamp?: string | { seconds: number; nanoseconds: number }
  role?: string
  location?: {
    isWithinRadius: boolean
    distance?: number
    accuracy?: number
  }
}
interface PenaltyRecord {
  eventId: string
  eventTitle: string
  status: 'pending' | 'paid'
  paidAt?: string
  paidBy?: string
  amount?: number
  createdAt: string
}
interface Student {
  id: string
  name: string
  surname?: string
  studentID: string
  yearLevel: string
  block: string
  course: string
  role?: string
}

const parseEventDate = (date: any): Date | null => {
  if (!date) return null
  try {
    if (typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000)
    }
    if (typeof date === 'string') {
      const d = new Date(date)
      return isNaN(d.getTime()) ? null : d
    }
    return null
  } catch {
    return null
  }
}

const sortEventsByUpcoming = (events: Event[]): Event[] => {
  const now = new Date()
  return [...events].sort((a, b) => {
    const dateA = parseEventDate(a.date)
    const dateB = parseEventDate(b.date)

    const isUpcomingA = dateA && dateA > now
    const isUpcomingB = dateB && dateB > now

    if (isUpcomingA && !isUpcomingB) return -1
    if (!isUpcomingA && isUpcomingB) return 1

    if (isUpcomingA && isUpcomingB) {
      return dateA!.getTime() - dateB!.getTime()
    } else {
      return dateB!.getTime() - dateA!.getTime()
    }
  })
}
const AnimatedBlock = memo(function AnimatedBlock({
  block,
  students,
  index,
  styles,
  isMobile,
  colors,
  formatTime,
}: {
  block: string
  students: AttendanceRecord[]
  index: number
  styles: any
  isMobile: boolean
  colors: any
  formatTime: (timestamp: any) => string
}) {
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
  }, [])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <View style={styles.blockSection}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Block {block}</Text>
          <Text style={styles.blockCount}>{students.length}</Text>
        </View>
        {students.map((record, idx) => (
          <View
            key={idx}
            style={[
              styles.attendanceItem,
              isMobile && styles.attendanceItemMobile,
            ]}
          >
            <View style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <Text
                  style={[
                    styles.studentName,
                    isMobile && styles.studentNameMobile,
                  ]}
                  numberOfLines={1}
                >
                  {record.studentName}
                </Text>
                <Text style={styles.studentId}>{record.studentID}</Text>
              </View>
              <View style={styles.attendanceMeta}>
                {record.location && (
                  <View
                    style={[
                      styles.locationBadge,
                      record.location.isWithinRadius
                        ? styles.locationBadgeValid
                        : styles.locationBadgeInvalid,
                    ]}
                  >
                    <Feather
                      name={record.location.isWithinRadius ? 'check' : 'x'}
                      size={10}
                      color={
                        record.location.isWithinRadius ? '#16a34a' : '#dc2626'
                      }
                    />
                    <Text
                      style={[
                        styles.locationBadgeText,
                        record.location.isWithinRadius
                          ? styles.locationBadgeTextValid
                          : styles.locationBadgeTextInvalid,
                      ]}
                    >
                      {record.location.isWithinRadius ? 'Verified' : 'Too Far'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.studentDetails} numberOfLines={1}>
              {record.course} • Year {record.yearLevel}
            </Text>
            <View style={styles.attendanceTimeContainer}>
              <Feather
                name='clock'
                size={12}
                color={colors.sidebar.text.muted}
              />
              <Text style={styles.attendanceTimeText}>
                Attended at: {formatTime(record.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  )
})

export default function MainAdminAttendance() {
  const { toast, showToast, hideToast } = useToast()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const { user, userData } = useAuth()
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const { colors, isDark, toggleTheme } = useTheme()

  const isMobile = screenWidth < 640
  const isTablet = screenWidth >= 640 && screenWidth < 1024
  const isDesktop = screenWidth >= 1024

  const styles = useMemo(
    () => createAttendanceStyles(colors, isDark, isMobile, isTablet, isDesktop),
    [colors, isDark, isMobile, isTablet, isDesktop]
  )

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const qrWrapperRef = useRef<View>(null)
  const qrCodeRef = useRef<any>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [showEventModal, setShowEventModal] = useState<boolean>(false)
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('all')
  const [selectedBlock, setSelectedBlock] = useState<string>('all')
  const [showExpirationModal, setShowExpirationModal] = useState<boolean>(false)
  const [customExpiration, setCustomExpiration] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [qrValue, setQrValue] = useState<string>('')
  const [isCustomDatePickerVisible, setCustomDatePickerVisible] =
    useState(false)
  const [customExpirationDate, setCustomExpirationDate] = useState<Date | null>(
    null
  )
  const [quickOptions, setQuickOptions] = useState<
    Array<{ label: string; value: string }>
  >([])
  const [isSaving, setIsSaving] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [paginatedBlocks, setPaginatedBlocks] = useState<
    [string, AttendanceRecord[]][]
  >([])
  const [totalPages, setTotalPages] = useState(1)
  const [eventPage, setEventPage] = useState(1)
  const [eventItemsPerPage] = useState(5)

  const [students, setStudents] = useState<Student[]>([])
  const [mode, setMode] = useState<'qr' | 'receipt'>('qr')
  const [searchQuery, setSearchQuery] = useState('')

  const [showPenaltyModal, setShowPenaltyModal] = useState(false)
  const [paidStudentIds, setPaidStudentIds] = useState<Set<string>>(new Set())
  const [processingPayment, setProcessingPayment] = useState<string | null>(
    null
  )
  const [sentPenaltyEvents, setSentPenaltyEvents] = useState<Set<string>>(
    new Set()
  )
  const [penaltyDetails, setPenaltyDetails] = useState<{
    [eventId: string]: { studentIds: string[]; sentAt: string }
  }>({})
  const [completedStudentIds, setCompletedStudentIds] = useState<Set<string>>(
    new Set()
  )

  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

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

  const [missingPage, setMissingPage] = useState(1)
  const missingItemsPerPage = 10

  const isValidDate = (dateString: any): boolean => {
    if (!dateString) return false
    try {
      const date = new Date(dateString)
      return !isNaN(date.getTime())
    } catch (error) {
      return false
    }
  }
  const getSurname = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/)
    return parts[parts.length - 1]
  }

  const sortMissingStudents = (students: Student[]): Student[] => {
    return [...students].sort((a, b) => {
      const yearA = parseInt(String(a.yearLevel).match(/\d+/)?.[0] ?? '0')
      const yearB = parseInt(String(b.yearLevel).match(/\d+/)?.[0] ?? '0')
      if (yearA !== yearB) return yearA - yearB

      const surnameA = getSurname(a.name).toLowerCase()
      const surnameB = getSurname(b.name).toLowerCase()
      return surnameA.localeCompare(surnameB)
    })
  }
  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'))

        const studentsList = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((student: any) => {
            const role = (student.role || 'student')
              .toString()
              .toLowerCase()
              .trim()
            return role === 'student'
          }) as Student[]

        setStudents(studentsList)
      } catch (error) {}
    }
    fetchStudents()
  }, [])

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const eventsCollection = collection(db, 'events')
        const eventSnapshot = await getDocs(eventsCollection)

        const eventsList = eventSnapshot.docs.map((doc) => {
          const eventData = doc.data()
          return {
            id: doc.id,
            title: eventData.title || '',
            location: eventData.location || '',
            date: eventData.date || '',
            coordinates: eventData.coordinates || null,
            qrExpiration: eventData.qrExpiration || null,
            isActive: eventData.isActive !== false,
            status: eventData.status || 'approved',
          }
        })
        setEvents(sortEventsByUpcoming(eventsList))
      } catch (error) {
        showToast('Failed to load events', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()

    const unsubscribe = onSnapshot(collection(db, 'events'), (snapshot) => {
      const updatedEvents = snapshot.docs.map((doc) => {
        const eventData = doc.data()
        return {
          id: doc.id,
          title: eventData.title || '',
          location: eventData.location || '',
          date: eventData.date || '',
          coordinates: eventData.coordinates || null,
          qrExpiration: eventData.qrExpiration || null,
          isActive: eventData.isActive !== false,
          status: eventData.status || 'approved',
        }
      })
      setEvents(sortEventsByUpcoming(updatedEvents))
    })

    return () => unsubscribe()
  }, [])

  // QR expiration helpers
  const isQRCodeExpired = (event: Event | null): boolean => {
    if (!event) return false
    if (event.isActive === false) return true
    if (!event.qrExpiration) return false
    try {
      const expirationTime = new Date(event.qrExpiration)
      const now = new Date()
      return now > expirationTime
    } catch (error) {
      return false
    }
  }

  useEffect(() => {
    if (showExpirationModal) {
      const now = new Date()
      const options = [
        {
          label: '1 hour',
          value: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        },
        {
          label: '6 hours',
          value: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          label: '12 hours',
          value: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          label: '24 hours',
          value: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          label: '1 week',
          value: new Date(
            now.getTime() + 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
      ]
      setQuickOptions(options)
    }
  }, [showExpirationModal])

  useEffect(() => {
    if (!selectedEvent) return

    const fetchPenaltyStatuses = async () => {
      try {
        const penaltiesQuery = query(
          collection(db, 'penalties'),
          where('eventId', '==', selectedEvent.id)
        )

        const penaltiesSnapshot = await getDocs(penaltiesQuery)

        const paidIds = new Set<string>()
        const completedIds = new Set<string>()
        const pendingIds = new Set<string>()

        penaltiesSnapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.status === 'paid') {
            paidIds.add(data.studentId)
          } else if (data.status === 'completed') {
            completedIds.add(data.studentId)
          } else if (data.status === 'pending') {
            pendingIds.add(data.studentId)
          }
        })

        setPaidStudentIds(paidIds)
        setCompletedStudentIds(completedIds)

        const hasAnyPenalties = penaltiesSnapshot.size > 0
        if (hasAnyPenalties && !sentPenaltyEvents.has(selectedEvent.id)) {
          setSentPenaltyEvents((prev) => new Set([...prev, selectedEvent.id]))
        }
      } catch (error) {}
    }

    fetchPenaltyStatuses()

    const penaltiesQuery = query(
      collection(db, 'penalties'),
      where('eventId', '==', selectedEvent.id)
    )

    const unsubscribe = onSnapshot(penaltiesQuery, (snapshot) => {
      const paidIds = new Set<string>()
      const completedIds = new Set<string>()
      const pendingIds = new Set<string>()

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        if (data.status === 'paid') {
          paidIds.add(data.studentId)
        } else if (data.status === 'completed') {
          completedIds.add(data.studentId)
        } else if (data.status === 'pending') {
          pendingIds.add(data.studentId)
        }
      })

      setPaidStudentIds(paidIds)
      setCompletedStudentIds(completedIds)

      const hasAnyPenalties = snapshot.size > 0
      if (hasAnyPenalties && selectedEvent) {
        setSentPenaltyEvents((prev) => new Set([...prev, selectedEvent.id]))
      }
    })

    return () => unsubscribe()
  }, [selectedEvent])

  useEffect(() => {
    if (!user?.uid) return

    const fetchSentPenalties = async () => {
      try {
        const announcementsQuery = query(
          collection(db, 'penaltyAnnouncements'),
          where('sentBy', '==', user.uid)
        )

        const snapshot = await getDocs(announcementsQuery)
        const sentEvents = new Set<string>()
        const details: {
          [eventId: string]: { studentIds: string[]; sentAt: string }
        } = {}

        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.eventId) {
            sentEvents.add(data.eventId)
            details[data.eventId] = {
              studentIds: data.studentIds || [],
              sentAt: data.sentAt,
            }
          }
        })

        setSentPenaltyEvents(sentEvents)
        setPenaltyDetails(details)
      } catch (error) {}
    }

    fetchSentPenalties()

    // Real-time listener
    const announcementsQuery = query(
      collection(db, 'penaltyAnnouncements'),
      where('sentBy', '==', user.uid)
    )

    const unsubscribe = onSnapshot(announcementsQuery, (snapshot) => {
      const sentEvents = new Set<string>()
      const details: {
        [eventId: string]: { studentIds: string[]; sentAt: string }
      } = {}

      snapshot.docs.forEach((doc) => {
        const data = doc.data()
        if (data.eventId) {
          sentEvents.add(data.eventId)
          details[data.eventId] = {
            studentIds: data.studentIds || [],
            sentAt: data.sentAt,
          }
        }
      })

      setSentPenaltyEvents(sentEvents)
      setPenaltyDetails(details)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const hasPenaltyBeenSent = (eventId: string): boolean => {
    return sentPenaltyEvents.has(eventId)
  }

  const hasStudentReceivedPenalty = (studentId: string): boolean => {
    if (!selectedEvent) return false

    return (
      paidStudentIds.has(studentId) ||
      completedStudentIds.has(studentId) ||
      (sentPenaltyEvents.has(selectedEvent.id) &&
        missingAttendees.some((s) => s.id === studentId))
    )
  }

  const recordPenaltySent = async (eventId: string, studentIds: string[]) => {
    if (!user?.uid) return

    try {
      const announcementId = `${eventId}_${user.uid}_${Date.now()}`
      const announcementRef = doc(db, 'penaltyAnnouncements', announcementId)

      await setDoc(announcementRef, {
        eventId: eventId,
        studentIds: studentIds,
        sentBy: user.uid,
        sentAt: new Date().toISOString(),
        sentAtTimestamp: serverTimestamp(),
        count: studentIds.length,
      })

      const eventRef = doc(db, 'events', eventId)
      await updateDoc(eventRef, {
        penaltiesSent: true,
        penaltiesSentAt: new Date().toISOString(),
        penaltiesSentBy: user.uid,
        penaltiesCount: studentIds.length,
      })

      showToast(
        `Penalty announcements sent to ${studentIds.length} students.`,
        'success'
      )
    } catch (error) {
      showToast('Failed to record penalty announcement.', 'error')
    }
  }
  const getEventDateISO = (date: any): string => {
    if (!date) return ''
    if (typeof date === 'object' && date.toDate) {
      return date.toDate().toISOString()
    }
    if (typeof date === 'string') {
      const d = new Date(date)
      return isNaN(d.getTime()) ? '' : d.toISOString()
    }
    if (typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toISOString()
    }
    return ''
  }
  const handleSendPenalty = async () => {
    if (!selectedEvent || !user) return

    const penaltiesQuery = query(
      collection(db, 'penalties'),
      where('eventId', '==', selectedEvent.id)
    )
    const existingPenalties = await getDocs(penaltiesQuery)
    if (existingPenalties.size > 0) {
      showToast('Penalties have already been sent for this event.', 'error')
      return
    }

    if (missingAttendees.length === 0) {
      showToast('There are no missing students to send penalties to.', 'error')
      return
    }

    try {
      setLoading(true)
      const batch = writeBatch(db)
      const studentIds: string[] = []
      const timestamp = new Date().toISOString()

      for (const student of missingAttendees) {
        const penaltyId = `${selectedEvent.id}_${student.id}`
        const penaltyRef = doc(db, 'penalties', penaltyId)
        studentIds.push(student.id)

        const penaltyData = {
          eventId: selectedEvent.id,
          eventTitle: selectedEvent.title,
          eventDate: getEventDateISO(selectedEvent.date),
          studentId: student.id,
          studentName: student.name,
          studentID: student.studentID,
          status: 'pending',
          createdAt: timestamp,
          sentBy: user.uid,
          sentAt: timestamp,
          updatedAt: serverTimestamp(),
        }

        batch.set(penaltyRef, penaltyData)

        const userRef = doc(db, 'users', student.id)
        const userDoc = await getDoc(userRef)
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const existingPenalties = userData.penalties || []
          existingPenalties.push({
            id: penaltyId,
            eventId: selectedEvent.id,
            eventTitle: selectedEvent.title,
            status: 'pending',
            createdAt: timestamp,
            sentAt: timestamp,
          })
          batch.update(userRef, { penalties: existingPenalties })
        }
      }

      const eventRef = doc(db, 'events', selectedEvent.id)
      batch.update(eventRef, {
        penaltiesSent: true,
        penaltiesSentAt: timestamp,
        penaltiesSentBy: user.uid,
        penaltiesCount: studentIds.length,
      })

      await batch.commit()

      const notificationPromises = missingAttendees.map((student) =>
        notificationService.createNotification({
          userId: student.id,
          title: `Penalty Issued: ${selectedEvent.title}`,
          message: `You have received a penalty for missing the event "${selectedEvent.title}". Please check your profile for details.`,
          type: 'user',
          timestamp: new Date(),
          priority: 'high',
          data: {
            eventId: selectedEvent.id,
            eventTitle: selectedEvent.title,
            penaltyId: `${selectedEvent.id}_${student.id}`,
            status: 'pending',
          },
        })
      )
      await Promise.all(notificationPromises)

      setSentPenaltyEvents((prev) => new Set([...prev, selectedEvent.id]))
      setShowPenaltyModal(false)
      showToast(
        `Penalties sent to ${studentIds.length} students and notifications created successfully!`,
        'success'
      )
    } catch (error) {
      console.error(error)
      showToast('Failed to send penalties. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null

    if (
      selectedEvent &&
      selectedEvent.qrExpiration &&
      !isQRCodeExpired(selectedEvent)
    ) {
      const updateTimeLeft = () => {
        const now = new Date()
        const expiration = new Date(selectedEvent.qrExpiration!)
        const diff = expiration.getTime() - now.getTime()

        if (diff <= 0) {
          setTimeLeft('Expired')
          const updatedEvent = { ...selectedEvent, isActive: false }
          setSelectedEvent(updatedEvent)
          return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)

        if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`)
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`)
        } else {
          setTimeLeft(`${seconds}s`)
        }
      }

      updateTimeLeft()
      intervalId = setInterval(updateTimeLeft, 1000)
    } else {
      setTimeLeft('')
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId)
      }
    }
  }, [selectedEvent])

  const stopAttendance = async () => {
    if (!selectedEvent) return
    if (selectedEvent.isActive === false) {
      showToast('Attendance is already stopped for this event', 'info')
      return
    }
    const confirmed = await confirm({
      title: 'Stop Attendance',
      message:
        'This will immediately expire the QR code. Students will no longer be able to mark their attendance.',
      confirmLabel: 'Stop Attendance',
      cancelLabel: 'Cancel',
      confirmDestructive: true,
    })
    if (!confirmed) return

    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      const eventRef = doc(db, 'events', selectedEvent.id)
      await updateDoc(eventRef, { isActive: false, qrExpiration: now })
      const updatedEvent = {
        ...selectedEvent,
        isActive: false,
        qrExpiration: now,
      }
      setSelectedEvent(updatedEvent)
      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEvent.id ? updatedEvent : e))
      )
      showToast('Attendance stopped successfully!', 'success')
    } catch (error) {
      showToast('Failed to stop attendance. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const generateEventQRCode = (event: Event) => {
    if (!event) return

    const qrData = JSON.stringify({
      type: 'attendance',
      eventId: event.id,
      eventTitle: event.title,
      generatedAt: new Date().toISOString(),
      expiresAt:
        event.qrExpiration && isValidDate(event.qrExpiration)
          ? event.qrExpiration
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      usesManualExpiration: !!(
        event.qrExpiration && isValidDate(event.qrExpiration)
      ),
      eventLocation: event.coordinates,
    })

    setQrValue(qrData)
    setSelectedEvent(event)
    setShowEventModal(false)
    fetchAttendanceRecords(event.id)
  }

  const refreshAttendance = async () => {
    if (!selectedEvent) return

    setRefreshing(true)
    await fetchAttendanceRecords(selectedEvent.id)
    setRefreshing(false)
  }

  const setManualExpiration = async () => {
    if (!selectedEvent || !customExpiration) return

    if (!isValidDate(customExpiration)) {
      showToast('Please enter a valid date and time', 'error')
      return
    }

    const expirationDate = new Date(customExpiration)
    const now = new Date()
    if (expirationDate <= now) {
      showToast('Expiration date must be in the future', 'error')
      return
    }

    setIsSaving(true)
    try {
      const eventRef = doc(db, 'events', selectedEvent.id)
      await updateDoc(eventRef, {
        qrExpiration: customExpiration,
        isActive: true,
      })

      const updatedEvent = {
        ...selectedEvent,
        qrExpiration: customExpiration,
        isActive: true,
      }

      const newQrData = JSON.stringify({
        type: 'attendance',
        eventId: updatedEvent.id,
        eventTitle: updatedEvent.title,
        generatedAt: new Date().toISOString(),
        expiresAt: customExpiration,
        usesManualExpiration: true,
        eventLocation: updatedEvent.coordinates,
      })

      setQrValue(newQrData)
      setSelectedEvent(updatedEvent)
      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEvent.id ? updatedEvent : e))
      )

      setCustomExpirationDate(null)
      setCustomExpiration('')

      showToast('Expiration date set successfully!', 'success')
      setShowExpirationModal(false)
    } catch (error) {
      showToast('Failed to set expiration date', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const clearManualExpiration = async () => {
    if (!selectedEvent) return

    try {
      const eventRef = doc(db, 'events', selectedEvent.id)
      await updateDoc(eventRef, {
        qrExpiration: null,
      })

      showToast('Expiration date cleared!', 'success')

      const updatedEvent = { ...selectedEvent, qrExpiration: null }
      setSelectedEvent(updatedEvent as Event)

      setEvents((prev) =>
        prev.map((e) => (e.id === selectedEvent.id ? updatedEvent : e))
      )
    } catch (error) {
      showToast('Failed to clear expiration date', 'error')
    }
  }

  const fetchAttendanceRecords = async (eventId: string) => {
    try {
      const eventRef = doc(db, 'events', eventId)
      const eventDoc = await getDoc(eventRef)

      if (eventDoc.exists()) {
        const eventData = eventDoc.data()

        if (
          eventData.attendees &&
          Array.isArray(eventData.attendees) &&
          eventData.attendees.length > 0
        ) {
          const validAttendees = eventData.attendees
            .filter((a: any) => a && (a.studentID || a.studentId))
            .map((a: any) => ({
              ...a,
              studentID: String(a.studentID || a.studentId),
              yearLevel: a.yearLevel || a.year || 'Unknown',
              block: a.block || 'No Block',
              studentName: a.studentName || a.name || 'Unknown',
            }))

          setAttendanceRecords(validAttendees)
          setCurrentPage(1)
        } else {
          setAttendanceRecords([])
        }
      } else {
        setAttendanceRecords([])
      }
    } catch (error) {
      setAttendanceRecords([])
    }
  }

  const clearSelection = () => {
    setSelectedEvent(null)
    setQrValue('')
    setAttendanceRecords([])
    setSelectedYearLevel('all')
    setSelectedBlock('all')
    setTimeLeft('')
    setCurrentPage(1)
    setSearchQuery('')
    setMissingPage(1)
  }

  const hasStudentPaid = (studentId: string): boolean => {
    return paidStudentIds.has(studentId)
  }

  const hasStudentCompleted = (studentId: string): boolean => {
    return completedStudentIds.has(studentId)
  }

  const handleMarkAsPaid = async (student: Student) => {
    if (!selectedEvent || !user) return

    try {
      setProcessingPayment(student.id)

      const penaltyId = `${selectedEvent.id}_${student.id}`
      const penaltyRef = doc(db, 'penalties', penaltyId)

      const penaltyData = {
        eventId: selectedEvent.id,
        eventTitle: selectedEvent.title,
        eventDate: getEventDateISO(selectedEvent.date),
        studentId: student.id,
        studentName: student.name,
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidBy: user.uid,
        createdAt: new Date().toISOString(),
      }

      await setDoc(penaltyRef, penaltyData)

      const userRef = doc(db, 'users', student.id)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const existingPenalties = userData.penalties || []

        const penaltyIndex = existingPenalties.findIndex(
          (p: any) => p.eventId === selectedEvent.id
        )

        let updatedPenalties
        if (penaltyIndex >= 0) {
          updatedPenalties = [...existingPenalties]
          updatedPenalties[penaltyIndex] = {
            ...updatedPenalties[penaltyIndex],
            status: 'paid',
            paidAt: new Date().toISOString(),
            paidBy: user.uid,
          }
        } else {
          updatedPenalties = [
            ...existingPenalties,
            {
              id: penaltyId,
              eventId: selectedEvent.id,
              eventTitle: selectedEvent.title,
              status: 'paid',
              createdAt: new Date().toISOString(),
              paidAt: new Date().toISOString(),
              paidBy: user.uid,
            },
          ]
        }

        await updateDoc(userRef, { penalties: updatedPenalties })
      }

      showToast(
        `${student.name} has been marked as paid for ${selectedEvent.title}.`,
        'success'
      )

      setPaidStudentIds((prev) => new Set([...prev, student.id]))
    } catch (error) {
      showToast('Failed to mark as paid. Please try again.', 'error')
    } finally {
      setProcessingPayment(null)
    }
  }

  const handleCompletePenalty = async (student: Student, event: Event) => {
    let currentUser = user
    if (!currentUser && auth.currentUser) {
      currentUser = auth.currentUser
    }
    if (!currentUser) {
      showToast('You must be logged in to perform this action.', 'error')
      return
    }

    try {
      setProcessingAction(student.id)

      const penaltiesQuery = query(
        collection(db, 'penalties'),
        where('studentId', '==', student.id),
        where('eventId', '==', event.id)
      )

      const snapshot = await getDocs(penaltiesQuery)

      if (snapshot.empty) {
        showToast(
          'Penalty record not found. Please ensure a penalty was sent for this student.',
          'error'
        )
        setProcessingAction(null)
        return
      }

      const penaltyDoc = snapshot.docs[0]

      const penaltyRef = doc(db, 'penalties', penaltyDoc.id)

      await updateDoc(penaltyRef, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        completedBy: currentUser.uid,
        updatedAt: serverTimestamp(),
      })

      const userRef = doc(db, 'users', student.id)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const existingPenalties = userData.penalties || []

        const updatedPenalties = existingPenalties.map((p: any) =>
          p.eventId === event.id
            ? {
                ...p,
                status: 'completed',
                completedAt: new Date().toISOString(),
              }
            : p
        )

        await updateDoc(userRef, { penalties: updatedPenalties })
      }

      setCompletedStudentIds((prev) => new Set([...prev, student.id]))

      showToast(
        `${student.name}'s penalty has been marked as completed.`,
        'success'
      )
    } catch (error) {
      showToast('Failed to complete penalty. Please try again.', 'error')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleCancelCompletion = async (student: Student, event: Event) => {
    let currentUser = user
    if (!currentUser && auth.currentUser) {
      currentUser = auth.currentUser
    }
    if (!currentUser) {
      showToast('You must be logged in.', 'error')
      return
    }

    try {
      setProcessingAction(student.id)

      const penaltiesQuery = query(
        collection(db, 'penalties'),
        where('studentId', '==', student.id),
        where('eventId', '==', event.id)
      )
      const snapshot = await getDocs(penaltiesQuery)

      if (snapshot.empty) {
        showToast('Penalty record not found.', 'error')
        return
      }

      const penaltyDoc = snapshot.docs[0]
      const penaltyRef = doc(db, 'penalties', penaltyDoc.id)

      await updateDoc(penaltyRef, {
        status: 'pending',
        cancelledAt: new Date().toISOString(),
        cancelledBy: currentUser.uid,
        completedAt: null,
        completedBy: null,
        updatedAt: serverTimestamp(),
      })

      const userRef = doc(db, 'users', student.id)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        const existingPenalties = userData.penalties || []

        const updatedPenalties = existingPenalties.map((p: any) =>
          p.eventId === event.id
            ? { ...p, status: 'pending', cancelledAt: new Date().toISOString() }
            : p
        )

        await updateDoc(userRef, { penalties: updatedPenalties })
      }

      setCompletedStudentIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(student.id)
        return newSet
      })

      showToast(`${student.name}'s completion has been cancelled.`, 'success')
    } catch (error) {
      showToast('Failed to cancel completion. Please try again.', 'error')
    } finally {
      setProcessingAction(null)
    }
  }

  const captureAndSaveQR = async () => {
    if (!qrCodeRef.current) {
      showToast('QR code reference not found', 'error')
      return
    }

    if (!qrValue || !selectedEvent) {
      showToast('No QR code data or event selected.', 'error')
      return
    }

    try {
      const getDataURL = (): Promise<string> => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              qrCodeRef.current.toDataURL((data: string) => {
                let dataUrl = data
                if (data && !data.startsWith('data:image/png;base64,')) {
                  dataUrl = 'data:image/png;base64,' + data
                }
                if (
                  dataUrl &&
                  dataUrl.includes('base64,') &&
                  dataUrl.length > 100
                ) {
                  resolve(dataUrl)
                } else {
                  reject(new Error('QR code generation failed.'))
                }
              })
            } catch (error) {
              reject(error)
            }
          }, 200)
        })
      }

      const qrDataUrl = await getDataURL()

      const eventTitle = selectedEvent.title || 'Untitled Event'
      const eventDate = selectedEvent.date
        ? formatDate(selectedEvent.date)
        : 'N/A'
      const eventLocation = selectedEvent.location || 'N/A'
      const expirationTime = selectedEvent.qrExpiration
        ? new Date(selectedEvent.qrExpiration).toLocaleString()
        : 'No expiration set'
      const generatedTime = new Date().toLocaleString()

      const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Helvetica', sans-serif;
              padding: 30px;
              text-align: center;
              color: #1e293b;
            }
            .header {
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            h1 {
              color: #1e40af;
              margin-bottom: 5px;
            }
            .subtitle {
              color: #64748b;
              font-size: 14px;
            }
            .details {
              background: #f8fafc;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
              text-align: left;
            }
            .detail-row {
              display: flex;
              margin-bottom: 10px;
            }
            .detail-label {
              font-weight: 600;
              width: 120px;
              color: #475569;
            }
            .detail-value {
              color: #0f172a;
            }
            .qr-container {
              margin: 30px 0;
              padding: 20px;
              background: white;
              border-radius: 16px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              display: inline-block;
            }
            .qr-label {
              margin-top: 10px;
              color: #64748b;
              font-size: 12px;
            }
            .footer {
              margin-top: 30px;
              font-size: 11px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${eventTitle}</h1>
            <div class="subtitle">Attendance QR Code</div>
          </div>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span>
              <span class="detail-value">${eventDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${eventLocation}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">QR Expires:</span>
              <span class="detail-value">${expirationTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Generated:</span>
              <span class="detail-value">${generatedTime}</span>
            </div>
          </div>

          <div class="qr-container">
            <img src="${qrDataUrl}" width="250" height="250" style="display:block;" />
            <div class="qr-label">Scan to record attendance</div>
          </div>

          <div class="footer">
            <p>TMC Connect – Official Attendance System</p>
          </div>
        </body>
      </html>
    `

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
          showToast('Please allow popups to print the QR code.', 'info')
          return
        }
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        printWindow.focus()
        printWindow.print()
        showToast('Use the print dialog to save as PDF.', 'info')
      } else {
        const { uri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        })

        const canShare = await Sharing.isAvailableAsync()
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `Save ${eventTitle} QR Code`,
            UTI: 'com.adobe.pdf',
          })
        } else {
          showToast('Sharing is not available on this device.', 'error')
        }

        try {
          await FileSystem.deleteAsync(uri, { idempotent: true })
        } catch {}
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate QR PDF.'
      showToast(errorMessage, 'error')
    }
  }

  const formatDate = (
    dateValue: string | { seconds: number; nanoseconds: number } | any
  ) => {
    if (!dateValue) return null

    try {
      let date: Date

      if (typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000)
      } else if (typeof dateValue === 'string') {
        if (!isValidDate(dateValue)) return null
        date = new Date(dateValue)
      } else {
        return null
      }

      if (isNaN(date.getTime())) return null

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return null
    }
  }

  const getEventStatusBadge = (eventDate: any) => {
    if (!eventDate) return null

    let date: Date
    try {
      if (typeof eventDate === 'object' && eventDate?.seconds) {
        date = new Date(eventDate.seconds * 1000)
      } else if (typeof eventDate === 'string') {
        date = new Date(eventDate)
      } else {
        return null
      }
      if (isNaN(date.getTime())) return null
    } catch {
      return null
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )

    const diffTime = eventDay.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return { text: 'TODAY', color: '#16a34a' }
    if (diffDays === 1) return { text: 'TOMORROW', color: '#2563eb' }
    if (diffDays > 1) return { text: 'UPCOMING', color: '#8b5cf6' }
    return { text: 'PAST', color: '#64748b' }
  }

  const formatShortDate = (
    dateValue: string | { seconds: number; nanoseconds: number } | any
  ) => {
    if (!dateValue) return null

    try {
      let date: Date

      if (typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000)
      } else if (typeof dateValue === 'string') {
        if (!isValidDate(dateValue)) return null
        date = new Date(dateValue)
      } else {
        return null
      }

      if (isNaN(date.getTime())) return null

      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return null
    }
  }

  const formatTime = (
    timestamp: string | { seconds: number; nanoseconds: number } | undefined
  ) => {
    if (!timestamp) return 'N/A'

    try {
      let date: Date

      if (typeof timestamp === 'object' && timestamp.seconds) {
        date = new Date(timestamp.seconds * 1000)
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp)
      } else {
        return 'N/A'
      }

      if (isNaN(date.getTime())) return 'N/A'

      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })
    } catch (error) {
      return 'N/A'
    }
  }

  const formatDateForWebInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleWebDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const localDateString = event.target.value
    if (!localDateString) return

    try {
      const [datePart, timePart] = localDateString.split('T')
      if (!datePart || !timePart) return

      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = timePart.split(':').map(Number)

      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day) ||
        isNaN(hours) ||
        isNaN(minutes)
      )
        return

      const selectedDate = new Date(year, month - 1, day, hours, minutes)
      if (isNaN(selectedDate.getTime())) return

      setCustomExpirationDate(selectedDate)
      setCustomExpiration(selectedDate.toISOString())
    } catch (error) {}
  }
  const formatStudentName = (student: { name: string; surname?: string }) => {
    if (student.surname?.trim()) {
      return `${student.surname}, ${student.name}`
    }
    return student.name
  }

  const formatAttendanceName = (record: AttendanceRecord) => {
    if ((record as any).surname) {
      return `${(record as any).surname}, ${record.studentName}`
    }
    const parts = record.studentName.trim().split(/\s+/)
    if (parts.length >= 2) {
      const lastName = parts.pop()
      return `${lastName}, ${parts.join(' ')}`
    }
    return record.studentName
  }

  const studentAttendanceRecords = useMemo(() => {
    return attendanceRecords.filter((record) => {
      if (record.role) {
        return record.role.toString().toLowerCase().trim() === 'student'
      }
      const studentId = String(record.studentID).trim().toLowerCase()
      return students.some(
        (s) => String(s.studentID).trim().toLowerCase() === studentId
      )
    })
  }, [attendanceRecords, students])

  const getFilteredAttendanceRecords = useMemo(() => {
    let filtered = studentAttendanceRecords
    if (selectedYearLevel !== 'all') {
      filtered = filtered.filter(
        (record) =>
          record.yearLevel?.toString() === selectedYearLevel.toString()
      )
    }
    if (selectedBlock !== 'all') {
      filtered = filtered.filter(
        (record) => record.block?.toString() === selectedBlock.toString()
      )
    }
    return filtered
  }, [studentAttendanceRecords, selectedYearLevel, selectedBlock])

  const missingAttendees = useMemo(() => {
    if (!students.length) return []
    if (!studentAttendanceRecords.length) return students

    const attendedIds = new Set(
      studentAttendanceRecords.map((r) =>
        String(r.studentID).trim().toLowerCase()
      )
    )
    return students.filter((s) => {
      const studentId = String(s.studentID).trim().toLowerCase()
      return !attendedIds.has(studentId)
    })
  }, [studentAttendanceRecords, students])

  const getFilteredMissing = useMemo(() => {
    let filtered = missingAttendees
    if (selectedYearLevel !== 'all') {
      filtered = filtered.filter((s) => {
        const studentYear = String(s.yearLevel || '')
        return studentYear.includes(selectedYearLevel)
      })
    }
    if (selectedBlock !== 'all') {
      filtered = filtered.filter(
        (s) => s.block?.toString() === selectedBlock.toString()
      )
    }
    return filtered
  }, [missingAttendees, selectedYearLevel, selectedBlock])

  useEffect(() => {}, [attendanceRecords, students, missingAttendees])

  const filteredAttendedBySearch = useMemo(() => {
    if (!searchQuery.trim()) return getFilteredAttendanceRecords
    const query = searchQuery.toLowerCase()
    return getFilteredAttendanceRecords.filter(
      (record) =>
        record.studentName.toLowerCase().includes(query) ||
        record.studentID.toLowerCase().includes(query)
    )
  }, [getFilteredAttendanceRecords, searchQuery])

  const filteredMissingBySearch = useMemo(() => {
    if (!searchQuery.trim()) return getFilteredMissing
    const query = searchQuery.toLowerCase()
    return getFilteredMissing.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.studentID.toLowerCase().includes(query)
    )
  }, [getFilteredMissing, searchQuery])

  const allYearLevels = useMemo(() => {
    const levels = students.map((s) => s.yearLevel).filter(Boolean)
    const normalizedLevels = levels.map((level) => {
      const match = String(level).match(/\d+/)
      return match ? match[0] : level
    })
    const uniqueLevels = [...new Set(normalizedLevels)]
    return uniqueLevels.sort((a, b) => {
      const numA = parseInt(a)
      const numB = parseInt(b)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      if (!isNaN(numA)) return -1
      if (!isNaN(numB)) return 1
      return String(a).localeCompare(String(b))
    })
  }, [students])

  const allBlocks = useMemo(() => {
    const blocks = [...new Set(students.map((s) => s.block).filter(Boolean))]
    return blocks.sort((a, b) => {
      const numA = parseInt(a)
      const numB = parseInt(b)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      if (!isNaN(numA)) return -1
      if (!isNaN(numB)) return 1
      return String(a).localeCompare(String(b))
    })
  }, [students])

  const getStudentsByBlock = useMemo(() => {
    const blocks: { [key: string]: AttendanceRecord[] } = {}
    filteredAttendedBySearch.forEach((record) => {
      const block = record.block || 'No Block'
      if (!blocks[block]) blocks[block] = []
      blocks[block].push(record)
    })
    Object.keys(blocks).forEach((block) => {
      blocks[block].sort((a, b) => {
        const getSortKey = (record: AttendanceRecord) => {
          if ((record as any).surname) {
            return (record as any).surname.toLowerCase()
          }
          const parts = record.studentName.trim().split(/\s+/)
          return parts.length > 1
            ? parts[parts.length - 1].toLowerCase()
            : record.studentName.toLowerCase()
        }
        return getSortKey(a).localeCompare(getSortKey(b))
      })
    })
    const sortedBlocks: { [key: string]: AttendanceRecord[] } = {}
    Object.keys(blocks)
      .sort((a, b) => {
        if (a === 'No Block') return 1
        if (b === 'No Block') return -1
        return parseInt(a) - parseInt(b)
      })
      .forEach((key) => {
        sortedBlocks[key] = blocks[key]
      })
    return sortedBlocks
  }, [filteredAttendedBySearch])

  useEffect(() => {
    const blocksArray = Object.entries(getStudentsByBlock)
    const total = Math.ceil(blocksArray.length / itemsPerPage)
    setTotalPages(total || 1)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedBlocks(blocksArray.slice(startIndex, endIndex))
  }, [getStudentsByBlock, currentPage, itemsPerPage])

  const totalMissingPages = Math.ceil(
    filteredMissingBySearch.length / missingItemsPerPage
  )

  const paginatedMissing = useMemo(() => {
    const sorted = [...filteredMissingBySearch].sort((a, b) => {
      const surnameA = (
        a.surname ||
        a.name.split(' ').pop() ||
        ''
      ).toLowerCase()
      const surnameB = (
        b.surname ||
        b.name.split(' ').pop() ||
        ''
      ).toLowerCase()
      return surnameA.localeCompare(surnameB)
    })
    const start = (missingPage - 1) * missingItemsPerPage
    return sorted.slice(start, start + missingItemsPerPage)
  }, [filteredMissingBySearch, missingPage])

  useEffect(() => {
    setMissingPage(1)
  }, [selectedYearLevel, selectedBlock, searchQuery])

  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#f59e0b' }
      case 'approved':
        return { backgroundColor: '#10b981' }
      case 'rejected':
        return { backgroundColor: '#ef4444' }
      default:
        return { backgroundColor: '#64748b' }
    }
  }

  const availableBlocks = useMemo(() => {
    const uniqueBlocks = [
      ...new Set(
        studentAttendanceRecords.map((record) => record.block).filter(Boolean)
      ),
    ]
    return uniqueBlocks.sort((a, b) => {
      if (a === 'No Block') return 1
      if (b === 'No Block') return -1
      return parseInt(a) - parseInt(b)
    })
  }, [studentAttendanceRecords])

  const availableYearLevels = useMemo(() => {
    const levels = [
      ...new Set(
        studentAttendanceRecords
          .map((record) => record.yearLevel)
          .filter(Boolean)
      ),
    ]
    return levels.sort((a, b) => parseInt(a) - parseInt(b))
  }, [studentAttendanceRecords])

  const isCurrentQRExpired = selectedEvent
    ? isQRCodeExpired(selectedEvent)
    : false

  const stats = useMemo(
    () => ({
      total: getFilteredAttendanceRecords.length,
      verified: getFilteredAttendanceRecords.filter(
        (r) => r.location?.isWithinRadius
      ).length,
      blocksCount: availableBlocks.length,
      totalStudents: students.length,
      totalAttended: studentAttendanceRecords.length,
    }),
    [
      getFilteredAttendanceRecords,
      availableBlocks,
      students.length,
      studentAttendanceRecords.length,
    ]
  )

  const eventStatusStats = useMemo(() => {
    const total = events.length
    const pending = events.filter((e) => e.status === 'pending').length
    const approved = events.filter((e) => e.status === 'approved').length
    const rejected = events.filter((e) => e.status === 'rejected').length
    return { total, pending, approved, rejected }
  }, [events])

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <View
        style={[
          styles.paginationContainer,
          isMobile && styles.paginationContainerMobile,
        ]}
      >
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
            size={16}
            color={
              currentPage === 1
                ? colors.sidebar.text.muted
                : colors.accent.primary
            }
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
          <Text style={styles.pageInfoText}>
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
            size={16}
            color={
              currentPage === totalPages
                ? colors.sidebar.text.muted
                : colors.accent.primary
            }
          />
        </TouchableOpacity>
      </View>
    )
  }

  const generateMissingReceipt = async () => {
    if (!selectedEvent) {
      showToast('Please select an event first.', 'error')
      return
    }
    if (isGeneratingPDF) return
    setIsGeneratingPDF(true)

    try {
      const attendedIds = new Set(
        attendanceRecords.map((r) => String(r.studentID).trim().toLowerCase())
      )

      const allStudents = students.map((student) => ({
        ...student,
        attended: attendedIds.has(
          String(student.studentID).trim().toLowerCase()
        ),
      }))

      const sortedStudents = [...allStudents].sort((a, b) => {
        const blockA = a.block?.toString() || ''
        const blockB = b.block?.toString() || ''
        const numA = parseInt(blockA)
        const numB = parseInt(blockB)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        if (!isNaN(numA)) return -1
        if (!isNaN(numB)) return 1
        return blockA.localeCompare(blockB)
      })

      const studentRows = sortedStudents
        .map((s) => {
          const displayName = s.surname ? `${s.surname}, ${s.name}` : s.name
          const remarkCell = s.attended
            ? `<span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background-color: #10b98120; color: #10b981;">✓ Attended</span>`
            : ''
          return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${displayName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${s.studentID}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${s.yearLevel || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Block ${s.block || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${remarkCell}</td>
        </tr>
      `
        })
        .join('')

      const attendedCount = attendanceRecords.length
      const absentCount = students.length - attendedCount

      const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 24px; }
            h1 { color: #1e40af; margin-bottom: 8px; }
            .subtitle { color: #64748b; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            .stats { display: flex; gap: 16px; margin-bottom: 24px; }
            .stat-box { background: #f8fafc; padding: 16px; border-radius: 12px; text-align: center; flex: 1; }
            .stat-number { font-size: 28px; font-weight: bold; color: #1e293b; }
            .stat-label { color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px 8px; background: #f1f5f9; color: #334155; font-weight: 600; }
            .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 12px; }
            @media print {
              body { padding: 12px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${selectedEvent.title}</h1>
          <div class="subtitle">
            ${formatDate(selectedEvent.date) || 'Date not set'} • ${selectedEvent.location}
          </div>
          <div class="stats">
            <div class="stat-box"><div class="stat-number">${students.length}</div><div class="stat-label">Total Students</div></div>
            <div class="stat-box"><div class="stat-number" style="color: #10b981;">${attendedCount}</div><div class="stat-label">Attended</div></div>
            <div class="stat-box"><div class="stat-number" style="color: #ef4444;">${absentCount}</div><div class="stat-label">Absent</div></div>
          </div>
          <h3 style="color: #334155; margin-bottom: 12px;">Attendance Report</h3>
          <table>
            <thead><tr><th>Name</th><th>Student ID</th><th>Year</th><th>Block</th><th style="text-align: center;">Remark</th></tr></thead>
            <tbody>${studentRows}</tbody>
          </table>
          <div class="footer">
            <p>Generated by ${userData?.name || 'Admin'} on ${new Date().toLocaleString()}</p>
            <p>Official attendance receipt — campus event system.</p>
          </div>
        </body>
      </html>
    `

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(html)
          printWindow.document.close()
          printWindow.focus()
          printWindow.print()
          printWindow.onafterprint = () => printWindow.close()
        } else {
          showToast('Please allow popups to generate the receipt.', 'error')
        }
        setIsGeneratingPDF(false)
        return
      }

      const canShare = await Sharing.isAvailableAsync()
      if (canShare) {
        const { uri } = await Print.printToFileAsync({ html })
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save attendance receipt',
          UTI: 'com.adobe.pdf',
        })
      } else {
        showToast('Sharing is not available on this device.', 'error')
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      showToast('Could not generate receipt. Please try again.', 'error')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const totalEventPages = Math.ceil(events.length / eventItemsPerPage)
  const paginatedEvents = useMemo(() => {
    const start = (eventPage - 1) * eventItemsPerPage
    const end = start + eventItemsPerPage
    return events.slice(start, end)
  }, [events, eventPage, eventItemsPerPage])

  const renderEventItem = ({ item }: { item: Event }) => {
    const isExpired = isQRCodeExpired(item)
    const isActive = item.isActive !== false && !isExpired
    const isApproved = item.status === 'approved'

    return (
      <TouchableOpacity
        style={[
          styles.eventItem,
          isMobile && styles.eventItemMobile,
          !isApproved && { opacity: 0.5 },
        ]}
        onPress={() => {
          if (!isApproved) {
            showToast(
              `This event is ${item.status}. Only approved events can be used for attendance.`,
              'error'
            )
            return
          }
          generateEventQRCode(item)
        }}
        activeOpacity={isApproved ? 0.7 : 1}
      >
        <View style={styles.eventItemContent}>
          <Text
            style={[
              styles.eventItemName,
              isMobile && styles.eventItemNameMobile,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.eventItemBadges}>
            {(() => {
              const dateBadge = getEventStatusBadge(item.date)
              if (dateBadge) {
                return (
                  <View
                    style={[
                      styles.eventItemExpBadge,
                      { backgroundColor: dateBadge.color },
                    ]}
                  >
                    <Text
                      style={[styles.eventItemExpText, { color: '#ffffff' }]}
                    >
                      {dateBadge.text}
                    </Text>
                  </View>
                )
              }
              return null
            })()}
            <View
              style={[
                styles.eventItemStatusBadge,
                getStatusBadgeStyle(item.status),
              ]}
            >
              <Text style={styles.eventItemStatusText}>
                {item.status?.toUpperCase() || 'APPROVED'}
              </Text>
            </View>
            {item.qrExpiration && isValidDate(item.qrExpiration) && (
              <View
                style={[
                  styles.eventItemExpBadge,
                  isExpired && styles.eventItemExpBadgeExpired,
                ]}
              >
                <Feather
                  name='clock'
                  size={10}
                  color={isExpired ? '#dc2626' : '#d97706'}
                />
                <Text
                  style={[
                    styles.eventItemExpText,
                    isExpired && styles.eventItemExpTextExpired,
                  ]}
                >
                  {isExpired ? 'Expired' : 'QR'}
                </Text>
              </View>
            )}
            {isActive && isApproved && (
              <View style={styles.eventItemActiveBadge}>
                <Feather name='check-circle' size={10} color='#16a34a' />
                <Text style={styles.eventItemActiveText}>Active</Text>
              </View>
            )}
          </View>
        </View>
        {formatShortDate(item.date) && (
          <Text style={styles.eventItemDate} numberOfLines={1}>
            {formatShortDate(item.date)}
          </Text>
        )}
        <View style={styles.eventItemFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather
              name='map-pin'
              size={10}
              color={colors.sidebar.text.secondary}
            />
            <Text
              style={[styles.eventItemLocation, { marginLeft: 4 }]}
              numberOfLines={1}
            >
              {item.location}
            </Text>
          </View>
          {item.coordinates && (
            <View style={styles.eventItemLocBadge}>
              <Feather name='shield' size={10} color='#16a34a' />
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderBlockSection = ({
    item,
  }: {
    item: [string, AttendanceRecord[]]
  }) => {
    const [block, students] = item
    return (
      <View style={styles.blockSection}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Block {block}</Text>
          <Text style={styles.blockCount}>{students.length}</Text>
        </View>
        {students.map((record, index) => (
          <View
            key={index}
            style={[
              styles.attendanceItem,
              isMobile && styles.attendanceItemMobile,
            ]}
          >
            <View style={styles.studentRow}>
              <View style={styles.studentInfo}>
                <Text
                  style={[
                    styles.studentName,
                    isMobile && styles.studentNameMobile,
                  ]}
                  numberOfLines={1}
                >
                  {formatAttendanceName(record)}
                </Text>
                <Text style={styles.studentId}>{record.studentID}</Text>
              </View>
              <View style={styles.attendanceMeta}>
                {record.location && (
                  <View
                    style={[
                      styles.locationBadge,
                      record.location.isWithinRadius
                        ? styles.locationBadgeValid
                        : styles.locationBadgeInvalid,
                    ]}
                  >
                    <Feather
                      name={record.location.isWithinRadius ? 'check' : 'x'}
                      size={10}
                      color={
                        record.location.isWithinRadius ? '#16a34a' : '#dc2626'
                      }
                    />
                    <Text
                      style={[
                        styles.locationBadgeText,
                        record.location.isWithinRadius
                          ? styles.locationBadgeTextValid
                          : styles.locationBadgeTextInvalid,
                      ]}
                    >
                      {record.location.isWithinRadius ? 'Verified' : 'Too Far'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={styles.studentDetails} numberOfLines={1}>
              {record.course} • Year {record.yearLevel}
            </Text>
            <View style={styles.attendanceTimeContainer}>
              <Feather
                name='clock'
                size={12}
                color={colors.sidebar.text.muted}
              />
              <Text style={styles.attendanceTimeText}>
                Attended at: {formatTime(record.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    )
  }

  const headerGradientColors = isDark
    ? (['#060c18', '#0a1a3a', '#10254e'] as const)
    : (['#ffffff', '#f5f9ff', '#eaf2ff'] as const)

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={headerGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient, isMobile && styles.headerGradientMobile]}
      >
        <View
          style={[styles.headerContent, isMobile && styles.headerContentMobile]}
        >
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
                isMobile && styles.userNameMobile,
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
              Attendance Manager
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.profileButton,
              isMobile && styles.profileButtonMobile,
            ]}
            onPress={() => router.push('/main_admin/profile')}
          >
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text
                  style={[
                    styles.profileInitials,
                    isMobile && styles.profileInitialsMobile,
                  ]}
                >
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={[styles.dateSection, isMobile && styles.dateSectionMobile]}
        >
          <View
            style={[
              styles.dateContainer,
              isMobile && styles.dateContainerMobile,
            ]}
          >
            <Text
              style={[
                styles.dateText,
                isMobile && styles.dateTextMobile,
                { color: isDark ? '#cbd5e1' : '#334155' },
              ]}
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: isMobile ? 'short' : 'long',
                year: 'numeric',
                month: isMobile ? 'short' : 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Theme Toggle Button */}
            <TouchableOpacity
              style={[
                styles.headerAction,
                isMobile && styles.headerActionMobile,
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
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.mainContent, isMobile && styles.mainContentMobile]}
        >
          {/* Left Grid */}
          <View style={[styles.leftGrid, isMobile && styles.leftGridMobile]}>
            <View
              style={[styles.leftHeader, isMobile && styles.leftHeaderMobile]}
            >
              <Text
                style={[styles.leftTitle, isMobile && styles.leftTitleMobile]}
              >
                {mode === 'qr' ? 'QR Code Generator' : 'Receipt Generator'}
              </Text>
            </View>
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  isMobile && styles.sectionTitleMobile,
                ]}
              >
                Select Event
              </Text>
              <TouchableOpacity
                style={[
                  styles.eventSelector,
                  isMobile && styles.eventSelectorMobile,
                ]}
                onPress={() => {
                  setShowEventModal(true)
                  setEventPage(1)
                }}
              >
                {selectedEvent ? (
                  <Text
                    style={[
                      styles.eventSelectorText,
                      isMobile && styles.eventSelectorTextMobile,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedEvent.title}
                  </Text>
                ) : (
                  <Text style={styles.eventSelectorPlaceholder}>
                    Tap to select an event
                  </Text>
                )}
                <Feather
                  name='chevron-down'
                  size={20}
                  color={colors.sidebar.text.secondary}
                  style={styles.eventSelectorIcon}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'qr' && styles.modeButtonActive,
                ]}
                onPress={() => setMode('qr')}
              >
                <Feather
                  name='grid'
                  size={16}
                  color={
                    mode === 'qr' ? '#ffffff' : colors.sidebar.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'qr' && styles.modeButtonTextActive,
                  ]}
                >
                  QR
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'receipt' && styles.modeButtonActive,
                ]}
                onPress={() => setMode('receipt')}
              >
                <Feather
                  name='file-text'
                  size={16}
                  color={
                    mode === 'receipt'
                      ? '#ffffff'
                      : colors.sidebar.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.modeButtonText,
                    mode === 'receipt' && styles.modeButtonTextActive,
                  ]}
                >
                  Receipt
                </Text>
              </TouchableOpacity>
            </View>

            {selectedEvent && mode === 'qr' && (
              <>
                <View
                  style={[
                    styles.qrContainer,
                    isMobile && styles.qrContainerMobile,
                  ]}
                >
                  {/* Event Header */}
                  <View style={styles.eventInfo}>
                    <Text
                      style={[
                        styles.eventName,
                        isMobile && styles.eventNameMobile,
                      ]}
                      numberOfLines={1}
                    >
                      {selectedEvent.title}
                    </Text>
                    <View style={styles.eventDetailsRow}>
                      <Text style={styles.eventDetailText}>
                        {formatDate(selectedEvent.date)}
                      </Text>
                      <View style={styles.bullet} />
                      <Feather
                        name='map-pin'
                        size={12}
                        color={colors.sidebar.text.secondary}
                      />
                      <Text style={styles.eventDetailText}>
                        {selectedEvent.location}
                      </Text>
                    </View>
                    {selectedEvent.coordinates && (
                      <View style={styles.locationVerificationBadge}>
                        <Feather name='shield' size={12} color='#16a34a' />
                        <Text style={styles.locationVerificationText}>
                          Location Verification Enabled
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* QR Code Frame with ref for capture */}
                  <View ref={qrWrapperRef} style={styles.qrFrame}>
                    <View style={styles.qrCodeWrapper}>
                      {!isCurrentQRExpired ? (
                        <>
                          <QRCode
                            value={qrValue}
                            getRef={(c) => (qrCodeRef.current = c)}
                            size={isMobile ? 180 : 220}
                            color={colors.text}
                            backgroundColor={colors.card}
                          />
                          <View style={styles.qrLabel}>
                            <Feather
                              name='camera'
                              size={12}
                              color={colors.sidebar.text.muted}
                            />
                            <Text style={styles.qrLabelText}>
                              Scan to verify attendance
                            </Text>
                          </View>
                        </>
                      ) : (
                        <View style={styles.expiredOverlay}>
                          <Feather name='x-circle' size={48} color='#dc2626' />
                          <Text style={styles.expiredText}>
                            QR Code Expired
                          </Text>
                          <Text style={styles.expiredSubtext}>
                            Generate a new code to continue
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={styles.qrStatus}>
                    <View
                      style={[
                        styles.statusBadge,
                        isCurrentQRExpired
                          ? styles.statusBadgeExpired
                          : styles.statusBadgeActive,
                      ]}
                    >
                      {isCurrentQRExpired ? (
                        <>
                          <Feather name='x-circle' size={12} color='#dc2626' />
                          <Text
                            style={[
                              styles.statusBadgeText,
                              styles.statusBadgeTextExpired,
                            ]}
                          >
                            QR Expired
                          </Text>
                        </>
                      ) : (
                        <>
                          <Feather
                            name='check-circle'
                            size={12}
                            color='#16a34a'
                          />
                          <Text
                            style={[
                              styles.statusBadgeText,
                              styles.statusBadgeTextActive,
                            ]}
                          >
                            {timeLeft ? `Valid for ${timeLeft}` : 'Active'}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Download Button (only if QR active) */}
                  {!isCurrentQRExpired && (
                    <View style={styles.downloadButtonContainer}>
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={captureAndSaveQR}
                        activeOpacity={0.7}
                      >
                        <Feather name='download' size={16} color='#ffffff' />
                        <Text style={styles.downloadButtonText}>Save QR</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Expiration hint */}
                  {selectedEvent.qrExpiration && !isCurrentQRExpired && (
                    <Text style={styles.expirationHint}>
                      Expires:{' '}
                      {new Date(selectedEvent.qrExpiration).toLocaleString()}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.actionButtons,
                    isMobile && styles.actionButtonsMobile,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.actionButtonPrimary,
                      isMobile && styles.actionButtonMobile,
                    ]}
                    onPress={() => setShowExpirationModal(true)}
                  >
                    <Feather name='clock' size={16} color='#ffffff' />
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.actionButtonTextPrimary,
                        isMobile && styles.actionButtonTextMobile,
                      ]}
                    >
                      Set Expiration
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.actionButtonDanger,
                      isMobile && styles.actionButtonMobile,
                    ]}
                    onPress={stopAttendance}
                  >
                    <Feather name='stop-circle' size={16} color='#ffffff' />
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.actionButtonTextPrimary,
                        isMobile && styles.actionButtonTextMobile,
                      ]}
                    >
                      Stop Attendance
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.actionButtonSecondary,
                      isMobile && styles.actionButtonMobile,
                    ]}
                    onPress={clearSelection}
                  >
                    <Feather
                      name='refresh-cw'
                      size={16}
                      color={colors.sidebar.text.secondary}
                    />
                    <Text
                      style={[
                        styles.actionButtonText,
                        styles.actionButtonTextSecondary,
                        isMobile && styles.actionButtonTextMobile,
                      ]}
                    >
                      Change Event
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {selectedEvent && mode === 'receipt' && (
              <View style={styles.receiptContainer}>
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.receiptDate}>
                    {formatDate(selectedEvent.date)}
                  </Text>
                </View>
                <View style={styles.receiptStats}>
                  <View style={styles.receiptStatItem}>
                    <Text style={styles.receiptStatLabel}>Total Students</Text>
                    <Text style={styles.receiptStatValue}>
                      {students.length}
                    </Text>
                  </View>
                  <View style={styles.receiptStatItem}>
                    <Text style={styles.receiptStatLabel}>Attended</Text>
                    <Text style={styles.receiptStatValue}>
                      {attendanceRecords.length}
                    </Text>
                  </View>
                  <View style={styles.receiptStatItem}>
                    <Text style={styles.receiptStatLabel}>Missing</Text>
                    <Text style={styles.receiptStatValue}>
                      {missingAttendees.length}
                    </Text>
                  </View>
                </View>

                {/* Send Penalty Button */}
                <TouchableOpacity
                  style={[
                    styles.generateReceiptButton,
                    {
                      backgroundColor: hasPenaltyBeenSent(selectedEvent.id)
                        ? '#10b981'
                        : '#ef4444',
                      marginBottom: 12,
                    },
                    (missingAttendees.length === 0 ||
                      hasPenaltyBeenSent(selectedEvent.id)) && { opacity: 0.5 },
                  ]}
                  onPress={() => {
                    if (hasPenaltyBeenSent(selectedEvent.id)) {
                      showToast(
                        'Penalties have already been sent for this event.',
                        'error'
                      )
                      return
                    }
                    setShowPenaltyModal(true)
                  }}
                  disabled={
                    missingAttendees.length === 0 ||
                    hasPenaltyBeenSent(selectedEvent.id)
                  }
                >
                  <Feather
                    name={
                      hasPenaltyBeenSent(selectedEvent.id)
                        ? 'check-circle'
                        : 'alert-triangle'
                    }
                    size={18}
                    color='#ffffff'
                  />
                  <Text style={styles.generateReceiptText}>
                    {missingAttendees.length === 0
                      ? 'No Missing Students'
                      : hasPenaltyBeenSent(selectedEvent.id)
                        ? `Penalties Sent (${missingAttendees.length})`
                        : `Send Penalty (${missingAttendees.length})`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.generateReceiptButton,
                    isGeneratingPDF && { opacity: 0.7 },
                  ]}
                  onPress={generateMissingReceipt}
                  disabled={isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <ActivityIndicator size='small' color='#ffffff' />
                  ) : (
                    <>
                      <Feather name='file-text' size={18} color='#ffffff' />
                      <Text style={styles.generateReceiptText}>
                        Generate PDF Receipt
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <PenaltyAnnouncementModal
                  visible={showPenaltyModal}
                  onClose={() => {
                    setShowPenaltyModal(false)
                    if (selectedEvent) {
                      fetchAttendanceRecords(selectedEvent.id)
                    }
                  }}
                  onSendPenalty={handleSendPenalty}
                  eventId={selectedEvent.id}
                  eventTitle={selectedEvent.title}
                  eventDate={selectedEvent.date}
                  missingStudents={missingAttendees.map((s) => ({
                    id: s.id,
                    name: s.name,
                    studentID: s.studentID,
                  }))}
                />
              </View>
            )}

            {!selectedEvent && (
              <View style={styles.noEventMessage}>
                <Feather
                  name='info'
                  size={24}
                  color={colors.sidebar.text.muted}
                />
                <Text style={styles.noEventText}>
                  Select an event to{' '}
                  {mode === 'qr' ? 'generate QR code' : 'view receipt options'}
                </Text>
              </View>
            )}
          </View>

          {/* Right Grid */}
          {selectedEvent && (
            <View
              style={[styles.rightGrid, isMobile && styles.rightGridMobile]}
            >
              {mode === 'qr' ? (
                <>
                  <View
                    style={[
                      styles.rightHeader,
                      isMobile && styles.rightHeaderMobile,
                    ]}
                  >
                    <View>
                      <Text
                        style={[
                          styles.rightTitle,
                          isMobile && styles.rightTitleMobile,
                        ]}
                      >
                        Attendance Records
                      </Text>
                      <Text style={styles.recordCount}>
                        {filteredAttendedBySearch.length} attendees
                        {filteredAttendedBySearch.length > itemsPerPage &&
                          ` (Page ${currentPage}/${totalPages})`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={refreshAttendance}
                      disabled={refreshing}
                    >
                      <Feather
                        name='refresh-cw'
                        size={18}
                        color={
                          refreshing
                            ? colors.sidebar.text.muted
                            : colors.accent.primary
                        }
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Search Bar */}
                  <View
                    style={[
                      styles.searchContainer,
                      isMobile && styles.searchContainerMobile,
                    ]}
                  >
                    <Feather
                      name='search'
                      size={isMobile ? 14 : 16}
                      color={colors.sidebar.text.secondary}
                    />
                    <FormTextInput
                      inputStyle={styles.searchInput}
                      placeholder='Search by name or ID...'
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor={colors.sidebar.text.muted}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.searchClearButton}
                      >
                        <Feather
                          name='x'
                          size={isMobile ? 14 : 16}
                          color={colors.sidebar.text.secondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Filters */}
                  <View style={styles.filtersContainer}>
                    <Text
                      style={[
                        styles.filterLabel,
                        isMobile && styles.filterLabelMobile,
                      ]}
                    >
                      Year Level
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.filterRow}
                    >
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          selectedYearLevel === 'all' &&
                            styles.filterChipActive,
                          isMobile && styles.filterChipMobile,
                        ]}
                        onPress={() => {
                          setSelectedYearLevel('all')
                          setCurrentPage(1)
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedYearLevel === 'all' &&
                              styles.filterChipTextActive,
                            isMobile && styles.filterChipTextMobile,
                          ]}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {availableYearLevels.map((yearLevel) => (
                        <TouchableOpacity
                          key={yearLevel}
                          style={[
                            styles.filterChip,
                            selectedYearLevel === yearLevel &&
                              styles.filterChipActive,
                            isMobile && styles.filterChipMobile,
                          ]}
                          onPress={() => {
                            setSelectedYearLevel(yearLevel)
                            setCurrentPage(1)
                          }}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              selectedYearLevel === yearLevel &&
                                styles.filterChipTextActive,
                              isMobile && styles.filterChipTextMobile,
                            ]}
                          >
                            Year {yearLevel}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text
                      style={[
                        styles.filterLabel,
                        isMobile && styles.filterLabelMobile,
                      ]}
                    >
                      Block
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.filterRow}
                    >
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          selectedBlock === 'all' && styles.filterChipActive,
                          isMobile && styles.filterChipMobile,
                        ]}
                        onPress={() => {
                          setSelectedBlock('all')
                          setCurrentPage(1)
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedBlock === 'all' &&
                              styles.filterChipTextActive,
                            isMobile && styles.filterChipTextMobile,
                          ]}
                        >
                          All Blocks
                        </Text>
                      </TouchableOpacity>
                      {availableBlocks.map((block) => (
                        <TouchableOpacity
                          key={block}
                          style={[
                            styles.filterChip,
                            selectedBlock === block && styles.filterChipActive,
                            isMobile && styles.filterChipMobile,
                          ]}
                          onPress={() => {
                            setSelectedBlock(block)
                            setCurrentPage(1)
                          }}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              selectedBlock === block &&
                                styles.filterChipTextActive,
                              isMobile && styles.filterChipTextMobile,
                            ]}
                          >
                            Block {block}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Attended List */}
                  <View style={styles.attendanceListContainer}>
                    {paginatedBlocks.length > 0 ? (
                      <>
                        <FlatList
                          data={paginatedBlocks}
                          keyExtractor={(item) => item[0]}
                          renderItem={({ item, index }) => (
                            <AnimatedBlock
                              block={item[0]}
                              students={item[1]}
                              index={index}
                              styles={styles}
                              isMobile={isMobile}
                              colors={colors}
                              formatTime={formatTime}
                            />
                          )}
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={styles.attendanceListContent}
                        />
                        {renderPagination()}
                      </>
                    ) : (
                      <View
                        style={[
                          styles.emptyState,
                          isMobile && styles.emptyStateMobile,
                        ]}
                      >
                        <View
                          style={[
                            styles.emptyStateIcon,
                            isMobile && styles.emptyStateIconMobile,
                          ]}
                        >
                          <Feather
                            name='users'
                            size={isMobile ? 32 : 40}
                            color={colors.sidebar.text.muted}
                          />
                        </View>
                        <Text
                          style={[
                            styles.emptyStateTitle,
                            isMobile && styles.emptyStateTitleMobile,
                          ]}
                        >
                          {attendanceRecords.length === 0
                            ? 'No attendance records yet'
                            : 'No students match the filters/search'}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                // Missing view
                <>
                  <View
                    style={[
                      styles.rightHeader,
                      isMobile && styles.rightHeaderMobile,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rightTitle,
                        isMobile && styles.rightTitleMobile,
                      ]}
                    >
                      Missing Students
                    </Text>
                    <Text style={styles.recordCount}>
                      {filteredMissingBySearch.length} students
                      {filteredMissingBySearch.length > missingItemsPerPage &&
                        ` (Page ${missingPage}/${totalMissingPages})`}
                    </Text>
                  </View>

                  {/* Search Bar */}
                  <View
                    style={[
                      styles.searchContainer,
                      isMobile && styles.searchContainerMobile,
                    ]}
                  >
                    <Feather
                      name='search'
                      size={isMobile ? 14 : 16}
                      color={colors.sidebar.text.secondary}
                    />
                    <FormTextInput
                      inputStyle={styles.searchInput}
                      placeholder='Search by name or ID...'
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholderTextColor={colors.sidebar.text.muted}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery('')}
                        style={styles.searchClearButton}
                      >
                        <Feather
                          name='x'
                          size={isMobile ? 14 : 16}
                          color={colors.sidebar.text.secondary}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Filters */}
                  <View style={styles.filtersContainer}>
                    <Text
                      style={[
                        styles.filterLabel,
                        isMobile && styles.filterLabelMobile,
                      ]}
                    >
                      Year Level
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.filterRow}
                    >
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          selectedYearLevel === 'all' &&
                            styles.filterChipActive,
                          isMobile && styles.filterChipMobile,
                        ]}
                        onPress={() => {
                          setSelectedYearLevel('all')
                          setMissingPage(1)
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedYearLevel === 'all' &&
                              styles.filterChipTextActive,
                            isMobile && styles.filterChipTextMobile,
                          ]}
                        >
                          All
                        </Text>
                      </TouchableOpacity>
                      {allYearLevels.length > 0 ? (
                        allYearLevels.map((yearLevel) => (
                          <TouchableOpacity
                            key={yearLevel}
                            style={[
                              styles.filterChip,
                              selectedYearLevel === yearLevel &&
                                styles.filterChipActive,
                              isMobile && styles.filterChipMobile,
                            ]}
                            onPress={() => {
                              setSelectedYearLevel(yearLevel)
                              setMissingPage(1)
                            }}
                          >
                            <Text
                              style={[
                                styles.filterChipText,
                                selectedYearLevel === yearLevel &&
                                  styles.filterChipTextActive,
                                isMobile && styles.filterChipTextMobile,
                              ]}
                            >
                              Year {yearLevel}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text
                          style={{
                            color: colors.sidebar.text.muted,
                            fontSize: 12,
                            paddingVertical: 8,
                          }}
                        >
                          No year levels available
                        </Text>
                      )}
                    </ScrollView>

                    <Text
                      style={[
                        styles.filterLabel,
                        isMobile && styles.filterLabelMobile,
                      ]}
                    >
                      Block
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.filterRow}
                    >
                      <TouchableOpacity
                        style={[
                          styles.filterChip,
                          selectedBlock === 'all' && styles.filterChipActive,
                          isMobile && styles.filterChipMobile,
                        ]}
                        onPress={() => {
                          setSelectedBlock('all')
                          setMissingPage(1)
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedBlock === 'all' &&
                              styles.filterChipTextActive,
                            isMobile && styles.filterChipTextMobile,
                          ]}
                        >
                          All Blocks
                        </Text>
                      </TouchableOpacity>
                      {allBlocks.length > 0 ? (
                        allBlocks.map((block) => (
                          <TouchableOpacity
                            key={block}
                            style={[
                              styles.filterChip,
                              selectedBlock === block &&
                                styles.filterChipActive,
                              isMobile && styles.filterChipMobile,
                            ]}
                            onPress={() => {
                              setSelectedBlock(block)
                              setMissingPage(1)
                            }}
                          >
                            <Text
                              style={[
                                styles.filterChipText,
                                selectedBlock === block &&
                                  styles.filterChipTextActive,
                                isMobile && styles.filterChipTextMobile,
                              ]}
                            >
                              Block {block}
                            </Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text
                          style={{
                            color: colors.sidebar.text.muted,
                            fontSize: 12,
                            paddingVertical: 8,
                          }}
                        >
                          No blocks available
                        </Text>
                      )}
                    </ScrollView>
                  </View>

                  {/* Missing List */}
                  <FlatList
                    data={paginatedMissing}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }: { item: Student }) => {
                      const isPaid = hasStudentPaid(item.id)
                      const isCompleted = hasStudentCompleted(item.id)
                      const isProcessing = processingAction === item.id
                      const penaltySent = hasPenaltyBeenSent(
                        selectedEvent?.id || ''
                      )

                      const showCompleteButton =
                        penaltySent && !isCompleted && !isPaid
                      const showCancelButton = isCompleted
                      const showPaidButton = isCompleted && !isPaid

                      return (
                        <View
                          style={[
                            styles.missingStudentItem,
                            isCompleted && {
                              backgroundColor: isDark
                                ? '#064e3b20'
                                : '#d1fae520',
                            },
                            isPaid && {
                              backgroundColor: isDark
                                ? '#1e3a8a20'
                                : '#dbeafe20',
                            },
                          ]}
                        >
                          <View
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <View style={{ flex: 1, marginRight: 8 }}>
                                <Text
                                  numberOfLines={1}
                                  ellipsizeMode='tail'
                                  style={[
                                    styles.studentName,
                                    (isCompleted || isPaid) && {
                                      textDecorationLine: 'line-through',
                                      color: colors.sidebar.text.muted,
                                    },
                                  ]}
                                >
                                  {item.surname
                                    ? `${item.surname}, ${item.name}`
                                    : item.name}
                                </Text>
                              </View>
                              <Text style={styles.studentId}>
                                {item.studentID}
                              </Text>

                              {/* Status badges */}
                              <View
                                style={{
                                  flexDirection: 'row',
                                  gap: 8,
                                  marginTop: 4,
                                  flexWrap: 'wrap',
                                }}
                              >
                                {isCompleted && (
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <Feather
                                      name='check-circle'
                                      size={12}
                                      color='#10b981'
                                    />
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: '#10b981',
                                        fontWeight: '600',
                                      }}
                                    >
                                      Completed
                                    </Text>
                                  </View>
                                )}
                                {isPaid && (
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <Feather
                                      name='credit-card'
                                      size={12}
                                      color='#3b82f6'
                                    />
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: '#3b82f6',
                                        fontWeight: '600',
                                      }}
                                    >
                                      Paid
                                    </Text>
                                  </View>
                                )}
                                {penaltySent && !isCompleted && !isPaid && (
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      gap: 4,
                                    }}
                                  >
                                    <Feather
                                      name='alert-circle'
                                      size={12}
                                      color='#f59e0b'
                                    />
                                    <Text
                                      style={{
                                        fontSize: 11,
                                        color: '#f59e0b',
                                        fontWeight: '600',
                                      }}
                                    >
                                      Penalty Sent
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            <Text style={styles.studentBlock}>
                              Block {item.block}
                            </Text>
                          </View>

                          {/* Action Buttons Container */}
                          <View
                            style={{
                              flexDirection: 'row',
                              gap: 8,
                              marginTop: 12,
                              flexWrap: 'wrap',
                            }}
                          >
                            {/* Complete Button */}
                            {showCompleteButton && (
                              <TouchableOpacity
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: '#10b981',
                                  paddingHorizontal: 12,
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                  flex: 0,
                                  justifyContent: 'center',
                                  minWidth: 100,
                                }}
                                onPress={async () => {
                                  const displayName = item.surname
                                    ? `${item.surname}, ${item.name}`
                                    : item.name
                                  const confirmed = await confirm({
                                    title: 'Complete Penalty',
                                    message: `Mark ${displayName}'s penalty as completed? This will remove it from their profile.`,
                                    confirmLabel: 'Complete',
                                    cancelLabel: 'Cancel',
                                    confirmDestructive: false,
                                  })
                                  if (!confirmed) return
                                  await handleCompletePenalty(
                                    item,
                                    selectedEvent
                                  )
                                }}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <ActivityIndicator
                                    size='small'
                                    color='#ffffff'
                                  />
                                ) : (
                                  <>
                                    <Feather
                                      name='check-circle'
                                      size={16}
                                      color='#ffffff'
                                    />
                                    <Text
                                      style={{
                                        color: '#ffffff',
                                        fontSize: 13,
                                        fontWeight: '600',
                                        marginLeft: 8,
                                      }}
                                    >
                                      Complete
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            )}

                            {/* Cancel Button */}
                            {showCancelButton && (
                              <TouchableOpacity
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: '#ef4444',
                                  paddingHorizontal: 16,
                                  paddingVertical: 10,
                                  borderRadius: 8,
                                  marginRight: 5,
                                  flex: 0,
                                  justifyContent: 'center',
                                  minWidth: 100,
                                }}
                                onPress={async () => {
                                  const displayName = item.surname
                                    ? `${item.surname}, ${item.name}`
                                    : item.name
                                  const confirmed = await confirm({
                                    title: 'Cancel Completion',
                                    message: `Revert ${displayName}'s penalty back to pending?`,
                                    confirmLabel: 'Yes, Cancel',
                                    cancelLabel: 'Keep Completed',
                                    confirmDestructive: true,
                                  })
                                  if (!confirmed) return
                                  await handleCancelCompletion(
                                    item,
                                    selectedEvent
                                  )
                                }}
                                disabled={isProcessing}
                              >
                                {isProcessing ? (
                                  <ActivityIndicator
                                    size='small'
                                    color='#ffffff'
                                  />
                                ) : (
                                  <>
                                    <Feather
                                      name='x-circle'
                                      size={16}
                                      color='#ffffff'
                                    />
                                    <Text
                                      style={{
                                        color: '#ffffff',
                                        fontSize: 13,
                                        fontWeight: '600',
                                        marginLeft: 8,
                                      }}
                                    >
                                      Cancel
                                    </Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      )
                    }}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.missingListContent}
                    ListEmptyComponent={
                      <View
                        style={[
                          styles.emptyState,
                          isMobile && styles.emptyStateMobile,
                        ]}
                      >
                        <View
                          style={[
                            styles.emptyStateIcon,
                            isMobile && styles.emptyStateIconMobile,
                          ]}
                        >
                          <Feather
                            name='users'
                            size={isMobile ? 32 : 40}
                            color={colors.sidebar.text.muted}
                          />
                        </View>
                        <Text
                          style={[
                            styles.emptyStateTitle,
                            isMobile && styles.emptyStateTitleMobile,
                          ]}
                        >
                          No missing students match the filters/search
                        </Text>
                      </View>
                    }
                  />

                  {/* Pagination for missing list */}
                  {totalMissingPages > 1 && (
                    <View
                      style={[
                        styles.paginationContainer,
                        isMobile && styles.paginationContainerMobile,
                        { marginTop: 16 },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          missingPage === 1 && styles.paginationButtonDisabled,
                        ]}
                        onPress={() =>
                          setMissingPage((p) => Math.max(1, p - 1))
                        }
                        disabled={missingPage === 1}
                      >
                        <Feather
                          name='chevron-left'
                          size={16}
                          color={
                            missingPage === 1
                              ? colors.sidebar.text.muted
                              : colors.accent.primary
                          }
                        />
                        <Text
                          style={[
                            styles.paginationButtonText,
                            missingPage === 1 &&
                              styles.paginationButtonTextDisabled,
                          ]}
                        >
                          Prev
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.pageInfo}>
                        <Text style={styles.pageInfoText}>
                          {missingPage}/{totalMissingPages}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          missingPage === totalMissingPages &&
                            styles.paginationButtonDisabled,
                        ]}
                        onPress={() =>
                          setMissingPage((p) =>
                            Math.min(totalMissingPages, p + 1)
                          )
                        }
                        disabled={missingPage === totalMissingPages}
                      >
                        <Text
                          style={[
                            styles.paginationButtonText,
                            missingPage === totalMissingPages &&
                              styles.paginationButtonTextDisabled,
                          ]}
                        >
                          Next
                        </Text>
                        <Feather
                          name='chevron-right'
                          size={16}
                          color={
                            missingPage === totalMissingPages
                              ? colors.sidebar.text.muted
                              : colors.accent.primary
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showEventModal}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowEventModal(false)}
      >
        <TouchableOpacity
          style={styles.glassModalOverlay}
          activeOpacity={1}
          onPress={() => setShowEventModal(false)}
        >
          <TouchableOpacity
            style={[
              styles.glassModalContent,
              isMobile && styles.glassModalContentMobile,
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
                  Select Event
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEventModal(false)}
                style={styles.glassModalClose}
              >
                <Feather
                  name='x'
                  size={isMobile ? 22 : 26}
                  color={colors.sidebar.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.glassModalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size='large'
                    color={colors.accent.primary}
                  />
                  <Text
                    style={[
                      styles.loadingText,
                      isMobile && styles.loadingTextMobile,
                    ]}
                  >
                    Loading events...
                  </Text>
                </View>
              ) : events.length === 0 ? (
                <View
                  style={[
                    styles.emptyState,
                    isMobile && styles.emptyStateMobile,
                  ]}
                >
                  <View
                    style={[
                      styles.emptyStateIcon,
                      isMobile && styles.emptyStateIconMobile,
                    ]}
                  >
                    <Feather
                      name='calendar'
                      size={isMobile ? 32 : 40}
                      color={colors.sidebar.text.muted}
                    />
                  </View>
                  <Text
                    style={[
                      styles.emptyStateTitle,
                      isMobile && styles.emptyStateTitleMobile,
                    ]}
                  >
                    No events available
                  </Text>
                </View>
              ) : (
                <>
                  {paginatedEvents.map((item, idx) => (
                    <React.Fragment key={item.id || idx}>
                      {renderEventItem({ item })}
                    </React.Fragment>
                  ))}
                  {totalEventPages > 1 && (
                    <View
                      style={[
                        styles.paginationContainer,
                        isMobile && styles.paginationContainerMobile,
                        { marginTop: 16 },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          eventPage === 1 && styles.paginationButtonDisabled,
                        ]}
                        onPress={() =>
                          setEventPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={eventPage === 1}
                      >
                        <Feather
                          name='chevron-left'
                          size={16}
                          color={
                            eventPage === 1
                              ? colors.sidebar.text.muted
                              : colors.accent.primary
                          }
                        />
                        <Text
                          style={[
                            styles.paginationButtonText,
                            eventPage === 1 &&
                              styles.paginationButtonTextDisabled,
                          ]}
                        >
                          Prev
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.pageInfo}>
                        <Text style={styles.pageInfoText}>
                          {eventPage}/{totalEventPages}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.paginationButton,
                          eventPage === totalEventPages &&
                            styles.paginationButtonDisabled,
                        ]}
                        onPress={() =>
                          setEventPage((prev) =>
                            Math.min(totalEventPages, prev + 1)
                          )
                        }
                        disabled={eventPage === totalEventPages}
                      >
                        <Text
                          style={[
                            styles.paginationButtonText,
                            eventPage === totalEventPages &&
                              styles.paginationButtonTextDisabled,
                          ]}
                        >
                          Next
                        </Text>
                        <Feather
                          name='chevron-right'
                          size={16}
                          color={
                            eventPage === totalEventPages
                              ? colors.sidebar.text.muted
                              : colors.accent.primary
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showExpirationModal}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowExpirationModal(false)}
      >
        <TouchableOpacity
          style={styles.glassModalOverlay}
          activeOpacity={1}
          onPress={() => setShowExpirationModal(false)}
        >
          <TouchableOpacity
            style={[
              styles.glassModalContent,
              isMobile && styles.glassModalContentMobile,
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
                  Set QR Expiration
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowExpirationModal(false)}
                style={styles.glassModalClose}
              >
                <Feather
                  name='x'
                  size={isMobile ? 22 : 26}
                  color={colors.sidebar.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView
              style={styles.glassModalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Quick options */}
              <View style={styles.glassFormGroup}>
                <Text style={[styles.glassFormLabel, { color: colors.text }]}>
                  Quick Options
                </Text>
                <View style={styles.expirationOptions}>
                  {quickOptions.map((option, index) => {
                    const isSelected = customExpiration === option.value
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.expirationOption,
                          isMobile && styles.expirationOptionMobile,
                          isSelected && styles.expirationOptionActive,
                        ]}
                        onPress={() => setCustomExpiration(option.value)}
                      >
                        <Text
                          style={[
                            styles.expirationOptionText,
                            isMobile && styles.expirationOptionTextMobile,
                            isSelected && styles.expirationOptionTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Feather name='check' size={16} color='#ffffff' />
                        )}
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>

              {/* Custom date */}
              <View style={styles.glassFormGroup}>
                <Text style={[styles.glassFormLabel, { color: colors.text }]}>
                  Custom Date & Time
                </Text>
                {Platform.OS === 'web' ? (
                  <input
                    type='datetime-local'
                    value={
                      customExpirationDate
                        ? formatDateForWebInput(customExpirationDate)
                        : ''
                    }
                    onChange={handleWebDateChange}
                    style={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      border: `1px solid ${colors.sidebar.border}`,
                      borderRadius: 8,
                      padding: '12px 16px',
                      fontSize: 14,
                      color: colors.text,
                      width: '100%',
                      marginBottom: 16,
                      outline: 'none',
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    style={[styles.glassFormInput, { marginBottom: 16 }]}
                    onPress={() => setCustomDatePickerVisible(true)}
                  >
                    <Text style={{ color: colors.text }}>
                      {customExpirationDate
                        ? customExpirationDate.toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Select custom date & time'}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.sidebar.text.muted,
                        marginTop: 2,
                      }}
                    >
                      {customExpirationDate
                        ? 'Tap to change'
                        : 'Choose expiration date'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Actions */}
              <View
                style={[
                  styles.glassFormActions,
                  isMobile && styles.glassFormActionsMobile,
                ]}
              >
                <TouchableOpacity
                  style={styles.glassCancelButton}
                  onPress={() => setShowExpirationModal(false)}
                >
                  <Text
                    style={[
                      styles.glassCancelButtonText,
                      isMobile && styles.glassCancelButtonTextMobile,
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.glassSubmitButton,
                    !customExpiration && styles.glassSubmitButtonDisabled,
                  ]}
                  onPress={setManualExpiration}
                  disabled={!customExpiration || isSaving}
                >
                  <Feather
                    name='check'
                    size={isMobile ? 16 : 18}
                    color='#ffffff'
                  />
                  <Text
                    style={[
                      styles.glassSubmitButtonText,
                      isMobile && styles.glassSubmitButtonTextMobile,
                    ]}
                  >
                    Set Expiration
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
