import {
  Feather
} from '@expo/vector-icons';
import * as Location from 'expo-location';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { CAMPUS_LOCATIONS, CampusLocation } from '../../constants/campusLocations';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebaseConfig';

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
    style={[styles.input, style]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    multiline={multiline}
    numberOfLines={numberOfLines}
    keyboardType={keyboardType}
    {...props}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    marginBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'center',
  },
  mainContent: {
    padding: 16,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eventCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  eventImageContainer: {
    height: 120,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayBadge: {
    backgroundColor: '#dcfce7',
  },
  tomorrowBadge: {
    backgroundColor: '#dbeafe',
  },
  upcomingBadge: {
    backgroundColor: '#fef3c7',
  },
  pastBadge: {
    backgroundColor: '#f1f5f9',
  },
  eventBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  todayBadgeText: {
    color: '#16a34a',
  },
  tomorrowBadgeText: {
    color: '#2563eb',
  },
  upcomingBadgeText: {
    color: '#d97706',
  },
  pastBadgeText: {
    color: '#64748b',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 22,
  },
  eventMeta: {
    flex: 1,
  },
  eventLocation: {
    fontSize: 12,
    color: '#0ea5e9',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDate: {
    fontSize: 11,
    color: '#64748b',
  },
  editButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3b82f6',
  },
  eventDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 12,
    flex: 1,
  },
  verificationBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    marginTop: 8,
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendeeCount: {
    fontSize: 11,
    color: '#64748b',
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizer: {
    fontSize: 11,
    color: '#64748b',
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2626',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 300,
  },
  emptyStateButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalBackText: {
    fontSize: 14,
    color: '#0ea5e9',
    fontWeight: '600',
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginLeft: -80,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  locationPickerButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
  },
  locationPickerText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationPickerSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
  formActions: {
    marginTop: 24,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  locationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  locationOptionImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  locationOptionText: {
    flex: 1,
  },
  locationOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  locationOptionDescription: {
    fontSize: 12,
    color: '#64748b',
  },
  locationsList: {
    maxHeight: 400,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  mapPickerButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapPickerButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonTextContainer: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  secondaryLocationButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryButtonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  coordinatesDisplay: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintContainer: {
    marginTop: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#94a3b8',
  },
  coordinatesActions: {
    marginTop: 24,
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  loadingSpinner: {
    marginLeft: 12,
  },
  imageUploadButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  imageUploadText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 4,
  },
  imagePickerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  selectedImagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 12,
  },
  locationDescription: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default function MainAdminEvents() {
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 375;

  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  const handleSelectCampusImage = (location: CampusLocation) => {
    setSelectedCampusLocation(location);
    setSelectedLocationImage(location.image);
    setShowImagePicker(false);

    if (!newEvent.location) {
      setNewEvent(prev => ({ ...prev, location: location.name }));
    }
    setTimeout(() => setShowLocationPicker(true), 100);
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLocationLoading(false);
        Alert.alert(
          'Permission Required',
          'Location permission is needed to automatically detect your location. You can enter coordinates manually instead.',
          [{ text: 'OK' }]
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

      Alert.alert(
        'Location Found',
        `Coordinates set to:\nLat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );

    } catch (error: unknown) {
      setLocationLoading(false);
      console.error('Error getting location:', error);

      let errorMessage = 'Failed to get current location. Please try again or enter coordinates manually.';
      
      setLocationError(errorMessage);
      Alert.alert('Location Error', errorMessage);
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

    Alert.alert(
      'Google Maps Opened',
      'Find your event location on Google Maps, then long-press to get coordinates. Come back here to enter them manually.',
      [{ text: 'OK' }]
    );
  };

  const saveCoordinates = () => {
    const lat = eventCoordinates.latitude.trim();
    const lng = eventCoordinates.longitude.trim();
    const radius = eventCoordinates.radius.trim();

    if (!lat || !lng || !radius) {
      Alert.alert('Missing Information', 'Please fill in all coordinates and radius fields.');
      return;
    }

    if (!validateCoordinates(lat, lng)) {
      Alert.alert(
        'Invalid Coordinates',
        'Please enter valid decimal coordinates.\n\n• Latitude: -90 to 90\n• Longitude: -180 to 180\n• Example: 14.599512, 120.984219'
      );
      return;
    }
    if (!validateRadius(radius)) {
      Alert.alert('Invalid Radius', 'Please enter a valid positive number for the verification radius (e.g., 100).');
      return;
    }

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      radius: parseInt(radius)
    };

    setNewEvent(prev => ({ ...prev, coordinates }));
    setShowCoordinatesModal(false);
    Alert.alert('Success', 'Location verification coordinates saved!');
  };

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
            coordinates: data.coordinates
          });
        });
        setEvents(eventsData);
        filterEvents(eventsData, activeFilter);

        setLoading(false);
        setRefreshing(false);
      },
      (error: unknown) => {
        console.error('Error fetching events:', error);
        Alert.alert('Error', 'Failed to load events');
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filterEvents = (eventsList: Event[], filter: 'all' | 'upcoming' | 'past') => {
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        setFilteredEvents(eventsList.filter(event => event.date > now));
        break;
      case 'past':
        setFilteredEvents(eventsList.filter(event => event.date <= now));
        break;
      default:
        setFilteredEvents(eventsList);
    }
  };

  const handleFilterChange = (filter: 'all' | 'upcoming' | 'past') => {
    setActiveFilter(filter);
    filterEvents(events, filter);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title?.trim() || !newEvent.description?.trim() || !newEvent.location?.trim()) {
      Alert.alert('Error', 'Please fill in all required fields: Title, Description, and Location');
      return;
    }

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
      Alert.alert('Success', 'Event created successfully!');

    } catch (error: unknown) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEvent.title || !newEvent.description || !newEvent.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

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
      Alert.alert('Success', 'Event updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Error setting up edit form:', error);
      Alert.alert('Error', 'Failed to load event for editing');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(`Are you sure you want to delete "${eventTitle}"?`);

      if (isConfirmed) {
        try {
          const eventRef = doc(db, 'events', eventId);
          await deleteDoc(eventRef);
          window.alert(`"${eventTitle}" deleted successfully!`);
        } catch (error: unknown) {
          console.error('Error deleting event:', error);
          window.alert('Failed to delete event. Please check console for details.');
        }
      }
    } else {
      Alert.alert(
        'Delete Event',
        `Are you sure you want to delete "${eventTitle}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const eventRef = doc(db, 'events', eventId);
                await deleteDoc(eventRef);
                Alert.alert('Success', `"${eventTitle}" deleted successfully!`);
              } catch (error: unknown) {
                console.error('Error deleting event:', error);
                Alert.alert('Error', 'Failed to delete event');
              }
            },
          },
        ]
      );
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
      Alert.alert('Error', 'Please enter a location name');
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

  const getDaysUntilEvent = (eventDate: Date) => {
    const today = new Date();
    const timeDiff = eventDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff === 0) return { text: 'TODAY', type: 'today' };
    if (daysDiff === 1) return { text: 'TOMORROW', type: 'tomorrow' };
    if (daysDiff > 1) return { text: `IN ${daysDiff} DAYS`, type: 'upcoming' };
    if (daysDiff === -1) return { text: 'YESTERDAY', type: 'past' };
    return { text: 'PAST EVENT', type: 'past' };
  };

  const getEventBadgeStyle = (type: string) => {
    switch (type) {
      case 'today': return [styles.eventBadge, styles.todayBadge];
      case 'tomorrow': return [styles.eventBadge, styles.tomorrowBadge];
      case 'upcoming': return [styles.eventBadge, styles.upcomingBadge];
      case 'past': return [styles.eventBadge, styles.pastBadge];
      default: return [styles.eventBadge, styles.pastBadge];
    }
  };

  const getEventBadgeTextStyle = (type: string) => {
    switch (type) {
      case 'today': return [styles.eventBadgeText, styles.todayBadgeText];
      case 'tomorrow': return [styles.eventBadgeText, styles.tomorrowBadgeText];
      case 'upcoming': return [styles.eventBadgeText, styles.upcomingBadgeText];
      case 'past': return [styles.eventBadgeText, styles.pastBadgeText];
      default: return [styles.eventBadgeText, styles.pastBadgeText];
    }
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const daysUntil = getDaysUntilEvent(item.date);

    return (
      <View style={styles.eventCard}>
        <View style={styles.eventImageContainer}>
          <Image
            source={getLocationImage(item)}
            style={styles.eventImage}
            resizeMode="cover"
          />
          <View style={getEventBadgeStyle(daysUntil.type)}>
            <Text style={getEventBadgeTextStyle(daysUntil.type)}>
              {daysUntil.text}
            </Text>
          </View>
        </View>

        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={styles.eventMeta}>
              <View style={styles.eventLocation}>
                <Feather name="map-pin" size={12} color="#0ea5e9" />
                <Text style={{ marginLeft: 4 }}>{item.location}</Text>
              </View>
              <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => handleEditEvent(item)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>

          {item.locationDescription && (
            <View style={styles.locationDescription}>
              <Feather name="info" size={10} color="#64748b" />
              <Text style={{ marginLeft: 4 }}>{item.locationDescription}</Text>
            </View>
          )}

          {item.coordinates && (
            <View style={styles.verificationBadge}>
              <Feather name="shield" size={10} color="#16a34a" />
              <Text style={styles.verificationBadgeText}>Location Verification</Text>
            </View>
          )}

          <View style={styles.eventFooter}>
            <View style={styles.eventStats}>
              <View style={styles.organizer}>
                <Feather name="user" size={10} color="#64748b" />
                <Text style={{ marginLeft: 4 }}>{item.organizer}</Text>
              </View>
              <View style={styles.attendeeCount}>
                <Feather name="users" size={10} color="#64748b" />
                <Text style={{ marginLeft: 4 }}>{item.attendees?.length || 0}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteEvent(item.id, item.title)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderForm = (isEdit: boolean = false) => (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <View style={styles.modalHeaderTop}>
          <TouchableOpacity onPress={handleCloseForm} style={styles.modalBackButton}>
            <Feather name="arrow-left" size={20} color="#0ea5e9" />
            <Text style={styles.modalBackText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </Text>
        </View>
        <Text style={styles.modalSubtitle}>
          {isEdit ? 'Update the event details' : 'Fill in the event details'}
        </Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              placeholder="Enter event title"
              value={newEvent.title}
              onChangeText={(text: string) => setNewEvent({ ...newEvent, title: text })}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your event in detail..."
              value={newEvent.description}
              onChangeText={(text: string) => setNewEvent({ ...newEvent, description: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Date & Time *</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={showDatePickerModal}
            >
              <Text style={styles.datePickerText}>{formatDate(newEvent.date)}</Text>
              <Feather name="calendar" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Location *</Text>
            <TouchableOpacity
              style={styles.locationPickerButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <Text style={styles.locationPickerText}>
                {newEvent.location ? newEvent.location : 'Set location details'}
              </Text>
              <Text style={styles.locationPickerSubtext}>
                {newEvent.location ? 'Tap to modify location' : 'Tap to set location'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.location.trim()) && styles.submitButtonDisabled
              ]}
              onPress={isEdit ? handleUpdateEvent : handleCreateEvent}
              disabled={!newEvent.title.trim() || !newEvent.description.trim() || !newEvent.location.trim()}
            >
              <Feather 
                name={isEdit ? "save" : "check-circle"} 
                size={18} 
                color="#ffffff" 
              />
              <Text style={styles.submitButtonText}>
                {isEdit ? 'Update Event' : 'Create Event'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCloseForm}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Events Management</Text>
          <Text style={styles.headerSubtitle}>Create, manage, and monitor campus events</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{events.length}</Text>
            <Text style={styles.statLabel}>Total Events</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {events.filter(event => event.date > new Date()).length}
            </Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {events.filter(event => event.date <= new Date()).length}
            </Text>
            <Text style={styles.statLabel}>Past</Text>
          </View>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('all')}
            >
              <Feather name="grid" size={14} color={activeFilter === 'all' ? '#ffffff' : '#64748b'} />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'all' && styles.filterButtonTextActive
              ]}>
                All Events
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'upcoming' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('upcoming')}
            >
              <Feather name="calendar" size={14} color={activeFilter === 'upcoming' ? '#ffffff' : '#64748b'} />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'upcoming' && styles.filterButtonTextActive
              ]}>
                Upcoming
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'past' && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange('past')}
            >
              <Feather name="clock" size={14} color={activeFilter === 'past' ? '#ffffff' : '#64748b'} />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'past' && styles.filterButtonTextActive
              ]}>
                Past
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateForm(true)}
          >
            <Feather name="plus" size={16} color="#ffffff" />
            <Text style={styles.createButtonText}>Create Event</Text>
          </TouchableOpacity>
        </View>

        {/* Events Grid */}
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Feather name="calendar" size={36} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyStateTitle}>
                {activeFilter === 'all' ? 'No events scheduled' :
                  activeFilter === 'upcoming' ? 'No upcoming events' : 'No past events'}
              </Text>
              <Text style={styles.emptyStateText}>
                {activeFilter === 'all' ? 'Create your first event to get started' :
                  activeFilter === 'upcoming' ? 'All caught up! No upcoming events' : 'No past events to display'}
              </Text>
              {activeFilter !== 'past' && (
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => setShowCreateForm(true)}
                >
                  <Feather name="plus" size={16} color="#ffffff" />
                  <Text style={styles.emptyStateButtonText}>Create Event</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateForm || showEditForm}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {renderForm(showEditForm)}
      </Modal>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
        minimumDate={new Date()}
        date={newEvent.date}
      />

      {/* Location Picker Modal - Simplified version */}
      <Modal
        visible={showLocationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            <View style={styles.locationModalHeader}>
              <Text style={styles.modalTitle}>Location Details</Text>
              <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
                <Feather name="x" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              {/* Simplified location picker content */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location Name</Text>
                <TextInput
                  placeholder="e.g., Main Campus, Expansion, etc."
                  value={newEvent.location}
                  onChangeText={(text: string) => setNewEvent(prev => ({ ...prev, location: text }))}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Location Description (Optional)</Text>
                <TextInput
                  placeholder="Describe the venue, facilities, or special features..."
                  value={newEvent.locationDescription}
                  onChangeText={(text: string) => setNewEvent(prev => ({ ...prev, locationDescription: text }))}
                  style={styles.textArea}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !newEvent.location && styles.submitButtonDisabled
                ]}
                onPress={handleLocationSelect}
                disabled={!newEvent.location}
              >
                <Text style={styles.submitButtonText}>
                  {newEvent.location ? 'Save Location' : 'Enter Location Name'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Other modals can be implemented similarly */}
    </View>
  );
}