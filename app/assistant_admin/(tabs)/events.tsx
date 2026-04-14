import { Feather, FontAwesome6 } from '@expo/vector-icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
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
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
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
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import {
  CAMPUS_LOCATIONS,
  CampusLocation,
} from '../../../constants/campusLocations'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import { db } from '../../../lib/firebaseConfig'
import { createAssistantEventsStyles } from '../../../styles/assistant-admin/eventStyles'

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
  status?: 'pending' | 'approved' | 'rejected'
  createdBy?: string
  createdByName?: string
}

export default function AssistantAdminEvents() {
  const { width } = useWindowDimensions()
  const { colors, isDark } = useTheme()
  const isMobile = width < 640
  const isTablet = width >= 640 && width < 1024
  const isDesktop = width >= 1024

  const styles = useMemo(
    () =>
      createAssistantEventsStyles(
        colors,
        isDark,
        isMobile,
        isTablet,
        isDesktop
      ),
    [colors, isDark, isMobile, isTablet, isDesktop]
  )

  const { user, userData } = useAuth()
  const router = useRouter()

  // Data state
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date())
  const [location, setLocation] = useState('')
  const [locationDescription, setLocationDescription] = useState('')
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<Event['coordinates']>()
  const [descriptionLength, setDescriptionLength] = useState(0)
  const [showCharWarning, setShowCharWarning] = useState(false)

  // Date picker
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)

  // Location & coordinates modals
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [showCoordinatesModal, setShowCoordinatesModal] = useState(false)
  const [showManualCoordinates, setShowManualCoordinates] = useState(false)
  const [coordLat, setCoordLat] = useState('')
  const [coordLng, setCoordLng] = useState('')
  const [coordRadius, setCoordRadius] = useState('100')
  const [locationLoading, setLocationLoading] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [selectedCampusLocation, setSelectedCampusLocation] =
    useState<CampusLocation | null>(null)

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

  const fadeAnim = useRef(new Animated.Value(1)).current
  const prevButtonScale = useRef(new Animated.Value(1)).current
  const nextButtonScale = useRef(new Animated.Value(1)).current
  const pageChangeRef = useRef(false)

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Event[] = snapshot.docs.map((doc) => {
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
            createdAt: data.createdAt?.toDate(),
            attendees: data.attendees || [],
            coordinates: data.coordinates,
            status: data.status || 'approved',
            createdBy: data.createdBy,
            createdByName: data.createdByName,
          }
        })
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
  }, [])

  useEffect(() => {
    let filtered = [...events]
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    switch (activeFilter) {
      case 'upcoming':
        filtered = filtered.filter((e) => e.date > now)
        break
      case 'past':
        filtered = filtered.filter((e) => e.date <= now)
        break
      case 'today':
        filtered = filtered.filter((e) => {
          const eventDate = new Date(e.date)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate >= today && eventDate < tomorrow
        })
        break
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

  // Stats
  const stats = useMemo(() => {
    const total = events.length
    const upcoming = events.filter((e) => e.date > new Date()).length
    const pending = events.filter((e) => e.status === 'pending').length
    return { total, upcoming, pending }
  }, [events])

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3 // metres
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

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.')
        setCheckingLocation(false)
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
      Alert.alert('Error', 'Could not get your location.')
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

  const animatePrevButton = () => {
    Animated.sequence([
      Animated.timing(prevButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(prevButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const animateNextButton = () => {
    Animated.sequence([
      Animated.timing(nextButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(nextButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start()
  }

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      animatePrevButton()
      pageChangeRef.current = true

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(currentPage - 1)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          pageChangeRef.current = false
        })
      })
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      animateNextButton()
      pageChangeRef.current = true

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentPage(currentPage + 1)

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          pageChangeRef.current = false
        })
      })
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setDate(new Date())
    setLocation('')
    setLocationDescription('')
    setSelectedCampusId(null)
    setSelectedCampusLocation(null)
    setCoordinates(undefined)
    setCoordLat('')
    setCoordLng('')
    setCoordRadius('100')
    setShowCreateForm(false)
    setIsSubmitting(false)
  }

  const showDatePicker = () => setDatePickerVisibility(true)
  const hideDatePicker = () => setDatePickerVisibility(false)
  const handleDateConfirm = (selectedDate: Date) => {
    setDate(selectedDate)
    hideDatePicker()
  }

  const handleWebDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!value) return
    const newDate = new Date(value)
    if (!isNaN(newDate.getTime())) setDate(newDate)
  }
  const formatDateForWebInput = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleSelectCampusImage = (loc: CampusLocation) => {
    setSelectedCampusLocation(loc)
    setSelectedCampusId(loc.id)
    setLocation(loc.name)
    setShowImagePicker(false)
    setTimeout(() => setShowLocationPicker(true), 100)
  }

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission needed.')
        setLocationLoading(false)
        return
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      })
      setCoordLat(loc.coords.latitude.toString())
      setCoordLng(loc.coords.longitude.toString())
      setLocationLoading(false)
    } catch (error) {
      setLocationLoading(false)
      Alert.alert('Error', 'Could not get current location.')
    }
  }

  const openWebMap = () => {
    const url = 'https://www.google.com/maps'
    if (Platform.OS === 'web') window.open(url, '_blank')
    else Linking.openURL(url)
  }

  const validateCoordinates = (lat: string, lng: string): boolean => {
    const latNum = parseFloat(lat)
    const lngNum = parseFloat(lng)
    return (
      !isNaN(latNum) &&
      !isNaN(lngNum) &&
      latNum >= -90 &&
      latNum <= 90 &&
      lngNum >= -180 &&
      lngNum <= 180
    )
  }

  const saveCoordinates = () => {
    const lat = coordLat.trim()
    const lng = coordLng.trim()
    const rad = coordRadius.trim()
    if (!lat || !lng || !rad) {
      Alert.alert('Missing Information', 'Please fill all fields.')
      return
    }
    if (!validateCoordinates(lat, lng)) {
      Alert.alert(
        'Invalid Coordinates',
        'Please enter valid decimal coordinates.'
      )
      return
    }
    const radiusNum = parseInt(rad, 10)
    if (isNaN(radiusNum) || radiusNum <= 0) {
      Alert.alert('Invalid Radius', 'Please enter a positive number.')
      return
    }
    setCoordinates({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radius: radiusNum,
    })
    setShowCoordinatesModal(false)
  }

  const handleLocationSelect = () => {
    if (location.trim()) {
      setShowLocationPicker(false)
    } else {
      Alert.alert('Error', 'Please enter a location name')
    }
  }

  const handleCreateEvent = async () => {
    if (!title.trim() || !description.trim() || !location.trim()) {
      Alert.alert(
        'Validation Error',
        'Title, description and location are required.'
      )
      return
    }

    setIsSubmitting(true)
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        date: Timestamp.fromDate(date),
        location: location.trim(),
        locationDescription: locationDescription.trim() || '',
        locationImage: selectedCampusId || '',
        organizer: user?.email || 'Assistant',
        createdAt: serverTimestamp(),
        attendees: [],
        coordinates: coordinates || null,
        status: 'pending',
        createdBy: user?.email || 'unknown',
        createdByName: userData?.name || 'Assistant Admin',
      }
      await addDoc(collection(db, 'events'), eventData)
      resetForm()
      Alert.alert('Success', 'Event submitted for approval.')
    } catch (error) {
      console.error('Error creating event:', error)
      Alert.alert('Error', 'Failed to create event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateEvent = async () => {
    if (!editingId || !title.trim() || !description.trim() || !location.trim())
      return

    setIsSubmitting(true)
    try {
      const eventRef = doc(db, 'events', editingId)
      await updateDoc(eventRef, {
        title: title.trim(),
        description: description.trim(),
        date: Timestamp.fromDate(date),
        location: location.trim(),
        locationDescription: locationDescription.trim() || '',
        locationImage: selectedCampusId || '',
        coordinates: coordinates || null,
        status: 'pending',
        updatedAt: serverTimestamp(),
      })
      resetForm()
      Alert.alert('Success', 'Event updated and pending approval.')
    } catch (error) {
      console.error('Error updating event:', error)
      Alert.alert('Error', 'Failed to update event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = (id: string, eventTitle: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${eventTitle}"?`)) {
        deleteDoc(doc(db, 'events', id))
          .then(() => {
            if (selectedEvent?.id === id) setShowDetailModal(false)
          })
          .catch((err) => {
            console.error(err)
            Alert.alert('Error', 'Delete failed.')
          })
      }
    } else {
      Alert.alert('Delete Event', `Delete "${eventTitle}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'events', id))
              if (selectedEvent?.id === id) setShowDetailModal(false)
              Alert.alert('Success', 'Event deleted.')
            } catch (error) {
              console.error(error)
              Alert.alert('Error', 'Delete failed.')
            }
          },
        },
      ])
    }
  }

  const handleEditStart = (event: Event) => {
    setEditingId(event.id)
    setTitle(event.title)
    setDescription(event.description)
    setDate(event.date)
    setLocation(event.location)
    setLocationDescription(event.locationDescription || '')
    setSelectedCampusId(event.locationImage || null)
    if (event.locationImage) {
      const campus = CAMPUS_LOCATIONS.find((c) => c.id === event.locationImage)
      setSelectedCampusLocation(campus || null)
    }
    setCoordinates(event.coordinates)
    if (event.coordinates) {
      setCoordLat(event.coordinates.latitude.toString())
      setCoordLng(event.coordinates.longitude.toString())
      setCoordRadius(event.coordinates.radius.toString())
    }
    setShowCreateForm(true)
  }

  // --- UI helpers ---
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return { text: 'APPROVED', color: '#10b981' }
      case 'rejected':
        return { text: 'REJECTED', color: '#ef4444' }
      default:
        return { text: 'PENDING', color: '#f59e0b' }
    }
  }

  const getDaysUntilEvent = (eventDate: Date) => {
    const now = new Date()
    const diffDays = Math.ceil(
      (eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
    )
    if (diffDays === 0) return { text: 'TODAY', color: '#16a34a' }
    if (diffDays === 1) return { text: 'TOMORROW', color: '#2563eb' }
    if (diffDays > 1) return { text: 'UPCOMING', color: '#8b5cf6' }
    return { text: 'PAST', color: '#64748b' }
  }

  const getLocationImage = (event: Event) => {
    if (event.locationImage) {
      const found = CAMPUS_LOCATIONS.find((l) => l.id === event.locationImage)
      if (found) return found.image
    }
    return CAMPUS_LOCATIONS[0].image
  }

  // --- Render card ---
  const renderEventCard = ({ item, index }: { item: Event; index: number }) => {
    const status = getStatusBadge(item.status)
    const days = getDaysUntilEvent(item.date)
    const imageSource = getLocationImage(item)
    const globalNumber = (currentPage - 1) * itemsPerPage + index + 1

    return (
      <TouchableOpacity
        style={styles.card}
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
              <View style={[styles.badge, { backgroundColor: status.color }]}>
                <Text style={styles.badgeText}>{status.text}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: days.color }]}>
                <Text style={styles.badgeText}>{days.text}</Text>
              </View>
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
                onPress={() => handleDeleteEvent(item.id, item.title)}
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
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <FontAwesome6
          name='calendar'
          size={40}
          color={colors.sidebar.text.muted}
        />
      </View>
      <Text style={styles.emptyStateTitle}>No events found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery
          ? 'Try different keywords'
          : 'Pull down to refresh or create a new event'}
      </Text>
    </View>
  )

  const renderPagination = () => {
    if (totalPages <= 1) return null
    return (
      <View style={styles.paginationContainer}>
        <Animated.View style={{ transform: [{ scale: prevButtonScale }] }}>
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
              color={
                currentPage === 1 ? colors.sidebar.text.muted : colors.text
              }
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
        </Animated.View>
        <Text style={styles.paginationPageInfo}>
          {currentPage} / {totalPages}
        </Text>
        <Animated.View style={{ transform: [{ scale: nextButtonScale }] }}>
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
        </Animated.View>
      </View>
    )
  }

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
            <Text style={styles.greeting}>My Events,</Text>
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
      {/*
      <View style={styles.statsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.accent.primary}15` }]}>
              <Ionicons name="calendar" size={18} color={colors.accent.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f59e0b15' }]}>
              <Feather name="clock" size={18} color="#f59e0b" />
            </View>
            <Text style={styles.statNumber}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#f59e0b15' }]}>
              <MaterialIcons name="pending" size={18} color="#f59e0b" />
            </View>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </ScrollView>
      </View>
    */}
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
          {(['all', 'upcoming', 'past', 'today'] as const).map((filter) => (
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
                {filter === 'today'
                  ? 'Today'
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
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

      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
        <FlatList
          data={paginatedEvents}
          keyExtractor={(item) => item.id}
          renderItem={renderEventCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                setTimeout(() => setRefreshing(false), 2000)
              }}
              colors={[colors.accent.primary]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </Animated.View>
      {renderPagination()}

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateForm}
        transparent
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
                    name={editingId ? 'pen-to-square' : 'calendar'}
                    size={20}
                    color={colors.accent.primary}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingId ? 'Edit Event' : 'New Event'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {editingId ? 'Update event details' : 'Create a new event'}
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
              {/* Campus Image Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Campus Image (optional)</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                >
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {CAMPUS_LOCATIONS.map((campus) => (
                      <TouchableOpacity
                        key={campus.id}
                        style={[
                          styles.campusImage,
                          selectedCampusId === campus.id &&
                            styles.campusImageSelected,
                        ]}
                        onPress={() => handleSelectCampusImage(campus)}
                      >
                        <Image
                          source={campus.image}
                          style={styles.campusImageInner}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='Enter event title'
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.formTextArea,
                    showCharWarning && styles.inputWarning,
                  ]}
                  placeholder='Describe the event...'
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={description}
                  onChangeText={(text) => {
                    if (text.length <= 500) {
                      setDescription(text)
                      setDescriptionLength(text.length)
                      setShowCharWarning(text.length >= 450)
                    }
                  }}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color:
                        descriptionLength >= 450
                          ? '#f59e0b'
                          : colors.sidebar.text.muted,
                    }}
                  >
                    {descriptionLength >= 450 && descriptionLength < 500
                      ? '⚠️ Approaching limit'
                      : ''}
                    {descriptionLength === 500
                      ? '⚠️ Maximum characters reached'
                      : ''}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        descriptionLength >= 450
                          ? '#ef4444'
                          : colors.sidebar.text.muted,
                      fontWeight: descriptionLength >= 450 ? 'bold' : 'normal',
                    }}
                  >
                    {descriptionLength}/500 characters
                  </Text>
                </View>
              </View>

              {/* Date & Time */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date & Time *</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type='datetime-local'
                    value={formatDateForWebInput(date)}
                    onChange={handleWebDateChange}
                    min={formatDateForWebInput(new Date())}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.border,
                      color: colors.text,
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={showDatePicker}
                    >
                      <Feather
                        name='calendar'
                        size={18}
                        color={colors.accent.primary}
                      />
                      <Text style={styles.datePickerText}>
                        {dayjs(date).format('MMM D, YYYY • h:mm A')}
                      </Text>
                    </TouchableOpacity>
                    <DateTimePickerModal
                      isVisible={isDatePickerVisible}
                      mode='datetime'
                      onConfirm={handleDateConfirm}
                      onCancel={hideDatePicker}
                      date={date}
                      minimumDate={new Date()}
                    />
                  </>
                )}
              </View>

              {/* Location */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location *</Text>
                <TouchableOpacity
                  style={styles.locationPickerButton}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Feather
                    name='map-pin'
                    size={18}
                    color={colors.accent.primary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationPickerTitle}>
                      {location || 'Set location'}
                    </Text>
                    <Text style={styles.locationPickerSubtitle}>
                      {location ? 'Tap to modify' : 'Enter location details'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Coordinates (optional) */}
              <TouchableOpacity
                style={styles.coordinatesButton}
                onPress={() => setShowCoordinatesModal(true)}
              >
                <Feather name='map' size={18} color='#f59e0b' />
                <View style={{ flex: 1 }}>
                  <Text style={styles.coordinatesButtonTitle}>
                    {coordinates
                      ? 'Verification location set'
                      : 'Set verification location'}
                  </Text>
                  <Text style={styles.coordinatesButtonSubtitle}>
                    {coordinates
                      ? `Lat: ${coordinates.latitude.toFixed(4)}, Lng: ${coordinates.longitude.toFixed(4)}`
                      : 'Coordinates for attendance check (optional)'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Actions */}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (isSubmitting ||
                      !title.trim() ||
                      !description.trim() ||
                      !location.trim()) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={editingId ? handleUpdateEvent : handleCreateEvent}
                  disabled={
                    isSubmitting ||
                    !title.trim() ||
                    !description.trim() ||
                    !location.trim()
                  }
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
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType='slide'
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <Feather
                    name='map-pin'
                    size={20}
                    color={colors.accent.primary}
                  />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Location Details</Text>
                  <Text style={styles.modalSubtitle}>Enter event location</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
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
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='e.g., Main Hall, Library, etc.'
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Location Description (optional)
                </Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder='Describe the venue...'
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={locationDescription}
                  onChangeText={setLocationDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
              <TouchableOpacity
                style={styles.imageUploadButton}
                onPress={() => {
                  setShowLocationPicker(false)
                  setTimeout(() => setShowImagePicker(true), 100)
                }}
              >
                <Text style={styles.imageUploadText}>
                  {selectedCampusLocation
                    ? selectedCampusLocation.name
                    : 'Choose Campus Image'}
                </Text>
                <Text style={styles.imagePickerSubtitle}>
                  Select from campus locations
                </Text>
              </TouchableOpacity>
              {selectedCampusLocation && (
                <Image
                  source={selectedCampusLocation.image}
                  style={styles.selectedImagePreview}
                />
              )}
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !location && styles.submitButtonDisabled,
                  ]}
                  onPress={handleLocationSelect}
                  disabled={!location}
                >
                  <Text style={styles.submitButtonText}>Save Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent
        animationType='slide'
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 600 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Campus Location</Text>
              <TouchableOpacity
                onPress={() => setShowImagePicker(false)}
                style={styles.modalClose}
              >
                <Feather
                  name='x'
                  size={24}
                  color={colors.sidebar.text.secondary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CAMPUS_LOCATIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.locationOption,
                    selectedCampusId === item.id &&
                      styles.locationOptionSelected,
                  ]}
                  onPress={() => handleSelectCampusImage(item)}
                >
                  <Image
                    source={item.image}
                    style={styles.locationOptionImage}
                  />
                  <View style={styles.locationOptionText}>
                    <Text style={styles.locationOptionName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.locationOptionDescription}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  {selectedCampusId === item.id && (
                    <Icon
                      name='check-circle'
                      size={24}
                      color={colors.accent.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={{ padding: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* Coordinates Modal */}
      <Modal
        visible={showCoordinatesModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowCoordinatesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 600 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconContainer}>
                  <Feather name='map' size={20} color='#f59e0b' />
                </View>
                <View>
                  <Text style={styles.modalTitle}>
                    Verification Coordinates
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    Set location for attendance check
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowCoordinatesModal(false)}
                style={styles.modalClose}
              >
                <Feather
                  name='x'
                  size={24}
                  color={colors.sidebar.text.secondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <TouchableOpacity
                style={styles.coordinatesAction}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                <Feather
                  name='crosshair'
                  size={18}
                  color={colors.accent.primary}
                />
                <Text style={{ flex: 1, color: colors.text }}>
                  {locationLoading
                    ? 'Getting location...'
                    : 'Use current location'}
                </Text>
                {locationLoading && (
                  <ActivityIndicator
                    size='small'
                    color={colors.accent.primary}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.coordinatesAction}
                onPress={openWebMap}
              >
                <Feather name='globe' size={18} color='#10b981' />
                <Text style={{ flex: 1, color: colors.text }}>
                  Open Google Maps
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.coordinatesAction}
                onPress={() => setShowManualCoordinates(true)}
              >
                <Feather
                  name='type'
                  size={18}
                  color={colors.sidebar.text.muted}
                />
                <Text style={{ flex: 1, color: colors.text }}>
                  Enter coordinates manually
                </Text>
              </TouchableOpacity>

              {(coordLat || coordLng) && (
                <View style={styles.coordinatesDisplay}>
                  <Text style={{ color: colors.text }}>
                    Lat: {coordLat || '—'}
                  </Text>
                  <Text style={{ color: colors.text }}>
                    Lng: {coordLng || '—'}
                  </Text>
                </View>
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Radius (meters)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='250'
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={coordRadius}
                  onChangeText={setCoordRadius}
                  keyboardType='numeric'
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={saveCoordinates}
                >
                  <Text style={styles.submitButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCoordinatesModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Manual Coordinates Modal */}
      <Modal
        visible={showManualCoordinates}
        transparent
        animationType='slide'
        onRequestClose={() => setShowManualCoordinates(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxHeight: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Coordinates</Text>
              <TouchableOpacity
                onPress={() => setShowManualCoordinates(false)}
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
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Latitude</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='14.599512'
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={coordLat}
                  onChangeText={setCoordLat}
                  keyboardType='numeric'
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Longitude</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder='120.984219'
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={coordLng}
                  onChangeText={setCoordLng}
                  keyboardType='numeric'
                />
              </View>
              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!coordLat || !coordLng) && styles.submitButtonDisabled,
                  ]}
                  onPress={() => {
                    if (validateCoordinates(coordLat, coordLng)) {
                      setShowManualCoordinates(false)
                    } else {
                      Alert.alert(
                        'Invalid Coordinates',
                        'Please enter valid decimal coordinates.'
                      )
                    }
                  }}
                  disabled={!coordLat || !coordLng}
                >
                  <Text style={styles.submitButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
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
                          backgroundColor: getStatusBadge(selectedEvent.status)
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
                          backgroundColor: getStatusBadge(selectedEvent.status)
                            .color,
                        },
                      ]}
                    >
                      <Text style={styles.detailBadgeText}>
                        {getStatusBadge(selectedEvent.status).text}
                      </Text>
                    </View>
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
                        {dayjs(selectedEvent.date).format(
                          'MMM D, YYYY • h:mm A'
                        )}
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
                    {selectedEvent.createdByName && (
                      <View style={styles.detailMetaItem}>
                        <Feather
                          name='user'
                          size={14}
                          color={colors.sidebar.text.muted}
                        />
                        <Text style={styles.detailMetaText}>
                          Created by {selectedEvent.createdByName}
                        </Text>
                      </View>
                    )}
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
                                {isWithinRange
                                  ? '✓ In Range'
                                  : '✗ Out of Range'}
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
                      style={styles.detailEditButton}
                      onPress={() => {
                        setShowDetailModal(false)
                        handleEditStart(selectedEvent)
                      }}
                    >
                      <Feather
                        name='edit-2'
                        size={18}
                        color={colors.accent.primary}
                      />
                      <Text style={styles.detailEditButtonText}>
                        Edit Event
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailDeleteButton}
                      onPress={() =>
                        handleDeleteEvent(selectedEvent.id, selectedEvent.title)
                      }
                    >
                      <Feather
                        name='trash-2'
                        size={18}
                        color={colors.error || '#ef4444'}
                      />
                      <Text style={styles.detailDeleteButtonText}>
                        Delete Event
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
