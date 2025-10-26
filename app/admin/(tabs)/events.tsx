import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import SamplePhoto from '../../../assets/images/campusEvents/sampleevents.jpg';
import { db } from '../../../lib/firebaseConfig';
import { useAuth } from '../../context/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: string;
  imageUrl?: string;
  createdAt: Date;
  attendees?: string[];
}

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375; // iPhone SE, small Android devices

// Custom TextInput component with proper typing
const TextInput = ({ 
  style, 
  value, 
  onChangeText, 
  placeholder, 
  multiline, 
  numberOfLines,
  ...props 
}: {
  style?: any;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}) => (
  <RNTextInput 
    style={[styles.input, style]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    multiline={multiline}
    numberOfLines={numberOfLines}
    {...props}
  />
);

const CAMPUS_LOCATIONS = [
  {
    id: '1',
    name: 'Main Auditorium',
    image: SamplePhoto,
    description: 'Main campus auditorium with 500 seating capacity'
  },
  {
    id: '2', 
    name: 'Sports Complex',
    image: SamplePhoto,
    description: 'Indoor sports facility with basketball and volleyball courts'
  },
  {
    id: '3',
    name: 'Student Center',
    image: SamplePhoto,
    description: 'Central hub for student activities and gatherings'
  },
  {
    id: '4',
    name: 'Library Hall',
    image: SamplePhoto,
    description: 'Quiet study area and event space in the library'
  },
  {
    id: '5',
    name: 'Outdoor Amphitheater',
    image: SamplePhoto,
    description: 'Open-air venue for performances and gatherings'
  },
  {
    id: '6',
    name: 'Science Building Lobby',
    image: SamplePhoto,
    description: 'Modern space for exhibitions and presentations'
  }
];

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date(),
    location: '',
    imageUrl: ''
  });
  const [attendingEvents, setAttendingEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    // CHANGED: Sort by date in DESCENDING order (newest/latest dates first)
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
            imageUrl: data.imageUrl,
            createdAt: data.createdAt.toDate(),
            attendees: data.attendees || []
          });
        });
        setEvents(eventsData);
        
        // Update attending events set for RSVP functionality
        if (user) {
          const attending = new Set<string>();
          eventsData.forEach(event => {
            if (event.attendees?.includes(user.uid)) {
              attending.add(event.id);
            }
          });
          setAttendingEvents(attending);
        }
        
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching events:', error);
        Alert.alert('Error', 'Failed to load events');
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.description || !newEvent.location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Get the selected location to use its image
      const selectedLocation = CAMPUS_LOCATIONS.find(loc => loc.name === newEvent.location);
      
      await addDoc(collection(db, 'events'), {
        title: newEvent.title,
        description: newEvent.description,
        date: Timestamp.fromDate(newEvent.date),
        location: newEvent.location,
        organizer: user?.email || 'Admin',
        imageUrl: selectedLocation ? 'local' : '', // Mark as local image
        createdAt: Timestamp.now(),
        attendees: []
      });

      setNewEvent({
        title: '',
        description: '',
        date: new Date(),
        location: '',
        imageUrl: ''
      });
      setShowCreateForm(false);
      Alert.alert('Success', 'Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: RSVP function now properly updates the state
  const handleRSVP = async (eventId: string, eventTitle: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to RSVP');
      return;
    }

    try {
      const eventRef = doc(db, 'events', eventId);
      
      // Check if user is already attending
      const isAttending = attendingEvents.has(eventId);

      if (isAttending) {
        // Cancel RSVP
        await updateDoc(eventRef, {
          attendees: arrayRemove(user.uid)
        });
        setAttendingEvents(prev => {
          const newSet = new Set(prev);
          newSet.delete(eventId);
          return newSet;
        });
        Alert.alert('RSVP Cancelled', `You are no longer attending ${eventTitle}`);
      } else {
        // RSVP to event
        await updateDoc(eventRef, {
          attendees: arrayUnion(user.uid)
        });
        setAttendingEvents(prev => new Set(prev.add(eventId)));
        Alert.alert('RSVP Success', `You have RSVP'd for ${eventTitle}`);
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      Alert.alert('Error', 'Failed to update RSVP');
    }
  };

  // FIXED: Delete event function
  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
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
              await deleteDoc(doc(db, 'events', eventId));
              Alert.alert('Success', 'Event deleted successfully!');
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
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

  // DATE PICKER FUNCTIONS:
  const showDatePickerModal = () => {
    setDatePickerVisibility(true);
  };

  const handleConfirmDate = (date: Date) => {
    setNewEvent({...newEvent, date});
    setDatePickerVisibility(false);
  };

  const handleCancelDate = () => {
    setDatePickerVisibility(false);
  };

  const selectLocation = (location: typeof CAMPUS_LOCATIONS[0]) => {
    setNewEvent({
      ...newEvent,
      location: location.name,
      imageUrl: 'local' // Mark that we're using a local image
    });
    setShowLocationPicker(false);
  };

  // Get location image for display
  const getLocationImage = (locationName: string) => {
    const location = CAMPUS_LOCATIONS.find(loc => loc.name === locationName);
    return location?.image || SamplePhoto;
  };

  const getLocationDescription = (locationName: string) => {
    const location = CAMPUS_LOCATIONS.find(loc => loc.name === locationName);
    return location?.description || 'Campus venue';
  };

  // Reset form when closing
  const handleCloseCreateForm = () => {
    setNewEvent({
      title: '',
      description: '',
      date: new Date(),
      location: '',
      imageUrl: ''
    });
    setShowCreateForm(false);
  };

  // UPDATED: New layout order with proper RSVP state
  const renderEventItem = ({ item }: { item: Event }) => {
    const isAttending = attendingEvents.has(item.id);
    const isEventUpcoming = item.date > new Date();

    return (
      <View style={styles.eventCard}>
        {/* 1. IMAGE */}
        {(item.imageUrl === 'local' || !item.imageUrl) && (
          <Image 
            source={getLocationImage(item.location)}
            style={styles.eventImage}
            resizeMode="cover"
          />
        )}
        
        {item.imageUrl && item.imageUrl !== 'local' && (
          <Image 
            source={{ uri: item.imageUrl }}
            style={styles.eventImage}
            resizeMode="cover"
          />
        )}
        
        <View style={styles.eventContent}>
          {/* 2. LOCATION - Below the image */}
          <View style={styles.locationContainer}>
            <Text style={styles.eventLocation}>📍 {item.location}</Text>
            <Text style={styles.locationDescription}>
              {getLocationDescription(item.location)}
            </Text>
          </View>

          {/* 3. DATE - Next after location */}
          <Text style={styles.eventDate}>
            {formatDate(item.date)}
          </Text>

          {/* 4. TITLE - Next after date */}
          <Text style={styles.eventTitle}>{item.title}</Text>

          {/* 5. DESCRIPTION - Next after title */}
          <Text style={styles.eventDescription}>{item.description}</Text>
          
          <Text style={styles.eventOrganizer}>Organized by: {item.organizer}</Text>
          
          <View style={styles.eventFooter}>
            <Text style={styles.attendeeCount}>
              {item.attendees?.length || 0} people attending
              {isAttending && ' • You are attending'}
            </Text>
            
            <View style={styles.eventActions}>
              {isEventUpcoming && (
                <TouchableOpacity 
                  style={[
                    styles.rsvpButton,
                    isAttending ? styles.cancelRsvpButton : styles.attendRsvpButton
                  ]}
                  onPress={() => handleRSVP(item.id, item.title)}
                >
                  <Text style={styles.rsvpButtonText}>
                    {isAttending ? 'Cancel RSVP' : 'RSVP'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDeleteEvent(item.id, item.title)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* FIXED HEADER - Better mobile responsive layout */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={1}>Campus Events</Text>
          <Text style={styles.subtitle} numberOfLines={1}>Stay updated with campus activities</Text>
        </View>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Text style={styles.createButtonText} numberOfLines={1}>
            Create Event
          </Text>
        </TouchableOpacity>
      </View>

      {/* FULL PAGE CREATE EVENT MODAL */}
      <Modal
        visible={showCreateForm}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.fullPageModalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleCloseCreateForm}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Event</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Scrollable Form Content */}
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              style={styles.fullPageScrollView}
              contentContainerStyle={styles.fullPageFormContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Event Title *</Text>
                <TextInput
                  placeholder="Enter event title"
                  value={newEvent.title}
                  onChangeText={(text: string) => setNewEvent({...newEvent, title: text})}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Event Description *</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="Describe your event in detail..."
                  value={newEvent.description}
                  onChangeText={(text: string) => setNewEvent({...newEvent, description: text})}
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Date & Time *</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={showDatePickerModal}
                >
                  <Text style={styles.datePickerText}>
                    {formatDate(newEvent.date)}
                  </Text>
                  <Text style={styles.datePickerLabel}>Tap to select date & time</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Location *</Text>
                <TouchableOpacity 
                  style={styles.locationPickerButton}
                  onPress={() => setShowLocationPicker(true)}
                >
                  <Text style={styles.locationPickerText}>
                    {newEvent.location || 'Select a venue'}
                  </Text>
                  <Text style={styles.locationPickerLabel}>Tap to choose location</Text>
                </TouchableOpacity>
              </View>

              {/* Show location preview image */}
              {newEvent.location && (
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>Location Preview</Text>
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={getLocationImage(newEvent.location)}
                      style={styles.selectedLocationImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.locationPreviewDescription}>
                      {getLocationDescription(newEvent.location)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <View style={styles.submitButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.submitButton,
                    (!newEvent.title || !newEvent.description || !newEvent.location) && styles.submitButtonDisabled
                  ]}
                  onPress={handleCreateEvent}
                  disabled={loading || !newEvent.title || !newEvent.description || !newEvent.location}
                >
                  <Text style={styles.submitButtonText}>
                    {loading ? 'Creating Event...' : 'Create Event'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCloseCreateForm}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirmDate}
        onCancel={handleCancelDate}
        minimumDate={new Date()}
        date={newEvent.date}
      />

      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Location</Text>
            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.locationsList}>
            {CAMPUS_LOCATIONS.map((location) => (
              <TouchableOpacity 
                key={location.id}
                style={styles.locationItem}
                onPress={() => selectLocation(location)}
              >
                <Image 
                  source={location.image} 
                  style={styles.locationItemImage}
                  resizeMode="cover"
                />
                <View style={styles.locationItemInfo}>
                  <Text style={styles.locationItemName}>{location.name}</Text>
                  <Text style={styles.locationItemDescription}>
                    {location.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E88E5']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming events</Text>
            <Text style={styles.emptyStateSubtext}>
              Check back later for new campus events!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 16,
  },
  // FIXED HEADER - Much better mobile responsive layout
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minHeight: 80,
  },
  headerContent: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  title: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#64748B',
    marginTop: 2,
  },
  // FIXED CREATE BUTTON - Much better for mobile with responsive sizing
  createButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: isSmallScreen ? 12 : 16,
    paddingVertical: isSmallScreen ? 8 : 10,
    borderRadius: 8,
    minWidth: isSmallScreen ? 90 : 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: isSmallScreen ? 12 : 14,
    textAlign: 'center',
  },

  // FULL PAGE MODAL STYLES
  fullPageModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1E88E5',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  placeholder: {
    width: 60, // Same width as back button for balance
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  fullPageScrollView: {
    flex: 1,
  },
  fullPageFormContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  datePickerButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
  },
  datePickerText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  datePickerLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  locationPickerButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 16,
  },
  locationPickerText: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  locationPickerLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  imagePreviewContainer: {
    marginTop: 8,
  },
  selectedLocationImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  locationPreviewDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  submitButtonContainer: {
    marginTop: 24,
  },
  submitButton: {
    backgroundColor: '#1E88E5',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },

  // Existing styles remain the same...
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 150,
  },
  eventContent: {
    padding: 16,
  },
  locationContainer: {
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
    marginBottom: 2,
  },
  locationDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  eventDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 24,
  },
  eventDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  eventOrganizer: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  attendeeCount: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rsvpButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  attendRsvpButton: {
    backgroundColor: '#10B981',
  },
  cancelRsvpButton: {
    backgroundColor: '#EF4444',
  },
  rsvpButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    fontSize: 16,
    color: '#1E88E5',
    fontWeight: '600',
  },
  locationsList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  locationItemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  locationItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  locationItemDescription: {
    fontSize: 12,
    color: '#64748B',
  },
});