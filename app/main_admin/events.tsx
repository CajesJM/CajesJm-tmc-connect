import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { CAMPUS_LOCATIONS, CampusLocation } from '../../constants/campusLocations';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../lib/firebaseConfig';
import { createEventsStyles } from '../../styles/main-admin/eventsStyles';

const showAlert = (title: string, message?: string) => {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
};

const FormTextInput = ({
  style,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType,
  inputStyle,
  ...props
}: {
  style?: any;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: any;
  inputStyle?: any;
  [key: string]: any;
}) => (
  <RNTextInput
    style={[inputStyle, style]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#94a3b8"
    multiline={multiline}
    numberOfLines={numberOfLines}
    keyboardType={keyboardType}
    {...props}
  />
);

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: string;
  locationImage?: string;
  createdAt: Date;
  attendees?: string[];
  locationDescription?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  status?: 'pending' | 'approved' | 'rejected';
}

interface CoordinatesState {
  latitude: string;
  longitude: string;
  radius: string;
}

interface NewEventState {
  title: string;
  description: string;
  date: Date;
  location: string;
  locationDescription: string;
  locationImage: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

const AnimatedEventItem = memo(function AnimatedEventItem({
  item,
  index,
  currentPage,
  itemsPerPage,
  styles,
  colors,
  isMobile,
  selectedEvent,
  setSelectedEvent,
  handleEditEvent,
  handleDeleteEvent,
  getPriorityColor,
  getEventStatusBadge,
  formatShortDate,
  getStatusColor,
}: {
  item: Event;
  index: number;
  currentPage: number;
  itemsPerPage: number;
  styles: any;
  colors: any;
  isMobile: boolean;
  selectedEvent: string | null;
  setSelectedEvent: (id: string | null) => void;
  handleEditEvent: (item: Event) => void;
  handleDeleteEvent: (id: string, title: string) => void;
  getPriorityColor: (date: Date) => string;
  getEventStatusBadge: (date: Date) => { text: string; color: string };
  formatShortDate: (date: Date) => string;
  getStatusColor: (status?: string) => string;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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
    ]).start();
  }, []);

  const isActive = selectedEvent === item.id;
  const priorityColor = getPriorityColor(item.date);
  const badge = getEventStatusBadge(item.date);
  const statusColor = getStatusColor(item.status);

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
        onPress={() => setSelectedEvent(item.id)}
      >
        <View style={[styles.paginatedNumber, { backgroundColor: `${priorityColor}15` }]}>
          <Text style={[styles.paginatedNumberText, { color: priorityColor }]}>
            {(currentPage - 1) * itemsPerPage + index + 1}
          </Text>
        </View>

        <View style={styles.paginatedInfo}>
          <View style={styles.paginatedTitleRow}>
            <Text style={[styles.paginatedTitle, isMobile && styles.paginatedTitleMobile]} numberOfLines={1}>
              {item.title}
            </Text>

            <View style={styles.paginatedBadgeContainer}>
              {item.status && (
                <View style={[styles.paginatedBadge, { backgroundColor: statusColor }]}>
                  <Text style={styles.paginatedBadgeText}>{item.status.toUpperCase()}</Text>
                </View>
              )}
              <View style={[styles.paginatedBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.paginatedBadgeText}>{badge.text}</Text>
              </View>
            </View>
          </View>

          <View style={styles.paginatedMeta}>
            <Text style={[styles.paginatedDate, isMobile && styles.paginatedDateMobile]}>
              {formatShortDate(item.date)}
            </Text>
          </View>

          <View style={styles.paginatedLocationRow}>
            <Feather name="map-pin" size={8} color="#0ea5e9" />
            <Text style={[styles.paginatedLocation, { marginLeft: 4 }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        </View>

        <View style={styles.paginatedActions}>
          <TouchableOpacity
            style={[styles.paginatedEditButton, isMobile && styles.paginatedEditButtonMobile]}
            onPress={() => handleEditEvent(item)}
          >
            <Feather name="edit-2" size={isMobile ? 12 : 14} color={colors.accent.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paginatedDeleteButton, isMobile && styles.paginatedDeleteButtonMobile]}
            onPress={() => handleDeleteEvent(item.id, item.title)}
          >
            <Feather name="trash-2" size={isMobile ? 12 : 14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});


export default function MainAdminEvents() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const isMobile = screenWidth < 640;
  const isTablet = screenWidth >= 640 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const isSmallScreen = screenWidth < 375;

  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [paginatedEvents, setPaginatedEvents] = useState<Event[]>([]);
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCoordinatesModal, setShowCoordinatesModal] = useState(false);
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedLocationImage, setSelectedLocationImage] = useState<any>(null);
  const [selectedCampusLocation, setSelectedCampusLocation] = useState<CampusLocation | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past' | 'today'>('all');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(isMobile ? 5 : 10);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [isWithinRange, setIsWithinRange] = useState<boolean | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [selectedEventUserLocation, setSelectedEventUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [selectedEventIsWithinRange, setIsSelectedEventWithinRange] = useState<boolean | null>(null);
  const [checkingSelectedEventLocation, setCheckingSelectedEventLocation] = useState(false);
  const { colors, isDark } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useMemo(
    () => createEventsStyles(colors, isDark, isMobile, isTablet, isDesktop, screenHeight),
    [colors, isDark, isMobile, isTablet, isDesktop, screenHeight]
  );
  const TextInput = ({
    style,
    value,
    onChangeText,
    placeholder,
    multiline,
    numberOfLines,
    keyboardType,
    ...props
  }: {
    style?: any;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    multiline?: boolean;
    numberOfLines?: number;
    keyboardType?: any;
    [key: string]: any;
  }) => (
    <RNTextInput
      style={[styles.modernFormInput, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94a3b8"
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      {...props}
    />
  );

  const [eventCoordinates, setEventCoordinates] = useState<CoordinatesState>({
    latitude: '',
    longitude: '',
    radius: '100'
  });

  const [newEvent, setNewEvent] = useState<NewEventState>({
    title: '',
    description: '',
    date: new Date(),
    location: '',
    locationDescription: '',
    locationImage: '',
    coordinates: undefined
  });

  useEffect(() => {
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(eventsQuery,
      (snapshot) => {
        const eventsData: Event[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          eventsData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            date: data.date.toDate(),
            location: data.location,
            organizer: data.organizer,
            locationImage: data.locationImage,
            createdAt: data.createdAt.toDate(),
            attendees: data.attendees || [],
            locationDescription: data.locationDescription,
            coordinates: data.coordinates,
            status: data.status || 'approved',
          });
        });
        setEvents(eventsData);
        filterEvents(eventsData, activeFilter);
        setLoading(false);
        setRefreshing(false);
      },
      (error: unknown) => {

        showAlert('Error', 'Failed to load events');
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterEvents(events, activeFilter);
  }, [events]);

  useEffect(() => {
    let filtered = filterEventsByTime(events, activeFilter);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedEvents(filtered.slice(startIndex, endIndex));
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  }, [events, activeFilter, currentPage, itemsPerPage]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const results = events.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, events]);

  const filterEventsByTime = (eventsList: Event[], filter: 'all' | 'upcoming' | 'past' | 'today') => {
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        return eventsList.filter(event => event.date > now);
      case 'past':
        return eventsList.filter(event => event.date <= now);
      case 'today':
        return eventsList.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.toDateString() === now.toDateString();
        });
      default:
        return eventsList;
    }
  };
  const getStatusBadgeStyle = (status?: string) => {
    switch (status) {
      case 'pending': return { backgroundColor: '#f59e0b' };
      case 'approved': return { backgroundColor: '#10b981' };
      case 'rejected': return { backgroundColor: '#ef4444' };
      default: return { backgroundColor: '#64748b' };
    }
  };

  const filterEvents = (eventsList: Event[], filter: 'all' | 'upcoming' | 'past' | 'today') => {
    const filtered = filterEventsByTime(eventsList, filter);
    setFilteredEvents(filtered);
  };

  const handleFilterChange = (filter: 'all' | 'upcoming' | 'past' | 'today') => {
    setActiveFilter(filter);
    setCurrentPage(1);
    setSelectedEvent(null);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleSelectCampusImage = (location: CampusLocation) => {
    setSelectedCampusLocation(location);
    setSelectedLocationImage(location.image);
    setShowImagePicker(false);
    setNewEvent(prev => ({ ...prev, location: location.name }));
    setTimeout(() => setShowLocationPicker(true), 100);
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationLoading(false);
        showAlert(
          'Permission Required',
          'Location permission is needed to automatically detect your location. You can enter coordinates manually instead.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });

      const { latitude, longitude } = location.coords;

      setEventCoordinates({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: eventCoordinates.radius
      });

      setLocationLoading(false);

      showAlert(
        'Location Found',
        `Coordinates set to:\nLat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`
      );

    } catch (error: unknown) {
      setLocationLoading(false);


      let errorMessage = 'Failed to get current location. Please try again or enter coordinates manually.';

      setLocationError(errorMessage);
      showAlert('Location Error', errorMessage);
    }
  };

  const validateCoordinates = (latitude: string, longitude: string): boolean => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) return false;
    if (lat < -90 || lat > 90) return false;
    if (lng < -180 || lng > 180) return false;

    return true;
  };

  const validateRadius = (radius: string): boolean => {
    const radiusNum = parseInt(radius);
    return !isNaN(radiusNum) && radiusNum > 0 && radiusNum <= 10000;
  };

  const handleCoordinateChange = (field: keyof CoordinatesState, value: string) => {
    if (field === 'latitude' || field === 'longitude') {
      const decimalRegex = /^-?\d*\.?\d*$/;
      if (value === '' || decimalRegex.test(value)) {
        setEventCoordinates(prev => ({ ...prev, [field]: value }));
      }
    } else if (field === 'radius') {
      const numericRegex = /^\d*$/;
      if (value === '' || numericRegex.test(value)) {
        setEventCoordinates(prev => ({ ...prev, [field]: value }));
      }
    }
  };

  const openWebMap = () => {
    if (eventCoordinates.latitude && eventCoordinates.longitude) {
      const lat = parseFloat(eventCoordinates.latitude);
      const lng = parseFloat(eventCoordinates.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        const url = `https://www.google.com/maps?q=${lat},${lng}`;
        if (Platform.OS === 'web') {
          window.open(url, '_blank');
        } else {
          Linking.openURL(url);
        }
        return;
      }
    }
    const url = 'https://www.google.com/maps';
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }

    showAlert(
      'Google Maps Opened',
      'Find your event location on Google Maps, then long-press to get coordinates. Come back here to enter them manually.'
    );
  };

  const saveCoordinates = () => {
    const lat = eventCoordinates.latitude.trim();
    const lng = eventCoordinates.longitude.trim();
    const radius = eventCoordinates.radius.trim();

    if (!lat || !lng || !radius) {
      showAlert('Missing Information', 'Please fill in all coordinates and radius fields.');
      return;
    }

    if (!validateCoordinates(lat, lng)) {
      showAlert(
        'Invalid Coordinates',
        'Please enter valid decimal coordinates.\n\n• Latitude: -90 to 90\n• Longitude: -180 to 180\n• Example: 14.599512, 120.984219'
      );
      return;
    }
    if (!validateRadius(radius)) {
      showAlert('Invalid Radius', 'Please enter a valid positive number for the verification radius (e.g., 100).');
      return;
    }

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radius: parseInt(radius)
    };

    setNewEvent(prev => ({ ...prev, coordinates }));
    setShowCoordinatesModal(false);
    showAlert('Success', 'Location verification coordinates saved!');
  };
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const openLocationInMaps = async (location: string, coordinates?: { latitude: number, longitude: number }) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let origin = '';

      if (status === 'granted') {
        const userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        origin = `${userLocation.coords.latitude},${userLocation.coords.longitude}`;
      }

      if (coordinates) {
        const { latitude, longitude } = coordinates;
        const destination = `${latitude},${longitude}`;

        let url: string;
        if (Platform.OS === 'ios') {
          url = origin
            ? `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`
            : `http://maps.apple.com/?daddr=${destination}&dirflg=d`;
        } else {

          url = origin
            ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
            : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
        }

        await Linking.openURL(url);
      } else {

        const query = encodeURIComponent(location);
        const url = Platform.OS === 'ios'
          ? `http://maps.apple.com/?q=${query}`
          : `https://www.google.com/maps/search/?api=1&query=${query}`;
        await Linking.openURL(url);
      }
    } catch (error) {

      showAlert('Error', 'Could not open maps application');
    }
  };

  const checkSelectedEventLocation = async (selectedEventId: string) => {
    const selected = events.find(e => e.id === selectedEventId);
    if (!selected?.coordinates) {
      showAlert('No Location Set', 'This event does not have a verification location set.');
      return;
    }

    try {
      setCheckingSelectedEventLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Location permission is required to check attendance range.');
        setCheckingSelectedEventLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSelectedEventUserLocation(userLoc);

      const distance = calculateDistance(
        userLoc.latitude,
        userLoc.longitude,
        selected.coordinates.latitude,
        selected.coordinates.longitude
      );

      const withinRange = distance <= selected.coordinates.radius;
      setIsSelectedEventWithinRange(withinRange);

      showAlert(
        withinRange ? '✅ You are within range!' : '❌ You are outside the range',
        `Your distance: ${Math.round(distance)}m\nAllowed radius: ${selected.coordinates.radius}m`
      );

    } catch (error) {

      showAlert('Error', 'Failed to get your location. Please try again.');
    } finally {
      setCheckingSelectedEventLocation(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title?.trim() || !newEvent.description?.trim() || !newEvent.location?.trim()) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      setLoading(true);

      const locationImageRef = selectedCampusLocation ? selectedCampusLocation.id : '';

      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        date: Timestamp.fromDate(newEvent.date),
        location: newEvent.location.trim(),
        organizer: user?.email || 'Admin',
        locationImage: locationImageRef,
        locationDescription: newEvent.locationDescription?.trim() || '',
        createdAt: Timestamp.now(),
        attendees: [],
        coordinates: newEvent.coordinates || null
      };

      const docRef = await addDoc(collection(db, 'events'), eventData);

      resetForm();
      setShowCreateForm(false);
      showAlert('Success', 'Event created successfully!');

    } catch (error: unknown) {

      showAlert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };
  const handleWebDateChange = (event: any) => {
    const localDateString = event.target.value;

    if (!localDateString) return;

    try {
      const [datePart, timePart] = localDateString.split('T');

      if (!datePart || !timePart) {

        return;
      }

      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);

      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {

        return;
      }

      if (year < 2000 || year > 2100) {

        return;
      }

      if (month < 1 || month > 12) {

        return;
      }

      if (day < 1 || day > 31) {

        return;
      }

      if (hours < 0 || hours > 23) {

        return;
      }

      if (minutes < 0 || minutes > 59) {

        return;
      }

      const localDate = new Date(year, month - 1, day, hours, minutes);

      if (isNaN(localDate.getTime())) {

        return;
      }

      const now = new Date();
      const maxFutureDate = new Date();
      maxFutureDate.setFullYear(now.getFullYear() + 5);

      if (localDate < now) {
      }

      if (localDate > maxFutureDate) {
        showAlert('Invalid Date', 'Date cannot be more than 5 years in the future');
        return;
      }

      setNewEvent({ ...newEvent, date: localDate });

    } catch (error) {

    }
  };
  const formatDateForWebInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEvent.title || !newEvent.description || !newEvent.location) {
      showAlert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      setLoading(true);
      const eventRef = doc(db, 'events', editingEvent.id);

      const updateData: any = {
        title: newEvent.title,
        description: newEvent.description,
        date: Timestamp.fromDate(newEvent.date),
        location: newEvent.location,
        locationDescription: newEvent.locationDescription || '',
      };
      if (selectedCampusLocation) {
        updateData.locationImage = selectedCampusLocation.id;
      }

      if (newEvent.coordinates) {
        updateData.coordinates = newEvent.coordinates;
      } else {
        updateData.coordinates = null;
      }

      await updateDoc(eventRef, updateData);

      resetForm();
      setShowEditForm(false);
      setEditingEvent(null);
      showAlert('Success', 'Event updated successfully!');
    } catch (error: unknown) {

      showAlert('Error', 'Failed to update event');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };
  const headerGradientColors = isDark
    ? ['#0f172a', '#1e293b'] as const
    : ['#1e40af', '#3b82f6'] as const;

  const handleEditEvent = (event: Event) => {
    try {
      setEditingEvent(event);
      setNewEvent({
        title: event.title || '',
        description: event.description || '',
        date: event.date || new Date(),
        location: event.location || '',
        locationDescription: event.locationDescription || '',
        locationImage: event.locationImage || '',
        coordinates: event.coordinates || undefined
      });

      if (event.locationImage) {
        const campusLocation = CAMPUS_LOCATIONS.find(loc => loc.id === event.locationImage);
        if (campusLocation) {
          setSelectedCampusLocation(campusLocation);
          setSelectedLocationImage(campusLocation.image);
        }
      }

      if (event.coordinates) {
        setEventCoordinates({
          latitude: event.coordinates.latitude?.toString() || '',
          longitude: event.coordinates.longitude?.toString() || '',
          radius: event.coordinates.radius?.toString() || '100'
        });
      } else {
        setEventCoordinates({
          latitude: '',
          longitude: '',
          radius: '100'
        });
      }

      setShowEditForm(true);

    } catch (error: unknown) {

      showAlert('Error', 'Failed to load event for editing');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    const confirmDelete = () => {
      if (Platform.OS === 'web') {
        return window.confirm(`Are you sure you want to delete "${eventTitle}"?`);
      } else {

        return new Promise<boolean>((resolve) => {
          Alert.alert(
            'Delete Event',
            `Are you sure you want to delete "${eventTitle}"? This will also delete all associated penalties.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]
          );
        });
      }
    };

    const confirmed = Platform.OS === 'web' ? confirmDelete() : await confirmDelete();
    if (!confirmed) return;

    try {
      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);
      const penaltiesQuery = query(
        collection(db, 'penalties'),
        where('eventId', '==', eventId)
      );
      const penaltiesSnapshot = await getDocs(penaltiesQuery);
      const deletePromises = penaltiesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      showAlert('Success', `"${eventTitle}" and its associated penalties deleted successfully!`);
    } catch (error: unknown) {

      showAlert('Error', 'Failed to delete event. Please check console for details.');
    }
  };

  const handleLocationSelect = () => {
    if (newEvent.location.trim()) {
      setNewEvent(prev => ({
        ...prev,
        location: newEvent.location.trim(),
        locationDescription: newEvent.locationDescription?.trim() || '',
        locationImage: selectedCampusLocation ? selectedCampusLocation.id : ''
      }));
      setShowLocationPicker(false);
    } else {
      showAlert('Error', 'Please enter a location name');
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      date: new Date(),
      location: '',
      locationDescription: '',
      locationImage: '',
      coordinates: undefined
    });
    setSelectedLocationImage(null);
    setSelectedCampusLocation(null);
    setEditingEvent(null);
    setEventCoordinates({
      latitude: '',
      longitude: '',
      radius: '100'
    });
  };

  const handleCloseForm = () => {
    resetForm();
    setShowCreateForm(false);
    setShowEditForm(false);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setSelectedEvent(null);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSelectedEvent(null);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showDatePickerModal = () => {
    setDatePickerVisibility(true);
  };

  const handleConfirmDate = (date: Date) => {
    setNewEvent({ ...newEvent, date });
    setDatePickerVisibility(false);
  };

  const getLocationImage = (event: Event) => {
    if (event.locationImage) {
      const campusLocation = CAMPUS_LOCATIONS.find(loc => loc.id === event.locationImage);
      if (campusLocation) {
        return campusLocation.image;
      }
    }
    return CAMPUS_LOCATIONS[0].image;
  };

  const getEventStatusBadge = (eventDate: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    const diffTime = eventDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'TODAY', type: 'today', color: '#16a34a' };
    if (diffDays === 1) return { text: 'TOMORROW', type: 'tomorrow', color: '#2563eb' };
    if (diffDays > 1) return { text: 'UPCOMING', type: 'upcoming', color: '#8b5cf6' };
    return { text: 'PAST', type: 'past', color: '#64748b' };
  };

  const getEventBadgeStyle = (eventDate: Date) => {
    const badge = getEventStatusBadge(eventDate);
    return [styles.paginatedBadge, { backgroundColor: badge.color }];
  };

  const getPriorityColor = (eventDate: Date) => {
    const badge = getEventStatusBadge(eventDate);
    return badge.color;
  };
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#64748b';
    }
  };
  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter(event => event.date > new Date()).length;
    const past = events.filter(event => event.date <= new Date()).length;
    return { total, upcoming, past };
  }, [events]);

  const renderPaginatedItem = ({ item, index }: { item: Event; index: number }) => {
    const isActive = selectedEvent === item.id;
    const priorityColor = getPriorityColor(item.date);

    return (
      <TouchableOpacity
        style={[
          styles.paginatedItem,
          isActive && styles.paginatedItemActive,
          isMobile && styles.paginatedItemMobile
        ]}
        onPress={() => setSelectedEvent(item.id)}
      >
        <View style={[styles.paginatedNumber, { backgroundColor: `${priorityColor}15` }]}>
          <Text style={[styles.paginatedNumberText, { color: priorityColor }]}>
            {(currentPage - 1) * itemsPerPage + index + 1}
          </Text>
        </View>

        <View style={styles.paginatedInfo}>
          {/* Title + Badges row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={[styles.paginatedTitle, isMobile && styles.paginatedTitleMobile]} numberOfLines={1}>
              {item.title}
            </Text>

            <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {/* Status badge */}
              {item.status && (
                <View style={[styles.paginatedBadge, getStatusBadgeStyle(item.status)]}>
                  <Text style={styles.paginatedBadgeText}>{item.status.toUpperCase()}</Text>
                </View>
              )}

              {/* Event date badge */}
              {(() => {
                const badge = getEventStatusBadge(item.date);
                return (
                  <View style={[styles.paginatedBadge, { backgroundColor: badge.color }]}>
                    <Text style={styles.paginatedBadgeText}>{badge.text}</Text>
                  </View>
                );
              })()}
            </View>
          </View>

          {/* Date and location (unchanged) */}
          <View style={styles.paginatedMeta}>
            <Text style={[styles.paginatedDate, isMobile && styles.paginatedDateMobile]}>
              {formatShortDate(item.date)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="map-pin" size={8} color="#0ea5e9" />
            <Text style={[styles.paginatedLocation, { marginLeft: 4 }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        </View>

        {/* Action buttons (unchanged) */}
        <View style={styles.paginatedActions}>
          <TouchableOpacity
            style={[styles.paginatedEditButton, isMobile && styles.paginatedEditButtonMobile]}
            onPress={() => handleEditEvent(item)}
          >
            <Feather name="edit-2" size={isMobile ? 12 : 14} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paginatedDeleteButton, isMobile && styles.paginatedDeleteButtonMobile]}
            onPress={() => handleDeleteEvent(item.id, item.title)}
          >
            <Feather name="trash-2" size={isMobile ? 12 : 14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResultItem = ({ item }: { item: Event }) => {
    const badge = getEventStatusBadge(item.date);
    const isActive = selectedEvent === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.searchResultItem,
          isActive && styles.searchResultItemActive,
          isMobile && styles.searchResultItemMobile,
        ]}
        onPress={() => setSelectedEvent(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.searchResultHeader}>
          <View style={styles.searchResultTitleContainer}>
            <Text style={[styles.searchResultTitle, isMobile && styles.searchResultTitleMobile]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.searchResultBadges}>
              {item.status && (
                <View style={[styles.searchResultBadge, getStatusBadgeStyle(item.status)]}>
                  <Text style={styles.searchResultBadgeText}>{item.status.toUpperCase()}</Text>
                </View>
              )}
              {(() => {
                const badge = getEventStatusBadge(item.date);
                return (
                  <View style={[styles.searchResultBadge, { backgroundColor: badge.color }]}>
                    <Text style={styles.searchResultBadgeText}>{badge.text}</Text>
                  </View>
                );
              })()}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="map-pin" size={10} color="#0ea5e9" />
            <Text style={[styles.searchResultLocation, isMobile && styles.searchResultLocationMobile, { marginLeft: 4 }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          <View style={styles.searchResultActions}>
            <TouchableOpacity
              style={[styles.searchResultEditButton, isMobile && styles.searchResultEditButtonMobile]}
              onPress={(e) => {
                e.stopPropagation();
                handleEditEvent(item);
              }}
            >
              <Feather name="edit-2" size={isMobile ? 12 : 14} color="#3b82f6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.searchResultDeleteButton, isMobile && styles.searchResultDeleteButtonMobile]}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteEvent(item.id, item.title);
              }}
            >
              <Feather name="trash-2" size={isMobile ? 12 : 14} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.searchResultDescription, isMobile && styles.searchResultDescriptionMobile]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.searchResultFooter}>
          <View style={styles.searchResultDate}>
            <Feather name="clock" size={isMobile ? 8 : 10} color="#64748b" />
            <Text style={[styles.searchResultDateText, isMobile && styles.searchResultDateTextMobile]}>
              {formatShortDate(item.date)}
            </Text>
          </View>
          <View style={styles.searchResultAttendees}>
            <Feather name="users" size={isMobile ? 8 : 10} color="#64748b" />
            <Text style={[styles.searchResultAttendeesText, isMobile && styles.searchResultAttendeesTextMobile]}>
              {item.attendees?.length || 0}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedDetail = (
    selected: Event,
    userLocation: { latitude: number, longitude: number } | null,
    isWithinRange: boolean | null,
    checkingLocation: boolean,
    onCheckLocation: () => void,
    onOpenMaps: (location: string, coordinates?: { latitude: number, longitude: number }) => void
  ) => {
    const badge = getEventStatusBadge(selected.date);

    return (
      <View>
        <View style={[styles.modernDetailImageContainer, isMobile && styles.modernDetailImageContainerMobile]}>
          <Image
            source={getLocationImage(selected)}
            style={styles.modernDetailImage}
            resizeMode="cover"
          />
          <View style={[styles.modernDetailImageBadge, { backgroundColor: getEventStatusBadge(selected.date).color }]}>
            <Text style={styles.eventBadgeText}>{badge.text}</Text>
          </View>
        </View>

        <Text style={[styles.modernDetailTitle, isMobile && styles.modernDetailTitleMobile]}>
          {selected.title}
        </Text>

        <View style={styles.modernDetailSection}>
          <Text style={styles.modernDetailLabel}>Description</Text>
          <Text style={[styles.modernDetailText, isMobile && styles.modernDetailTextMobile]}>
            {selected.description}
          </Text>
        </View>

        <View style={styles.modernDetailRow}>
          <Feather name="calendar" size={16} color="#0ea5e9" />
          <Text style={styles.modernDetailRowText}>
            {formatDate(selected.date)}
          </Text>
        </View>

        <View style={styles.modernDetailRow}>
          <Feather name="map-pin" size={16} color="#0ea5e9" />
          <Text style={styles.modernDetailRowText}>
            {selected.location}
          </Text>
        </View>

        {selected.locationDescription && (
          <View style={styles.modernDetailRow}>
            <Feather name="info" size={16} color="#64748b" />
            <Text style={styles.modernDetailRowText}>
              {selected.locationDescription}
            </Text>
          </View>
        )}

        {selected.coordinates && (
          <View style={styles.modernDetailSection}>
            <View style={styles.modernDetailRangeHeader}>
              <Text style={styles.modernDetailLabel}>Attendance Range</Text>
              {isWithinRange !== null && (
                <View style={[
                  styles.rangeIndicator,
                  { backgroundColor: isWithinRange ? '#10b981' : '#ef4444' }
                ]}>
                  <Text style={styles.rangeIndicatorText}>
                    {isWithinRange ? '✓ In Range' : '✗ Out of Range'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modernDetailRow}>
              <Feather name="map" size={16} color="#f59e0b" />
              <Text style={styles.modernDetailRowText}>
                {selected.coordinates.latitude.toFixed(4)}, {selected.coordinates.longitude.toFixed(4)}
              </Text>
              <TouchableOpacity
                onPress={() => onOpenMaps(selected.location, selected.coordinates)}
                style={[styles.modernDetailIconButton, { backgroundColor: '#f59e0b20' }]}
              >
                <Feather name="external-link" size={16} color="#f59e0b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modernDetailRow}>
              <Feather name="radio" size={16} color="#f59e0b" />
              <Text style={styles.modernDetailRowText}>
                Allowed Radius: {selected.coordinates.radius}m
              </Text>
            </View>

            <View style={styles.rangeVisualization}>
              <View style={styles.rangeTrack}>
                <View
                  style={[
                    styles.rangeFill,
                    {
                      width: `${Math.min(100, (userLocation ? calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        selected.coordinates.latitude,
                        selected.coordinates.longitude
                      ) / selected.coordinates.radius * 100 : 0))}%`
                    }
                  ]}
                />
              </View>
              <Text style={styles.rangeTrackText}>
                {userLocation
                  ? `${Math.round(calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    selected.coordinates.latitude,
                    selected.coordinates.longitude
                  ))}m / ${selected.coordinates.radius}m`
                  : 'Check your location to see distance'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.checkLocationButton,
                checkingLocation && styles.checkLocationButtonDisabled
              ]}
              onPress={onCheckLocation}
              disabled={checkingLocation}
            >
              {checkingLocation ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Feather name="crosshair" size={16} color="#ffffff" />
                  <Text style={styles.checkLocationButtonText}>
                    {userLocation ? 'Refresh My Location' : 'Check My Location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.modernDetailRow}>
          <Feather name="users" size={16} color="#64748b" />
          <Text style={styles.modernDetailRowText}>
            {selected.attendees?.length || 0} attending
          </Text>
        </View>

        <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
          <TouchableOpacity
            style={[styles.modernSubmitButton, isMobile && styles.modernSubmitButtonMobile]}
            onPress={() => {
              handleEditEvent(selected);
              setSelectedEvent(null);
            }}
          >
            <Feather name="edit-2" size={isMobile ? 14 : 16} color="#ffffff" />
            <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modernCancelButton, isMobile && styles.modernCancelButtonMobile]}
            onPress={() => {
              handleDeleteEvent(selected.id, selected.title);
              setSelectedEvent(null);
            }}
          >
            <Text style={[styles.modernCancelButtonText, isMobile && styles.modernCancelButtonTextMobile]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={[styles.paginationContainer, isMobile && styles.paginationContainerMobile]}>
        <TouchableOpacity
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled, isMobile && styles.paginationButtonMobile]}
          onPress={handlePrevPage}
          disabled={currentPage === 1}
        >
          <Feather name="chevron-left" size={isMobile ? 14 : 16} color={currentPage === 1 ? '#cbd5e1' : '#0ea5e9'} />
          {!isMobile && <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
            Prev
          </Text>}
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={[styles.pageInfoText, isMobile && styles.pageInfoTextMobile]}>{currentPage}/{totalPages}</Text>
        </View>

        <TouchableOpacity
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled, isMobile && styles.paginationButtonMobile]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}
        >
          {!isMobile && <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
            Next
          </Text>}
          <Feather name="chevron-right" size={isMobile ? 14 : 16} color={currentPage === totalPages ? '#cbd5e1' : '#0ea5e9'} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderForm = (isEdit: boolean = false) => (
    <Modal
      visible={showCreateForm || showEditForm}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCloseForm}
    >
      {/* Outer blur overlay */}
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <TouchableOpacity
          style={styles.glassModalOverlayTouch}
          activeOpacity={1}
          onPress={handleCloseForm}
        />
      </BlurView>

      {/* Modal container */}
      <View style={styles.glassModalCentered}>
        <View style={[styles.glassModalContainer, { borderColor: 'rgba(255,255,255,0.3)' }]}>
          {/* Gradient header */}
          <LinearGradient
            colors={isDark ? ['#1e293b', '#0f172a'] : ['#f8fafc', '#e2e8f0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glassModalGradientHeader}
          >
            <View style={styles.glassModalHeader}>
              <View style={styles.glassModalHeaderLeft}>
                <View style={[styles.glassModalIconContainer, isMobile && styles.glassModalIconContainerMobile]}>
                  <Feather
                    name={isEdit ? "edit-2" : "calendar"}
                    size={isMobile ? 16 : 20}
                    color={colors.accent.primary}
                  />
                </View>
                <View>
                  <Text style={[styles.glassModalTitle, { color: colors.text }]}>
                    {isEdit ? 'Edit Event' : 'New Event'}
                  </Text>
                  <Text style={[styles.glassModalSubtitle, { color: colors.sidebar.text.secondary }]}>
                    {isEdit ? 'Update event details' : 'Create a new event'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleCloseForm} style={styles.glassModalCloseButton}>
                <Ionicons name="close-circle" size={28} color={colors.accent.primary} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Scrollable content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.glassModalScrollContent}
            style={{ backgroundColor: isDark ? 'rgba(15, 25, 35, 0.7)' : 'rgba(255, 255, 255, 0.7)' }}
          >
            <View style={[styles.glassModalFormSection, { borderColor: 'rgba(255,255,255,0.2)' }]}>
              {/* Campus Image Selection */}
              <View style={styles.glassFormGroup}>
                <Text style={[styles.glassFormLabel, { color: colors.text }]}>Campus Image (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {CAMPUS_LOCATIONS.map((location) => (
                      <TouchableOpacity
                        key={location.id}
                        style={[
                          {
                            width: 80,
                            height: 80,
                            borderRadius: 12,
                            overflow: 'hidden',
                            borderWidth: 2,
                            borderColor: selectedCampusLocation?.id === location.id ? colors.accent.primary : colors.border,
                          },
                          isMobile && { width: 60, height: 60 }
                        ]}
                        onPress={() => handleSelectCampusImage(location)}
                      >
                        <Image
                          source={location.image}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {selectedCampusLocation && (
                  <Text style={[styles.glassFormHelperText, { color: colors.sidebar.text.muted }]}>
                    Selected: {selectedCampusLocation.name}
                  </Text>
                )}
              </View>

              {/* Title */}
              <View style={styles.glassFormGroup}>
                <Text style={[styles.glassFormLabel, { color: colors.text }]}>Title *</Text>
                <TextInput
                  style={[styles.glassFormInput, isMobile && styles.glassFormInputMobile]}
                  placeholder="Enter event title"
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={newEvent.title}
                  onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                />
              </View>

              {/* Description */}
              <View style={styles.glassFormGroup}>
                <Text style={[styles.glassFormLabel, { color: colors.text }]}>Description *</Text>
                <TextInput
                  style={[styles.glassFormInput, styles.glassTextArea, isMobile && styles.glassFormInputMobile]}
                  placeholder="Describe your event..."
                  placeholderTextColor={colors.sidebar.text.muted}
                  value={newEvent.description}
                  onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Date & Time */}
              <View style={styles.glassFormGroup}>
                <Text style={[styles.glassFormLabel, { color: colors.text }]}>Date & Time *</Text>
                <TouchableOpacity
                  style={styles.glassFormInput}
                  onPress={showDatePickerModal}
                >
                  <Text style={{ color: colors.text }}>
                    {formatDate(newEvent.date)}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.sidebar.text.muted, marginTop: 2 }}>
                    Tap to change date and time
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Location */}
              <View style={styles.glassFormGroup}>
                <Text style={[styles.glassFormLabel, { color: colors.text }]}>Location *</Text>
                <TouchableOpacity
                  style={styles.glassFormInput}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Text style={{ color: colors.text }}>
                    {newEvent.location || 'Set location'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.sidebar.text.muted, marginTop: 2 }}>
                    {newEvent.location ? 'Tap to modify' : 'Enter location details'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Coordinates */}
              <View style={styles.glassFormGroup}>
                <TouchableOpacity
                  style={[styles.glassFormInput, { marginBottom: 20 }]}
                  onPress={() => setShowCoordinatesModal(true)}
                >
                  <Text style={{ color: colors.text }}>
                    {newEvent.coordinates ? 'Verification Location Set' : 'Set Verification Location'}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.sidebar.text.muted, marginTop: 2 }}>
                    {newEvent.coordinates
                      ? `Lat: ${newEvent.coordinates.latitude.toFixed(4)}, Lng: ${newEvent.coordinates.longitude.toFixed(4)}`
                      : 'Add coordinates for attendance verification'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Actions */}
              <View style={[styles.glassFormActions, isMobile && styles.glassFormActionsMobile]}>
                <TouchableOpacity
                  style={[
                    styles.glassSubmitButton,
                    (!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.location.trim() || isSubmitting) && styles.glassSubmitButtonDisabled,
                    isMobile && styles.glassSubmitButtonMobile
                  ]}
                  onPress={isEdit ? handleUpdateEvent : handleCreateEvent}
                  disabled={!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.location.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Feather
                        name={isEdit ? "check-circle" : "plus-circle"}
                        size={isMobile ? 16 : 18}
                        color="#ffffff"
                      />
                      <Text style={[styles.glassSubmitButtonText, isMobile && styles.glassSubmitButtonTextMobile]}>
                        {isEdit ? 'Update Event' : 'Create Event'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.glassCancelButton, isMobile && styles.glassCancelButtonMobile]}
                  onPress={handleCloseForm}
                >
                  <Text style={[styles.glassCancelButtonText, isMobile && styles.glassCancelButtonTextMobile]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={headerGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, isMobile && styles.headerGradientMobile]}
      >
        <View style={[styles.headerContent, isMobile && styles.headerContentMobile]}>
          <View>
            <Text style={[styles.greetingText, { color: isDark ? colors.sidebar.text.secondary : '#ffffff' }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, isMobile && styles.userNameMobile]}>
              {userData?.name || 'Admin'}
            </Text>
            <Text style={[styles.roleText, { color: isDark ? colors.sidebar.text.secondary : '#ffffff' }]}>
              Events Manager
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.profileButton, isMobile && styles.profileButtonMobile]}
            onPress={() => router.push('/main_admin/profile')}
          >
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileFallback]}>
                <Text style={[styles.profileInitials, isMobile && styles.profileInitialsMobile]}>
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : 'A'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.dateSection, isMobile && styles.dateSectionMobile]}>
          <View style={[styles.dateContainer, isMobile && styles.dateContainerMobile]}>
            <Text style={[styles.dateText, isMobile && styles.dateTextMobile]}>
              {new Date().toLocaleDateString('en-US', {
                weekday: isMobile ? 'short' : 'long',
                year: 'numeric',
                month: isMobile ? 'short' : 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerAction, isMobile && styles.headerActionMobile]}
              onPress={() => setShowCreateForm(true)}
            >
              <Feather name="plus" size={isMobile ? 16 : 18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>


      {/* Main Content Grid */}
      <View style={[styles.mainContent, isMobile && styles.mainContentMobile]}>
        {/* Left Grid - Paginated Events */}
        <View style={[styles.leftGrid, isMobile && styles.leftGridMobile]}>
          <View style={[styles.leftHeader, isMobile && styles.leftHeaderMobile]}>
            <Text style={[styles.leftTitle, isMobile && styles.leftTitleMobile]}>Events</Text>
            <View style={[styles.leftControls, isMobile && styles.leftControlsMobile]}>
              <Text style={[styles.eventCount, isMobile && styles.eventCountMobile]}>
                {filterEventsByTime(events, activeFilter).length}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.leftFilters, isMobile && styles.leftFiltersMobile]}
              >
                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'all' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('all')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'all' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'today' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('today')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'today' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>Today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'upcoming' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('upcoming')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'upcoming' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>Upcoming</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.leftFilterButton,
                    activeFilter === 'past' && styles.leftFilterButtonActive,
                    isMobile && styles.leftFilterButtonMobile
                  ]}
                  onPress={() => handleFilterChange('past')}
                >
                  <Text style={[
                    styles.leftFilterButtonText,
                    activeFilter === 'past' && styles.leftFilterButtonTextActive,
                    isMobile && styles.leftFilterButtonTextMobile
                  ]}>Past</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {filterEventsByTime(events, activeFilter).length} event{filterEventsByTime(events, activeFilter).length !== 1 ? 's' : ''}
              {activeFilter !== 'all' && ` from ${activeFilter}`}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size={isMobile ? "small" : "large"} color="#0ea5e9" />
              <Text style={[styles.loadingText, isMobile && styles.loadingTextMobile]}>Loading events...</Text>
            </View>
          ) : (
            <>
              {/* Events List */}
              <View style={styles.eventsListContainer}>
                <FlatList
                  data={paginatedEvents}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <AnimatedEventItem
                      item={item}
                      index={index}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      styles={styles}
                      colors={colors}
                      isMobile={isMobile}
                      selectedEvent={selectedEvent}
                      setSelectedEvent={setSelectedEvent}
                      handleEditEvent={handleEditEvent}
                      handleDeleteEvent={handleDeleteEvent}
                      getPriorityColor={getPriorityColor}
                      getEventStatusBadge={getEventStatusBadge}
                      formatShortDate={formatShortDate}
                      getStatusColor={getStatusColor}
                    />
                  )}
                  style={styles.paginatedList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="calendar" size={isMobile ? 24 : 32} color="#cbd5e1" />
                      </View>
                      <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>No events found</Text>
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        {activeFilter === 'all' ? 'Create your first event to get started' :
                          activeFilter === 'upcoming' ? 'No upcoming events scheduled' : 'No past events to display'}
                      </Text>
                    </View>
                  }
                />
              </View>

              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </View>

        {/* Right Grid - Search */}
        <View style={[styles.rightGrid, isMobile && styles.rightGridMobile]}>
          <View style={[styles.rightHeader, isMobile && styles.rightHeaderMobile]}>
            <Text style={[styles.searchTitle, isMobile && styles.searchTitleMobile]}>Search Events</Text>

            <View style={[styles.searchContainer, isMobile && styles.searchContainerMobile]}>
              <Feather name="search" size={isMobile ? 14 : 16} color="#64748b" />
              <FormTextInput
                style={[styles.searchInput, isMobile && styles.searchInputMobile]}
                placeholder="Type to search..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.searchClearButton}>
                  <Feather name="x" size={isMobile ? 14 : 16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {searchQuery && (
              <View style={[styles.searchStats, isMobile && styles.searchStatsMobile]}>
                <Text style={[styles.resultsCount, isMobile && styles.resultsCountMobile]}>
                  Found <Text style={styles.resultsHighlight}>{searchResults.length}</Text> {isMobile ? '' : 'results'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.searchResultsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0ea5e9" />
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={renderSearchResultItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  searchQuery ? (
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="search" size={isMobile ? 24 : 32} color="#cbd5e1" />
                      </View>
                      <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>No matches</Text>
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        Try different keywords
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.emptyState, isMobile && styles.emptyStateMobile]}>
                      <View style={[styles.emptyStateIcon, isMobile && styles.emptyStateIconMobile]}>
                        <Feather name="search" size={isMobile ? 24 : 32} color="#cbd5e1" />
                      </View>
                      <Text style={[styles.emptyStateTitle, isMobile && styles.emptyStateTitleMobile]}>Start searching</Text>
                      <Text style={[styles.emptyStateText, isMobile && styles.emptyStateTextMobile]}>
                        Type to find events
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
      {renderForm(showEditForm)}

      {Platform.OS === 'web' ? (
        <Modal
          visible={isDatePickerVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setDatePickerVisibility(false)}
        >
          <View style={styles.modernModalOverlay}>
            <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile, { maxWidth: 400 }]}>
              <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
                <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                  <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                    <Feather name="calendar" size={isMobile ? 16 : 20} color="#0ea5e9" />
                  </View>
                  <View style={styles.modernModalTitleContainer}>
                    <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>
                      Select Date & Time
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setDatePickerVisibility(false)}
                  style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}
                >
                  <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <View style={[styles.modernModalContent, isMobile && styles.modernModalContentMobile]}>
                <input
                  type="datetime-local"
                  value={formatDateForWebInput(newEvent.date)}
                  onChange={handleWebDateChange}
                  min={formatDateForWebInput(new Date())}
                  step="900"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    borderRadius: '12px',
                    border: `1px solid ${colors.border}`,
                    marginBottom: '12px',
                    backgroundColor: isDark ? colors.card : '#f8fafc',
                    color: colors.text,
                    fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <Text style={{
                  fontSize: 12,
                  color: colors.sidebar.text.muted,
                  marginBottom: 20,
                  textAlign: 'center' as const
                }}>
                  Format: YYYY-MM-DD HH:MM (24-hour)
                </Text>

                <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
                  <TouchableOpacity
                    style={[styles.modernSubmitButton, isMobile && styles.modernSubmitButtonMobile]}
                    onPress={() => setDatePickerVisibility(false)}
                  >
                    <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="datetime"
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisibility(false)}
          minimumDate={new Date()}
          date={newEvent.date}
        />
      )}

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile]}>
            <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
              <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                  <Feather name="map-pin" size={isMobile ? 16 : 20} color="#0ea5e9" />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>
                    Location Details
                  </Text>
                  <Text style={[styles.modernModalSubtitle, isMobile && styles.modernModalSubtitleMobile]}>
                    Enter event location
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowLocationPicker(false)}
                style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}
              >
                <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.modernModalContent, isMobile && styles.modernModalContentMobile]}
              showsVerticalScrollIndicator={false}>
              {/* Location Name */}
              <View style={styles.modernFormGroup}>
                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Location Name</Text>
                <FormTextInput
                  inputStyle={styles.modernFormInput}
                  placeholder="e.g., Main Hall, Room 101"
                  value={newEvent.location}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, location: text }))}
                />
              </View>

              {/* Location Description */}
              <View style={styles.modernFormGroup}>
                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Location Description (Optional)</Text>
                <FormTextInput
                  inputStyle={styles.modernFormInput}
                  placeholder="Describe the venue..."
                  value={newEvent.locationDescription}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, locationDescription: text }))}
                  style={[styles.modernTextArea, isMobile && styles.modernFormInputMobile]}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Image Selection */}
              <View style={styles.modernFormGroup}>
                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Location Image</Text>
                <TouchableOpacity
                  style={[styles.modernLocationButton, { paddingVertical: 12, paddingHorizontal: 16 }]}
                  onPress={() => {
                    setShowLocationPicker(false);
                    setTimeout(() => setShowImagePicker(true), 100);
                  }}
                >
                  <View style={styles.modernLocationButtonText}>
                    <Text style={styles.modernLocationButtonTitle}>
                      {selectedCampusLocation ? selectedCampusLocation.name : 'Choose Campus Location'}
                    </Text>
                    <Text style={styles.modernLocationButtonSubtitle}>
                      {selectedCampusLocation ? 'Tap to change' : 'Select from campus locations'}
                    </Text>
                  </View>
                </TouchableOpacity>
                {selectedCampusLocation && (
                  <Image
                    source={selectedCampusLocation.image}
                    style={[styles.selectedImagePreview, { marginTop: 8, alignSelf: 'center' }]}
                  />
                )}
              </View>

              {/* Save Button */}
              <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
                <TouchableOpacity
                  style={[
                    styles.modernSubmitButton,
                    !newEvent.location && styles.modernSubmitButtonDisabled,
                    isMobile && styles.modernSubmitButtonMobile
                  ]}
                  onPress={handleLocationSelect}
                  disabled={!newEvent.location}
                >
                  <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>
                    Save Location
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={showImagePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePicker(false)}
      >
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile, { maxHeight: 500 }]}>
            <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
              <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                  <Feather name="image" size={isMobile ? 16 : 20} color="#0ea5e9" />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>
                    Choose Campus Location
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowImagePicker(false)}
                style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}
              >
                <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CAMPUS_LOCATIONS}
              showsVerticalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: '#f8fafc',
                    borderRadius: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: selectedCampusLocation?.id === item.id ? '#0ea5e9' : '#e2e8f0',
                  }}
                  onPress={() => handleSelectCampusImage(item)}

                >
                  <Image source={item.image} style={{ width: 50, height: 50, borderRadius: 8, marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{item.name}</Text>
                    {item.description && (
                      <Text style={{ fontSize: 11, color: '#64748b' }}>{item.description}</Text>
                    )}
                  </View>
                  {selectedCampusLocation?.id === item.id && (
                    <Feather name="check-circle" size={20} color="#0ea5e9" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Coordinates Modal */}
      <Modal
        visible={showCoordinatesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCoordinatesModal(false)}
      >
        <View style={styles.modernModalOverlay}>
          <View style={[styles.modernModalContainer, isMobile && styles.modernModalContainerMobile]}>
            <View style={[styles.modernModalHeader, isMobile && styles.modernModalHeaderMobile]}>
              <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                  <Feather name="map" size={isMobile ? 16 : 20} color="#f59e0b" />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={[styles.modernModalTitle, isMobile && styles.modernModalTitleMobile]}>
                    Verification Location
                  </Text>
                  <Text style={[styles.modernModalSubtitle, isMobile && styles.modernModalSubtitleMobile]}>
                    Set coordinates for attendance verification
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowCoordinatesModal(false)}
                style={[styles.modernModalCloseButton, isMobile && styles.modernModalCloseButtonMobile]}
              >
                <Feather name="x" size={isMobile ? 18 : 20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={[styles.modernModalContent, isMobile && styles.modernModalContentMobile]}
              showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.modernLocationButton, isMobile && styles.modernFormInputMobile]}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                <Feather name="crosshair" size={20} color="#0ea5e9" />
                <View style={styles.modernLocationButtonText}>
                  <Text style={styles.modernLocationButtonTitle}>
                    {locationLoading ? 'Getting location...' : 'Get Current Location'}
                  </Text>
                  <Text style={styles.modernLocationButtonSubtitle}>
                    Use device GPS to set coordinates
                  </Text>
                </View>
                {locationLoading && <ActivityIndicator size="small" color="#0ea5e9" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modernLocationButton}
                onPress={openWebMap}
              >
                <Feather name="globe" size={20} color="#10b981" />
                <View style={styles.modernLocationButtonText}>
                  <Text style={styles.modernLocationButtonTitle}>Open Google Maps</Text>
                  <Text style={styles.modernLocationButtonSubtitle}>
                    Find coordinates on the web
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.modernFormGroup}>
                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Latitude</Text>
                <FormTextInput
                  inputStyle={styles.modernFormInput}
                  placeholder="e.g., 14.599512"
                  value={eventCoordinates.latitude}
                  onChangeText={(text: string) => handleCoordinateChange('latitude', text)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modernFormGroup}>
                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Longitude</Text>
                <FormTextInput
                  inputStyle={styles.modernFormInput}
                  placeholder="e.g., 120.984219"
                  value={eventCoordinates.longitude}
                  onChangeText={(text: string) => handleCoordinateChange('longitude', text)}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modernFormGroup}>
                <Text style={[styles.modernFormLabel, isMobile && styles.modernFormLabelMobile]}>Verification Radius (meters)</Text>
                <FormTextInput
                  inputStyle={styles.modernFormInput}
                  placeholder="e.g., 100"
                  value={eventCoordinates.radius}
                  onChangeText={(text: string) => handleCoordinateChange('radius', text)}
                  keyboardType="numeric"
                />
                <Text style={styles.modernLocationButtonSubtitle}>
                  Recommended: 50-200 meters
                </Text>
              </View>

              <View style={[styles.modernFormActions, isMobile && styles.modernFormActionsMobile]}>
                <TouchableOpacity
                  style={[styles.modernSubmitButton, isMobile && styles.modernSubmitButtonMobile]}
                  onPress={saveCoordinates}
                >
                  <Text style={[styles.modernSubmitButtonText, isMobile && styles.modernSubmitButtonTextMobile]}>
                    Save Coordinates
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Glassmorphism Event Detail Modal */}
      <Modal
        visible={selectedEvent !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <TouchableOpacity
          style={styles.glassModalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedEvent(null)}
        >
          <TouchableOpacity
            style={[styles.glassModalContent, isMobile && styles.glassModalContentMobile]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.glassModalHeader}>
              <View style={[styles.modernModalHeaderLeft, isMobile && styles.modernModalHeaderLeftMobile]}>
                <View style={[styles.modernModalIconContainer, isMobile && styles.modernModalIconContainerMobile]}>
                  <Feather name="calendar" size={isMobile ? 16 : 20} color="#0ea5e9" />
                </View>
                <View style={styles.modernModalTitleContainer}>
                  <Text style={[styles.glassModalTitle, isMobile && styles.glassModalTitleMobile]}>
                    Event Details
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedEvent(null)}
                style={styles.glassModalClose}
              >
                <Feather name="x" size={isMobile ? 22 : 26} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={[styles.glassModalBody, isMobile && styles.glassModalBodyMobile]}
              showsVerticalScrollIndicator={false}
            >
              {selectedEvent && renderSelectedDetail(
                events.find(e => e.id === selectedEvent)!,
                selectedEventUserLocation,
                selectedEventIsWithinRange,
                checkingSelectedEventLocation,
                () => checkSelectedEventLocation(selectedEvent),
                openLocationInMaps
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}