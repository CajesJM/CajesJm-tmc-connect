import { Feather, FontAwesome6, Ionicons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
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
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { db } from '../../lib/firebaseConfig'
import { createAnnouncementStyles } from '../../styles/main-admin/announcementStyles'
import { notificationService } from '../../utils/notifications'

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title)
  } else {
    Alert.alert(title, message)
  }
}

dayjs.extend(relativeTime)

interface Announcement {
  id: string
  title: string
  message: string
  createdAt?: any
  priority?: 'normal' | 'important' | 'urgent'
  status?: 'pending' | 'approved' | 'rejected'
  createdBy?: string
  createdByName?: string
}
const AnimatedAnnouncementItem = memo(function AnimatedAnnouncementItem({
  item,
  index,
  currentPage,
  itemsPerPage,
  styles,
  colors,
  isMobile,
  selectedAnnouncement,
  setSelectedAnnouncement,
  handleEditStart,
  handleDelete,
  getPriorityColor,
  isNewAnnouncement,
  isUrgentAnnouncement,
  isImportantAnnouncement,
}: {
  item: Announcement
  index: number
  currentPage: number
  itemsPerPage: number
  styles: any
  colors: any
  isMobile: boolean
  selectedAnnouncement: string | null
  setSelectedAnnouncement: (id: string | null) => void
  handleEditStart: (item: Announcement) => void
  handleDelete: (id: string, title: string) => void
  getPriorityColor: (item: Announcement) => string
  isNewAnnouncement: (createdAt: any) => boolean
  isUrgentAnnouncement: (item: Announcement) => boolean
  isImportantAnnouncement: (item: Announcement) => boolean
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

  const isActive = selectedAnnouncement === item.id
  const priorityColor = getPriorityColor(item)
  const isPending = item.status === 'pending'
  const isRejected = item.status === 'rejected'

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.paginatedItem,
          isActive && styles.paginatedItemActive,
          isMobile && styles.paginatedItemMobile,
        ]}
        onPress={() => setSelectedAnnouncement(item.id)}
      >
        {/* Your existing item layout (same as renderPaginatedItem) */}
        <View
          style={[
            styles.paginatedNumber,
            { backgroundColor: `${priorityColor}15` },
          ]}
        >
          <Text style={[styles.paginatedNumberText, { color: priorityColor }]}>
            {(currentPage - 1) * itemsPerPage + index + 1}
          </Text>
        </View>

        <View style={styles.paginatedInfo}>
          <View
            style={[
              styles.paginatedTitleRow,
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              },
            ]}
          >
            <Text
              style={[
                styles.paginatedTitle,
                isMobile && styles.paginatedTitleMobile,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>

            <View
              style={[
                styles.paginatedBadgeContainer,
                {
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                  gap: 4,
                },
              ]}
            >
              {isUrgentAnnouncement(item) && (
                <View
                  style={[
                    styles.paginatedBadge,
                    { backgroundColor: '#ef4444' },
                  ]}
                >
                  <Text style={styles.paginatedBadgeText}>URGENT</Text>
                </View>
              )}
              {isImportantAnnouncement(item) && !isUrgentAnnouncement(item) && (
                <View
                  style={[
                    styles.paginatedBadge,
                    { backgroundColor: '#f59e0b' },
                  ]}
                >
                  <Text style={styles.paginatedBadgeText}>IMPORTANT</Text>
                </View>
              )}
              {isNewAnnouncement(item.createdAt) && (
                <View
                  style={[
                    styles.paginatedBadge,
                    { backgroundColor: '#3b82f6' },
                  ]}
                >
                  <Text style={styles.paginatedBadgeText}>NEW</Text>
                </View>
              )}
              {isPending && (
                <View
                  style={[
                    styles.paginatedBadge,
                    { backgroundColor: '#f59e0b' },
                  ]}
                >
                  <Text style={styles.paginatedBadgeText}>PENDING</Text>
                </View>
              )}
              {isRejected && (
                <View
                  style={[
                    styles.paginatedBadge,
                    { backgroundColor: '#ef4444' },
                  ]}
                >
                  <Text style={styles.paginatedBadgeText}>REJECTED</Text>
                </View>
              )}
              {item.status === 'approved' && (
                <View
                  style={[
                    styles.paginatedBadge,
                    { backgroundColor: '#10b981' },
                  ]}
                >
                  <Text style={styles.paginatedBadgeText}>APPROVED</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.paginatedMeta}>
            <Text
              style={[
                styles.paginatedDate,
                isMobile && styles.paginatedDateMobile,
              ]}
            >
              {item.createdAt
                ? dayjs(item.createdAt.toDate()).fromNow()
                : 'Just now'}
            </Text>
          </View>

          {item.createdByName && (
            <Text
              style={[
                styles.paginatedCreator,
                isMobile && styles.paginatedCreatorMobile,
              ]}
            >
              by {item.createdByName}
            </Text>
          )}
        </View>

        <View style={styles.paginatedActions}>
          <TouchableOpacity
            style={[
              styles.paginatedEditButton,
              isMobile && styles.paginatedEditButtonMobile,
            ]}
            onPress={() => handleEditStart(item)}
          >
            <Feather
              name='edit-2'
              size={isMobile ? 12 : 14}
              color={colors.accent.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paginatedDeleteButton,
              isMobile && styles.paginatedDeleteButtonMobile,
            ]}
            onPress={() => handleDelete(item.id, item.title)}
          >
            <Feather name='trash-2' size={isMobile ? 12 : 14} color='#ef4444' />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
})

