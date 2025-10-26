import { arrayRemove, arrayUnion, collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
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
  attendees: string[];
}

// Use the same campus locations as your admin dashboard
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

export default function StudentEventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendingEvents, setAttendingEvents] = useState<Set<string>>(new Set());

  // Real-time listener for events
  useEffect(() => {
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('date', 'asc')
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
        
        // Update attending events set
        if (user) {
          const attending = new Set<string>();
          eventsData.forEach(event => {
            if (event.attendees.includes(user.uid)) {
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

  const handleRSVP = async (eventId: string, eventTitle: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to RSVP');
      return;
    }

    try {
      const eventRef = doc(db, 'events', eventId);
      
      if (attendingEvents.has(eventId)) {
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

  const isUpcomingEvent = (eventDate: Date) => {
    return eventDate > new Date();
  };

  // Get location image for display - same as admin dashboard
  const getLocationImage = (locationName: string) => {
    const location = CAMPUS_LOCATIONS.find(loc => loc.name === locationName);
    return location?.image || SamplePhoto;
  };

  const getLocationDescription = (locationName: string) => {
    const location = CAMPUS_LOCATIONS.find(loc => loc.name === locationName);
    return location?.description || 'Campus venue';
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const isAttending = attendingEvents.has(item.id);
    const isEventUpcoming = isUpcomingEvent(item.date);

    return (
      <View style={[
        styles.eventCard,
        !isEventUpcoming && styles.pastEventCard
      ]}>
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
          <Text style={[
            styles.eventDate,
            !isEventUpcoming && styles.pastEventDate
          ]}>
            {formatDate(item.date)}
          </Text>

          {/* 4. TITLE - Next after date */}
          <Text style={styles.eventTitle}>{item.title}</Text>

          {/* 5. DESCRIPTION - Next after title */}
          <Text style={styles.eventDescription}>{item.description}</Text>
          
          <Text style={styles.eventOrganizer}>Organized by: {item.organizer}</Text>
          
          <View style={styles.eventFooter}>
            <Text style={styles.attendeeCount}>
              {item.attendees.length} people attending
              {isAttending && ' • You are attending'}
            </Text>
            
            {isEventUpcoming ? (
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
            ) : (
              <View style={styles.pastEventBadge}>
                <Text style={styles.pastEventText}>Past Event</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const upcomingEvents = events.filter(event => isUpcomingEvent(event.date));
  const pastEvents = events.filter(event => !isUpcomingEvent(event.date));

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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Campus Events</Text>
          <Text style={styles.subtitle}>Discover and RSVP to upcoming events</Text>
        </View>
      </View>

      <FlatList
        data={upcomingEvents}
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
        ListFooterComponent={
          pastEvents.length > 0 ? (
            <View style={styles.pastEventsSection}>
              <Text style={styles.sectionTitle}>Past Events</Text>
              {pastEvents.map((event) => (
                <View key={event.id} style={styles.pastEventCard}>
                  {/* Past events with same layout */}
                  {(event.imageUrl === 'local' || !event.imageUrl) && (
                    <Image 
                      source={getLocationImage(event.location)}
                      style={styles.pastEventImage}
                      resizeMode="cover"
                    />
                  )}
                  
                  {event.imageUrl && event.imageUrl !== 'local' && (
                    <Image 
                      source={{ uri: event.imageUrl }}
                      style={styles.pastEventImage}
                      resizeMode="cover"
                    />
                  )}
                  
                  <View style={styles.pastEventContent}>
                    <Text style={styles.pastEventLocation}>📍 {event.location}</Text>
                    <Text style={styles.pastEventDate}>
                      {formatDate(event.date)}
                    </Text>
                    <Text style={styles.pastEventTitle}>{event.title}</Text>
                    <Text style={styles.pastEventDescription}>
                      {event.description}
                    </Text>
                    <Text style={styles.pastEventAttendees}>
                      {event.attendees.length} people attended
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    maxWidth: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'left',
  },
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
  pastEventCard: {
    opacity: 0.7,
    backgroundColor: '#F8FAFC',
  },
  eventImage: {
    width: '100%',
    height: 150,
  },
  eventContent: {
    padding: 16,
  },
  // LOCATION - Below image
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
  // DATE - After location
  eventDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  pastEventDate: {
    color: '#94A3B8',
  },
  // TITLE - After date
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 24,
  },
  // DESCRIPTION - After title
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
  rsvpButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
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
  pastEventBadge: {
    backgroundColor: '#94A3B8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 100,
  },
  pastEventText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
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
  pastEventsSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  pastEventImage: {
    width: '100%',
    height: 120,
  },
  pastEventContent: {
    padding: 12,
  },
  pastEventLocation: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
    marginBottom: 4,
  },
  pastEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 8,
  },
  pastEventDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  pastEventAttendees: {
    fontSize: 12,
    color: '#94A3B8',
  },
});