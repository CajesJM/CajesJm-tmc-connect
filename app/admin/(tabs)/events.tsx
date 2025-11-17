import * as Location from 'expo-location';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAMPUS_LOCATIONS, CampusLocation } from '../../../constants/campusLocations';
import { db } from '../../../lib/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/adminEvents';

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

export default function EventsScreen() {
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth < 768;

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
  const [error, setError] = useState<string | null>(null);
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
      console.log('Requesting location permission...');
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

      console.log('Getting current position...');

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), 10000);
      });

      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;

      const { latitude, longitude } = location.coords;

      console.log('Location found:', latitude, longitude);

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

      let errorMessage = 'Failed to get current location. ';

      if (error instanceof Error) {
        if (error.message === 'LOCATION_TIMEOUT') {
          errorMessage = 'Location detection timed out after 10 seconds. Please try again or enter coordinates manually.';
        } else {
          const locationError = error as any;
          if (locationError.code === 'CANCELLED') {
            errorMessage += 'Location request was cancelled.';
          } else if (locationError.code === 'UNAVAILABLE') {
            errorMessage += 'Location services are not available.';
          } else {
            errorMessage += error.message;
          }
        }
      } else {
        errorMessage += 'Please try again or enter coordinates manually.';
      }

      setLocationError(errorMessage);
      Alert.alert('Location Error', errorMessage);
    }
  };

  const validateCoordinates = (latitude: string, longitude: string): boolean => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    console.log('Validating coordinates:', { lat, lng, latitude, longitude });

    if (isNaN(lat) || isNaN(lng)) {
      console.log('Coordinates are NaN');
      return false;
    }
    if (lat < -90 || lat > 90) {
      console.log('Latitude out of range:', lat);
      return false;
    }
    if (lng < -180 || lng > 180) {
      console.log('Longitude out of range:', lng);
      return false;
    }

    console.log('Coordinates are valid');
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
    }

    else if (field === 'radius') {
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

    console.log('Saving coordinates:', { lat, lng, radius });

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

    console.log('Coordinates saved successfully:', coordinates);

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
  }, [user]);

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
    console.log('CREATE EVENT BUTTON CLICKED');

    if (!newEvent.title?.trim() || !newEvent.description?.trim() || !newEvent.location?.trim()) {
      console.log('VALIDATION FAILED');
      Alert.alert('Error', 'Please fill in all required fields: Title, Description, and Location');
      return;
    }

    console.log('VALIDATION PASSED - Proceeding with event creation');

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

      console.log('Creating event in Firestore...');
      const docRef = await addDoc(collection(db, 'events'), eventData);

      console.log('Event created successfully with ID:', docRef.id);
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
      console.log('Editing event:', event.id);

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
    console.log('DELETE BUTTON CLICKED');
    console.log('Event ID:', eventId);
    console.log('Event Title:', eventTitle);

    if (Platform.OS === 'web') {
      const isConfirmed = window.confirm(`Are you sure you want to delete "${eventTitle}"?`);
      console.log('Web confirmation result:', isConfirmed);

      if (isConfirmed) {
        try {
          console.log('Starting delete operation on web...');
          const eventRef = doc(db, 'events', eventId);
          await deleteDoc(eventRef);
          console.log('Event deleted successfully from Firebase');
          window.alert(`"${eventTitle}" deleted successfully!`);
        } catch (error: unknown) {
          console.error('Error deleting event:', error);
          window.alert('Failed to delete event. Please check console for details.');
        }
      } else {
        console.log('Delete cancelled by user');
      }
    } else {
      Alert.alert(
        'Delete Event',
        `Are you sure you want to delete "${eventTitle}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Delete cancelled by user')
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('Starting delete operation on mobile...');
                const eventRef = doc(db, 'events', eventId);
                await deleteDoc(eventRef);
                console.log('Event deleted successfully from Firebase');
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
      console.log('Location saved:', newEvent.location);
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Tomorrow';
    if (daysDiff > 1) return `In ${daysDiff} days`;
    if (daysDiff === -1) return 'Yesterday';
    return 'Past event';
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Something went wrong: {error}</Text>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => setError(null)}
        >
          <Text style={styles.submitButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderEventItem = ({ item }: { item: Event }) => {
    const daysUntil = getDaysUntilEvent(item.date);

    return (
      <View style={[
        styles.eventCard,
        isSmallScreen && styles.eventCardSmall
      ]}>
        <View style={styles.eventImageContainer}>
          <Image
            source={getLocationImage(item)}
            style={[
              styles.eventImage,
              isSmallScreen && styles.eventImageSmall
            ]}
            resizeMode="cover"
          />
          <View style={[
            styles.eventBadge,
            daysUntil === 'Today' && styles.todayBadge,
            daysUntil === 'Tomorrow' && styles.tomorrowBadge,
            (typeof daysUntil === 'string' && daysUntil.includes('days')) && styles.upcomingBadge,
            daysUntil === 'Past event' && styles.pastBadge,
            isSmallScreen && styles.eventBadgeSmall
          ]}>
            <Text style={[
              styles.eventBadgeText,
              isSmallScreen && styles.eventBadgeTextSmall
            ]}>{daysUntil}</Text>
          </View>
        </View>

        <View style={[
          styles.eventContent,
          isSmallScreen && styles.eventContentSmall
        ]}>
          <View style={styles.eventHeader}>
            <View style={styles.eventMeta}>
              <Text style={[
                styles.eventLocation,
                isSmallScreen && styles.eventLocationSmall
              ]}><Icon name="map-marker" size={16} color="#1e6dffff" /> {item.location}</Text>
              <Text style={[
                styles.eventDate,
                isSmallScreen && styles.eventDateSmall
              ]}>{formatDate(item.date)}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.editButton,
                isSmallScreen && styles.editButtonSmall
              ]}
              onPress={() => handleEditEvent(item)}
            >
              <Text style={[
                styles.editButtonText,
                isSmallScreen && styles.editButtonTextSmall
              ]}>Edit</Text>
            </TouchableOpacity>
          </View>

          <Text style={[
            styles.eventTitle,
            isSmallScreen && styles.eventTitleSmall
          ]}>{item.title}</Text>
          <Text style={[
            styles.eventDescription,
            isSmallScreen && styles.eventDescriptionSmall
          ]}>{item.description}</Text>

          {item.locationDescription && (
            <Text style={[
              styles.locationDescription,
              isSmallScreen && styles.locationDescriptionSmall
            ]}>
              <Icon name="office-building" size={16} color="#666" />  {item.locationDescription}
            </Text>
          )}

          {item.coordinates && (
            <View style={styles.verificationBadge}>
              <Text style={styles.verificationBadgeText}>
                <Icon name="map-marker-check" size={12} color="#10B981" /> Location Verification
              </Text>
            </View>
          )}

          <View style={styles.eventStats}>
            <Text style={[
              styles.eventOrganizer,
              isSmallScreen && styles.eventOrganizerSmall
            ]}>👤 {item.organizer}</Text>
            <Text style={[
              styles.attendeeCount,
              isSmallScreen && styles.attendeeCountSmall
            ]}>
              👥 {item.attendees?.length || 0} attending
            </Text>
          </View>

          <View style={styles.eventFooter}>
            <TouchableOpacity
              style={[
                styles.deleteButton,
                isSmallScreen && styles.deleteButtonSmall
              ]}
              onPress={() => handleDeleteEvent(item.id, item.title)}
            >
              <Text style={[
                styles.deleteButtonText,
                isSmallScreen && styles.deleteButtonTextSmall
              ]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderForm = (isEdit: boolean = false) => (
    <View style={styles.fullPageModalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={handleCloseForm} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{isEdit ? 'Edit Event' : 'Create New Event'}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.fullPageScrollView}
          contentContainerStyle={styles.fullPageFormContent}
        >
          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Event Title</Text>
            <TextInput
              placeholder="Enter event title"
              value={newEvent.title}
              onChangeText={(text: string) => setNewEvent({ ...newEvent, title: text })}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Event Description</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your event in detail..."
              value={newEvent.description}
              onChangeText={(text: string) => setNewEvent({ ...newEvent, description: text })}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Date & Time</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={showDatePickerModal}
            >
              <Text style={styles.datePickerText}>{formatDate(newEvent.date)}</Text>
              <Text style={styles.datePickerLabel}>Tap to select date & time</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Location Details</Text>
            <TouchableOpacity
              style={styles.locationPickerButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <Text style={styles.locationPickerText}>
                {newEvent.location ? newEvent.location : 'Set location details'}
              </Text>
              <Text style={styles.locationPickerLabel}>
                {newEvent.location ? 'Tap to modify location' : 'Tap to set location'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!newEvent.title || !newEvent.description || !newEvent.location) && styles.submitButtonDisabled
              ]}
              onPress={isEdit ? handleUpdateEvent : handleCreateEvent}
              disabled={loading || !newEvent.title || !newEvent.description || !newEvent.location}
            >
              <Text style={styles.submitButtonText}>
                {loading ? (isEdit ? '🔄 Updating...' : '🔄 Creating...') : (isEdit ? 'Update Event' : 'Create Event')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleCloseForm}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Loading events dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={[
        styles.dashboardHeader,
        isSmallScreen && styles.dashboardHeaderSmall
      ]}>
        <View style={styles.headerContent}>
          <Text style={[
            styles.title,
            isSmallScreen && styles.titleSmall
          ]}>Events</Text>
          <Text style={[
            styles.subtitle,
            isSmallScreen && styles.subtitleSmall
          ]}>Manage and monitor campus events</Text>
        </View>
        <View style={[
          styles.headerStats,
          isSmallScreen && styles.headerStatsSmall
        ]}>
          <View style={[
            styles.statCard,
            isSmallScreen && styles.statCardSmall
          ]}>
            <Text style={[
              styles.statNumber,
              isSmallScreen && styles.statNumberSmall
            ]}>{events.length}</Text>
            <Text style={[
              styles.statLabel,
              isSmallScreen && styles.statLabelSmall
            ]}>Total Events</Text>
          </View>
          <View style={[
            styles.statCard,
            isSmallScreen && styles.statCardSmall
          ]}>
            <Text style={[
              styles.statNumber,
              isSmallScreen && styles.statNumberSmall
            ]}>
              {events.filter(event => event.date > new Date()).length}
            </Text>
            <Text style={[
              styles.statLabel,
              isSmallScreen && styles.statLabelSmall
            ]}>Upcoming</Text>
          </View>
          <View style={[
            styles.statCard,
            isSmallScreen && styles.statCardSmall
          ]}>
            <Text style={[
              styles.statNumber,
              isSmallScreen && styles.statNumberSmall
            ]}>
              {events.filter(event => event.date <= new Date()).length}
            </Text>
            <Text style={[
              styles.statLabel,
              isSmallScreen && styles.statLabelSmall
            ]}>Past</Text>
          </View>
        </View>
      </View>

      <View style={[
        styles.headerActions,
        isSmallScreen && styles.headerActionsSmall
      ]}>

        {isSmallScreen ? (
          <>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  activeFilter === 'all' && styles.filterButtonActive
                ]}
                onPress={() => handleFilterChange('all')}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === 'all' && styles.filterButtonTextActive
                ]}>All Events</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  activeFilter === 'upcoming' && styles.filterButtonActive
                ]}
                onPress={() => handleFilterChange('upcoming')}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === 'upcoming' && styles.filterButtonTextActive
                ]}>Upcoming</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  activeFilter === 'past' && styles.filterButtonActive
                ]}
                onPress={() => handleFilterChange('past')}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === 'past' && styles.filterButtonTextActive
                ]}>Past Events</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.createButton,
                isSmallScreen && styles.createButtonSmall
              ]}
              onPress={() => setShowCreateForm(true)}
            >
              <Text style={[
                styles.createButtonText,
                isSmallScreen && styles.createButtonTextSmall
              ]}>+ Create Event</Text>
            </TouchableOpacity>
          </>
        ) : (

          <>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  activeFilter === 'all' && styles.filterButtonActive
                ]}
                onPress={() => handleFilterChange('all')}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === 'all' && styles.filterButtonTextActive
                ]}>All Events</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  activeFilter === 'upcoming' && styles.filterButtonActive
                ]}
                onPress={() => handleFilterChange('upcoming')}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === 'upcoming' && styles.filterButtonTextActive
                ]}>Upcoming</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterButton,
                  activeFilter === 'past' && styles.filterButtonActive
                ]}
                onPress={() => handleFilterChange('past')}
              >
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === 'past' && styles.filterButtonTextActive
                ]}>Past Events</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Text style={styles.createButtonText}>+ Create Event</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal visible={showCreateForm} animationType="slide" presentationStyle="fullScreen">
        {renderForm(false)}
      </Modal>

      <Modal visible={showEditForm} animationType="slide" presentationStyle="fullScreen">
        {renderForm(true)}
      </Modal>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
        minimumDate={new Date()}
        date={newEvent.date}
      />
      <Modal visible={showImagePicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Campus Location</Text>
            <TouchableOpacity onPress={() => setShowImagePicker(false)}>
              <Text style={styles.closeButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={CAMPUS_LOCATIONS}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.locationOption,
                  selectedCampusLocation?.id === item.id && styles.locationOptionSelected
                ]}
                onPress={() => handleSelectCampusImage(item)}
              >
                <Image source={item.image} style={styles.locationOptionImage} />
                <View style={styles.locationOptionText}>
                  <Text style={styles.locationOptionName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.locationOptionDescription}>{item.description}</Text>
                  )}
                </View>
                {selectedCampusLocation?.id === item.id && (
                  <Icon name="check-circle" size={24} color="#1e6dffff" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.locationsList}
          />
        </View>
      </Modal>

      <Modal visible={showLocationPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Location Details</Text>
            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.locationsList} contentContainerStyle={styles.customLocationContainer}>
            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Location Name</Text>
              <TextInput
                placeholder="e.g., Main Campus, Expansion, etc."
                value={newEvent.location}
                onChangeText={(text: string) => setNewEvent(prev => ({ ...prev, location: text }))}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Location Description (Optional)</Text>
              <TextInput
                placeholder="Describe the venue, facilities, or special features..."
                value={newEvent.locationDescription}
                onChangeText={(text: string) => setNewEvent(prev => ({ ...prev, locationDescription: text }))}
                style={styles.textArea}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Location Image</Text>
              <TouchableOpacity
                style={styles.imageUploadButton}
                onPress={() => {
                  setShowLocationPicker(false);
                  setTimeout(() => setShowImagePicker(true), 100);
                }}
              >
                <Text style={styles.imageUploadText}>
                  {selectedCampusLocation ? `${selectedCampusLocation.name}` : 'Choose Campus Location'}
                </Text>
                <Text style={styles.imagePickerSubtitle}>
                  {selectedCampusLocation ? 'Tap to change' : 'Select from campus locations'}
                </Text>
              </TouchableOpacity>
              {selectedCampusLocation && (
                <Image source={selectedCampusLocation.image} style={styles.selectedImagePreview} />
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Location Verification</Text>
              <TouchableOpacity
                style={styles.coordinatesButton}
                onPress={() => setShowCoordinatesModal(true)}
              >
                <View style={styles.coordinatesButtonContent}>
                  <Icon name="map-marker-radius" size={20} color="#1e6dffff" />
                  <View style={styles.coordinatesButtonText}>
                    <Text style={styles.coordinatesButtonTitle}>
                      {newEvent.coordinates ? 'Location Verification Enabled' : 'Set Location Verification'}
                    </Text>
                    <Text style={styles.coordinatesButtonSubtitle}>
                      {newEvent.coordinates
                        ? `Radius: ${newEvent.coordinates.radius}m • Required for attendance`
                        : 'Require students to be at venue to mark attendance'
                      }
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color="#666" />
                </View>
              </TouchableOpacity>
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
      </Modal>

      <Modal visible={showCoordinatesModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Location Verification</Text>
            <TouchableOpacity onPress={() => setShowCoordinatesModal(false)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.locationsList} contentContainerStyle={styles.customLocationContainer}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                Set coordinates for location verification. Students must be within the specified radius to mark attendance.
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Select Location Method</Text>

              <TouchableOpacity
                style={[
                  styles.mapPickerButton,
                  locationLoading && styles.mapPickerButtonDisabled
                ]}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                <View style={styles.buttonContent}>
                  {locationLoading ? (
                    <ActivityIndicator size="small" color="#1e6dffff" />
                  ) : (
                    <Icon name="crosshairs-gps" size={24} color="#1e6dffff" />
                  )}
                  <View style={styles.buttonTextContainer}>
                    <Text style={styles.buttonTitle}>
                      {locationLoading ? 'Searching for Location...' : 'Use Current Location'}
                    </Text>
                    <Text style={styles.buttonSubtitle}>
                      {locationLoading ? 'Please wait while we detect your position' : 'Automatically detect your current position'}
                    </Text>
                  </View>
                </View>
                {locationLoading && (
                  <ActivityIndicator size="small" color="#1e6dffff" style={styles.loadingSpinner} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryLocationButton}
                onPress={() => setShowManualCoordinates(true)}
              >
                <View style={styles.buttonContent}>
                  <Icon name="keyboard-outline" size={20} color="#666" />
                  <Text style={styles.secondaryButtonTitle}>Enter Coordinates Manually</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryLocationButton}
                onPress={openWebMap}
              >
                <View style={styles.buttonContent}>
                  <Icon name="map" size={20} color="#666" />
                  <Text style={styles.secondaryButtonTitle}>
                    {Platform.OS === 'web' ? 'Open Google Maps' : 'Find on Google Maps'}
                  </Text>
                </View>
              </TouchableOpacity>

              {(eventCoordinates.latitude || eventCoordinates.longitude) && (
                <View style={styles.coordinatesDisplay}>
                  <Text style={styles.coordinatesText}>
                    <Icon name="map-marker-radius" size={20} color="#1e6dffff" /> Latitude: {eventCoordinates.latitude || 'Not set'}
                  </Text>
                  <Text style={styles.coordinatesText}>
                    <Icon name="map-marker-radius" size={20} color="#1e6dffff" /> Longitude: {eventCoordinates.longitude || 'Not set'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Verification Radius (meters)</Text>
              <TextInput
                placeholder="e.g., 100"
                value={eventCoordinates.radius}
                onChangeText={(text: string) => handleCoordinateChange('radius', text)}
                keyboardType="numeric"
              />
              <View style={styles.hintContainer}>
                <Text style={styles.inputHint}>Students must be within this distance to verify attendance</Text>
              </View>
            </View>

            <View style={styles.coordinatesActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setEventCoordinates({ latitude: '', longitude: '', radius: '100' });
                  setNewEvent(prev => ({ ...prev, coordinates: undefined }));
                  setShowCoordinatesModal(false);
                  Alert.alert('Verification Disabled', 'Location verification has been disabled for this event.');
                }}
              >
                <Text style={styles.secondaryButtonText}>Disable Verification</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!eventCoordinates.latitude || !eventCoordinates.longitude || !eventCoordinates.radius) && styles.submitButtonDisabled
                ]}
                onPress={saveCoordinates}
                disabled={!eventCoordinates.latitude || !eventCoordinates.longitude || !eventCoordinates.radius}
              >
                <Text style={styles.submitButtonText}>Save Coordinates</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showManualCoordinates} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Enter Coordinates</Text>
            <TouchableOpacity onPress={() => setShowManualCoordinates(false)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.locationsList} contentContainerStyle={styles.customLocationContainer}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionDescription}>
                Enter the latitude and longitude coordinates for the event location in decimal format.
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Latitude</Text>
              <TextInput
                placeholder="e.g., 14.599512"
                value={eventCoordinates.latitude}
                onChangeText={(text: string) => handleCoordinateChange('latitude', text)}
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.hintContainer}>
                <Text style={styles.inputHint}>Decimal format only (-90 to 90)</Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionLabel}>Longitude</Text>
              <TextInput
                placeholder="e.g., 120.984219"
                value={eventCoordinates.longitude}
                onChangeText={(text: string) => handleCoordinateChange('longitude', text)}
                keyboardType="numbers-and-punctuation"
              />
              <View style={styles.hintContainer}>
                <Text style={styles.inputHint}>Decimal format only (-180 to 180)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!eventCoordinates.latitude || !eventCoordinates.longitude) && styles.submitButtonDisabled
              ]}
              onPress={() => {
                if (validateCoordinates(eventCoordinates.latitude, eventCoordinates.longitude)) {
                  setShowManualCoordinates(false);
                } else {
                  Alert.alert('Invalid Coordinates', 'Please enter valid decimal coordinates.\n\nLatitude: -90 to 90\nLongitude: -180 to 180');
                }
              }}
              disabled={!eventCoordinates.latitude || !eventCoordinates.longitude}
            >
              <Text style={styles.submitButtonText}>Save Coordinates</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          isSmallScreen && styles.listContentSmall
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} />
        }
        ListEmptyComponent={
          <View style={[
            styles.emptyState,
            isSmallScreen && styles.emptyStateSmall
          ]}>
            <Text style={[
              styles.emptyStateTitle,
              isSmallScreen && styles.emptyStateTitleSmall
            ]}>
              {activeFilter === 'all' ? 'No events scheduled' :
                activeFilter === 'upcoming' ? 'No upcoming events' : 'No past events'}
            </Text>
            <Text style={[
              styles.emptyStateText,
              isSmallScreen && styles.emptyStateTextSmall
            ]}>
              {activeFilter === 'all' ? 'Create your first event to get started' :
                activeFilter === 'upcoming' ? 'All caught up! No upcoming events' : 'No past events to display'}
            </Text>
            {activeFilter !== 'past' && (
              <TouchableOpacity
                style={[
                  styles.emptyStateButton,
                  isSmallScreen && styles.emptyStateButtonSmall
                ]}
                onPress={() => setShowCreateForm(true)}
              >
                <Text style={[
                  styles.emptyStateButtonText,
                  isSmallScreen && styles.emptyStateButtonTextSmall
                ]}>Create Your First Event</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}