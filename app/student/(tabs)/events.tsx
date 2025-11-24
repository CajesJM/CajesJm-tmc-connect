import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAMPUS_LOCATIONS } from '../../../constants/campusLocations';
import { db } from '../../../lib/firebaseConfig';
import { styles } from '../../../styles/studentEvents';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizer: string;
  locationImage?: string;
  createdAt: Date;
  attendees: string[];
  locationDescription?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
}

export default function StudentEventsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 375;

  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showMapOptions, setShowMapOptions] = useState(false);

  useEffect(() => {
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
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

  const filterEvents = (eventsList: Event[], filter: 'upcoming' | 'past') => {
    const now = new Date();
    const filtered = eventsList.filter(event =>
      filter === 'upcoming' ? event.date > now : event.date <= now
    );
    setFilteredEvents(filtered);
  };

  const handleFilterChange = (filter: 'upcoming' | 'past') => {
    setActiveFilter(filter);
    filterEvents(events, filter);
  };

  const onRefresh = () => {
    setRefreshing(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    today.setHours(0, 0, 0, 0);
    const eventDateCopy = new Date(eventDate);
    eventDateCopy.setHours(0, 0, 0, 0);

    const timeDiff = eventDateCopy.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff === 0) return 'Today';
    if (daysDiff === 1) return 'Tomorrow';
    if (daysDiff > 1) return `${daysDiff}d`;
    if (daysDiff === -1) return 'Yesterday';
    return 'Past';
  };

  const openEventInMaps = (event: Event, showBoundary: boolean = false) => {
    if (!event.coordinates) {
      const url = Platform.OS === 'ios' 
        ? `http://maps.apple.com/?q=${encodeURIComponent(event.location)}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`;
      
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps app');
      });
      return;
    }

    const { latitude, longitude, radius } = event.coordinates;
    
    if (showBoundary) {
      const url = Platform.OS === 'ios'
        ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(event.location + ' (Event Location)')}`
        : `https://www.google.com/maps/@${latitude},${longitude},${radius}m/data=!3m1!1e3?q=${encodeURIComponent(event.location)}`;
      
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps app');
      });
      
      Alert.alert(
        'Event Boundary',
        `Location: ${event.location}\n\nVerification Radius: ${radius} meters\n\nStudents must be within ${radius}m of the event location to mark attendance.`,
        [{ text: 'OK' }]
      );
    } else {
      const url = Platform.OS === 'ios'
        ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(event.title + ' - ' + event.location)}`
        : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${encodeURIComponent(event.title)}`;
      
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps app');
      });
    }
  };

  const showMapOptionsModal = (event: Event) => {
    setSelectedEvent(event);
    setShowMapOptions(true);
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const isEventUpcoming = item.date > new Date();
    const daysUntil = getDaysUntilEvent(item.date);

    return (
      <View style={[
        styles.eventCard,
        !isEventUpcoming && styles.pastEventCard
      ]}>
        <View style={styles.eventImageContainer}>
          <Image
            source={getLocationImage(item)}
            style={styles.eventImage}
            resizeMode="cover"
          />
          <View style={[
            styles.eventBadge,
            daysUntil === 'Today' && styles.todayBadge,
            daysUntil === 'Tomorrow' && styles.tomorrowBadge,
            (typeof daysUntil === 'string' && daysUntil.includes('d')) && styles.upcomingBadge,
            daysUntil === 'Past' && styles.pastBadge,
          ]}>
            <Text style={styles.eventBadgeText}>
              {daysUntil}
            </Text>
          </View>
        </View>

        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={styles.eventMeta}>
              <Text style={styles.eventLocation}>
                <Icon name="map-marker" size={14} color="#4F46E5" /> {item.location}
              </Text>
              <Text style={[
                styles.eventDate,
                !isEventUpcoming && styles.pastEventDate
              ]}>
                {formatDate(item.date)}
              </Text>
            </View>
          </View>

          <Text style={styles.eventTitle}>
            {item.title}
          </Text>

          <Text style={styles.eventDescription}>
            {item.description}
          </Text>

          {item.locationDescription && (
            <Text style={styles.locationDescription}>
              <Icon name="office-building" size={14} color="#6B7280" /> {item.locationDescription}
            </Text>
          )}

          {item.coordinates && (
            <View style={styles.coordinatesSection}>
              <View style={styles.verificationBadge}>
                <Icon name="map-marker-check" size={12} color="#10B981" />
                <Text style={styles.verificationBadgeText}>
                  Location Verification
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.mapButton}
                onPress={() => showMapOptionsModal(item)}
              >
                <View style={styles.mapButtonContent}>
                  <Icon name="map" size={18} color="#4F46E5" />
                  <View style={styles.mapButtonText}>
                    <Text style={styles.mapButtonTitle}>View on Map</Text>
                    <Text style={styles.mapButtonSubtitle}>
                      {item.coordinates.radius}m radius
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={18} color="#6B7280" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {!item.coordinates && isEventUpcoming && (
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => openEventInMaps(item, false)}
            >
              <View style={styles.mapButtonContent}>
                <Icon name="map" size={18} color="#4F46E5" />
                <View style={styles.mapButtonText}>
                  <Text style={styles.mapButtonTitle}>Find Location</Text>
                  <Text style={styles.mapButtonSubtitle}>
                    Open in Maps
                  </Text>
                </View>
                <Icon name="chevron-right" size={18} color="#6B7280" />
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.eventStats}>
            <View style={styles.eventStatItem}>
              <Icon name="account" size={12} color="#6B7280" />
              <Text style={styles.eventOrganizer}>
                {item.organizer}
              </Text>
            </View>
            <View style={styles.eventStatItem}>
              <Icon name="account-group" size={12} color="#6B7280" />
              <Text style={styles.attendeeCount}>
                {item.attendees.length} attending
              </Text>
            </View>
          </View>

          {!isEventUpcoming && (
            <View style={styles.pastEventBadge}>
              <Text style={styles.pastEventText}>
                Event Ended
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMapOptionsModal = () => (
    <Modal
      visible={showMapOptions}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMapOptions(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Map Options</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowMapOptions(false)}
          >
            <Icon name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {selectedEvent && (
            <>
              <View style={styles.eventInfo}>
                <Text style={styles.eventInfoTitle}>{selectedEvent.title}</Text>
                <Text style={styles.eventInfoLocation}>
                  <Icon name="map-marker" size={14} color="#4F46E5" /> {selectedEvent.location}
                </Text>
                {selectedEvent.coordinates && (
                  <View style={styles.coordinatesInfo}>
                    <Text style={styles.coordinatesText}>
                      <Icon name="map-marker-radius" size={14} color="#4F46E5" /> 
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
                  setShowMapOptions(false);
                  openEventInMaps(selectedEvent, false);
                }}
              >
                <View style={styles.mapOptionContent}>
                  <Icon name="map-marker" size={20} color="#4F46E5" />
                  <View style={styles.mapOptionText}>
                    <Text style={styles.mapOptionTitle}>Show Event Location</Text>
                    <Text style={styles.mapOptionSubtitle}>Open exact event location in maps</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.mapInstructions}>
                <Text style={styles.instructionsTitle}>How to use:</Text>
                <View style={styles.instructionItem}>
                  <Icon name="map-marker" size={14} color="#6B7280" />
                  <Text style={styles.instructionText}>
                    <Text style={styles.instructionBold}>Event Location</Text> - Shows exact event spot
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading campus events...</Text>
      </View>
    );
  }

  const upcomingCount = events.filter(event => event.date > new Date()).length;
  const pastCount = events.filter(event => event.date <= new Date()).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="calendar" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>Campus Events</Text>
        <Text style={styles.headerSubtitle}>
          Discover campus events and activities
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{upcomingCount}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{events.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pastCount}</Text>
          <Text style={styles.statLabel}>Past</Text>
        </View>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.filterChips}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'upcoming' && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange('upcoming')}
          >
          
            <Text style={[
              styles.filterChipText,
              activeFilter === 'upcoming' && styles.filterChipTextActive
            ]}>
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              activeFilter === 'past' && styles.filterChipActive
            ]}
            onPress={() => handleFilterChange('past')}
          >
       
            <Text style={[
              styles.filterChipText,
              activeFilter === 'past' && styles.filterChipTextActive
            ]}>
              Past Events
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          {activeFilter === 'upcoming' ? ' upcoming' : ' past'}
        </Text>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Icon name="calendar-remove" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyStateTitle}>
              {activeFilter === 'upcoming' ? 'No upcoming events' : 'No past events'}
            </Text>
            <Text style={styles.emptyStateText}>
              {activeFilter === 'upcoming'
                ? 'Check back later for new campus events!'
                : 'No past events to display'
              }
            </Text>
          </View>
        }
      />

      {renderMapOptionsModal()}
    </View>
  );
}