export default function MainAdminAnnouncements() {
  const { width: screenWidth } = useWindowDimensions()
  const { colors, isDark } = useTheme()
  const { user, userData } = useAuth()
  const router = useRouter()

  const isMobile = screenWidth < 640
  const isTablet = screenWidth >= 640 && screenWidth < 1024
  const isDesktop = screenWidth >= 1024

  const styles = useMemo(
    () =>
      createAnnouncementStyles(colors, isDark, isMobile, isTablet, isDesktop),
    [colors, isDark, isMobile, isTablet, isDesktop]
  )

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [paginatedAnnouncements, setPaginatedAnnouncements] = useState<
    Announcement[]
  >([])
  const [searchResults, setSearchResults] = useState<Announcement[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'today' | 'week' | 'month' | 'pinned'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemsPerPage] = useState(isMobile ? 10 : 10)

  const [selectedAnnouncement, setSelectedAnnouncement] = useState<
    string | null
  >(null)
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>(
    'normal'
  )
  const MAX_MESSAGE_LENGTH = 500

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Announcement[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Announcement, 'id'>),
        }))
        setAnnouncements(list)
        setIsLoading(false)
      },
      (error) => {
        setIsLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    let filtered = filterAnnouncementsByTime(announcements, activeFilter)

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedAnnouncements(filtered.slice(startIndex, endIndex))
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
  }, [announcements, activeFilter, currentPage, itemsPerPage])

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      const results = announcements.filter(
        (ann) =>
          ann.title.toLowerCase().includes(searchLower) ||
          ann.message.toLowerCase().includes(searchLower)
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, announcements])

  const filterAnnouncementsByTime = (
    announcementsList: Announcement[],
    filter: 'all' | 'today' | 'week' | 'month' | 'pinned'
  ) => {
    const now = dayjs()

    switch (filter) {
      case 'today':
        return announcementsList.filter((ann) => {
          if (!ann.createdAt) return false
          return dayjs(ann.createdAt.toDate()).isSame(dayjs(), 'day')
        })
      case 'week':
        return announcementsList.filter((ann) => {
          if (!ann.createdAt) return false
          return dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'week'))
        })
      case 'month':
        return announcementsList.filter((ann) => {
          if (!ann.createdAt) return false
          return dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'month'))
        })
      case 'pinned':
        return announcementsList.filter(
          (ann) =>
            ann.priority === 'important' ||
            ann.priority === 'urgent' ||
            ann.title.toLowerCase().includes('important') ||
            ann.title.toLowerCase().includes('urgent')
        )
      default:
        return announcementsList
    }
  }

  const handleFilterChange = (
    filter: 'all' | 'today' | 'week' | 'month' | 'pinned'
  ) => {
    setActiveFilter(filter)
    setCurrentPage(1)
  }

  const handleSearch = (text: string) => {
    setSearchQuery(text)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      showAlert('Validation Error', 'Please fill in both title and message')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Create announcement
      const docRef = await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        priority: priority,
        status: 'approved',
        createdBy: userData?.email || 'admin',
        createdByName: userData?.name || 'Main Admin',
        createdAt: serverTimestamp(),
      })

      // 2. Get all student userIds (adjust collection name if different)
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      )
      const studentSnap = await getDocs(studentsQuery)
      const studentIds = studentSnap.docs.map((doc) => doc.id)

      // 3. Create a notification for each student
      const notificationPromises = studentIds.map((studentId) =>
        notificationService.createNotification({
          userId: studentId,
          title: `New Announcement: ${title.trim()}`,
          message: message.trim(),
          type: 'announcement',
          timestamp: new Date(),
          priority:
            priority === 'urgent'
              ? 'high'
              : priority === 'important'
                ? 'medium'
                : 'low',
          data: { announcementId: docRef.id, priority },
        })
      )
      await Promise.all(notificationPromises)

      resetForm()
      showAlert('Success', 'Announcement created and notifications sent!')
    } catch (error) {
      console.error(error)
      showAlert('Error', 'Failed to create announcement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditStart = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setTitle(announcement.title)
    setMessage(announcement.message)

    if (announcement.priority) {
      setPriority(announcement.priority)
    } else if (announcement.title.toLowerCase().includes('urgent')) {
      setPriority('urgent')
    } else if (announcement.title.toLowerCase().includes('important')) {
      setPriority('important')
    } else {
      setPriority('normal')
    }

    setShowCreateForm(true)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !title.trim() || !message.trim()) return
    setIsSubmitting(true)

    try {
      const announcementRef = doc(db, 'announcements', editingId)
      await updateDoc(announcementRef, {
        title: title.trim(),
        message: message.trim(),
        priority: priority,
        updatedAt: serverTimestamp(),
      })

      // Notify students about the update
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      )
      const studentSnap = await getDocs(studentsQuery)
      const studentIds = studentSnap.docs.map((doc) => doc.id)
      const notificationPromises = studentIds.map((studentId) =>
        notificationService.createNotification({
          userId: studentId,
          title: `Announcement Updated: ${title.trim()}`,
          message: message.trim(),
          type: 'announcement',
          timestamp: new Date(),
          priority:
            priority === 'urgent'
              ? 'high'
              : priority === 'important'
                ? 'medium'
                : 'low',
          data: { announcementId: editingId, priority },
        })
      )
      await Promise.all(notificationPromises)

      resetForm()
      showAlert('Success', 'Announcement updated and notifications sent!')
    } catch (error) {
      showAlert('Error', 'Failed to update announcement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, announcementTitle: string) => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(
        `Are you sure you want to delete "${announcementTitle}"?`
      )
      if (isConfirmed) {
        try {
          await deleteDoc(doc(db, 'announcements', id))
          if (selectedAnnouncement === id) {
            setSelectedAnnouncement(null)
          }
          showAlert('Success', 'Announcement deleted successfully!')
        } catch (error) {
          showAlert('Error', 'Failed to delete announcement')
        }
      }
    } else {
      Alert.alert(
        'Delete Announcement',
        `Are you sure you want to delete "${announcementTitle}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteDoc(doc(db, 'announcements', id))
                if (selectedAnnouncement === id) {
                  setSelectedAnnouncement(null)
                }
                showAlert('Success', 'Announcement deleted successfully!')
              } catch (error) {
                showAlert('Error', 'Failed to delete announcement')
              }
            },
          },
        ]
      )
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setMessage('')
    setPriority('normal')
    setShowCreateForm(false)
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

  const stats = useMemo(() => {
    const total = announcements.length
    const today = announcements.filter((ann) => {
      if (!ann.createdAt) return false
      return dayjs(ann.createdAt.toDate()).isSame(dayjs(), 'day')
    }).length
    const urgent = announcements.filter(
      (ann) =>
        ann.priority === 'urgent' || ann.title.toLowerCase().includes('urgent')
    ).length
    return { total, today, urgent }
  }, [announcements])

  const isNewAnnouncement = (createdAt: any) => {
    if (!createdAt) return false
    return dayjs(createdAt.toDate()).isAfter(dayjs().subtract(1, 'day'))
  }

  const isUrgentAnnouncement = (ann: Announcement) => {
    return (
      ann.priority === 'urgent' || ann.title.toLowerCase().includes('urgent')
    )
  }

  const isImportantAnnouncement = (ann: Announcement) => {
    return (
      ann.priority === 'important' ||
      ann.title.toLowerCase().includes('important')
    )
  }

  const formatDate = (date: Date) => {
    return dayjs(date).format('MMM D, YYYY • h:mm A')
  }

  const getPriorityColor = (ann: Announcement) => {
    if (ann.priority === 'urgent' || ann.title.toLowerCase().includes('urgent'))
      return '#ef4444'
    if (
      ann.priority === 'important' ||
      ann.title.toLowerCase().includes('important')
    )
      return '#f59e0b'
    return colors.accent.primary
  }

  const renderSearchResultItem = ({ item }: { item: Announcement }) => {
    const priorityColor = getPriorityColor(item)
    const isPending = item.status === 'pending'
    const isRejected = item.status === 'rejected'
    const isActive = selectedAnnouncement === item.id

    return (
      <TouchableOpacity
        style={[
          styles.searchResultItem,
          isActive && styles.searchResultItemActive,
          isMobile && styles.searchResultItemMobile,
        ]}
        onPress={() => setSelectedAnnouncement(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.searchResultHeader}>
          <View style={styles.searchResultTitleContainer}>
            <Text
              style={[
                styles.searchResultTitle,
                isMobile && styles.searchResultTitleMobile,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View style={styles.searchResultBadges}>
              {isNewAnnouncement(item.createdAt) && (
                <View
                  style={[
                    styles.searchResultBadge,
                    { backgroundColor: '#3b82f6' },
                  ]}
                >
                  <Text style={styles.searchResultBadgeText}>NEW</Text>
                </View>
              )}
              {isUrgentAnnouncement(item) && (
                <View
                  style={[
                    styles.searchResultBadge,
                    { backgroundColor: '#ef4444' },
                  ]}
                >
                  <Text style={styles.searchResultBadgeText}>URGENT</Text>
                </View>
              )}
              {isImportantAnnouncement(item) && !isUrgentAnnouncement(item) && (
                <View
                  style={[
                    styles.searchResultBadge,
                    { backgroundColor: '#f59e0b' },
                  ]}
                >
                  <Text style={styles.searchResultBadgeText}>IMPORTANT</Text>
                </View>
              )}
              {isPending && (
                <View
                  style={[
                    styles.searchResultBadge,
                    { backgroundColor: '#f59e0b' },
                  ]}
                >
                  <Text style={styles.searchResultBadgeText}>PENDING</Text>
                </View>
              )}
              {isRejected && (
                <View
                  style={[
                    styles.searchResultBadge,
                    { backgroundColor: '#ef4444' },
                  ]}
                >
                  <Text style={styles.searchResultBadgeText}>REJECTED</Text>
                </View>
              )}
              {item.status === 'approved' && (
                <View
                  style={[
                    styles.searchResultBadge,
                    { backgroundColor: '#10b981' },
                  ]}
                >
                  <Text style={styles.searchResultBadgeText}>APPROVED</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.searchResultActions}>
            <TouchableOpacity
              style={[
                styles.searchResultEditButton,
                isMobile && styles.searchResultEditButtonMobile,
              ]}
              onPress={(e) => {
                e.stopPropagation()
                handleEditStart(item)
              }}
            >
              <Feather
                name='edit-2'
                size={isMobile ? 12 : 14}
                color={colors.accent.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.searchResultDeleteButton,
                isMobile && styles.searchResultDeleteButtonMobile,
              ]}
              onPress={(e) => {
                e.stopPropagation()
                handleDelete(item.id, item.title)
              }}
            >
              <Feather
                name='trash-2'
                size={isMobile ? 12 : 14}
                color='#ef4444'
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={[
            styles.searchResultMessage,
            isMobile && styles.searchResultMessageMobile,
          ]}
          numberOfLines={2}
        >
          {item.message}
        </Text>

        <View style={styles.searchResultFooter}>
          <View style={styles.searchResultDate}>
            <Feather
              name='clock'
              size={isMobile ? 8 : 10}
              color={colors.sidebar.text.muted}
            />
            <Text
              style={[
                styles.searchResultDateText,
                isMobile && styles.searchResultDateTextMobile,
              ]}
            >
              {item.createdAt
                ? dayjs(item.createdAt.toDate()).fromNow()
                : 'Just now'}
            </Text>
          </View>
          <Text
            style={[
              styles.searchResultFullDate,
              isMobile && styles.searchResultFullDateMobile,
            ]}
          >
            {item.createdAt
              ? dayjs(item.createdAt.toDate()).format('MMM D, YYYY')
              : ''}
          </Text>
        </View>
        {item.createdByName && (
          <Text
            style={[
              styles.searchResultCreator,
              isMobile && styles.searchResultCreatorMobile,
            ]}
          >
            Created by {item.createdByName}
          </Text>
        )}
      </TouchableOpacity>
    )
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
            isMobile && styles.paginationButtonMobile,
          ]}
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        >
          <Feather
            name='chevron-left'
            size={isMobile ? 14 : 16}
            color={
              currentPage === 1
                ? colors.sidebar.text.muted
                : colors.accent.primary
            }
          />
          {!isMobile && (
            <Text
              style={[
                styles.paginationButtonText,
                currentPage === 1 && styles.paginationButtonTextDisabled,
              ]}
            >
              Prev
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text
            style={[styles.pageInfoText, isMobile && styles.pageInfoTextMobile]}
          >
            {currentPage}/{totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.paginationButtonDisabled,
            isMobile && styles.paginationButtonMobile,
          ]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          {!isMobile && (
            <Text
              style={[
                styles.paginationButtonText,
                currentPage === totalPages &&
                  styles.paginationButtonTextDisabled,
              ]}
            >
              Next
            </Text>
          )}
          <Feather
            name='chevron-right'
            size={isMobile ? 14 : 16}
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

  const headerGradientColors = isDark
    ? (['#0f172a', '#1e293b'] as const)
    : (['#1e40af', '#3b82f6'] as const)

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={headerGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, isMobile && styles.headerGradientMobile]}
      >
        <View
          style={[styles.headerContent, isMobile && styles.headerContentMobile]}
        >
          <View>
            <Text
              style={[
                styles.greetingText,
                { color: isDark ? colors.sidebar.text.secondary : '#ffffff' },
              ]}
            >
              Welcome back,
            </Text>
            <Text style={[styles.userName, isMobile && styles.userNameMobile]}>
              {userData?.name || 'Admin'}
            </Text>
            <Text
              style={[
                styles.roleText,
                { color: isDark ? colors.sidebar.text.secondary : '#ffffff' },
              ]}
            >
              {' '}
              Announcements Manager
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
            <Text style={[styles.dateText, isMobile && styles.dateTextMobile]}>
              {new Date().toLocaleDateString('en-US', {
                weekday: isMobile ? 'short' : 'long',
                year: 'numeric',
                month: isMobile ? 'short' : 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.headerAction,
                isMobile && styles.headerActionMobile,
              ]}
              onPress={() => setShowCreateForm(true)}
            >
              <Feather name='plus' size={isMobile ? 16 : 18} color='#ffffff' />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content Grid */}
      <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
        {/* Left Grid - Paginated Announcements */}
        <View style={[styles.leftGrid, isMobile && styles.leftGridMobile]}>
          <View
            style={[styles.leftHeader, isMobile && styles.leftHeaderMobile]}
          >
            <Text
              style={[styles.leftTitle, isMobile && styles.leftTitleMobile]}
            >
              Announcements
            </Text>
            <View
              style={[
                styles.leftControls,
                isMobile && styles.leftControlsMobile,
              ]}
            >
              <Text
                style={[
                  styles.announcementCount,
                  isMobile && styles.announcementCountMobile,
                ]}
              >
                {filterAnnouncementsByTime(announcements, activeFilter).length}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[
                  styles.leftFilters,
                  isMobile && styles.leftFiltersMobile,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'all' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile,
                  ]}
                  onPress={() => handleFilterChange('all')}
                >
                  <Text
                    style={[
                      styles.leftFilterButtonText,
                      activeFilter === 'all' &&
                        styles.leftFilterButtonTextActive,
                      isMobile && styles.leftFilterButtonTextMobile,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'today' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile,
                  ]}
                  onPress={() => handleFilterChange('today')}
                >
                  <Text
                    style={[
                      styles.leftFilterButtonText,
                      activeFilter === 'today' &&
                        styles.leftFilterButtonTextActive,
                      isMobile && styles.leftFilterButtonTextMobile,
                    ]}
                  >
                    Today
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'week' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile,
                  ]}
                  onPress={() => handleFilterChange('week')}
                >
                  <Text
                    style={[
                      styles.leftFilterButtonText,
                      activeFilter === 'week' &&
                        styles.leftFilterButtonTextActive,
                      isMobile && styles.leftFilterButtonTextMobile,
                    ]}
                  >
                    Week
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'month' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile,
                  ]}
                  onPress={() => handleFilterChange('month')}
                >
                  <Text
                    style={[
                      styles.leftFilterButtonText,
                      activeFilter === 'month' &&
                        styles.leftFilterButtonTextActive,
                      isMobile && styles.leftFilterButtonTextMobile,
                    ]}
                  >
                    Month
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'pinned' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile,
                  ]}
                  onPress={() => handleFilterChange('pinned')}
                >
                  <Text
                    style={[
                      styles.leftFilterButtonText,
                      activeFilter === 'pinned' &&
                        styles.leftFilterButtonTextActive,
                      isMobile && styles.leftFilterButtonTextMobile,
                    ]}
                  >
                    Priority
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
          {/* Results info */}
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {filterAnnouncementsByTime(announcements, activeFilter).length}{' '}
              announcement
              {filterAnnouncementsByTime(announcements, activeFilter).length !==
              1
                ? 's'
                : ''}
              {activeFilter !== 'all' && ` from ${activeFilter}`}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size={isMobile ? 'small' : 'large'}
                color={colors.accent.primary}
              />
              <Text
                style={[
                  styles.loadingText,
                  isMobile && styles.loadingTextMobile,
                ]}
              >
                Loading...
              </Text>
            </View>
          ) : (
            <>
              <FlatList
                data={paginatedAnnouncements}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <AnimatedAnnouncementItem
                    item={item}
                    index={index}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    styles={styles}
                    colors={colors}
                    isMobile={isMobile}
                    selectedAnnouncement={selectedAnnouncement}
                    setSelectedAnnouncement={setSelectedAnnouncement}
                    handleEditStart={handleEditStart}
                    handleDelete={handleDelete}
                    getPriorityColor={getPriorityColor}
                    isNewAnnouncement={isNewAnnouncement}
                    isUrgentAnnouncement={isUrgentAnnouncement}
                    isImportantAnnouncement={isImportantAnnouncement}
                  />
                )}
                style={styles.paginatedList}
                showsVerticalScrollIndicator={false}
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
                      <FontAwesome6
                        name='bullhorn'
                        size={isMobile ? 24 : 32}
                        color={colors.sidebar.text.muted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.emptyStateTitle,
                        isMobile && styles.emptyStateTitleMobile,
                      ]}
                    >
                      No announcements
                    </Text>
                    <Text
                      style={[
                        styles.emptyStateText,
                        isMobile && styles.emptyStateTextMobile,
                      ]}
                    >
                      Create your first announcement to get started
                    </Text>
                  </View>
                }
              />

              <Modal
                visible={!!selectedAnnouncement}
                transparent={true}
                animationType='fade'
                onRequestClose={() => setSelectedAnnouncement(null)}
              >
                <TouchableOpacity
                  style={styles.glassModalOverlay}
                  activeOpacity={1}
                  onPress={() => setSelectedAnnouncement(null)}
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
                      <Text
                        style={[
                          styles.glassModalTitle,
                          isMobile && styles.glassModalTitleMobile,
                        ]}
                      >
                        Announcement Details
                      </Text>
                      <TouchableOpacity
                        onPress={() => setSelectedAnnouncement(null)}
                        style={styles.glassModalClose}
                      >
                        <Feather
                          name='x'
                          size={isMobile ? 22 : 26}
                          color={colors.sidebar.text.secondary}
                        />
                      </TouchableOpacity>
                    </View>

                    {(() => {
                      const selected = announcements.find(
                        (a) => a.id === selectedAnnouncement
                      )
                      if (!selected) return null

                      const priorityColor = getPriorityColor(selected)

                      return (
                        <View style={styles.glassModalBody}>
                          {/* Badges */}
                          <View
                            style={[
                              styles.selectedDetailBadges,
                              isMobile && styles.selectedDetailBadgesMobile,
                            ]}
                          >
                            {isNewAnnouncement(selected.createdAt) && (
                              <View
                                style={[
                                  styles.detailBadge,
                                  { backgroundColor: '#3b82f6' },
                                  isMobile && styles.detailBadgeMobile,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.detailBadgeText,
                                    isMobile && styles.detailBadgeTextMobile,
                                  ]}
                                >
                                  NEW
                                </Text>
                              </View>
                            )}
                            {selected.status === 'pending' && (
                              <View
                                style={[
                                  styles.detailBadge,
                                  { backgroundColor: '#f59e0b' },
                                  isMobile && styles.detailBadgeMobile,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.detailBadgeText,
                                    isMobile && styles.detailBadgeTextMobile,
                                  ]}
                                >
                                  PENDING
                                </Text>
                              </View>
                            )}
                            {selected.status === 'rejected' && (
                              <View
                                style={[
                                  styles.detailBadge,
                                  { backgroundColor: '#ef4444' },
                                  isMobile && styles.detailBadgeMobile,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.detailBadgeText,
                                    isMobile && styles.detailBadgeTextMobile,
                                  ]}
                                >
                                  REJECTED
                                </Text>
                              </View>
                            )}
                            {selected.status === 'approved' && (
                              <View
                                style={[
                                  styles.detailBadge,
                                  { backgroundColor: '#10b981' },
                                  isMobile && styles.detailBadgeMobile,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.detailBadgeText,
                                    isMobile && styles.detailBadgeTextMobile,
                                  ]}
                                >
                                  APPROVED
                                </Text>
                              </View>
                            )}
                            {isUrgentAnnouncement(selected) && (
                              <View
                                style={[
                                  styles.detailBadge,
                                  { backgroundColor: '#ef4444' },
                                  isMobile && styles.detailBadgeMobile,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.detailBadgeText,
                                    isMobile && styles.detailBadgeTextMobile,
                                  ]}
                                >
                                  URGENT
                                </Text>
                              </View>
                            )}
                            {isImportantAnnouncement(selected) &&
                              !isUrgentAnnouncement(selected) && (
                                <View
                                  style={[
                                    styles.detailBadge,
                                    { backgroundColor: '#f59e0b' },
                                    isMobile && styles.detailBadgeMobile,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.detailBadgeText,
                                      isMobile && styles.detailBadgeTextMobile,
                                    ]}
                                  >
                                    IMPORTANT
                                  </Text>
                                </View>
                              )}
                          </View>

                          {/* Title (big & colored) */}
                          <Text
                            style={[
                              styles.glassDetailTitle,
                              isMobile && styles.glassDetailTitleMobile,
                              { color: priorityColor },
                            ]}
                            numberOfLines={3}
                          >
                            {selected.title}
                          </Text>

                          {/* Message */}
                          <Text
                            style={[
                              styles.selectedDetailMessage,
                              isMobile && styles.selectedDetailMessageMobile,
                            ]}
                          >
                            {selected.message}
                          </Text>

                          {/* Footer */}
                          <View
                            style={[
                              styles.selectedDetailFooter,
                              isMobile && styles.selectedDetailFooterMobile,
                            ]}
                          >
                            <View
                              style={[
                                styles.selectedDetailDate,
                                isMobile && styles.selectedDetailDateMobile,
                              ]}
                            >
                              <Feather
                                name='calendar'
                                size={isMobile ? 12 : 14}
                                color={colors.sidebar.text.muted}
                              />
                              <Text
                                style={[
                                  styles.selectedDetailDateText,
                                  isMobile &&
                                    styles.selectedDetailDateTextMobile,
                                ]}
                              >
                                {selected.createdAt
                                  ? dayjs(selected.createdAt.toDate()).format(
                                      'MMM D, YYYY • h:mm A'
                                    )
                                  : ''}
                              </Text>
                            </View>

                            {selected.createdByName && (
                              <View
                                style={[
                                  styles.selectedDetailCreator,
                                  isMobile &&
                                    styles.selectedDetailCreatorMobile,
                                ]}
                              >
                                <Feather
                                  name='user'
                                  size={isMobile ? 12 : 14}
                                  color={colors.sidebar.text.muted}
                                />
                                <Text
                                  style={[
                                    styles.selectedDetailCreatorText,
                                    isMobile &&
                                      styles.selectedDetailCreatorTextMobile,
                                  ]}
                                >
                                  by {selected.createdByName}
                                </Text>
                              </View>
                            )}

                            <View
                              style={[
                                styles.selectedDetailActions,
                                isMobile && styles.selectedDetailActionsMobile,
                              ]}
                            >
                              <TouchableOpacity
                                style={[
                                  styles.selectedDetailEditButton,
                                  isMobile &&
                                    styles.selectedDetailEditButtonMobile,
                                ]}
                                onPress={() => {
                                  setSelectedAnnouncement(null)
                                  handleEditStart(selected)
                                }}
                              >
                                <Feather
                                  name='edit-2'
                                  size={isMobile ? 14 : 16}
                                  color={colors.accent.primary}
                                />
                                {!isMobile && (
                                  <Text style={styles.selectedDetailEditText}>
                                    Edit
                                  </Text>
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.selectedDetailDeleteButton,
                                  isMobile &&
                                    styles.selectedDetailDeleteButtonMobile,
                                ]}
                                onPress={() => {
                                  setSelectedAnnouncement(null)
                                  handleDelete(selected.id, selected.title)
                                }}
                              >
                                <Feather
                                  name='trash-2'
                                  size={isMobile ? 14 : 16}
                                  color='#ef4444'
                                />
                                {!isMobile && (
                                  <Text style={styles.selectedDetailDeleteText}>
                                    Delete
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )
                    })()}
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>

              {renderPagination()}
            </>
          )}
        </View>

        {/* Right Grid - Search and Results */}
        <View style={[styles.rightGrid, isMobile && styles.rightGridMobile]}>
          <View
            style={[styles.rightHeader, isMobile && styles.rightHeaderMobile]}
          >
            <Text
              style={[styles.searchTitle, isMobile && styles.searchTitleMobile]}
            >
              Search Announcements
            </Text>

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
              <TextInput
                style={[
                  styles.searchInput,
                  isMobile && styles.searchInputMobile,
                ]}
                placeholder='Type to search...'
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize='none'
                placeholderTextColor={colors.sidebar.text.muted}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
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

            {/* Search Stats */}
            {searchQuery && (
              <View
                style={[
                  styles.searchStats,
                  isMobile && styles.searchStatsMobile,
                ]}
              >
                <Text
                  style={[
                    styles.resultsCount,
                    isMobile && styles.resultsCountMobile,
                  ]}
                >
                  Found{' '}
                  <Text style={styles.resultsHighlight}>
                    {searchResults.length}
                  </Text>{' '}
                  {isMobile ? '' : 'results'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.searchResultsContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size={isMobile ? 'small' : 'small'}
                  color={colors.accent.primary}
                />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={renderSearchResultItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  searchQuery ? (
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
                          name='search'
                          size={isMobile ? 24 : 32}
                          color={colors.sidebar.text.muted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.emptyStateTitle,
                          isMobile && styles.emptyStateTitleMobile,
                        ]}
                      >
                        No matches
                      </Text>
                      <Text
                        style={[
                          styles.emptyStateText,
                          isMobile && styles.emptyStateTextMobile,
                        ]}
                      >
                        Try different keywords
                      </Text>
                    </View>
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
                          name='search'
                          size={isMobile ? 24 : 32}
                          color={colors.sidebar.text.muted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.emptyStateTitle,
                          isMobile && styles.emptyStateTitleMobile,
                        ]}
                      >
                        Start searching
                      </Text>
                      <Text
                        style={[
                          styles.emptyStateText,
                          isMobile && styles.emptyStateTextMobile,
                        ]}
                      >
                        Type to find announcements
                      </Text>
                    </View>
                  )
                }
              />
            )}
          </View>
        </View>
      </View>

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateForm}
        transparent={true}
        animationType='fade'
        onRequestClose={resetForm}
      >
        {/* Outer overlay with blur (glass background) */}
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <TouchableOpacity
            style={styles.glassModalOverlayTouch}
            activeOpacity={1}
            onPress={resetForm}
          />
        </BlurView>

        {/* Modal container */}
        <View style={styles.glassModalCentered}>
          <View
            style={[
              styles.glassModalContainer,
              { borderColor: 'rgba(255,255,255,0.3)' },
            ]}
          >
            {/* Gradient header */}
            <LinearGradient
              colors={isDark ? ['#1e293b', '#0f172a'] : ['#f8fafc', '#e2e8f0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glassModalGradientHeader}
            >
              <View style={styles.glassModalHeader}>
                <View style={styles.glassModalHeaderLeft}>
                  <View
                    style={[
                      styles.glassModalIconContainer,
                      isMobile && styles.glassModalIconContainerMobile,
                    ]}
                  >
                    <FontAwesome6
                      name={editingId ? 'pen-to-square' : 'bullhorn'}
                      size={isMobile ? 16 : 20}
                      color={colors.accent.primary}
                    />
                  </View>
                  <View>
                    <Text
                      style={[styles.glassModalTitle, { color: colors.text }]}
                    >
                      {editingId ? 'Edit Announcement' : 'New Announcement'}
                    </Text>
                    <Text
                      style={[
                        styles.glassModalSubtitle,
                        { color: colors.sidebar.text.secondary },
                      ]}
                    >
                      {editingId ? 'Update details' : 'Create announcement'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={resetForm}
                  style={styles.glassModalCloseButton}
                >
                  <Ionicons
                    name='close-circle'
                    size={28}
                    color={colors.accent.primary}
                  />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Scrollable content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.glassModalScrollContent}
              style={{
                backgroundColor: isDark
                  ? 'rgba(15, 25, 35, 0.7)'
                  : 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <View
                style={[
                  styles.glassModalFormSection,
                  { borderColor: 'rgba(255,255,255,0.2)' },
                ]}
              >
                {/* Priority */}
                <View style={styles.glassFormGroup}>
                  <Text style={[styles.glassFormLabel, { color: colors.text }]}>
                    Priority
                  </Text>
                  <View
                    style={[
                      styles.glassPriorityContainer,
                      isMobile && styles.glassPriorityContainerMobile,
                    ]}
                  >
                    {[
                      {
                        value: 'normal',
                        label: 'Normal',
                        color: colors.accent.primary,
                        activeColor: 'normal',
                      },
                      {
                        value: 'important',
                        label: 'Important',
                        color: '#f59e0b',
                        activeColor: 'important',
                      },
                      {
                        value: 'urgent',
                        label: 'Urgent',
                        color: '#ef4444',
                        activeColor: 'urgent',
                      },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.glassPriorityButton,
                          priority === option.value && {
                            backgroundColor: `${option.color}20`,
                            borderColor: option.color,
                          },
                          isMobile && styles.glassPriorityButtonMobile,
                        ]}
                        onPress={() => setPriority(option.value as any)}
                      >
                        <View
                          style={[
                            styles.glassPriorityIndicator,
                            { backgroundColor: option.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.glassPriorityButtonText,
                            {
                              color:
                                priority === option.value
                                  ? option.color
                                  : colors.sidebar.text.secondary,
                            },
                            isMobile && styles.glassPriorityButtonTextMobile,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Title */}
                <View style={styles.glassFormGroup}>
                  <Text style={[styles.glassFormLabel, { color: colors.text }]}>
                    Title
                  </Text>
                  <TextInput
                    style={[
                      styles.glassFormInput,
                      isMobile && styles.glassFormInputMobile,
                    ]}
                    placeholder='Enter title'
                    placeholderTextColor={colors.sidebar.text.muted}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {/* Message */}
                <View style={styles.glassFormGroup}>
                  <Text style={[styles.glassFormLabel, { color: colors.text }]}>
                    Message
                  </Text>
                  <TextInput
                    style={[
                      styles.glassFormInput,
                      styles.glassTextArea,
                      isMobile && styles.glassFormInputMobile,
                    ]}
                    placeholder='Write message...'
                    placeholderTextColor={colors.sidebar.text.muted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={isMobile ? 4 : 6}
                    textAlignVertical='top'
                    maxLength={MAX_MESSAGE_LENGTH}
                  />
                  {/* Character counter */}
                  <View style={styles.characterCounterContainer}>
                    <Text
                      style={[
                        styles.characterCounterText,
                        { color: colors.sidebar.text.muted },
                      ]}
                    >
                      {message.length}/{MAX_MESSAGE_LENGTH} characters
                    </Text>
                    {message.length >= MAX_MESSAGE_LENGTH && (
                      <Text style={styles.characterCounterWarning}>
                        Limit reached
                      </Text>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View
                  style={[
                    styles.glassFormActions,
                    isMobile && styles.glassFormActionsMobile,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.glassSubmitButton,
                      (!title.trim() || !message.trim() || isSubmitting) &&
                        styles.glassSubmitButtonDisabled,
                      isMobile && styles.glassSubmitButtonMobile,
                    ]}
                    onPress={editingId ? handleSaveEdit : handleAddAnnouncement}
                    disabled={!title.trim() || !message.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size='small' color='#ffffff' />
                    ) : (
                      <>
                        <Feather
                          name={editingId ? 'check-circle' : 'send'}
                          size={isMobile ? 16 : 18}
                          color='#ffffff'
                        />
                        <Text
                          style={[
                            styles.glassSubmitButtonText,
                            isMobile && styles.glassSubmitButtonTextMobile,
                          ]}
                        >
                          {editingId ? 'Save Changes' : 'Publish Announcement'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.glassCancelButton,
                      isMobile && styles.glassCancelButtonMobile,
                    ]}
                    onPress={resetForm}
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
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
