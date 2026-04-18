import { Feather } from '@expo/vector-icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { useFocusEffect, useRouter } from 'expo-router'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useAuth } from '../../../src/Controller/context/AuthContext'
import { useNotifications } from '../../../src/Controller/context/NotificationContext'
import { useTheme } from '../../../src/Controller/context/ThemeContext'
import { CAMPUS_LOCATIONS } from '../../../src/Model/constants/campusLocations'
import { db } from '../../../src/Model/lib/firebaseConfig'
import { createEventStyles } from '../../../src/View/styles/student/eventStyles'

dayjs.extend(relativeTime)

interface Event {
  id: string
  title: string
  description: string
  date: Date
  location: string
  locationDescription?: string
  locationImage?: string
  organizer: string
  createdAt: Date
  attendees?: string[]
  coordinates?: {
    latitude: number
    longitude: number
    radius: number
  }
  verifiedAttendees?: string[]
}

export default function StudentEventsScreen() {
  const { user, userData } = useAuth()
  const currentUserId = user?.uid
  const router = useRouter()
  const { width } = useWindowDimensions()

  const { colors, isDark } = useTheme()
  const isMobile = width < 640
  const isTablet = width >= 640 && width < 1024
  const isDesktop = width >= 1024

  const styles = useMemo(
    () => createEventStyles(colors, isDark, isMobile, isTablet, isDesktop),
    [colors, isDark, isMobile, isTablet, isDesktop]
  )

  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showMapOptions, setShowMapOptions] = useState(false)

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'upcoming' | 'past' | 'today'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const [checkingLocation, setCheckingLocation] = useState(false)
  const [userLocation, setUserLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [isWithinRange, setIsWithinRange] = useState<boolean | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<
    Record<string, boolean>
  >({})

  const [refreshKey, setRefreshKey] = useState(0)

  const { clearUnread } = useNotifications()
  const isFocused = useRef(true)
  const initialLoadDone = useRef(false)
  const lastEventCreatedAt = useRef<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true
      clearUnread('events')

      return () => {
        isFocused.current = false
      }
    }, [clearUnread])
  )

  const todayEventsCount = useMemo(() => {
    const today = new Date()
    return events.filter((e) => {
      const d = e.date
      return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
      )
    }).length
  }, [events])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setRefreshKey((prev) => prev + 1)

    setTimeout(() => {
      setRefreshing((prev) => {
        if (prev) {
          return false
        }
        return prev
      })
    }, 3000)
  }, [])

  useEffect(() => {
    if (!currentUserId) return

    const fetchAttendance = async () => {
      try {
        const attendanceRef = doc(db, 'attendance', currentUserId)
        const attendanceSnap = await getDoc(attendanceRef)

        if (attendanceSnap.exists()) {
          setAttendanceRecords(attendanceSnap.data().events || {})
        }
      } catch (error) {
        console.error('Error fetching attendance:', error)
      }
    }

    fetchAttendance()
  }, [currentUserId])

  useEffect(() => {
    setIsLoading(true)

    const eventsRef = collection(db, 'events')
    const unsubscribe = onSnapshot(
      eventsRef,
      (snapshot) => {
        const list: Event[] = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              title: data.title,
              description: data.description,
              date: data.date.toDate(),
              location: data.location,
              locationDescription: data.locationDescription,
              locationImage: data.locationImage,
              organizer: data.organizer,
              createdAt: data.createdAt?.toDate() || new Date(),
              attendees: data.attendees || [],
              verifiedAttendees: data.verifiedAttendees || [],
              coordinates: data.coordinates,
            }
          })
          .filter((event) => {
            const docData = snapshot.docs.find((d) => d.id === event.id)?.data()
            return (
              docData?.status === 'approved' ||
              !docData?.hasOwnProperty('status')
            )
          })

        if (list.length > 0) {
          let newestEvent: Event | null = null
          for (const event of list) {
            if (!newestEvent || event.createdAt > newestEvent.createdAt) {
              newestEvent = event
            }
          }

          if (newestEvent && newestEvent.createdAt) {
            const newestMillis = newestEvent.createdAt.getTime()
            lastEventCreatedAt.current = newestMillis.toString()
          }
        }

        if (!initialLoadDone.current) {
          initialLoadDone.current = true
        }

        list.sort((a, b) => b.date.getTime() - a.date.getTime())

        setEvents(list)
        setIsLoading(false)
        setRefreshing(false)
      },
      (error) => {
        console.error('Error fetching events:', error)
        setIsLoading(false)
        setRefreshing(false)
      }
    )

    return () => unsubscribe()
  }, [refreshKey])

  const getAttendanceStatus = (
    event: Event
  ): 'attended' | 'missed' | 'not-recorded' => {
    if (!userData?.studentID) return 'not-recorded'

    const now = new Date()
    const isPast = event.date <= now

    if (!isPast) return 'not-recorded'

    const hasAttended = event.attendees?.some(
      (attendee: any) => attendee.studentID === userData.studentID
    )

    if (hasAttended) return 'attended'
    return 'missed'
  }

  const getEmptyTitle = () => {
    if (activeFilter === 'upcoming') return 'No upcoming events'
    if (activeFilter === 'past') return 'No past events'
    return 'No events today'
  }

  const getEmptyText = () => {
    if (activeFilter === 'upcoming') return 'Check back later for new events!'
    if (activeFilter === 'past') return 'No past events to display'
    return 'No events scheduled for today.'
  }

  useEffect(() => {
    let filtered = [...events]
    const now = new Date()

    if (activeFilter === 'upcoming') {
      filtered = filtered.filter((e) => e.date > now)
    } else if (activeFilter === 'past') {
      filtered = filtered.filter((e) => e.date <= now)
    } else if (activeFilter === 'today') {
      const today = new Date()
      filtered = filtered.filter((e) => {
        const d = e.date
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        )
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      )
    }

    setFilteredEvents(filtered)
    setCurrentPage(1)
  }, [events, activeFilter, searchQuery])

  useEffect(() => {
    if (showDetailModal) {
      setDistance(null)
      setUserLocation(null)
      setIsWithinRange(null)
    }
  }, [showDetailModal, selectedEvent])

  const stats = useMemo(() => {
    const total = events.length
    const upcoming = events.filter((e) => e.date > new Date()).length
    const past = events.filter((e) => e.date <= new Date()).length
    return { total, upcoming, past }
  }, [events])

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  const handleCheckLocation = async (event: Event) => {
    if (!event.coordinates) {
      Alert.alert(
        'No Location Set',
        'This event does not have verification coordinates.'
      )
      return
    }

    try {
      setCheckingLocation(true)

      let { status } = await Location.getForegroundPermissionsAsync()

      if (status !== 'granted') {
        const permissionResult =
          await Location.requestForegroundPermissionsAsync()
        status = permissionResult.status
      }

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to verify your attendance. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:')
                } else {
                  Linking.openSettings()
                }
              },
            },
          ]
        )
        return
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const userLoc = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }
      setUserLocation(userLoc)

      const dist = calculateDistance(
        userLoc.latitude,
        userLoc.longitude,
        event.coordinates.latitude,
        event.coordinates.longitude
      )

      setDistance(dist)
      const within = dist <= event.coordinates.radius
      setIsWithinRange(within)

      Alert.alert(
        within ? '✅ You are within range!' : '❌ You are outside the range',
        `Your distance: ${Math.round(dist)}m\nAllowed radius: ${event.coordinates.radius}m`
      )
    } catch (error) {
      console.error('Error checking location:', error)
      Alert.alert('Error', 'Could not get your location. Please try again.')
    } finally {
      setCheckingLocation(false)
    }
  }

  const openLocationInMaps = async (
    location: string,
    coordinates?: { latitude: number; longitude: number }
  ) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      let origin = ''

      if (status === 'granted') {
        const userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        })
        origin = `${userLocation.coords.latitude},${userLocation.coords.longitude}`
      }

      if (coordinates) {
        const { latitude, longitude } = coordinates
        const destination = `${latitude},${longitude}`

        let url: string
        if (Platform.OS === 'ios') {
          url = origin
            ? `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`
            : `http://maps.apple.com/?daddr=${destination}&dirflg=d`
        } else {
          url = origin
            ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
            : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`
        }

        await Linking.openURL(url)
      } else {
        const query = encodeURIComponent(location)
        const url =
          Platform.OS === 'ios'
            ? `http://maps.apple.com/?q=${query}`
            : `https://www.google.com/maps/search/?api=1&query=${query}`
        await Linking.openURL(url)
      }
    } catch (error) {
      console.error('Error opening maps:', error)
      Alert.alert('Error', 'Could not open maps application')
    }
  }

  const getDaysUntilEvent = (eventDate: Date) => {
    const now = new Date()
    const diffDays = Math.ceil(
      (eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
    )
    if (diffDays === 0) return { text: 'TODAY', color: '#16a34a' }
    if (diffDays === 1) return { text: 'TOMORROW', color: '#2563eb' }
    if (diffDays > 1) return { text: `IN ${diffDays} DAYS`, color: '#d97706' }
    return { text: 'PAST', color: '#64748b' }
  }

  const getLocationImage = (event: Event) => {
    if (event.locationImage) {
      const found = CAMPUS_LOCATIONS.find((l) => l.id === event.locationImage)
      if (found) return found.image
    }
    return CAMPUS_LOCATIONS[0].image
  }

  const renderEventCard = ({ item, index }: { item: Event; index: number }) => {
    const days = getDaysUntilEvent(item.date)
    const imageSource = getLocationImage(item)
    const isPast = item.date <= new Date()
    const attendanceStatus = getAttendanceStatus(item)

    // Global number across all pages
    const globalNumber = (currentPage - 1) * itemsPerPage + index + 1

    return (
      <TouchableOpacity
        style={[styles.card, isPast && styles.cardPast]}
        onPress={() => {
          setSelectedEvent(item)
          setShowDetailModal(true)
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={styles.cardImageContainer}>
            <Image source={imageSource} style={styles.cardImage} />
            <View style={styles.cardNumberContainer}>
              <View style={styles.cardNumberBadge}>
                <Text style={styles.cardNumberText}>{globalNumber}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.cardBadges}>
              <View style={[styles.badge, { backgroundColor: days.color }]}>
                <Text style={styles.badgeText}>{days.text}</Text>
              </View>
              {isPast && attendanceStatus !== 'not-recorded' && (
                <View
                  style={[
                    styles.attendanceBadge,
                    attendanceStatus === 'attended'
                      ? styles.attendedBadge
                      : styles.missedBadge,
                  ]}
                >
                  <Feather
                    name={
                      attendanceStatus === 'attended'
                        ? 'check-circle'
                        : 'x-circle'
                    }
                    size={10}
                    color='#fff'
                  />
                  <Text style={styles.attendanceBadgeText}>
                    {attendanceStatus === 'attended' ? 'ATTENDED' : 'MISSED'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.cardInfoRow}>
            <Feather
              name='calendar'
              size={12}
              color={colors.sidebar.text.muted}
            />
            <Text style={styles.cardInfoText}>
              {dayjs(item.date).format('MMM D, YYYY • h:mm A')}
            </Text>
          </View>

          <View style={styles.cardInfoRow}>
            <Feather
              name='map-pin'
              size={12}
              color={colors.sidebar.text.muted}
            />
            <Text style={styles.cardInfoText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <TouchableOpacity
              style={styles.cardMapButton}
              onPress={() => {
                setSelectedEvent(item)
                setShowMapOptions(true)
              }}
            >
              <Feather name='map' size={16} color={colors.accent.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Icon
          name='calendar-remove'
          size={40}
          color={colors.sidebar.text.muted}
        />
      </View>
      <Text style={styles.emptyStateTitle}>{getEmptyTitle()}</Text>
      <Text style={styles.emptyStateText}>{getEmptyText()}</Text>
    </View>
  )

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

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      transparent
      animationType='slide'
      onRequestClose={() => setShowDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailModalContainer}>
          {selectedEvent && (
            <>
              <View style={styles.detailModalHeader}>
                <View style={styles.detailModalHeaderLeft}>
                  <View
                    style={[
                      styles.detailPriorityIndicator,
                      {
                        backgroundColor: getDaysUntilEvent(selectedEvent.date)
                          .color,
                      },
                    ]}
                  />
                  <Text style={styles.detailModalTitle}>Event Details</Text>
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

              <ScrollView style={styles.detailModalContent}>
                <Image
                  source={getLocationImage(selectedEvent)}
                  style={styles.detailImage}
                  resizeMode='cover'
                />

                <View style={styles.detailBadges}>
                  <View
                    style={[
                      styles.detailBadge,
                      {
                        backgroundColor: getDaysUntilEvent(selectedEvent.date)
                          .color,
                      },
                    ]}
                  >
                    <Text style={styles.detailBadgeText}>
                      {getDaysUntilEvent(selectedEvent.date).text}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailTitle}>{selectedEvent.title}</Text>

                <View style={styles.detailMeta}>
                  <View style={styles.detailMetaItem}>
                    <Feather
                      name='calendar'
                      size={14}
                      color={colors.sidebar.text.muted}
                    />
                    <Text style={styles.detailMetaText}>
                      {dayjs(selectedEvent.date).format('MMM D, YYYY • h:mm A')}
                    </Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Feather
                      name='map-pin'
                      size={14}
                      color={colors.sidebar.text.muted}
                    />
                    <Text style={styles.detailMetaText}>
                      {selectedEvent.location}
                    </Text>
                  </View>
                  {selectedEvent.locationDescription && (
                    <View style={styles.detailMetaItem}>
                      <Feather
                        name='info'
                        size={14}
                        color={colors.sidebar.text.muted}
                      />
                      <Text style={styles.detailMetaText}>
                        {selectedEvent.locationDescription}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailMetaItem}>
                    <Feather
                      name='user'
                      size={14}
                      color={colors.sidebar.text.muted}
                    />
                    <Text style={styles.detailMetaText}>
                      Organized by {selectedEvent.organizer}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>Description</Text>
                  <Text style={styles.detailSectionText}>
                    {selectedEvent.description}
                  </Text>
                </View>

                {selectedEvent.coordinates && (
                  <>
                    <View style={styles.detailSection}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <Text style={styles.detailSectionLabel}>
                          Attendance Range
                        </Text>
                        {isWithinRange !== null && (
                          <View
                            style={[
                              styles.rangeStatusBadge,
                              {
                                backgroundColor: isWithinRange
                                  ? '#10b981'
                                  : '#ef4444',
                              },
                            ]}
                          >
                            <Text style={styles.rangeStatusText}>
                              {isWithinRange ? '✓ In Range' : '✗ Out of Range'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {distance !== null && (
                        <View style={{ marginBottom: 12 }}>
                          <View style={styles.rangeTrack}>
                            <View
                              style={[
                                styles.rangeFill,
                                {
                                  width: `${Math.min(
                                    100,
                                    (distance /
                                      selectedEvent.coordinates.radius) *
                                      100
                                  )}%`,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.rangeTrackText}>
                            {Math.round(distance)}m /{' '}
                            {selectedEvent.coordinates.radius}m
                          </Text>
                        </View>
                      )}

                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <TouchableOpacity
                          style={[styles.detailActionButton, { flex: 1 }]}
                          onPress={() => handleCheckLocation(selectedEvent)}
                          disabled={checkingLocation}
                        >
                          {checkingLocation ? (
                            <ActivityIndicator
                              size='small'
                              color={colors.accent.primary}
                            />
                          ) : (
                            <>
                              <Feather
                                name='crosshair'
                                size={16}
                                color={colors.accent.primary}
                              />
                              <Text style={styles.detailActionButtonText}>
                                Check my location
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.detailActionButton, { flex: 1 }]}
                          onPress={() =>
                            openLocationInMaps(
                              selectedEvent.location,
                              selectedEvent.coordinates
                            )
                          }
                        >
                          <Feather name='map' size={16} color='#10b981' />
                          <Text style={styles.detailActionButtonText}>
                            View on map
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.detailMetaItem}>
                        <Feather name='map-pin' size={14} color='#f59e0b' />
                        <Text style={styles.detailMetaText}>
                          {selectedEvent.coordinates.latitude.toFixed(4)},{' '}
                          {selectedEvent.coordinates.longitude.toFixed(4)}
                        </Text>
                      </View>
                      <View style={styles.detailMetaItem}>
                        <Feather name='radio' size={14} color='#f59e0b' />
                        <Text style={styles.detailMetaText}>
                          Radius: {selectedEvent.coordinates.radius}m
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.detailCloseButton}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.detailCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  )

  const renderMapOptionsModal = () => (
    <Modal
      visible={showMapOptions}
      transparent
      animationType='slide'
      onRequestClose={() => setShowMapOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Map Options</Text>
            <TouchableOpacity
              onPress={() => setShowMapOptions(false)}
              style={styles.modalClose}
            >
              <Feather
                name='x'
                size={24}
                color={colors.sidebar.text.secondary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {selectedEvent && (
              <>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventInfoTitle}>
                    {selectedEvent.title}
                  </Text>
                  <Text style={styles.eventInfoLocation}>
                    <Feather
                      name='map-pin'
                      size={14}
                      color={colors.accent.primary}
                    />{' '}
                    {selectedEvent.location}
                  </Text>
                  {selectedEvent.coordinates && (
                    <View style={styles.coordinatesInfo}>
                      <Text style={styles.coordinatesText}>
                        <Feather name='radio' size={14} color='#f59e0b' />
                        Verification Radius: {selectedEvent.coordinates.radius}m
                      </Text>
                      <Text style={styles.coordinatesHint}>
                        You must be within this distance to mark attendance
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.mapOptionButton}
                  onPress={() => {
                    setShowMapOptions(false)
                    openLocationInMaps(
                      selectedEvent.location,
                      selectedEvent.coordinates
                    )
                  }}
                >
                  <View style={styles.mapOptionContent}>
                    <Feather
                      name='map'
                      size={20}
                      color={colors.accent.primary}
                    />
                    <View style={styles.mapOptionText}>
                      <Text style={styles.mapOptionTitle}>Open in Maps</Text>
                      <Text style={styles.mapOptionSubtitle}>
                        Get directions to the event
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )

  // Header gradient colors (same as announcement)
  const headerGradientColors = isDark
    ? (['#0f172a', '#1e293b'] as const)
    : (['#1e40af', '#3b82f6'] as const)

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size='large' color={colors.accent.primary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={headerGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Events Dashboard,</Text>
            <Text style={styles.userName}>
              {userData?.surname
                ? `${userData.name} ${userData.surname}`
                : userData?.name || 'Student'}
            </Text>
            <Text style={styles.role}>Student</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/student/profile')}
          >
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={styles.profileInitials}>
                  {userData?.name
                    ? userData.surname
                      ? `${userData.name.charAt(0)}${userData.surname.charAt(0)}`.toUpperCase()
                      : userData.name.charAt(0).toUpperCase()
                    : 'S'}
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
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name='search' size={18} color={colors.sidebar.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder='Search events...'
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
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'all' && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'upcoming' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('upcoming')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'upcoming' && styles.filterChipTextActive,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'past' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('past')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'past' && styles.filterChipTextActive,
              ]}
            >
              Past
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'today' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('today')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'today' && styles.filterChipTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      {/* Results info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          {activeFilter !== 'all' && ` from ${activeFilter}`}
          {searchQuery ? ` matching "${searchQuery}"` : ''}
        </Text>
      </View>

      {/* Events List */}
      <FlatList
        data={paginatedEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderEventCard}
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

      {renderDetailModal()}
      {renderMapOptionsModal()}
    </View>
  )
}
