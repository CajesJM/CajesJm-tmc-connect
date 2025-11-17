import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CAMPUS_LOCATIONS } from '../../../constants/campusLocations';
import { db } from '../../../lib/firebaseConfig';
import { styles } from '../../styles/studentEvents';

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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
    if (daysDiff > 1) return `In ${daysDiff} days`;
    if (daysDiff === -1) return 'Yesterday';
    return 'Past event';
  };

  const renderEventItem = ({ item }: { item: Event }) => {
    const isEventUpcoming = item.date > new Date();
    const daysUntil = getDaysUntilEvent(item.date);

    return (
      <View style={[
        styles.eventCard,
        isSmallScreen && styles.eventCardSmall,
        !isEventUpcoming && styles.pastEventCard
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
            ]}>
              {daysUntil}
            </Text>
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
              ]}>
                <Icon name="map-marker" size={16} color="#1e6dffff" /> {item.location}
              </Text>
              <Text style={[
                styles.eventDate,
                isSmallScreen && styles.eventDateSmall,
                !isEventUpcoming && styles.pastEventDate
              ]}>
                {formatDate(item.date)}
              </Text>
            </View>
          </View>

          <Text style={[
            styles.eventTitle,
            isSmallScreen && styles.eventTitleSmall
          ]}>
            {item.title}
          </Text>

          <Text style={[
            styles.eventDescription,
            isSmallScreen && styles.eventDescriptionSmall
          ]}>
            {item.description}
          </Text>

          {item.locationDescription && (
            <Text style={[
              styles.locationDescription,
              isSmallScreen && styles.locationDescriptionSmall
            ]}>
              <Icon name="office-building" size={16} color="#666" /> {item.locationDescription}
            </Text>
          )}

          {item.coordinates && (
            <View style={styles.verificationBadge}>
              <Icon name="map-marker-check" size={12} color="#10B981" />
              <Text style={styles.verificationBadgeText}>
                Location Verification Enabled
              </Text>
            </View>
          )}

          <View style={styles.eventStats}>
            <View style={styles.eventStatItem}>
              <Icon name="account" size={14} color="#1E88E5" />
              <Text style={[
                styles.eventOrganizer,
                isSmallScreen && styles.eventOrganizerSmall
              ]}>
                {item.organizer}
              </Text>
            </View>
            <View style={styles.eventStatItem}>
              <Icon name="account-group" size={14} color="#1E88E5" />
              <Text style={[
                styles.attendeeCount,
                isSmallScreen && styles.attendeeCountSmall
              ]}>
                {item.attendees.length} attending
              </Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            {!isEventUpcoming && (
              <View style={[
                styles.pastEventBadge,
                isSmallScreen && styles.pastEventBadgeSmall
              ]}>
                <Text style={[
                  styles.pastEventText,
                  isSmallScreen && styles.pastEventTextSmall
                ]}>
                  Event Ended
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Loading campus events...</Text>
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
          ]}>
            Campus Events
          </Text>
          <Text style={[
            styles.subtitle,
            isSmallScreen && styles.subtitleSmall
          ]}>
            Discover campus events and activities
          </Text>
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
            ]}>
              {events.filter(event => event.date > new Date()).length}
            </Text>
            <Text style={[
              styles.statLabel,
              isSmallScreen && styles.statLabelSmall
            ]}>
              Upcoming
            </Text>
          </View>

          <View style={[
            styles.statCard,
            isSmallScreen && styles.statCardSmall
          ]}>
            <Text style={[
              styles.statNumber,
              isSmallScreen && styles.statNumberSmall
            ]}>
              {events.length}
            </Text>
            <Text style={[
              styles.statLabel,
              isSmallScreen && styles.statLabelSmall
            ]}>
              Total Events
            </Text>
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
            ]}>
              Past Events
            </Text>
          </View>
        </View>
      </View>

      <View style={[
        styles.headerActions,
        isSmallScreen && styles.headerActionsSmall
      ]}>
        <View style={styles.filterContainer}>
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
            ]}>
              <Icon name="calendar" size={16} color="#0521f8ff" /> Upcoming Events
            </Text>
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
            ]}>
              <Icon name="history" size={16} color="#2505f2ff" /> Past Events
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          isSmallScreen && styles.listContentSmall
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E88E5']}
            tintColor="#1E88E5"
          />
        }
        ListEmptyComponent={
          <View style={[
            styles.emptyState,
            isSmallScreen && styles.emptyStateSmall
          ]}>
            <Icon name="calendar-remove" size={64} color="#94A3B8" />
            <Text style={[
              styles.emptyStateTitle,
              isSmallScreen && styles.emptyStateTitleSmall
            ]}>
              {activeFilter === 'upcoming' ? 'No upcoming events' : 'No past events'}
            </Text>
            <Text style={[
              styles.emptyStateText,
              isSmallScreen && styles.emptyStateTextSmall
            ]}>
              {activeFilter === 'upcoming'
                ? 'Check back later for new campus events!'
                : 'No past events to display'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
}