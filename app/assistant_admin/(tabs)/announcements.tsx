import { Feather, FontAwesome6 } from '@expo/vector-icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import { useAuth } from '../../../src/Controller/context/AuthContext'
import { useTheme } from '../../../src/Controller/context/ThemeContext'
import { db } from '../../../src/Model/lib/firebaseConfig'
import { createAssistantAnnouncementStyles } from '../../../src/View/styles/assistant-admin/announcementStyles'

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

export default function AssistantAdminAnnouncements() {
  const { width: screenWidth } = useWindowDimensions()
  const { colors, isDark } = useTheme()

  const isMobile = screenWidth < 640
  const isTablet = screenWidth >= 640 && screenWidth < 1024
  const isDesktop = screenWidth >= 1024

  const styles = useMemo(
    () =>
      createAssistantAnnouncementStyles(
        colors,
        isDark,
        isMobile,
        isTablet,
        isDesktop
      ),
    [colors, isDark, isMobile, isTablet, isDesktop]
  )

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<
    Announcement[]
  >([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'today' | 'week' | 'month' | 'priority'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null)
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>(
    'normal'
  )
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const { userData } = useAuth()
  const router = useRouter()

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
        setRefreshing(false)
      },
      (error) => {
        console.error('Error fetching announcements:', error)
        setIsLoading(false)
        setRefreshing(false)
      }
    )
    return () => unsubscribe()
  }, [])

  // Filter and search logic
  useEffect(() => {
    let filtered = [...announcements]

    const now = dayjs()
    switch (activeFilter) {
      case 'today':
        filtered = filtered.filter(
          (ann) =>
            ann.createdAt && dayjs(ann.createdAt.toDate()).isSame(now, 'day')
        )
        break
      case 'week':
        filtered = filtered.filter(
          (ann) =>
            ann.createdAt &&
            dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'week'))
        )
        break
      case 'month':
        filtered = filtered.filter(
          (ann) =>
            ann.createdAt &&
            dayjs(ann.createdAt.toDate()).isAfter(now.subtract(1, 'month'))
        )
        break
      case 'priority':
        filtered = filtered.filter(
          (ann) => ann.priority === 'important' || ann.priority === 'urgent'
        )
        break
    }

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (ann) =>
          ann.title.toLowerCase().includes(searchLower) ||
          ann.message.toLowerCase().includes(searchLower)
      )
    }

    setFilteredAnnouncements(filtered)
    setCurrentPage(1)
  }, [announcements, activeFilter, searchQuery])

  const onRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleAddAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Validation Error', 'Please fill in both title and message')
      return
    }

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        priority: priority,
        status: 'pending',
        createdBy: userData?.email || 'unknown',
        createdByName: userData?.name || 'Assistant Admin',
        createdAt: serverTimestamp(),
      })
      resetForm()
      Alert.alert('Success', 'Announcement submitted for approval.')
    } catch (error) {
      console.error('Error adding announcement:', error)
      Alert.alert('Error', 'Failed to create announcement')
    } finally {
      setIsSubmitting(false)
    }
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
        status: 'pending',
        updatedAt: serverTimestamp(),
      })
      resetForm()
      Alert.alert('Success', 'Announcement updated and pending approval.')
    } catch (error) {
      console.error('Error updating announcement:', error)
      Alert.alert('Error', 'Failed to update announcement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditStart = (announcement: Announcement) => {
    setEditingId(announcement.id)
    setTitle(announcement.title)
    setMessage(announcement.message)
    setPriority(announcement.priority || 'normal')
    setShowCreateForm(true)
  }

  const handleDelete = async (id: string, announcementTitle: string) => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(
        `Are you sure you want to delete "${announcementTitle}"?`
      )
      if (isConfirmed) {
        try {
          await deleteDoc(doc(db, 'announcements', id))
          if (selectedAnnouncement?.id === id) {
            setSelectedAnnouncement(null)
            setShowDetailModal(false)
          }
          window.alert('Announcement deleted successfully!')
        } catch (error) {
          console.error('Error deleting announcement:', error)
          window.alert('Failed to delete announcement')
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
                if (selectedAnnouncement?.id === id) {
                  setSelectedAnnouncement(null)
                  setShowDetailModal(false)
                }
                Alert.alert('Success', 'Announcement deleted successfully!')
              } catch (error) {
                console.error('Error deleting announcement:', error)
                Alert.alert('Error', 'Failed to delete announcement')
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
    setIsSubmitting(false)
  }

  const openDetailModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setShowDetailModal(true)
  }

  const getPriorityColor = (title: string, priority?: string) => {
    if (priority === 'urgent' || title.toLowerCase().includes('urgent'))
      return '#ef4444'
    if (priority === 'important' || title.toLowerCase().includes('important'))
      return '#f59e0b'
    return colors.accent.primary
  }

  const getPriorityLabel = (title: string, priority?: string) => {
    if (priority === 'urgent' || title.toLowerCase().includes('urgent'))
      return 'URGENT'
    if (priority === 'important' || title.toLowerCase().includes('important'))
      return 'IMPORTANT'
    return 'NORMAL'
  }

  const isNewAnnouncement = (createdAt: any) => {
    if (!createdAt) return false
    return dayjs(createdAt.toDate()).isAfter(dayjs().subtract(1, 'day'))
  }

  const stats = useMemo(() => {
    const total = announcements.length
    const today = announcements.filter((ann) => {
      if (!ann.createdAt) return false
      return dayjs(ann.createdAt.toDate()).isSame(dayjs(), 'day')
    }).length
    const priority = announcements.filter(
      (ann) => ann.priority === 'important' || ann.priority === 'urgent'
    ).length
    return { total, today, priority }
  }, [announcements])

  const totalPages = Math.ceil(filteredAnnouncements.length / itemsPerPage)
  const paginatedAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.paginationButtonDisabled,
          ]}
          onPress={goToPreviousPage}
          disabled={currentPage === 1}
        >
          <Feather
            name='chevron-left'
            size={18}
            color={currentPage === 1 ? colors.sidebar.text.muted : colors.text}
          />
          <Text
            style={[
              styles.paginationText,
              currentPage === 1 && styles.paginationTextDisabled,
            ]}
          >
            Prev
          </Text>
        </TouchableOpacity>

        <Text style={styles.paginationPageInfo}>
          {currentPage} / {totalPages}
        </Text>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.paginationButtonDisabled,
          ]}
          onPress={goToNextPage}
          disabled={currentPage === totalPages}
        >
          <Text
            style={[
              styles.paginationText,
              currentPage === totalPages && styles.paginationTextDisabled,
            ]}
          >
            Next
          </Text>
          <Feather
            name='chevron-right'
            size={18}
            color={
              currentPage === totalPages
                ? colors.sidebar.text.muted
                : colors.text
            }
          />
        </TouchableOpacity>
      </View>
    )
  }

  const renderAnnouncementCard = (item: Announcement, index: number) => {
    const globalNumber = (currentPage - 1) * itemsPerPage + index + 1
    const priorityColor = getPriorityColor(item.title, item.priority)
    const isNew = isNewAnnouncement(item.createdAt)
    const isPending = item.status === 'pending'
    const isRejected = item.status === 'rejected'
    const isApproved = item.status === 'approved' || !item.status

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openDetailModal(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={[priorityColor, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardAbsoluteBar}
        />

        {/* Number badge */}
        <View style={styles.cardNumberContainer}>
          <View style={styles.cardNumberBadge}>
            <Text style={styles.cardNumberText}>{globalNumber}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.cardHeaderRight}>
              {isNew && (
                <View style={[styles.badge, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.badgeText}>NEW</Text>
                </View>
              )}
              {isPending && (
                <View style={[styles.badge, { backgroundColor: '#f59e0b' }]}>
                  <Text style={styles.badgeText}>PENDING</Text>
                </View>
              )}
              {isRejected && (
                <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.badgeText}>REJECTED</Text>
                </View>
              )}
              {isApproved && !isPending && !isRejected && (
                <View style={[styles.badge, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.badgeText}>APPROVED</Text>
                </View>
              )}
              <View
                style={[
                  styles.priorityDotSmall,
                  { backgroundColor: priorityColor },
                ]}
              />
              <Text style={styles.cardTime}>
                {item.createdAt
                  ? dayjs(item.createdAt.toDate()).fromNow()
                  : 'Just now'}
              </Text>
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.cardActionButtonSmall}
                  onPress={() => handleEditStart(item)}
                >
                  <Feather
                    name='edit-2'
                    size={14}
                    color={colors.accent.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.cardActionButtonSmall,
                    styles.cardActionButtonDangerSmall,
                  ]}
                  onPress={() => handleDelete(item.id, item.title)}
                >
                  <Feather
                    name='trash-2'
                    size={14}
                    color={colors.error || '#ef4444'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <Text style={styles.cardMessage} numberOfLines={1}>
            {item.message}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <FontAwesome6
          name='bullhorn'
          size={40}
          color={colors.sidebar.text.muted}
        />
      </View>
      <Text style={styles.emptyStateTitle}>No announcements</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery
          ? 'Try different search terms'
          : 'Pull down to refresh or create a new announcement'}
      </Text>
    </View>
  )

  // Header gradient colors based on theme
  const headerGradientColors = isDark
    ? (['#0f172a', '#1e293b'] as const)
    : (['#1e40af', '#3b82f6'] as const)

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={headerGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>My Announcements,</Text>
            <Text style={styles.userName}>{userData?.name || 'Assistant'}</Text>
            <Text style={styles.role}>Assistant Admin</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/assistant_admin/profile')}
          >
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={styles.profileInitials}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                </Text>
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
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowCreateForm(true)}
          >
            <Feather name='plus' size={20} color='#ffffff' />
            <Text style={styles.addButtonText}>New</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Row */}
      {/*<View style={styles.statsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.accent.primary}15` }]}>
              <Ionicons name="document-text" size={18} color={colors.accent.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10b98115' }]}>
              <Feather name="sun" size={18} color="#10b981" />
            </View>
            <Text style={styles.statNumber}>{stats.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ef444415' }]}>
              <MaterialIcons name="priority-high" size={18} color="#ef4444" />
            </View>
            <Text style={styles.statNumber}>{stats.priority}</Text>
            <Text style={styles.statLabel}>Priority</Text>
          </View>
        </ScrollView>
      </View> */}

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name='search' size={18} color={colors.sidebar.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder='Search announcements...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.sidebar.text.muted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchClear}
            >
              <Feather name='x' size={18} color={colors.sidebar.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {(['all', 'today', 'week', 'month', 'priority'] as const).map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  activeFilter === filter && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === filter && styles.filterChipTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>
      {/* Results info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredAnnouncements.length} announcement
          {filteredAnnouncements.length !== 1 ? 's' : ''}
          {activeFilter !== 'all' && ` from ${activeFilter}`}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </Text>
      </View>

      {/* Announcements List with Pagination */}
      <FlatList
        data={paginatedAnnouncements}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => renderAnnouncementCard(item, index)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderPagination}
        ListFooterComponentStyle={styles.paginationWrapper}
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateForm}
        transparent={true}
        animationType='slide'
        onRequestClose={resetForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <FontAwesome6
                    name={editingId ? 'pen-to-square' : 'bullhorn'}
                    size={20}
                    color={colors.accent.primary}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingId ? 'Edit Announcement' : 'New Announcement'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {editingId
                      ? 'Update announcement details'
                      : 'Create a new announcement'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={resetForm} style={styles.modalClose}>
                <Feather
                  name='x'
                  size={24}
                  color={colors.sidebar.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Priority Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Priority Level</Text>
                <View style={styles.priorityContainer}>
                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      priority === 'normal' && styles.priorityButtonActive,
                      priority === 'normal' && {
                        borderColor: colors.accent.primary,
                        backgroundColor: `${colors.accent.primary}15`,
                      },
                    ]}
                    onPress={() => setPriority('normal')}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: colors.accent.primary },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityButtonText,
                        priority === 'normal' &&
                          styles.priorityButtonTextActive,
                      ]}
                    >
                      Normal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      priority === 'important' && styles.priorityButtonActive,
                      priority === 'important' && {
                        borderColor: '#f59e0b',
                        backgroundColor: '#f59e0b15',
                      },
                    ]}
                    onPress={() => setPriority('important')}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: '#f59e0b' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityButtonText,
                        priority === 'important' &&
                          styles.priorityButtonTextActive,
                      ]}
                    >
                      Important
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      priority === 'urgent' && styles.priorityButtonActive,
                      priority === 'urgent' && {
                        borderColor: '#ef4444',
                        backgroundColor: '#ef444415',
                      },
                    ]}
                    onPress={() => setPriority('urgent')}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: '#ef4444' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityButtonText,
                        priority === 'urgent' &&
                          styles.priorityButtonTextActive,
                      ]}
                    >
                      Urgent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='Enter announcement title'
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
              </View>

              {/* Message Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Message</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder='Write your announcement message...'
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={6}
                  textAlignVertical='top'
                  maxLength={500}
                />
                <Text style={styles.characterCount}>{message.length}/500</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (isSubmitting || !title.trim() || !message.trim()) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={editingId ? handleSaveEdit : handleAddAnnouncement}
                  disabled={isSubmitting || !title.trim() || !message.trim()}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size='small' color='#ffffff' />
                  ) : (
                    <>
                      <Feather
                        name={editingId ? 'check-circle' : 'send'}
                        size={18}
                        color='#ffffff'
                      />
                      <Text style={styles.submitButtonText}>
                        {editingId ? 'Save Changes' : 'Submit for Approval'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={resetForm}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail View Modal */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType='slide'
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            {selectedAnnouncement && (
              <>
                <View style={styles.detailModalHeader}>
                  <View style={styles.detailModalHeaderLeft}>
                    <View
                      style={[
                        styles.detailPriorityIndicator,
                        {
                          backgroundColor: getPriorityColor(
                            selectedAnnouncement.title,
                            selectedAnnouncement.priority
                          ),
                        },
                      ]}
                    />
                    <Text style={styles.detailModalTitle}>
                      Announcement Details
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowDetailModal(false)}
                    style={styles.detailModalClose}
                  >
                    <Feather
                      name='x'
                      size={24}
                      color={colors.sidebar.text.secondary}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.detailModalContent}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.detailBadges}>
                    {isNewAnnouncement(selectedAnnouncement.createdAt) && (
                      <View
                        style={[
                          styles.detailBadge,
                          { backgroundColor: '#3b82f6' },
                        ]}
                      >
                        <Text style={styles.detailBadgeText}>NEW</Text>
                      </View>
                    )}
                    {selectedAnnouncement.status === 'pending' && (
                      <View
                        style={[
                          styles.detailBadge,
                          { backgroundColor: '#f59e0b' },
                        ]}
                      >
                        <Text style={styles.detailBadgeText}>PENDING</Text>
                      </View>
                    )}
                    {selectedAnnouncement.status === 'rejected' && (
                      <View
                        style={[
                          styles.detailBadge,
                          { backgroundColor: '#ef4444' },
                        ]}
                      >
                        <Text style={styles.detailBadgeText}>REJECTED</Text>
                      </View>
                    )}
                    {(selectedAnnouncement.status === 'approved' ||
                      !selectedAnnouncement.status) && (
                      <View
                        style={[
                          styles.detailBadge,
                          { backgroundColor: '#10b981' },
                        ]}
                      >
                        <Text style={styles.detailBadgeText}>APPROVED</Text>
                      </View>
                    )}
                    <View
                      style={[
                        styles.detailBadge,
                        {
                          backgroundColor: getPriorityColor(
                            selectedAnnouncement.title,
                            selectedAnnouncement.priority
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.detailBadgeText}>
                        {getPriorityLabel(
                          selectedAnnouncement.title,
                          selectedAnnouncement.priority
                        )}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailTitle}>
                    {selectedAnnouncement.title}
                  </Text>

                  <View style={styles.detailMeta}>
                    <View style={styles.detailMetaItem}>
                      <Feather
                        name='clock'
                        size={14}
                        color={colors.sidebar.text.muted}
                      />
                      <Text style={styles.detailMetaText}>
                        {selectedAnnouncement.createdAt
                          ? dayjs(
                              selectedAnnouncement.createdAt.toDate()
                            ).format('MMM D, YYYY • h:mm A')
                          : 'Just now'}
                      </Text>
                    </View>
                    {selectedAnnouncement.createdByName && (
                      <View style={styles.detailMetaItem}>
                        <Feather
                          name='user'
                          size={14}
                          color={colors.sidebar.text.muted}
                        />
                        <Text style={styles.detailMetaText}>
                          Created by {selectedAnnouncement.createdByName}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.detailMessageContainer}>
                    <Text style={styles.detailMessage}>
                      {selectedAnnouncement.message}
                    </Text>
                  </View>

                  <View style={styles.detailActions}>
                    <TouchableOpacity
                      style={styles.detailEditButton}
                      onPress={() => {
                        setShowDetailModal(false)
                        handleEditStart(selectedAnnouncement)
                      }}
                    >
                      <Feather
                        name='edit-2'
                        size={18}
                        color={colors.accent.primary}
                      />
                      <Text style={styles.detailEditButtonText}>
                        Edit Announcement
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.detailDeleteButton}
                      onPress={() =>
                        handleDelete(
                          selectedAnnouncement.id,
                          selectedAnnouncement.title
                        )
                      }
                    >
                      <Feather
                        name='trash-2'
                        size={18}
                        color={colors.error || '#ef4444'}
                      />
                      <Text style={styles.detailDeleteButtonText}>
                        Delete Announcement
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}
